import {
  Activity,
  BellRing,
  CheckCircle2,
  CircleDashed,
  ClipboardCheck,
  Gauge,
  ShieldAlert,
} from "lucide-react";
import { Link } from "react-router-dom";
import type {
  ChallengeAlertExplanation,
  ChallengeEvidence,
  ChallengeVerificationCheck,
  KaikuChallengeAlert,
} from "../../domain/kaikuChallenge";
import {
  formatDuration,
  formatIdentifier,
  formatRiskScore,
  formatSyntheticTimestamp,
} from "../../shared/format/challenge";
import { formatTimestamp } from "../../shared/format/operations";
import { Badge } from "../../shared/ui/Badge";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";
import { ChallengePriorityBadge, ChallengeStateBadge } from "../alerts/ChallengeAlertBadges";

interface ChallengeRiskCaseDetailProps {
  alert: KaikuChallengeAlert;
  explanation: ChallengeAlertExplanation;
}

export function ChallengeRiskCaseDetail({ alert, explanation }: ChallengeRiskCaseDetailProps) {
  return (
    <div className="incident-stack">
      <CaseSummary alert={alert} explanation={explanation} />
      <CausalChain alert={alert} explanation={explanation} />
      <CaseEvidence alert={alert} />
      <ResponsePlan explanation={explanation} />
      <ClaimBoundary alert={alert} explanation={explanation} />
    </div>
  );
}

function CaseSummary({ alert, explanation }: ChallengeRiskCaseDetailProps) {
  return (
    <section aria-labelledby="case-summary-title" className="panel incident-summary">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">Evento {alert.eventId} · corrida {alert.runId}</p>
          <h3 id="case-summary-title">{explanation.headline}</h3>
          <p>{explanation.summary}</p>
        </div>
        <div className="incident-summary-badges">
          <Badge tone="warning">Caso predictivo</Badge>
          <ChallengePriorityBadge priority={alert.priority} />
          <ChallengeStateBadge state={alert.state} />
        </div>
      </div>
      <dl className="incident-facts challenge-case-facts">
        <div><dt>Tipo probable</dt><dd>{formatIdentifier(alert.suspectedIncidentType ?? "sin clasificar")}</dd></div>
        <div><dt>Score de riesgo</dt><dd>{formatRiskScore(alert.risk.value)}</dd></div>
        <div><dt>Señal → detección</dt><dd>{formatDuration(alert.signalToDetectionSeconds)}</dd></div>
        <div><dt>Primera señal</dt><dd>{formatSyntheticTimestamp(alert.signalAt.value)}</dd></div>
        <div><dt>Detección</dt><dd>{formatSyntheticTimestamp(alert.detectedAt.value)}</dd></div>
        <div><dt>Calidad</dt><dd><DataQualityBadge quality={alert.dataQuality} /></dd></div>
      </dl>
      <p className="challenge-score-note">El score ordena riesgo; no es una probabilidad calibrada ni confirma un incidente real.</p>
    </section>
  );
}

function CausalChain({ alert, explanation }: ChallengeRiskCaseDetailProps) {
  const acknowledged = explanation.operatorResponse.status === "acknowledged";
  const stages = [
    {
      icon: Activity,
      title: explanation.signal.title,
      detail: explanation.signal.detail,
      status: "Observada",
      time: formatSyntheticTimestamp(alert.signalAt.value),
      className: "causal-signal",
    },
    {
      icon: Gauge,
      title: explanation.decision.title,
      detail: `${explanation.decision.detail} Detección tras ${formatDuration(alert.signalToDetectionSeconds)}.`,
      status: "Emitida",
      time: formatSyntheticTimestamp(alert.detectedAt.value),
      className: "causal-detection",
    },
    {
      icon: ClipboardCheck,
      title: explanation.action.title,
      detail: explanation.action.detail,
      status: "No iniciada",
      time: "Sin marca de ejecución",
      className: "causal-action",
    },
    {
      icon: acknowledged ? CheckCircle2 : BellRing,
      title: "Respuesta del operador",
      detail: acknowledged
        ? "La recepción fue reconocida; esto no prueba mitigación."
        : "La alerta fue entregada y espera reconocimiento del operador.",
      status: acknowledged ? "Reconocida" : "Pendiente",
      time: explanation.operatorResponse.acknowledgedAt === null
        ? "Sin reconocimiento"
        : formatTimestamp(explanation.operatorResponse.acknowledgedAt.value),
      className: "causal-operator",
    },
    {
      icon: CircleDashed,
      title: explanation.verification.title,
      detail: explanation.verification.detail,
      status: "Pendiente",
      time: "Sin recuperación verificada",
      className: "causal-verification-pending",
    },
  ];

  return (
    <section aria-labelledby="case-chain-title" className="panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">Cadena medible</p>
          <h3 id="case-chain-title">Señal → decisión → respuesta → verificación</h3>
          <p>Los relojes sintético y del operador se mantienen separados.</p>
        </div>
      </div>
      <ol aria-label="Cadena causal del caso de riesgo" className="causal-timeline challenge-case-timeline">
        {stages.map(({ className, detail, icon: Icon, status, time, title }) => (
          <li className={className} key={title}>
            <span className="causal-marker"><Icon aria-hidden="true" size={14} /></span>
            <div>
              <div className="causal-title-row"><strong>{title}</strong><span>{time}</span></div>
              <p>{detail}</p>
              <span>Estado: {status}</span>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function CaseEvidence({ alert }: { alert: KaikuChallengeAlert }) {
  const evidence = evidenceEntries(alert.evidence);
  return (
    <section aria-labelledby="case-evidence-title" className="panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">Datos persistidos</p>
          <h3 id="case-evidence-title">Evidencia que sostuvo la decisión</h3>
          <p>No se agregan métricas ni causas que el backend no haya entregado.</p>
        </div>
      </div>
      {evidence.length === 0 ? <p className="incident-absence">El caso no contiene evidencia estructurada.</p> : (
        <ul className="incident-evidence-list">
          {evidence.map(([key, value]) => (
            <li key={key}>
              <div><strong>{formatIdentifier(key)}</strong><span>Señal del modelo</span></div>
              <p>{formatEvidenceValue(value)}</p>
              <div className="incident-evidence-meta">
                <time dateTime={alert.signalAt.value}>{formatSyntheticTimestamp(alert.signalAt.value)}</time>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ResponsePlan({ explanation }: { explanation: ChallengeAlertExplanation }) {
  const plan = explanation.action.responsePlan;
  return (
    <section aria-labelledby="case-plan-title" className="panel challenge-case-plan">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">Recomendación controlada · {plan.id}</p>
          <h3 id="case-plan-title">{plan.title}</h3>
          <p>{plan.summary}</p>
        </div>
        <Badge tone="warning">Requiere aprobación</Badge>
      </div>
      <div className="challenge-case-plan-grid">
        <PlanList items={plan.diagnosticSteps} title="Diagnóstico" />
        <PlanList items={plan.controlledSteps} title="Pasos controlados" />
        <VerificationList checks={plan.verification} />
        <PlanList items={plan.stopConditions} title="Condiciones de paro" />
      </div>
      <p className="recovery-absent">El frontend no ejecuta este runbook. Acción y verificación permanecen sin iniciar.</p>
    </section>
  );
}

function PlanList({ items, title }: { items: readonly string[]; title: string }) {
  return <article><h4>{title}</h4><ol>{items.map((item) => <li key={item}>{item}</li>)}</ol></article>;
}

function VerificationList({ checks }: { checks: readonly ChallengeVerificationCheck[] }) {
  return (
    <article>
      <h4>Verificación exigida</h4>
      <ul>{checks.map((check) => (
        <li key={`${check.signal}-${check.condition}`}>
          {formatIdentifier(check.signal)}: {check.condition} durante {check.stableMinutes} min
        </li>
      ))}</ul>
    </article>
  );
}

function ClaimBoundary({ alert, explanation }: ChallengeRiskCaseDetailProps) {
  return (
    <section aria-labelledby="case-boundary-title" className="panel uncertainty-panel">
      <div className="panel-heading incident-section-heading">
        <div>
          <p className="eyebrow">Límite de evidencia</p>
          <h3 id="case-boundary-title">Qué demuestra y qué sigue pendiente</h3>
          <p>{explanation.impact.detail}</p>
        </div>
        <ShieldAlert aria-hidden="true" size={22} />
      </div>
      <ul>
        {explanation.limitations.map((limitation) => <li key={limitation}><ShieldAlert aria-hidden="true" size={16} />{limitation}</li>)}
        <li><ShieldAlert aria-hidden="true" size={16} />No hay mitigación ejecutada ni recuperación verificada.</li>
      </ul>
      <dl className="contract-details">
        <div><dt>Evento durable</dt><dd>{alert.eventId}</dd></div>
        <div><dt>Alerta de entrega</dt><dd>{alert.outboxAlertId}</dd></div>
        <div><dt>Modelo</dt><dd>{alert.provenance.modelVersion}</dd></div>
        <div><dt>Política</dt><dd>{alert.provenance.policyVersion}</dd></div>
      </dl>
      <Link className="button button-secondary challenge-case-alert-link" to="/alertas">Abrir cola para reconocer recepción</Link>
    </section>
  );
}

function evidenceEntries(evidence: ChallengeEvidence): [string, unknown][] {
  return evidence.kind === "risk_signals"
    ? evidence.signals.map((signal) => [signal.key, signal.value])
    : Object.entries(evidence.details);
}

function formatEvidenceValue(value: unknown): string {
  if (typeof value === "number") return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 }).format(value);
  if (typeof value === "string" || typeof value === "boolean") return String(value);
  if (value === null) return "Sin valor";
  return JSON.stringify(value);
}
