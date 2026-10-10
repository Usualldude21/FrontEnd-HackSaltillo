import type { ChallengeReplayResult } from "../../domain/kaikuChallenge";
import type { KaikuChallengeDataSource } from "../../domain/ports";
import { ApiError } from "../../infrastructure/api/errors";

const runIdPattern = /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/u;

export function validateChallengeRunId(value: string): string | null {
  const normalized = value.trim();
  if (normalized.length === 0) return "Escribe el identificador de una corrida oficial.";
  if (!runIdPattern.test(normalized)) {
    return "Usa entre 1 y 64 caracteres: letras, números, guion o guion bajo.";
  }
  return null;
}

export async function runChallengeReplay(
  source: KaikuChallengeDataSource,
  runId: string,
  adminToken: string,
  signal?: AbortSignal,
): Promise<ChallengeReplayResult> {
  const normalizedRunId = runId.trim();
  const validationError = validateChallengeRunId(normalizedRunId);
  if (validationError !== null) throw new Error(validationError);
  return source.replayRun(normalizedRunId, adminToken, signal);
}

export function challengeReplayErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "El entorno local no pudo autorizar la demostración. Reinicia ambos servicios con el comando de demo.";
    if (error.status === 404) return "La corrida no existe en el paquete oficial disponible.";
    if (error.status === 409) return "El backend ya está procesando otra corrida. Intenta nuevamente al terminar.";
    if (error.status === 422) return "La corrida fue rechazada porque no cumple el contrato de ingestión.";
  }
  return error instanceof Error ? error.message : "No fue posible procesar la corrida.";
}
