import type { ZodType } from "zod";
import { ZodError } from "zod";
import { incompatibleContractError, normalizeApiError } from "./errors";

export interface HttpClient {
  request<T>(path: string, schema: ZodType<T>, init?: HttpRequestOptions): Promise<T>;
}

export interface HttpClientOptions {
  baseUrl: string;
  fetchImpl?: typeof fetch;
}

export interface HttpRequestOptions extends RequestInit {
  acceptedStatuses?: readonly number[];
}

export function joinUrl(baseUrl: string, path: string): string {
  if (/^https?:\/\//u.test(path)) return path;
  const base = baseUrl.endsWith("/") ? baseUrl.slice(0, -1) : baseUrl;
  const suffix = path.startsWith("/") ? path : `/${path}`;
  return `${base}${suffix}` || suffix;
}

async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (text.length === 0) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

export function createHttpClient(options: HttpClientOptions): HttpClient {
  const fetchImpl = options.fetchImpl ?? fetch;

  return {
    async request<T>(path: string, schema: ZodType<T>, init?: HttpRequestOptions): Promise<T> {
      const { acceptedStatuses = [], ...requestInit } = init ?? {};
      const response = await fetchImpl(joinUrl(options.baseUrl, path), {
        ...requestInit,
        headers: {
          Accept: "application/json",
          ...(requestInit.body === undefined ? {} : { "Content-Type": "application/json" }),
          ...requestInit.headers,
        },
      });
      const body = await readBody(response);

      if (!response.ok && !acceptedStatuses.includes(response.status)) {
        throw normalizeApiError(response.status, body, response.headers.get("Retry-After"));
      }

      try {
        return schema.parse(body);
      } catch (error) {
        if (error instanceof ZodError) throw incompatibleContractError(error);
        throw error;
      }
    },
  };
}
