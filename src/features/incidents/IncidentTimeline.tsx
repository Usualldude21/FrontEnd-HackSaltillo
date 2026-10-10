import { Activity, BellRing, CheckCircle2, CircleDot, ShieldCheck, Wrench } from "lucide-react";
import type { TimelineEvent } from "../../domain/event";
import type { Incident } from "../../domain/incident";
import { buildCausalTimeline, type CausalMilestoneKind } from "../../application/selectors/incidents";
import { formatTimestamp } from "../../shared/format/operations";

const icons = {
  signal: Activity,
  detection: BellRing,
  action: Wrench,
  verification: ShieldCheck,
  recovery: CheckCircle2,
  event: CircleDot,
} satisfies Record<CausalMilestoneKind, typeof Activity>;

interface IncidentTimelineProps {
  events: readonly TimelineEvent[];
  incident: Incident;
}

export function IncidentTimeline({ events, incident }: IncidentTimelineProps) {
  const timeline = buildCausalTimeline(incident, events);
  return (
    <section aria-labelledby="causal-timeline-title" className="panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">3 · Línea temporal</p>
          <h3 id="causal-timeline-title">Secuencia causal</h3>
        </div>
      </div>
      <ol className="causal-timeline">
        {timeline.map((milestone) => {
          const Icon = icons[milestone.kind];
          return (
            <li className={`causal-${milestone.kind}`} key={milestone.id}>
              <div className="causal-marker"><Icon aria-hidden="true" size={17} /></div>
              <div>
                <div className="causal-title-row">
                  <strong>{milestone.title}</strong>
                  <time dateTime={milestone.timestamp}>{formatTimestamp(milestone.timestamp)}</time>
                </div>
                <p>{milestone.description}</p>
                <span>Fuente: {milestone.source === "incident" ? "campo del incidente" : "evento"}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
