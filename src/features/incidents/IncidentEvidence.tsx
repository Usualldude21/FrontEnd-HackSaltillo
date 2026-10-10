import type { SentinelAlert } from "../../domain/alert";
import { formatTimestamp } from "../../shared/format/operations";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";

export function IncidentEvidence({ alerts }: { alerts: readonly SentinelAlert[] }) {
  const evidence = alerts.flatMap((alert) => alert.evidence.map((item) => ({
    ...item,
    alertId: alert.id,
    quality: alert.dataQuality,
  })));

  return (
    <section aria-labelledby="incident-evidence-title" className="panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">2 · Evidencia observada</p>
          <h3 id="incident-evidence-title">Hechos vinculados</h3>
        </div>
      </div>
      {evidence.length === 0 ? (
        <p className="incident-absence">No hay evidencia estructurada enlazada a este incidente.</p>
      ) : (
        <ul className="incident-evidence-list">
          {evidence.map((item) => (
            <li key={`${item.alertId}-${item.feature}-${item.observedAt}`}>
              <div>
                <strong>{item.feature}</strong>
                <span>Alerta {item.alertId}</span>
              </div>
              <p>{evidenceStatement(item)}</p>
              <div className="incident-evidence-meta">
                <DataQualityBadge quality={item.quality} />
                <time dateTime={item.observedAt}>{formatTimestamp(item.observedAt)}</time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function evidenceStatement(evidence: SentinelAlert["evidence"][number]): string {
  if (evidence.observed === null) return "La señal no tuvo un valor disponible.";
  const observed = formatValue(evidence.observed, evidence.unit);
  if (evidence.baseline === null) return `El valor observado fue ${observed}.`;
  const verb = evidence.direction === "down" ? "disminuyó" : evidence.direction === "stable" ? "se mantuvo" : "aumentó";
  return `La señal ${verb} de ${formatValue(evidence.baseline, evidence.unit)} a ${observed}.`;
}

function formatValue(value: number, unit: string | null): string {
  const formatted = new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);
  return unit === null ? formatted : `${formatted} ${unit}`;
}
