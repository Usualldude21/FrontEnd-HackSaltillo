import { createParser } from "eventsource-parser";
import { ZodError, z } from "zod";
import type { EventStreamSource } from "../../domain/ports";
import { mapEvent } from "./mappers";
import { ApiError, incompatibleContractError, normalizeApiError } from "./errors";
import { createHttpClient, joinUrl, type HttpClientOptions } from "./httpClient";
import { eventCursorDtoSchema, eventDtoSchema, eventHeartbeatDtoSchema } from "./schemas";

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
    message: "El stream SSE se cerró antes de ser cancelado.",
    retryAfterSeconds: null,
    validationIssues: [],
  });
}

function throwParsingError(error: unknown): void {
  if (error instanceof Error) throw error;
}

export function createEventStreamSource(options: HttpClientOptions): EventStreamSource {
  const http = createHttpClient(options);
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async getEventCursor(signal) {
      const dto = await http.request(
        "/api/events/cursor",
        eventCursorDtoSchema,
        signal === undefined ? undefined : { signal },
      );
      return dto.latest_id;
    },

    async listEvents(afterId, signal) {
      const dtos = await http.request(
        `/api/events?after_id=${afterId}&limit=100`,
        z.array(eventDtoSchema),
        signal === undefined ? undefined : { signal },
      );
      return dtos.map(mapEvent);
    },

    async streamEvents(afterId, callbacks, signal) {
      const response = await fetchImpl(joinUrl(options.baseUrl, `/api/events/stream?after_id=${afterId}`), {
        headers: { Accept: "text/event-stream" },
        ...(signal === undefined ? {} : { signal }),
      });

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
              callbacks.onHeartbeat(eventHeartbeatDtoSchema.parse(payload).cursor);
              return;
            }
            callbacks.onEvent(mapEvent(eventDtoSchema.parse(payload)));
          } catch (error) {
            parsingError = error instanceof ZodError
              ? incompatibleContractError(error)
              : error instanceof Error
                ? error
                : new Error("El stream SSE envió un evento inválido.");
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
