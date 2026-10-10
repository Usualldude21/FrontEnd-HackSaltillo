import { Activity, BellRing, CheckCircle2, CircleDot, ShieldCheck, Wrench } from "lucide-react";
import type { TimelineEvent } from "../../domain/event";
import { formatTimestamp } from "../../shared/format/operations";
import { EmptyState } from "../../shared/ui/EmptyState";

const presentation = {
  FIRST_SIGNAL: { icon: Activity, label: "Primera señal", className: "signal" },
  ALERT_EMITTED: { icon: BellRing, label: "Alerta emitida", className: "detection" },
  ACTION_APPLIED: { icon: Wrench, label: "Acción aplicada", className: "action" },
  VERIFIED: { icon: ShieldCheck, label: "Verificación posterior", className: "verification" },
  RECOVERED: { icon: CheckCircle2, label: "Recuperación registrada", className: "recovery" },
} as const;

export function ReplayTimeline({ events }: { events: readonly TimelineEvent[] }) {
  return (
    <section aria-labelledby="replay-timeline-title" className="panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">Evidencia disponible hasta ahora</p>
          <h3 id="replay-timeline-title">Línea temporal del replay</h3>
        </div>
      </div>
      {events.length === 0 ? (
        <EmptyState
          description="El backend todavía no ha emitido eventos causales para este momento del replay."
          title="Sin eventos visibles"
        />
      ) : (
        <ol className="causal-timeline">
          {events.map((event) => {
            const normalized = event.type.toUpperCase();
            const item = presentation[normalized as keyof typeof presentation];
            const Icon = item?.icon ?? CircleDot;
            return (
              <li className={`causal-${item?.className ?? "event"}`} key={event.id}>
                <div className="causal-marker"><Icon aria-hidden="true" size={17} /></div>
                <div>
                  <div className="causal-title-row">
                    <strong>{item?.label ?? normalized.toLocaleLowerCase("es-MX").replaceAll("_", " ")}</strong>
                    <time dateTime={event.timestamp}>{formatTimestamp(event.timestamp)}</time>
                  </div>
                  <p>{eventDescription(event)}</p>
                  <span>Fuente: evento del backend</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function eventDescription(event: TimelineEvent): string {
  const entries = Object.entries(event.details);
  if (entries.length === 0) return "El evento no contiene detalles adicionales.";
  return entries.map(([key, value]) => {
    const label = key.replaceAll("_", " ");
    const rendered = typeof value === "string" || typeof value === "number" || typeof value === "boolean"
      ? String(value)
      : value === null ? "sin dato" : "detalle estructurado disponible";
    return `${label}: ${rendered}`;
  }).join(" · ");
}
