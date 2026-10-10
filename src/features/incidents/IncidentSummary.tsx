import type { SentinelAlert } from "../../domain/alert";
import type { Incident } from "../../domain/incident";
import {
  formatConfidence,
  formatIncidentSeverity,
  formatIncidentStatus,
  formatTimestamp,
} from "../../shared/format/operations";
import { Badge } from "../../shared/ui/Badge";

interface IncidentSummaryProps {
  alerts: readonly SentinelAlert[];
  incident: Incident;
}

export function IncidentSummary({ alerts, incident }: IncidentSummaryProps) {
  const confidences = alerts.flatMap((alert) => alert.confidence === null ? [] : [alert.confidence]);
  const confidence = confidences.length === 0 ? null : Math.max(...confidences);
  const tenant = alerts.find((alert) => alert.tenant !== null)?.tenant ?? incident.tenant;

  return (
    <section aria-labelledby="incident-summary-title" className="panel incident-summary">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">1 · Resumen del riesgo</p>
          <h3 id="incident-summary-title">{incident.service}</h3>
          <p>Incidente {incident.id}</p>
        </div>
        <div className="incident-summary-badges">
          <Badge tone={severityTone(incident.severity)}>{formatIncidentSeverity(incident.severity)}</Badge>
          <Badge tone={incident.recoveredAt === null ? "warning" : "success"}>{formatIncidentStatus(incident.status)}</Badge>
        </div>
      </div>
      <dl className="incident-facts">
        <div><dt>Tenant</dt><dd>{tenant ?? "No declarado"}</dd></div>
        <div><dt>Confianza máxima</dt><dd>{formatConfidence(confidence)}</dd></div>
        <div><dt>Primera señal</dt><dd>{formatTimestamp(incident.firstSignalAt)}</dd></div>
        <div><dt>Detección</dt><dd>{formatTimestamp(incident.detectedAt)}</dd></div>
        {incident.recoveredAt === null ? null : (
          <div><dt>Recuperación</dt><dd>{formatTimestamp(incident.recoveredAt)}</dd></div>
        )}
        <div><dt>Corrida</dt><dd>{incident.experimentId ?? "No disponible"}</dd></div>
      </dl>
    </section>
  );
}

function severityTone(severity: string): "danger" | "warning" | "neutral" {
  const normalized = severity.toLowerCase();
  if (normalized === "critical") return "danger";
  if (normalized === "warning" || normalized === "high") return "warning";
  return "neutral";
}
