import { CircleCheck, CircleEllipsis, CircleOff, TriangleAlert } from "lucide-react";
import type { TenantDisplayState } from "../../application/selectors/operations";
import { Badge, type BadgeTone } from "../../shared/ui/Badge";

const presentation: Record<TenantDisplayState, {
  label: string;
  tone: BadgeTone;
  icon: typeof CircleCheck;
}> = {
  stable: { label: "Estable", tone: "success", icon: CircleCheck },
  watch: { label: "Observación", tone: "warning", icon: CircleEllipsis },
  alert: { label: "Alerta", tone: "danger", icon: TriangleAlert },
  "no-telemetry": { label: "Sin telemetría", tone: "neutral", icon: CircleOff },
};

interface TenantStatusBadgeProps {
  state: TenantDisplayState;
}

export function TenantStatusBadge({ state }: TenantStatusBadgeProps) {
  const item = presentation[state];
  const Icon = item.icon;
  return (
    <Badge tone={item.tone}>
      <Icon aria-hidden="true" size={14} />
      {item.label}
    </Badge>
  );
}
