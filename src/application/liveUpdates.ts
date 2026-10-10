import type { ConnectionState } from "../domain/backend";
import type { TimelineEvent } from "../domain/event";
import type { EventStreamSource } from "../domain/ports";
import { ApiError } from "../infrastructure/api/errors";
import { deduplicateEvents } from "./selectors/events";

const invalidCursorCodes = new Set(["cursor_ahead", "cursor_expired", "replay_limit_exceeded"]);

export interface LiveUpdateObserver {
  onState: (state: ConnectionState) => void;
  onEvents: (events: readonly TimelineEvent[]) => void;
}

interface LiveUpdateOptions {
  random?: () => number;
  wait?: (milliseconds: number, signal: AbortSignal) => Promise<void>;
}

export function backoffDelay(attempt: number, random: () => number = Math.random): number {
  const exponential = Math.min(30_000, 1_000 * (2 ** Math.min(attempt, 5)));
  return Math.round(exponential * (0.5 + random() * 0.5));
}

export function waitForRetry(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve) => {
    if (signal.aborted) {
      resolve();
      return;
    }
    const timeout = window.setTimeout(resolve, milliseconds);
    signal.addEventListener("abort", () => {
      window.clearTimeout(timeout);
      resolve();
    }, { once: true });
  });
}

export async function runLiveUpdates(
  source: EventStreamSource,
  observer: LiveUpdateObserver,
  signal: AbortSignal,
  options: LiveUpdateOptions = {},
): Promise<void> {
  const seen = new Set<number>();
  const wait = options.wait ?? waitForRetry;
  const random = options.random ?? Math.random;
  let cursor = 0;
  let initialized = false;
  let attempt = 0;

  const publish = (events: readonly TimelineEvent[]) => {
    const unique = deduplicateEvents(events).filter((event) => !seen.has(event.id));
    if (unique.length === 0) return;
    for (const event of unique) {
      seen.add(event.id);
      cursor = Math.max(cursor, event.id);
    }
    observer.onEvents(unique);
  };

  observer.onState("connecting");

  while (!signal.aborted) {
    try {
      if (!initialized) {
        cursor = await source.getEventCursor(signal);
        initialized = true;
      }

      await source.streamEvents(cursor, {
        onOpen() {
          attempt = 0;
          observer.onState("live");
        },
        onEvent(event) {
          publish([event]);
        },
        onHeartbeat(nextCursor) {
          cursor = Math.max(cursor, nextCursor);
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
        const snapshot = await source.listEvents(0, signal);
        publish(snapshot);
        cursor = await source.getEventCursor(signal);
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
