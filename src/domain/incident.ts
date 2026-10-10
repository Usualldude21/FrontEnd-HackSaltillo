import type { TenantId } from "./tenant";

export interface Incident {
  id: string;
  tenant: TenantId | null;
  service: string;
  severity: string;
  status: string;
  firstSignalAt: string;
  detectedAt: string;
  recoveredAt: string | null;
  evidence: Record<string, unknown>;
  experimentId: string | null;
}
