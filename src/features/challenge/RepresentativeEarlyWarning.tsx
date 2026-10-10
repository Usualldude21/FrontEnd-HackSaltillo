import { BellRing, CircleDot, ClipboardCheck, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import type { ChallengeEvidence, ChallengeShowcase } from "../../domain/kaikuChallenge";
import {
  formatDuration,
  formatIdentifier,
  formatRiskScore,
  formatSyntheticTimestamp,
} from "../../shared/format/challenge";

interface RepresentativeEarlyWarningProps {
  showcase: ChallengeShowcase;
}

export function RepresentativeEarlyWarning({ showcase }: RepresentativeEarlyWarningProps) {
  const example = showcase.representativeCase;

  return (
    <section aria-labelledby="early-warning-title" className="panel challenge-case">
      <div className="panel-heading challenge-panel-heading">
        <div>
          <p className="eyebrow">Caso reproducible · {example.runId}</p>
          <h3 id="early-warning-title">De la primera señal a una decisión segura</h3>
        </div>
        <div className="challenge-risk-score">
          <span>Score de riesgo</span>
          <strong>{formatRiskScore(example.risk.value)}</strong>
          <small>No es probabilidad calibrada</small>
        </div>
      </div>

      <ol className="causal-timeline challenge-timeline">
        <TimelineStep
          icon={<CircleDot aria-hidden="true" size={15} />}
          label="Primera señal observable"
          text="El modelo encuentra una combinación temprana de presión de base de datos y latencia."
          timestamp={formatSyntheticTimestamp(example.signalAt.value)}
        />
        <TimelineStep
          icon={<BellRing aria-hidden="true" size={15} />}
          label="Detección confiable"
          text={`Riesgo tipificado como ${formatIdentifier(example.suspectedIncidentType)} después de ${formatDuration(example.signalToDetectionSeconds)}.`}
          timestamp={formatSyntheticTimestamp(example.detectedAt.value)}
        />
        <TimelineStep
          icon={<ClipboardCheck aria-hidden="true" size={15} />}
          label="Decisión recomendada"
          text={example.recommendedAction}
          timestamp="Plan determinista, requiere aprobación"
        />
        <TimelineStep
          icon={<ShieldCheck aria-hidden="true" size={15} />}
          label="Acción y verificación"
          text="No ejecutadas. El backend entrega condiciones de verificación, pero no afirma una mitigación inexistente."
          timestamp="Pendiente de operador"
        />
      </ol>

      <div className="challenge-case-grid">
        <article>
          <h4>Evidencia causal disponible</h4>
          <EvidenceList evidence={example.evidence} />
        </article>
        <article>
          <h4>{example.responsePlan.title}</h4>
          <p>{example.responsePlan.summary}</p>
          <strong>Verificar después de actuar</strong>
          <ul>
            {example.responsePlan.verification.map((check) => (
              <li key={`${check.signal}-${check.condition}`}>
                {formatIdentifier(check.signal)}: {check.condition} durante {check.stableMinutes} min
              </li>
            ))}
          </ul>
        </article>
      </div>

      <p className="challenge-business-note">
        <strong>Lectura de negocio:</strong> {example.businessInterpretation}
      </p>
    </section>
  );
}

interface TimelineStepProps {
  icon: ReactNode;
  label: string;
  text: string;
  timestamp: string;
}

function TimelineStep({ icon, label, text, timestamp }: TimelineStepProps) {
  return (
    <li>
      <span className="causal-marker">{icon}</span>
      <div>
        <strong>{label}</strong>
        <p>{text}</p>
        <span>{timestamp}</span>
      </div>
    </li>
  );
}

function EvidenceList({ evidence }: { evidence: ChallengeEvidence }) {
  if (evidence.kind === "risk_signals") {
    return (
      <ul className="challenge-evidence-list">
        {evidence.signals.map((signal) => (
          <li key={signal.key}>
            <span>{formatIdentifier(signal.key)}</span>
            <strong>{formatEvidenceValue(signal.value)}</strong>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="challenge-evidence-list">
      {Object.entries(evidence.details).map(([key, value]) => (
        <li key={key}>
          <span>{formatIdentifier(key)}</span>
          <strong>{formatEvidenceValue(value)}</strong>
        </li>
      ))}
    </ul>
  );
}

function formatEvidenceValue(value: unknown): string {
  if (typeof value === "number") return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 }).format(value);
  if (typeof value === "string" || typeof value === "boolean") return String(value);
  return JSON.stringify(value);
}
