import type { AlertSeverity, AlertState, SentinelAlert } from "../../domain/alert";

const stateWeight = { open: 0, acknowledged: 1, resolved: 2 } as const;
const severityWeight = { critical: 0, warning: 1, watch: 2 } as const;

export function sortAlertsByPriority(alerts: readonly SentinelAlert[]): SentinelAlert[] {
  return [...alerts].sort((left, right) => {
    const stateOrder = stateWeight[left.state] - stateWeight[right.state];
    if (stateOrder !== 0) return stateOrder;

    const severityOrder = severityWeight[left.severity] - severityWeight[right.severity];
    if (severityOrder !== 0) return severityOrder;

    const confidenceOrder = (right.confidence ?? -1) - (left.confidence ?? -1);
    if (confidenceOrder !== 0) return confidenceOrder;

    return Date.parse(right.timestamp) - Date.parse(left.timestamp);
  });
}

export interface AlertFilters {
  state: AlertState | "all";
  severity: AlertSeverity | "all";
  runId: string;
}

export const defaultAlertFilters: AlertFilters = {
  state: "all",
  severity: "all",
  runId: "all",
};

export function filterAlerts(
  alerts: readonly SentinelAlert[],
  filters: AlertFilters,
): SentinelAlert[] {
  return sortAlertsByPriority(alerts.filter((alert) => {
    const stateMatches = filters.state === "all" || alert.state === filters.state;
    const severityMatches = filters.severity === "all" || alert.severity === filters.severity;
    const runMatches = filters.runId === "all"
      || (filters.runId === "unassigned" ? alert.runId === null : alert.runId === filters.runId);
    return stateMatches && severityMatches && runMatches;
  }));
}
