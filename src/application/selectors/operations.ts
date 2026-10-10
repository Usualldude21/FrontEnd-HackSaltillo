import type { AlertEvidence, SentinelAlert } from "../../domain/alert";
import type { DataQuality, TelemetryPoint } from "../../domain/telemetry";
import type { Tenant } from "../../domain/tenant";
import { sortAlertsByPriority } from "./alerts";

export type TenantDisplayState = "stable" | "watch" | "alert" | "no-telemetry";

export interface TenantOperationalSummary {
  tenant: Tenant;
  state: TenantDisplayState;
  dataQuality: DataQuality | null;
  highestConfidence: number | null;
  lastSampleAt: string | null;
  dominantEvidence: AlertEvidence | null;
  openAlerts: number;
}

function latestPoint(points: readonly TelemetryPoint[]): TelemetryPoint | null {
  return points.reduce<TelemetryPoint | null>((latest, point) => {
    if (latest === null || Date.parse(point.timestamp) > Date.parse(latest.timestamp)) return point;
    return latest;
  }, null);
}

function displayState(
  activeAlerts: readonly SentinelAlert[],
  latestTelemetry: TelemetryPoint | null,
): TenantDisplayState {
  if (activeAlerts.some((alert) => alert.severity === "critical" || alert.severity === "warning")) {
    return "alert";
  }
  if (activeAlerts.some((alert) => alert.severity === "watch")) return "watch";
  if (latestTelemetry === null || latestTelemetry.dataQuality === "outage") return "no-telemetry";
  return "stable";
}

export function buildTenantSummary(
  tenant: Tenant,
  telemetry: readonly TelemetryPoint[],
  alerts: readonly SentinelAlert[],
  runId: string,
): TenantOperationalSummary {
  const tenantTelemetry = telemetry.filter((point) =>
    point.runId === runId && point.tenant === "kaiku");
  const tenantAlerts = sortAlertsByPriority(alerts.filter((alert) =>
    alert.runId === runId && alert.tenant === "kaiku" && alert.state === "open"));
  const latest = latestPoint(tenantTelemetry);
  const confidenceValues = tenantAlerts.flatMap((alert) =>
    alert.confidence === null ? [] : [alert.confidence]);
  const highestConfidence = confidenceValues.length === 0 ? null : Math.max(...confidenceValues);

  return {
    tenant,
    state: displayState(tenantAlerts, latest),
    dataQuality: latest?.dataQuality ?? null,
    highestConfidence,
    lastSampleAt: latest?.timestamp ?? null,
    dominantEvidence: tenantAlerts[0]?.evidence[0] ?? null,
    openAlerts: tenantAlerts.length,
  };
}

export function selectKaikuAlerts(
  alerts: readonly SentinelAlert[],
  runId: string,
): SentinelAlert[] {
  return sortAlertsByPriority(alerts.filter((alert) =>
    alert.runId === runId && alert.tenant === "kaiku"));
}
