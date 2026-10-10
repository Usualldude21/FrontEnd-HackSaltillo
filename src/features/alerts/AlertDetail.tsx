import { CheckCircle2, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { SentinelAlert } from "../../domain/alert";
import { formatConfidence, formatTimestamp } from "../../shared/format/operations";
import { Button } from "../../shared/ui/Button";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";
import { AlertSeverityBadge, AlertStateBadge } from "./AlertBadges";

interface AlertDetailProps {
  alert: SentinelAlert;
  authorized: boolean;
  feedback: string | null;
  isAcknowledging: boolean;
  mutationError: string | null;
  onAcknowledge: () => void;
}

export function AlertDetail({
  alert,
  authorized,
  feedback,
  isAcknowledging,
  mutationError,
  onAcknowledge,
}: AlertDetailProps) {
  return (
    <section aria-labelledby="alert-detail-title" className="panel alert-detail">
      <div className="panel-heading alert-detail-heading">
        <div>
          <p className="eyebrow">Detalle resumido · alerta {alert.id}</p>
          <h3 id="alert-detail-title">{alert.tenant === "kaiku" ? "Kaiku" : "Alerta operativa"}</h3>
          <p>{alert.incidentType ?? "El backend no declaró un tipo de incidente."}</p>
        </div>
        <div className="alert-badge-group">
          <AlertSeverityBadge severity={alert.severity} />
          <AlertStateBadge state={alert.state} />
        </div>
      </div>

      <dl className="alert-detail-facts">
        <div><dt>Momento de la señal</dt><dd>{formatTimestamp(alert.timestamp)}</dd></div>
        <div><dt>Confianza</dt><dd>{formatConfidence(alert.confidence)}</dd></div>
        <div><dt>Corrida</dt><dd>{alert.runId ?? "No disponible"}</dd></div>
        <div><dt>Modelo</dt><dd>{alert.modelVersion ?? "No disponible"}</dd></div>
        <div><dt>Calidad</dt><dd><DataQualityBadge quality={alert.dataQuality} /></dd></div>
      </dl>

      <div className="alert-evidence-summary">
        <h4>Evidencia observada</h4>
        {alert.evidence.length === 0 ? (
          <p>Esta alerta no contiene evidencia estructurada.</p>
        ) : (
          <ul>
            {alert.evidence.map((evidence) => (
              <li key={`${evidence.feature}-${evidence.observedAt}`}>
                <strong>{evidence.feature}</strong>
                <span>{evidenceStatement(evidence)}</span>
                <time dateTime={evidence.observedAt}>{formatTimestamp(evidence.observedAt)}</time>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="alert-detail-actions">
        {alert.incidentId === null ? null : (
          <Link className="button button-secondary" to={`/incidentes/${encodeURIComponent(alert.incidentId)}`}>
            Abrir incidente <ExternalLink aria-hidden="true" size={15} />
          </Link>
        )}
        {alert.state === "open" ? (
          <Button disabled={!authorized || isAcknowledging} onClick={onAcknowledge}>
            <CheckCircle2 aria-hidden="true" size={16} />
            {isAcknowledging ? "Reconociendo…" : "Reconocer alerta"}
          </Button>
        ) : null}
      </div>
      {alert.state === "open" && !authorized ? (
        <p className="authorization-note">Agrega un token de sesión para habilitar el reconocimiento.</p>
      ) : null}
      {mutationError === null ? null : <p className="action-message action-message-error" role="alert">{mutationError}</p>}
      {feedback === null ? null : <p className="action-message action-message-success" role="status">{feedback}</p>}
    </section>
  );
}

function evidenceStatement(evidence: SentinelAlert["evidence"][number]): string {
  if (evidence.observed === null) return "La señal no tuvo un valor disponible.";
  const observed = formatEvidenceValue(evidence.observed, evidence.unit);
  if (evidence.baseline === null) return `El valor observado fue ${observed}.`;
  return `Cambió de ${formatEvidenceValue(evidence.baseline, evidence.unit)} a ${observed}.`;
}

function formatEvidenceValue(value: number, unit: string | null): string {
  const formatted = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);
  return unit === null ? formatted : `${formatted} ${unit}`;
}
