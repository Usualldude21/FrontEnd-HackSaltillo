import { createParser } from "eventsource-parser";
import { ZodError } from "zod";
import type { ChallengeStreamUpdate, OperatorWallClockMoment } from "../../domain/kaikuChallenge";
import type { KaikuChallengeStreamSource } from "../../domain/ports";
import {
  challengeAcknowledgedStreamSchema,
  challengeAlertSchema,
  challengeCursorSchema,
  challengeStreamHeartbeatSchema,
} from "./challengeBackendSchemas";
import { mapChallengeAlert } from "./challengeBackendMappers";
import { ApiError, incompatibleContractError, normalizeApiError } from "./errors";
import { createHttpClient, joinUrl, type HttpClientOptions } from "./httpClient";

async function readErrorBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function disconnectedError(): ApiError {
  return new ApiError({
    status: 0,
    code: "stream_disconnected",
    message: "El stream de Kaiku se cerró antes de ser cancelado.",
    retryAfterSeconds: null,
    validationIssues: [],
  });
}

function operatorMoment(value: string): OperatorWallClockMoment {
  return { value, clock: "operator_wall_clock" };
}

function parseUpdate(eventName: string, payload: unknown): ChallengeStreamUpdate {
  if (eventName === "challenge_alert") {
    const dto = challengeAlertSchema.parse(payload);
    return { kind: "alert", cursor: dto.event_id, alert: mapChallengeAlert(dto) };
  }
  if (eventName === "challenge_alert_acknowledged") {
    const dto = challengeAcknowledgedStreamSchema.parse(payload);
    return {
      kind: "acknowledgement",
      cursor: dto.event_id,
      outboxAlertId: dto.outbox_alert_id,
      runId: dto.run_id,
      tenant: dto.tenant,
      acknowledgedAt: operatorMoment(dto.timestamp),
      deliveryToAcknowledgementSeconds: dto.delivery_to_acknowledgement_seconds,
      mitigationExecuted: false,
    };
  }
  throw new ApiError({
    status: 0,
    code: "incompatible_contract",
    message: `El stream de Kaiku envió un tipo desconocido: ${eventName || "sin nombre"}.`,
    retryAfterSeconds: null,
    validationIssues: [],
  });
}

function throwParsingError(error: Error | null): void {
  if (error !== null) throw error;
}

export function createKaikuChallengeStreamSource(
  options: HttpClientOptions,
): KaikuChallengeStreamSource {
  const http = createHttpClient(options);
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async getCursor(signal) {
      const cursor = await http.request(
        "/api/challenge/alerts/cursor",
        challengeCursorSchema,
        signal === undefined ? undefined : { signal },
      );
      return cursor.latest_id;
    },

    async streamUpdates(afterId, callbacks, signal) {
      const response = await fetchImpl(
        joinUrl(options.baseUrl, `/api/challenge/alerts/stream?after_id=${afterId}`),
        {
          headers: {
            Accept: "text/event-stream",
            "Last-Event-ID": String(afterId),
          },
          ...(signal === undefined ? {} : { signal }),
        },
      );
      if (!response.ok) {
        throw normalizeApiError(
          response.status,
          await readErrorBody(response),
          response.headers.get("Retry-After"),
        );
      }
      if (response.body === null) throw disconnectedError();

      const decoder = new TextDecoder();
      let parsingError: Error | null = null;
      const parser = createParser({
        onEvent(message) {
          try {
            const payload: unknown = JSON.parse(message.data);
            if (message.event === "heartbeat") {
              callbacks.onHeartbeat(challengeStreamHeartbeatSchema.parse(payload).cursor);
              return;
            }
            callbacks.onUpdate(parseUpdate(message.event ?? "", payload));
          } catch (error) {
            parsingError = error instanceof ZodError
              ? incompatibleContractError(error)
              : error instanceof Error
                ? error
                : new Error("El stream de Kaiku envió un evento inválido.");
          }
        },
        onError(error) {
          parsingError = error;
        },
      });

      callbacks.onOpen();
      const reader = response.body.getReader();
      try {
        while (true) {
          const chunk = await reader.read();
          if (chunk.done) break;
          parser.feed(decoder.decode(chunk.value, { stream: true }));
          throwParsingError(parsingError);
        }
        parser.feed(decoder.decode());
        throwParsingError(parsingError);
      } finally {
        reader.releaseLock();
      }

      if (signal?.aborted === true) return;
      throw disconnectedError();
    },
  };
}
