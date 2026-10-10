import { Link } from "react-router-dom";
import type { SentinelAlert } from "../../domain/alert";
import type { Tenant } from "../../domain/tenant";
import { EmptyState } from "../../shared/ui/EmptyState";

interface IncidentHandoffProps {
  alerts: readonly SentinelAlert[];
  tenant: Tenant;
}

export function IncidentHandoff({ alerts, tenant }: IncidentHandoffProps) {
  const activeIncident = alerts.find((alert) => alert.state === "open" && alert.incidentId !== null);
  return (
    <section aria-labelledby="timeline-title" className="panel operation-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Seguimiento causal</p>
          <h3 id="timeline-title">Línea temporal de {tenant.name}</h3>
        </div>
      </div>
      {activeIncident?.incidentId === undefined || activeIncident.incidentId === null ? (
        <EmptyState
          description="No existe un incidente activo enlazado a las alertas de Kaiku."
          title="Sin incidente activo"
        />
      ) : (
        <div className="incident-handoff">
          <div>
            <strong>Incidente {activeIncident.incidentId}</strong>
            <p>Existe evidencia enlazada. Abre el detalle para seguir señal, acción y verificación.</p>
          </div>
          <Link className="button button-secondary" to={`/incidentes/${activeIncident.incidentId}`}>
            Abrir incidente
          </Link>
        </div>
      )}
    </section>
  );
}
