import { CheckCircle2, Database, ShieldAlert, Siren } from "lucide-react";
import type { ChallengeOperations } from "../../domain/kaikuChallenge";
import { formatDuration } from "../../shared/format/challenge";

interface ChallengeOperationsSummaryProps {
  operations: ChallengeOperations;
}

export function ChallengeOperationsSummary({ operations }: ChallengeOperationsSummaryProps) {
  const { alertCounts, integrity, timing } = operations;

  return (
    <section aria-labelledby="challenge-status-title" className="panel challenge-summary">
      <div className="panel-heading challenge-panel-heading">
        <div>
          <p className="eyebrow">Estado durable</p>
          <h3 id="challenge-status-title">Alertas procesadas de Kaiku</h3>
        </div>
        <span className={`badge ${integrity.passed ? "badge-success" : "badge-danger"}`}>
          {integrity.passed ? <CheckCircle2 aria-hidden="true" size={15} /> : <ShieldAlert aria-hidden="true" size={15} />}
          Integridad {integrity.passed ? "validada" : "fallida"}
        </span>
      </div>

      <dl className="challenge-stat-grid">
        <div>
          <dt><Siren aria-hidden="true" size={16} /> Riesgo de incidente</dt>
          <dd>{alertCounts.incidentRisk}</dd>
        </div>
        <div>
          <dt><Database aria-hidden="true" size={16} /> Calidad de datos</dt>
          <dd>{alertCounts.dataQuality}</dd>
        </div>
        <div>
          <dt>Abiertas</dt>
          <dd>{alertCounts.open}</dd>
        </div>
        <div>
          <dt>Mediana señal → detección</dt>
          <dd>{formatDuration(timing.signalToDetection.median)}</dd>
        </div>
      </dl>
      <p className="challenge-clock-note">
        Señal y detección usan el reloj del replay sintético. La atención del operador usa reloj real;
        esos dominios no se mezclan en una duración inventada.
      </p>
    </section>
  );
}
