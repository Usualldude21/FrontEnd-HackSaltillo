import type { TimelineEvent } from "../../domain/event";
import type { Incident } from "../../domain/incident";
import { selectIncidentAction, selectVerificationEvent } from "../../application/selectors/incidents";
import { formatTimestamp } from "../../shared/format/operations";
import { Badge } from "../../shared/ui/Badge";

interface IncidentOutcomeProps {
  events: readonly TimelineEvent[];
  incident: Incident;
}

export function IncidentOutcome({ events, incident }: IncidentOutcomeProps) {
  const action = selectIncidentAction(events);
  const verification = selectVerificationEvent(events);

  return (
    <section aria-labelledby="incident-outcome-title" className="panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">4 · Acción y verificación</p>
          <h3 id="incident-outcome-title">Resultado registrado</h3>
        </div>
      </div>
      <div className="outcome-grid">
        <article>
          <div className="outcome-title"><h4>Acción</h4><ActionBadge outcome={action.outcome} /></div>
          <p>{actionMessage(action.outcome)}</p>
          {action.event === null ? null : (
            <dl className="contract-details">
              <div><dt>Evento</dt><dd>{action.event.type}</dd></div>
              <div><dt>Momento</dt><dd>{formatTimestamp(action.event.timestamp)}</dd></div>
              {Object.entries(action.event.details).map(([key, value]) => (
                <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{formatDetail(value)}</dd></div>
              ))}
            </dl>
          )}
        </article>
        <article>
          <div className="outcome-title"><h4>Verificación posterior</h4><VerificationBadge present={verification !== undefined} /></div>
          {verification === undefined ? (
            <p>No existe un evento de verificación posterior en el contrato recibido.</p>
          ) : (
            <>
              <p>Existe una verificación registrada: {formatTimestamp(verification.timestamp)}</p>
              <dl className="contract-details">
                {Object.entries(verification.details).map(([key, value]) => (
                  <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{formatDetail(value)}</dd></div>
                ))}
              </dl>
            </>
          )}
          {incident.recoveredAt === null ? (
            <p className="recovery-absent">No hay recuperación registrada.</p>
          ) : (
            <p className="recovery-present">Recuperación declarada: {formatTimestamp(incident.recoveredAt)}</p>
          )}
        </article>
      </div>
    </section>
  );
}

function ActionBadge({ outcome }: { outcome: ReturnType<typeof selectIncidentAction>["outcome"] }) {
  if (outcome === "applied") return <Badge tone="success">Aplicada</Badge>;
  if (outcome === "blocked") return <Badge tone="danger">Bloqueada</Badge>;
  if (outcome === "suggested") return <Badge tone="warning">Solo sugerida</Badge>;
  return <Badge tone="neutral">Sin registro</Badge>;
}

function VerificationBadge({ present }: { present: boolean }) {
  return <Badge tone={present ? "success" : "neutral"}>{present ? "Verificada" : "Sin verificar"}</Badge>;
}

function actionMessage(outcome: ReturnType<typeof selectIncidentAction>["outcome"]): string {
  if (outcome === "applied") return "El contrato contiene un evento explícito de acción aplicada.";
  if (outcome === "blocked") return "El contrato contiene un evento explícito de acción bloqueada.";
  if (outcome === "suggested") return "La acción fue sugerida; no existe evidencia de que se haya ejecutado.";
  return "No existe una acción aplicada, bloqueada o sugerida en los eventos recibidos.";
}

function formatDetail(value: unknown): string {
  if (value === null) return "Sin dato";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  return "Detalle estructurado";
}
