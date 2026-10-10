import type { TenantOperationalSummary } from "../../application/selectors/operations";
import { formatConfidence } from "../../shared/format/operations";
import { Badge } from "../../shared/ui/Badge";

interface RiskSummaryProps {
  summary: TenantOperationalSummary;
  openAlerts: number;
}

export function RiskSummary({ summary, openAlerts }: RiskSummaryProps) {
  return (
    <section aria-labelledby="risk-summary-title" className="risk-summary">
      <div>
        <p className="eyebrow">Prioridad operativa</p>
        <h3 id="risk-summary-title">{openAlerts} {openAlerts === 1 ? "alerta abierta" : "alertas abiertas"}</h3>
      </div>
      {openAlerts === 0 ? (
        <div className="risk-summary-main">
          <Badge tone="success">Sin riesgo activo</Badge>
          <p>No hay alertas abiertas de Kaiku para la corrida seleccionada.</p>
        </div>
      ) : (
        <div className="risk-summary-main">
          <Badge tone="danger">Atención requerida · Kaiku</Badge>
          <p>
            Confianza activa: <strong>{formatConfidence(summary.highestConfidence)}</strong>
            {summary.dominantEvidence === null
              ? null
              : <> · Señal: <strong>{summary.dominantEvidence.feature}</strong></>}
          </p>
        </div>
      )}
    </section>
  );
}
