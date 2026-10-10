import type { SentinelDataSource } from "../../domain/ports";
import { ApiError } from "../../infrastructure/api/errors";

export async function acknowledgeAlert(
  source: SentinelDataSource,
  alertId: string,
  adminToken: string,
  signal?: AbortSignal,
): Promise<void> {
  if (adminToken.trim().length === 0) {
    throw new Error("Se requiere autorización para reconocer la alerta.");
  }

  await source.acknowledgeAlert(alertId, adminToken, signal);
}

export function acknowledgeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 401) return "El token no fue aceptado. Verifica la autorización de esta sesión.";
    if (error.status === 404) return "La alerta ya no existe. Actualiza la cola antes de continuar.";
    if (error.status === 409) return "La alerta cambió en otra sesión. La cola se actualizará con su estado actual.";
    if (error.status === 422) return "El backend rechazó la solicitud de reconocimiento por datos inválidos.";
  }
  return error instanceof Error ? error.message : "No fue posible reconocer la alerta.";
}
