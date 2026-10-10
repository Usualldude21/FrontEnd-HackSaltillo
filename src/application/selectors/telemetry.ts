import type { TelemetryPoint } from "../../domain/telemetry";
import type { TenantId } from "../../domain/tenant";

export function selectTelemetry(
  points: readonly TelemetryPoint[],
  tenant: TenantId,
  runId: string,
): TelemetryPoint[] {
  return points.filter((point) => point.tenant === tenant && point.runId === runId);
}

export function selectLatestTelemetry(
  points: readonly TelemetryPoint[],
  tenant: TenantId,
  runId: string,
): TelemetryPoint | null {
  return selectTelemetry(points, tenant, runId).reduce<TelemetryPoint | null>((latest, point) => {
    if (latest === null || Date.parse(point.timestamp) > Date.parse(latest.timestamp)) return point;
    return latest;
  }, null);
}
