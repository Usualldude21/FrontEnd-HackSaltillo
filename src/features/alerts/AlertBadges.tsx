import type { AlertSeverity, AlertState } from "../../domain/alert";
import { Badge, type BadgeTone } from "../../shared/ui/Badge";

const severityPresentation: Record<AlertSeverity, { label: string; tone: BadgeTone }> = {
  critical: { label: "Crítica", tone: "danger" },
  warning: { label: "Advertencia", tone: "warning" },
  watch: { label: "Observación", tone: "info" },
};

const statePresentation: Record<AlertState, { label: string; tone: BadgeTone }> = {
  open: { label: "Abierta", tone: "danger" },
  acknowledged: { label: "Reconocida", tone: "success" },
  resolved: { label: "Resuelta", tone: "neutral" },
};

export function AlertSeverityBadge({ severity }: { severity: AlertSeverity }) {
  const presentation = severityPresentation[severity];
  return <Badge tone={presentation.tone}>{presentation.label}</Badge>;
}

export function AlertStateBadge({ state }: { state: AlertState }) {
  const presentation = statePresentation[state];
  return <Badge tone={presentation.tone}>{presentation.label}</Badge>;
}
