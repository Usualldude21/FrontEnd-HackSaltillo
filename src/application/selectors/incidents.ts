import type { SentinelAlert } from "../../domain/alert";
import type { TimelineEvent } from "../../domain/event";
import type { Incident } from "../../domain/incident";

export type CausalMilestoneKind = "signal" | "detection" | "action" | "verification" | "recovery" | "event";

export interface CausalMilestone {
  id: string;
  kind: CausalMilestoneKind;
  timestamp: string;
  title: string;
  description: string;
  source: "incident" | "event";
}

export type ActionOutcome = "applied" | "blocked" | "suggested" | "none";

export interface IncidentActionSummary {
  outcome: ActionOutcome;
  event: TimelineEvent | null;
}

const appliedActionTypes = new Set(["ACTION_APPLIED", "ACTION_COMPLETED", "MITIGATION_APPLIED"]);
const blockedActionTypes = new Set(["ACTION_BLOCKED", "MITIGATION_BLOCKED"]);
const suggestedActionTypes = new Set(["ACTION_SUGGESTED", "MITIGATION_SUGGESTED"]);

export function selectIncidentAlerts(
  alerts: readonly SentinelAlert[],
  incidentId: string,
): SentinelAlert[] {
  return alerts.filter((alert) => alert.incidentId === incidentId);
}

export function selectIncidentAction(events: readonly TimelineEvent[]): IncidentActionSummary {
  const ordered = sortTimelineEvents(events);
  const latest = findLastEvent(ordered, (event) => {
    const type = normalizeType(event.type);
    return appliedActionTypes.has(type) || blockedActionTypes.has(type) || suggestedActionTypes.has(type);
  });
  if (latest === undefined) return { outcome: "none", event: null };
  const type = normalizeType(latest.type);
  if (appliedActionTypes.has(type)) return { outcome: "applied", event: latest };
  if (blockedActionTypes.has(type)) return { outcome: "blocked", event: latest };
  return { outcome: "suggested", event: latest };
}

export function selectVerificationEvent(events: readonly TimelineEvent[]): TimelineEvent | undefined {
  return findLastEvent(sortTimelineEvents(events), (event) => {
    const type = normalizeType(event.type);
    return type === "VERIFIED" || type === "VERIFICATION_COMPLETED";
  });
}

export function buildCausalTimeline(
  incident: Incident,
  events: readonly TimelineEvent[],
): CausalMilestone[] {
  const orderedEvents = sortTimelineEvents(events);
  const milestones: CausalMilestone[] = [
    {
      id: "incident-first-signal",
      kind: "signal",
      timestamp: incident.firstSignalAt,
      title: "Primera señal",
      description: eventDescription(orderedEvents.find((event) => normalizeType(event.type) === "FIRST_SIGNAL")),
      source: "incident",
    },
    {
      id: "incident-detected",
      kind: "detection",
      timestamp: incident.detectedAt,
      title: "Incidente detectado",
      description: "Momento de detección declarado por el incidente.",
      source: "incident",
    },
  ];

  for (const event of orderedEvents) {
    const type = normalizeType(event.type);
    if (type === "FIRST_SIGNAL") continue;
    if (type === "ALERT_EMITTED" && event.timestamp === incident.detectedAt) continue;
    milestones.push({
      id: `event-${event.id}`,
      kind: eventKind(type),
      timestamp: event.timestamp,
      title: eventTitle(type),
      description: eventDescription(event),
      source: "event",
    });
  }

  if (incident.recoveredAt !== null
    && !orderedEvents.some((event) => event.timestamp === incident.recoveredAt
      && eventKind(normalizeType(event.type)) === "recovery")) {
    milestones.push({
      id: "incident-recovered",
      kind: "recovery",
      timestamp: incident.recoveredAt,
      title: "Recuperación registrada",
      description: "Momento de recuperación declarado por el incidente.",
      source: "incident",
    });
  }

  return milestones.sort((left, right) => {
    const timeOrder = Date.parse(left.timestamp) - Date.parse(right.timestamp);
    return timeOrder === 0 ? milestoneWeight(left.kind) - milestoneWeight(right.kind) : timeOrder;
  });
}

export function sortTimelineEvents(events: readonly TimelineEvent[]): TimelineEvent[] {
  const unique = new Map<number, TimelineEvent>();
  for (const event of events) unique.set(event.id, event);
  return [...unique.values()].sort((left, right) => {
    const timeOrder = Date.parse(left.timestamp) - Date.parse(right.timestamp);
    return timeOrder === 0 ? left.id - right.id : timeOrder;
  });
}

function normalizeType(type: string): string {
  return type.trim().toUpperCase();
}

function eventKind(type: string): CausalMilestoneKind {
  if (appliedActionTypes.has(type) || blockedActionTypes.has(type) || suggestedActionTypes.has(type)) return "action";
  if (type === "VERIFIED" || type === "VERIFICATION_COMPLETED") return "verification";
  if (type === "RECOVERED") return "recovery";
  if (type === "ALERT_EMITTED" || type === "DETECTED") return "detection";
  return "event";
}

function eventTitle(type: string): string {
  const titles: Record<string, string> = {
    ACTION_APPLIED: "Acción aplicada",
    ACTION_BLOCKED: "Acción bloqueada",
    ACTION_COMPLETED: "Acción completada",
    ACTION_SUGGESTED: "Acción sugerida",
    ALERT_EMITTED: "Alerta emitida",
    MITIGATION_APPLIED: "Mitigación aplicada",
    MITIGATION_BLOCKED: "Mitigación bloqueada",
    MITIGATION_SUGGESTED: "Mitigación sugerida",
    RECOVERED: "Recuperación registrada",
    VERIFIED: "Verificación posterior",
    VERIFICATION_COMPLETED: "Verificación posterior",
  };
  return titles[type] ?? type.toLocaleLowerCase("es-MX").replaceAll("_", " ");
}

function eventDescription(event: TimelineEvent | undefined): string {
  if (event === undefined) return "No hay detalles adicionales en los eventos recibidos.";
  const entries = Object.entries(event.details);
  if (entries.length === 0) return "El evento no contiene detalles adicionales.";
  return entries.map(([key, value]) => `${humanizeKey(key)}: ${formatDetail(value)}`).join(" · ");
}

function humanizeKey(value: string): string {
  return value.replaceAll("_", " ");
}

function formatDetail(value: unknown): string {
  if (value === null) return "sin dato";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return "detalle estructurado disponible";
}

function milestoneWeight(kind: CausalMilestoneKind): number {
  return ["signal", "detection", "action", "verification", "recovery", "event"].indexOf(kind);
}

function findLastEvent(
  events: readonly TimelineEvent[],
  predicate: (event: TimelineEvent) => boolean,
): TimelineEvent | undefined {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];
    if (event !== undefined && predicate(event)) return event;
  }
  return undefined;
}
