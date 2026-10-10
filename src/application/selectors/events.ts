import type { QueryKey } from "@tanstack/react-query";
import type { TimelineEvent } from "../../domain/event";
import { queryKeys } from "../queries/keys";

export function deduplicateEvents(events: readonly TimelineEvent[]): TimelineEvent[] {
  const byId = new Map<number, TimelineEvent>();
  for (const event of events) byId.set(event.id, event);
  return [...byId.values()].sort((left, right) => left.id - right.id);
}

export function relatedQueryKeys(event: TimelineEvent): QueryKey[] {
  const type = event.type.toUpperCase();
  const keys: QueryKey[] = [];
  const alertChanged = type.includes("ALERT");
  const operationChanged = alertChanged
    || type.includes("SIGNAL")
    || type.includes("METRIC")
    || type.includes("TELEMETRY");
  const incidentChanged = event.incidentId !== null
    || type.includes("INCIDENT")
    || type.includes("ACTION")
    || type.includes("VERIFIED")
    || type.includes("RECOVER");
  const replayChanged = type.includes("REPLAY");

  if (alertChanged) keys.push(["alerts"]);
  if (operationChanged) keys.push(["operation-snapshot"]);
  if (incidentChanged) keys.push(queryKeys.incidents);
  if (replayChanged) keys.push(["replay"]);
  if (event.incidentId !== null) {
    keys.push(queryKeys.incident(event.incidentId));
    keys.push(queryKeys.incidentEvents(event.incidentId));
    keys.push(queryKeys.incidentDetail(event.incidentId));
  }

  return keys;
}
