import { ZodError } from "zod";

export interface ApiErrorShape {
  status: number;
  code: string | null;
  message: string;
  retryAfterSeconds: number | null;
  validationIssues: Array<{ path: string; message: string }>;
}

export class ApiError extends Error implements ApiErrorShape {
  readonly status: number;
  readonly code: string | null;
  readonly retryAfterSeconds: number | null;
  readonly validationIssues: Array<{ path: string; message: string }>;

  constructor(input: ApiErrorShape) {
    super(input.message);
    this.name = "ApiError";
    this.status = input.status;
    this.code = input.code;
    this.retryAfterSeconds = input.retryAfterSeconds;
    this.validationIssues = input.validationIssues;
  }
}

interface FastApiErrorBody {
  detail?: string | { code?: string; message?: string } | FastApiValidationIssue[];
}

interface FastApiValidationIssue {
  loc?: Array<string | number>;
  msg?: string;
}

export function normalizeApiError(
  status: number,
  body: unknown,
  retryAfter: string | null = null,
): ApiError {
  const parsedBody = typeof body === "object" && body !== null ? (body as FastApiErrorBody) : {};
  const detail = parsedBody.detail;
  const objectDetail = typeof detail === "object" && detail !== null && !Array.isArray(detail)
    ? detail
    : null;
  const code = objectDetail !== null && typeof objectDetail.code === "string"
    ? objectDetail.code
    : null;
  const message = typeof detail === "string"
    ? detail
    : objectDetail !== null && typeof objectDetail.message === "string"
      ? objectDetail.message
      : Array.isArray(detail)
        ? "La solicitud contiene datos inválidos."
      : `La solicitud no pudo completarse (HTTP ${status}).`;
  const validationIssues = Array.isArray(detail)
    ? detail.flatMap((issue) => typeof issue.msg === "string"
      ? [{ path: Array.isArray(issue.loc) ? issue.loc.join(".") : "", message: issue.msg }]
      : [])
    : [];
  const parsedRetryAfter = retryAfter === null ? Number.NaN : Number(retryAfter);

  return new ApiError({
    status,
    code,
    message,
    retryAfterSeconds: Number.isFinite(parsedRetryAfter) ? parsedRetryAfter : null,
    validationIssues,
  });
}

export function incompatibleContractError(error: ZodError): ApiError {
  return new ApiError({
    status: 0,
    code: "incompatible_contract",
    message: "El backend respondió con un contrato incompatible.",
    retryAfterSeconds: null,
    validationIssues: error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    })),
  });
}
