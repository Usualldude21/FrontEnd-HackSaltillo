import type {
  ChallengeAlertKind,
  ChallengeAlertPriority,
  ChallengeAlertState,
  KaikuChallengeAlert,
} from "../../domain/kaikuChallenge";

const stateWeight: Record<ChallengeAlertState, number> = { open: 0, acknowledged: 1 };
const priorityWeight: Record<ChallengeAlertPriority, number> = { critical: 0, warning: 1 };
const kindWeight: Record<ChallengeAlertKind, number> = { incident_risk: 0, data_quality_alert: 1 };

export interface ChallengeAlertFilters {
  state: ChallengeAlertState | "all";
  kind: ChallengeAlertKind | "all";
  runId: string;
}

export const defaultChallengeAlertFilters: ChallengeAlertFilters = {
  state: "all",
  kind: "incident_risk",
  runId: "all",
};

export function sortChallengeAlerts(alerts: readonly KaikuChallengeAlert[]): KaikuChallengeAlert[] {
  return [...alerts].sort((left, right) => {
    const stateOrder = stateWeight[left.state] - stateWeight[right.state];
    if (stateOrder !== 0) return stateOrder;
    const priorityOrder = priorityWeight[left.priority] - priorityWeight[right.priority];
    if (priorityOrder !== 0) return priorityOrder;
    const kindOrder = kindWeight[left.kind] - kindWeight[right.kind];
    if (kindOrder !== 0) return kindOrder;
    const riskOrder = right.risk.value - left.risk.value;
    return riskOrder !== 0 ? riskOrder : right.eventId - left.eventId;
  });
}

export function filterChallengeAlerts(
  alerts: readonly KaikuChallengeAlert[],
  filters: ChallengeAlertFilters,
): KaikuChallengeAlert[] {
  return sortChallengeAlerts(alerts.filter((alert) => (
    (filters.state === "all" || alert.state === filters.state)
    && (filters.kind === "all" || alert.kind === filters.kind)
    && (filters.runId === "all" || alert.runId === filters.runId)
  )));
}
