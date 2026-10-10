import type { DataQuality } from "./telemetry";
import type { TenantId } from "./tenant";

export type AlertSeverity = "watch" | "warning" | "critical";
export type AlertState = "open" | "acknowledged" | "resolved";

export interface AlertEvidence {
  feature: string;
  observed: number | null;
  baseline: number | null;
  unit: string | null;
  direction: "up" | "down" | "missing" | "stable";
  observedAt: string;
}

export interface SentinelAlert {
  id: string;
  source: "operational_lab" | "challenge_predictor";
  tenant: TenantId | null;
  runId: string | null;
  incidentId: string | null;
  timestamp: string;
  confidence: number | null;
  incidentType: string | null;
  severity: AlertSeverity;
  state: AlertState;
  dataQuality: DataQuality;
  evidence: AlertEvidence[];
  modelVersion: string | null;
}
