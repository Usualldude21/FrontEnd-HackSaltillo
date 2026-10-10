import type { SentinelDataSource } from "../../domain/ports";
import type { TelemetryPoint } from "../../domain/telemetry";
import type { SentinelAlert } from "../../domain/alert";

export interface OperationSnapshot {
  runId: string;
  telemetry: TelemetryPoint[];
  alerts: SentinelAlert[];
}

export async function loadOperationSnapshot(
  source: SentinelDataSource,
  runId: string,
  signal?: AbortSignal,
): Promise<OperationSnapshot> {
  const [telemetry, alerts] = await Promise.all([
    source.listTelemetry({ runId, tenant: "kaiku" }, signal),
    source.listAlerts({ runId, tenant: "kaiku" }, signal),
  ]);

  return {
    runId,
    telemetry: telemetry.filter((point) => point.runId === runId && point.tenant === "kaiku"),
    alerts: alerts.filter((alert) => alert.runId === runId && alert.tenant === "kaiku"),
  };
}
