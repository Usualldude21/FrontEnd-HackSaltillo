import type { TenantId } from "./tenant";

export type DataQuality = "ok" | "partial" | "outage";

export interface TelemetryPoint {
  tenant: TenantId;
  runId: string;
  timestamp: string;
  cpu: number | null;
  ram: number | null;
  disk: number | null;
  latencyMs: number | null;
  errors: number | null;
  dataQuality: DataQuality;
}
