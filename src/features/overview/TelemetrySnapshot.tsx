import type { TelemetryPoint } from "../../domain/telemetry";
import type { Tenant } from "../../domain/tenant";
import { formatMetric, formatTimestamp } from "../../shared/format/operations";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";
import { EmptyState } from "../../shared/ui/EmptyState";

interface TelemetrySnapshotProps {
  point: TelemetryPoint | null;
  tenant: Tenant;
}

export function TelemetrySnapshot({ point, tenant }: TelemetrySnapshotProps) {
  return (
    <section aria-labelledby="telemetry-title" className="panel operation-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Monitoreo exclusivo · {tenant.id}</p>
          <h3 id="telemetry-title">Telemetría reciente de {tenant.name}</h3>
        </div>
        {point === null ? null : <DataQualityBadge quality={point.dataQuality} />}
      </div>
      {point === null ? (
        <EmptyState
          description="La corrida seleccionada no contiene muestras de Kaiku."
          title="Sin telemetría"
        />
      ) : (
        <>
          <p className="sample-time">Última muestra recibida: {formatTimestamp(point.timestamp)}</p>
          <dl className="metric-grid">
            <Metric label="CPU" value={formatMetric(point.cpu, "%")} />
            <Metric label="RAM" value={formatMetric(point.ram, "%")} />
            <Metric label="Disco" value={formatMetric(point.disk, "%")} />
            <Metric label="Latencia" value={formatMetric(point.latencyMs, " ms")} />
            <Metric label="Errores" value={formatMetric(point.errors, "")} />
          </dl>
          {point.dataQuality === "outage" ? (
            <p className="data-gap-note">Los valores ausentes se muestran como huecos; no se convierten en cero.</p>
          ) : null}
        </>
      )}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  const missing = value === "Sin dato";
  return (
    <div className={missing ? "metric metric-missing" : "metric"}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
