import { CircleHelp } from "lucide-react";
import type { SentinelAlert } from "../../domain/alert";
import type { TimelineEvent } from "../../domain/event";
import type { Incident } from "../../domain/incident";
import { selectIncidentAction } from "../../application/selectors/incidents";

interface IncidentUncertaintiesProps {
  alerts: readonly SentinelAlert[];
  events: readonly TimelineEvent[];
  incident: Incident;
}

export function IncidentUncertainties({ alerts, events, incident }: IncidentUncertaintiesProps) {
  const uncertainties = buildUncertainties(alerts, events, incident);
  return (
    <section aria-labelledby="uncertainties-title" className="panel uncertainty-panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">5 · Incertidumbres</p>
          <h3 id="uncertainties-title">Límites de la evidencia</h3>
        </div>
      </div>
      {uncertainties.length === 0 ? (
        <p className="incident-absence">No se identificaron incertidumbres adicionales en los campos recibidos.</p>
      ) : (
        <ul>
          {uncertainties.map((uncertainty) => (
            <li key={uncertainty}><CircleHelp aria-hidden="true" size={17} /><span>{uncertainty}</span></li>
          ))}
        </ul>
      )}
    </section>
  );
}

function buildUncertainties(
  alerts: readonly SentinelAlert[],
  events: readonly TimelineEvent[],
  incident: Incident,
): string[] {
  const values: string[] = [];
  if (alerts.length === 0) values.push("No hay una alerta enlazada que aporte confianza o calidad de datos.");
  if (alerts.some((alert) => alert.dataQuality === "partial")) values.push("Parte de la evidencia proviene de telemetría parcial.");
  if (alerts.some((alert) => alert.dataQuality === "outage")) values.push("Existe un apagón de telemetría dentro de la evidencia enlazada.");
  if (alerts.some((alert) => alert.confidence === null)) values.push("La fuente operativa no declaró una confianza numérica.");
  if (selectIncidentAction(events).outcome === "none") values.push("No hay una acción registrada para evaluar su efecto.");
  if (incident.recoveredAt === null) values.push("El incidente no declara un momento de recuperación.");
  if (!events.some((event) => ["VERIFIED", "VERIFICATION_COMPLETED"].includes(event.type.toUpperCase()))) {
    values.push("No existe un evento de verificación posterior.");
  }
  return values;
}
