import type { TenantOperationalSummary } from "../../application/selectors/operations";
import { formatConfidence, formatTimestamp } from "../../shared/format/operations";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";
import { TenantStatusBadge } from "./TenantStatusBadge";

interface KaikuStatusCardProps {
  summary: TenantOperationalSummary;
}

export function KaikuStatusCard({ summary }: KaikuStatusCardProps) {
  const { tenant } = summary;
  return (
    <article className="kaiku-status-card">
      <div className="kaiku-card-topline">
        <span className="kaiku-id">{tenant.id}</span>
        <TenantStatusBadge state={summary.state} />
      </div>
      <strong className="kaiku-name">{tenant.name}</strong>
      <span className="kaiku-business">{tenant.business}</span>
      <dl className="kaiku-facts">
        <div>
          <dt>Confianza activa</dt>
          <dd>{formatConfidence(summary.highestConfidence)}</dd>
        </div>
        <div>
          <dt>Última muestra</dt>
          <dd>{formatTimestamp(summary.lastSampleAt)}</dd>
        </div>
        <div>
          <dt>Señal dominante</dt>
          <dd>{summary.dominantEvidence?.feature ?? "Sin señal activa"}</dd>
        </div>
        <div>
          <dt>Alertas abiertas</dt>
          <dd>{summary.openAlerts}</dd>
        </div>
      </dl>
      {summary.dataQuality === null
        ? <span className="kaiku-no-quality">Sin muestra disponible</span>
        : <DataQualityBadge quality={summary.dataQuality} />}
    </article>
  );
}
