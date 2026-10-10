import type { BackendCapabilities } from "../../domain/backend";
import { Badge } from "../../shared/ui/Badge";

interface MonitorStatusProps {
  capabilities: BackendCapabilities;
}

export function MonitorStatus({ capabilities }: MonitorStatusProps) {
  return (
    <section aria-labelledby="monitor-title" className="panel operation-section">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Estado técnico</p>
          <h3 id="monitor-title">Capacidades del monitor</h3>
        </div>
      </div>
      <ul className="capability-list">
        <Capability available={capabilities.challengePredictor} label="Predictor de Kaiku" />
        <Capability available={capabilities.eventStream} label="Actualizaciones SSE" />
        <Capability available={capabilities.operationalLab} label="Laboratorio operativo" />
        <Capability available={capabilities.administrativeActions} label="Acciones administrativas" />
      </ul>
    </section>
  );
}

function Capability({ available, label }: { available: boolean; label: string }) {
  return (
    <li>
      <span>{label}</span>
      <Badge tone={available ? "success" : "neutral"}>{available ? "Disponible" : "No disponible"}</Badge>
    </li>
  );
}
