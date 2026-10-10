export const tenantIds = ["kaiku"] as const;

export type TenantId = (typeof tenantIds)[number];

export interface Tenant {
  id: TenantId;
  name: string;
  business: string;
  criticalSystems: string[];
  operatingWindow: string;
}
