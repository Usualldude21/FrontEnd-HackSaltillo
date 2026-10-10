import type { SentinelAlert } from "../../domain/alert";
import type { TimelineEvent } from "../../domain/event";
import type { Incident } from "../../domain/incident";
import type { SentinelDataSource } from "../../domain/ports";
import { selectIncidentAlerts, sortTimelineEvents } from "../selectors/incidents";

export interface IncidentDetailSnapshot {
  incident: Incident;
  events: TimelineEvent[];
  alerts: SentinelAlert[];
}

export async function loadIncidentDetail(
  source: SentinelDataSource,
  incidentId: string,
  signal?: AbortSignal,
): Promise<IncidentDetailSnapshot> {
  const [incident, events, alerts] = await Promise.all([
    source.getIncident(incidentId, signal),
    source.listIncidentEvents(incidentId, signal),
    source.listAlerts({}, signal),
  ]);
  return {
    incident,
    events: sortTimelineEvents(events.filter((event) => event.incidentId === incidentId)),
    alerts: selectIncidentAlerts(alerts, incidentId),
  };
}
