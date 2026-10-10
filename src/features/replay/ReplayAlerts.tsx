import type { SentinelAlert } from "../../domain/alert";
import { formatConfidence, formatTimestamp } from "../../shared/format/operations";
import { EmptyState } from "../../shared/ui/EmptyState";
import { AlertSeverityBadge } from "../alerts/AlertBadges";

export function ReplayAlerts({ alerts }: { alerts: readonly SentinelAlert[] }) {
  return (
    <section aria-labelledby="replay-alerts-title" className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Sin anticipar el futuro</p>
          <h3 id="replay-alerts-title">Alertas emitidas hasta este minuto</h3>
        </div>
      </div>
      {alerts.length === 0 ? (
        <EmptyState
          description="No se han emitido alertas antes del timestamp actual del replay."
          title="Sin alertas visibles"
        />
      ) : (
        <ul className="replay-alert-list">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <div>
                <strong>{alert.incidentType ?? "Alerta de Kaiku"}</strong>
                <time dateTime={alert.timestamp}>{formatTimestamp(alert.timestamp)}</time>
              </div>
              <span>{alert.evidence[0]?.feature ?? "Sin evidencia estructurada"}</span>
              <span>{formatConfidence(alert.confidence)}</span>
              <AlertSeverityBadge severity={alert.severity} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
