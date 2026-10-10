import type {
  ChallengeAlertKind,
  ChallengeAlertPriority,
  ChallengeAlertState,
} from "../../domain/kaikuChallenge";
import { Badge, type BadgeTone } from "../../shared/ui/Badge";

const priorityPresentation: Record<ChallengeAlertPriority, { label: string; tone: BadgeTone }> = {
  critical: { label: "Crítica", tone: "danger" },
  warning: { label: "Advertencia", tone: "warning" },
};

const statePresentation: Record<ChallengeAlertState, { label: string; tone: BadgeTone }> = {
  open: { label: "Abierta", tone: "danger" },
  acknowledged: { label: "Reconocida", tone: "success" },
};

const kindPresentation: Record<ChallengeAlertKind, { label: string; tone: BadgeTone }> = {
  incident_risk: { label: "Riesgo de incidente", tone: "warning" },
  data_quality_alert: { label: "Calidad de datos", tone: "info" },
};

export function ChallengePriorityBadge({ priority }: { priority: ChallengeAlertPriority }) {
  const item = priorityPresentation[priority];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function ChallengeStateBadge({ state }: { state: ChallengeAlertState }) {
  const item = statePresentation[state];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}

export function ChallengeKindBadge({ kind }: { kind: ChallengeAlertKind }) {
  const item = kindPresentation[kind];
  return <Badge tone={item.tone}>{item.label}</Badge>;
}
