import type { ConnectionState } from "../domain/backend";
import type { ChallengeStreamUpdate } from "../domain/kaikuChallenge";
import type { KaikuChallengeStreamSource } from "../domain/ports";
import { ApiError } from "../infrastructure/api/errors";
import { backoffDelay, waitForRetry } from "./liveUpdates";

const invalidCursorCodes = new Set(["cursor_ahead", "cursor_expired", "replay_limit_exceeded"]);

export interface ChallengeLiveUpdateObserver {
  onState: (state: ConnectionState) => void;
  onUpdates: (updates: readonly ChallengeStreamUpdate[]) => void;
  onCursor: (cursor: number) => void;
  onReconcile: () => void;
}

interface ChallengeLiveUpdateOptions {
  initialCursor?: number | null;
  random?: () => number;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

export async function runChallengeLiveUpdates(
  source: KaikuChallengeStreamSource,
  observer: ChallengeLiveUpdateObserver,
  signal: AbortSignal,
  options: ChallengeLiveUpdateOptions = {},
): Promise<void> {
  const wait = options.wait ?? waitForRetry;
  const random = options.random ?? Math.random;
  let cursor = options.initialCursor ?? 0;
  let initialized = options.initialCursor !== undefined && options.initialCursor !== null;
  let attempt = 0;

  const advanceCursor = (nextCursor: number) => {
    if (nextCursor <= cursor) return false;
    cursor = nextCursor;
    observer.onCursor(cursor);
    return true;
  };

  observer.onState("connecting");

  while (!signal.aborted) {
    try {
      if (!initialized) {
        cursor = await source.getCursor(signal);
        initialized = true;
        observer.onCursor(cursor);
      }

      await source.streamUpdates(cursor, {
        onOpen() {
          attempt = 0;
          observer.onState("live");
        },
        onUpdate(update) {
          if (advanceCursor(update.cursor)) observer.onUpdates([update]);
        },
        onHeartbeat(nextCursor) {
          advanceCursor(nextCursor);
        },
      }, signal);
      if (signal.aborted) return;
    } catch (error) {
      if (signal.aborted) return;
      if (error instanceof ApiError && error.code === "incompatible_contract") {
        observer.onState("incompatible");
        return;
      }

      observer.onState(attempt >= 3 ? "offline" : "reconnecting");

      if (error instanceof ApiError && error.code !== null && invalidCursorCodes.has(error.code)) {
        observer.onReconcile();
        cursor = await source.getCursor(signal);
        observer.onCursor(cursor);
        attempt = 0;
        continue;
      }

      const retryAfter = error instanceof ApiError ? error.retryAfterSeconds : null;
      const delay = retryAfter === null ? backoffDelay(attempt, random) : retryAfter * 1_000;
      attempt += 1;
      await wait(delay, signal);
    }
  }
}
