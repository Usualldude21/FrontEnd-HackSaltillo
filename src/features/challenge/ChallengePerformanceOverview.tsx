import { BellRing, Clock3, ShieldCheck, VolumeX } from "lucide-react";
import type { ChallengeOperations, ChallengeShowcase } from "../../domain/kaikuChallenge";
import { formatDuration } from "../../shared/format/challenge";

interface ChallengePerformanceOverviewProps {
  operations: ChallengeOperations;
  showcase: ChallengeShowcase;
}

export function ChallengePerformanceOverview({
  operations,
  showcase,
}: ChallengePerformanceOverviewProps) {
  const control = showcase.falseAlarmControl;
  const avoidedNoise = Math.max(
    0,
    control.knownEventAlertsWithoutContext - control.knownEventAlertsWithContext,
  );

  return (
    <div className="performance-page-grid">
      <section aria-labelledby="performance-evidence-title" className="performance-hero">
        <header>
          <div>
            <p className="section-label">Evidencia medible</p>
            <h2 id="performance-evidence-title">Resultado de la ejecución</h2>
          </div>
          <span className={operations.integrity.passed ? "integrity-ok" : "integrity-failed"}>
            <ShieldCheck aria-hidden="true" size={16} />
            {operations.integrity.passed ? "Integridad validada" : "Integridad pendiente"}
          </span>
        </header>
        <p className="performance-lede">
          Resultados medidos de la corrida seleccionada.
        </p>
        <dl className="performance-primary-metrics">
          <div>
            <dt><BellRing aria-hidden="true" size={19} /> Riesgos emitidos</dt>
            <dd className="num">{operations.alertCounts.incidentRisk}</dd>
            <small>Hallazgos del modelo, no incidentes confirmados</small>
          </div>
          <div>
            <dt><VolumeX aria-hidden="true" size={19} /> Ruido evitado por contexto</dt>
            <dd className="num">{avoidedNoise}</dd>
            <small>Eventos normales que no llegaron a la cola</small>
          </div>
          <div>
            <dt><Clock3 aria-hidden="true" size={19} /> Mediana señal → detección</dt>
            <dd className="num">{formatDuration(operations.timing.signalToDetection.median)}</dd>
            <small>N = {operations.timing.signalToDetection.count} alertas procesadas</small>
          </div>
        </dl>
      </section>

    </div>
  );
}
