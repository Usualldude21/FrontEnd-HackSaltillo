import { CircleAlert, CircleCheck, CircleDashed, RefreshCw, WifiOff } from "lucide-react";
import type { ConnectionState } from "../../domain/backend";
import { Badge, type BadgeTone } from "./Badge";

const connectionPresentation: Record<ConnectionState, {
  label: string;
  tone: BadgeTone;
  icon: typeof CircleCheck;
}> = {
  connecting: { label: "Conectando", tone: "neutral", icon: CircleDashed },
  live: { label: "En vivo", tone: "success", icon: CircleCheck },
  reconnecting: { label: "Reconectando", tone: "warning", icon: RefreshCw },
  offline: { label: "Sin conexión", tone: "danger", icon: WifiOff },
  incompatible: { label: "Contrato incompatible", tone: "danger", icon: CircleAlert },
};

interface ConnectionBadgeProps {
  state: ConnectionState;
  prefix?: string;
  label?: string;
}

export function ConnectionBadge({ label, prefix, state }: ConnectionBadgeProps) {
  const presentation = connectionPresentation[state];
  const Icon = presentation.icon;
  return (
    <Badge role="status" tone={presentation.tone}>
      <Icon aria-hidden="true" size={14} />
      {prefix === undefined ? null : `${prefix} · `}{label ?? presentation.label}
    </Badge>
  );
}
