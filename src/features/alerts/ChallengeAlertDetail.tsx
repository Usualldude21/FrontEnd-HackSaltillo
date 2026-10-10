import { CheckCircle2, Clock3, ShieldAlert, Sparkles } from "lucide-react";
import type {
  ChallengeAlertExplanation,
  ChallengeEvidence,
  ChallengeIncidentInvestigation,
  KaikuChallengeAlert,
} from "../../domain/kaikuChallenge";
import {
  formatDuration,
  formatIdentifier,
  formatIncidentType,
  formatRiskScore,
  formatSyntheticTimestamp,
} from "../../shared/format/challenge";
import { formatTimestamp } from "../../shared/format/operations";
import { Button } from "../../shared/ui/Button";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";
import { ErrorState } from "../../shared/ui/ErrorState";
import { Skeleton } from "../../shared/ui/Skeleton";
import {
  ChallengeKindBadge,
  ChallengePriorityBadge,
  ChallengeStateBadge,
} from "./ChallengeAlertBadges";

interface ChallengeAlertDetailProps {
  alert: KaikuChallengeAlert;
  explanation: ChallengeAlertExplanation | undefined;
  explanationError: unknown;
  explanationPending: boolean;
  feedback: string | null;
  isAcknowledging: boolean;
  mutationError: string | null;
  onAcknowledge: () => void;
  onRetryExplanation: () => void;
  investigation: ChallengeIncidentInvestigation | undefined;
  investigationError: unknown;
  investigationPending: boolean;
  onInvestigate: () => void;
}

export function ChallengeAlertDetail({
  alert,
  explanation,
  explanationError,
  explanationPending,
  feedback,
  isAcknowledging,
  mutationError,
  onAcknowledge,
  onRetryExplanation,
  investigation,
  investigationError,
  investigationPending,
  onInvestigate,
}: ChallengeAlertDetailProps) {
  return (
    <section aria-labelledby="alert-detail-title" className="panel alert-detail challenge-alert-detail">
      <div className="panel-heading alert-detail-heading">
        <div>
          <p className="eyebrow">Evento {alert.eventId} · entrega {alert.outboxAlertId}</p>
          <h3 id="alert-detail-title">
            {alert.kind === "incident_risk"
              ? formatIncidentType(alert.suspectedIncidentType)
              : "Pérdida de visibilidad"}
          </h3>
          <p>{alert.recommendedAction}</p>
        </div>
        <div className="alert-badge-group">
          <ChallengeKindBadge kind={alert.kind} />
          <ChallengePriorityBadge priority={alert.priority} />
          <ChallengeStateBadge state={alert.state} />
        </div>
      </div>

      <dl className="alert-detail-facts challenge-alert-facts">
        <div><dt>Primera señal</dt><dd>{formatSyntheticTimestamp(alert.signalAt.value)}</dd></div>
        <div><dt>Detección</dt><dd>{formatSyntheticTimestamp(alert.detectedAt.value)}</dd></div>
        <div><dt>Señal → detección</dt><dd>{formatDuration(alert.signalToDetectionSeconds)}</dd></div>
        <div><dt>Score de riesgo</dt><dd>{alert.kind === "incident_risk" ? formatRiskScore(alert.risk.value) : "No aplica"}</dd></div>
        <div><dt>Calidad</dt><dd><DataQualityBadge quality={alert.dataQuality} /></dd></div>
      </dl>
      <p className="challenge-score-note">El score de riesgo no es una probabilidad calibrada de incidente.</p>

      <details className="challenge-technical-details">
        <summary>Evidencia técnica persistida</summary>
        <div className="alert-evidence-summary">
          <Evidence evidence={alert.evidence} observedAt={alert.signalAt.value} />
        </div>
      </details>

      {explanationPending ? (
        <div aria-label="Cargando explicación determinista" className="challenge-explanation-loading" role="status">
          <Skeleton height="11rem" width="100%" />
        </div>
      ) : null}
      {explanationError !== null ? (
        <ErrorState
          message={explanationError instanceof Error
            ? explanationError.message
            : "No fue posible cargar la explicación persistida."}
          onRetry={onRetryExplanation}
        />
      ) : null}
      {explanation === undefined ? null : <Explanation explanation={explanation} />}

      {alert.remediation === null ? null : (
        <section className="challenge-ai-summary" aria-labelledby="remediation-title">
          <div className="challenge-ai-summary-heading">
            <ShieldAlert aria-hidden="true" size={18} />
            <div>
              <p className="eyebrow">Infraestructura controlada</p>
              <h4 id="remediation-title">Remediación {alert.remediation.status.replaceAll("_", " ")}</h4>
              <p>{alert.remediation.decisionReason ?? "El flujo autónomo dejó evidencia durable de cada transición."}</p>
            </div>
          </div>
          <dl className="alert-detail-facts challenge-alert-facts">
            <div><dt>Decisor</dt><dd>{alert.remediation.decisionProvider ?? "Pendiente"}</dd></div>
            <div><dt>Runbook</dt><dd>{alert.remediation.runbookId ?? "Sin seleccionar"}</dd></div>
            <div><dt>Acción MCP</dt><dd>{alert.actionExecuted ? "Ejecutada" : "No ejecutada"}</dd></div>
            <div><dt>Fallo</dt><dd>{alert.remediation.failureCode ?? "Ninguno"}</dd></div>
          </dl>
          <a className="button button-secondary" download href="/api/challenge/remediations/audit.csv">Descargar auditoría CSV</a>
        </section>
      )}

      {alert.incidentId === null ? null : (
        <section aria-labelledby="gemini-summary-title" className="challenge-ai-summary">
          <div className="challenge-ai-summary-heading">
            <Sparkles aria-hidden="true" size={18} />
            <div>
              <p className="eyebrow">Traducción opcional</p>
              <h4 id="gemini-summary-title">Resumen para el operador</h4>
              <p>Gemini consulta evidencia de solo lectura mediante MCP; no cambia el score ni ejecuta acciones.</p>
            </div>
            {investigation === undefined ? (
              <Button disabled={investigationPending} onClick={onInvestigate} variant="secondary">
                <Sparkles aria-hidden="true" size={15} />
                {investigationPending ? "Consultando…" : "Explicar con Gemini"}
              </Button>
            ) : null}
          </div>
          {investigationError === null || investigationError === undefined ? null : (
            <p className="action-message action-message-error" role="alert">
              {investigationError instanceof Error ? investigationError.message : "Gemini no pudo generar el resumen."}
            </p>
          )}
          {investigation === undefined ? null : <Investigation investigation={investigation} />}
        </section>
      )}

      <div className="challenge-operator-response">
        <div>
          <p className="eyebrow">Respuesta del operador</p>
          <h4>{alert.state === "open" ? "Recepción pendiente" : "Recepción reconocida"}</h4>
          <p>
            Reconocer registra respuesta humana. Si ocurre antes del plazo configurado,
            cancela la ruta autónoma; nunca ejecuta por sí mismo un runbook.
          </p>
        </div>
        {alert.state === "open" ? (
          <Button disabled={isAcknowledging} onClick={onAcknowledge}>
            <CheckCircle2 aria-hidden="true" size={16} />
            {isAcknowledging ? "Registrando…" : "Reconocer recepción"}
          </Button>
        ) : (
          <span className="badge badge-success"><CheckCircle2 aria-hidden="true" size={15} /> Registrada</span>
        )}
      </div>
      {alert.acknowledgedAt === null ? null : (
        <p className="challenge-ack-time">
          <Clock3 aria-hidden="true" size={15} />
          Reconocida {formatTimestamp(alert.acknowledgedAt.value)} · latencia de entrega:
          {" "}{formatDuration(alert.deliveryToAcknowledgementSeconds)}
        </p>
      )}
      {mutationError === null ? null : <p className="action-message action-message-error" role="alert">{mutationError}</p>}
      {feedback === null ? null : <p className="action-message action-message-success" role="status">{feedback}</p>}
    </section>
  );
}

function Evidence({ evidence, observedAt }: { evidence: ChallengeEvidence; observedAt: string }) {
  const entries = evidence.kind === "risk_signals"
    ? evidence.signals.map((signal) => [signal.key, signal.value] as const)
    : Object.entries(evidence.details);
  if (entries.length === 0) return <p>La alerta no contiene evidencia estructurada.</p>;
  return (
    <ul>
      {entries.map(([key, value]) => (
        <li key={key}>
          <strong>{formatSignalName(key)}</strong>
          <span>{formatEvidenceValue(key, value)}</span>
          <time dateTime={observedAt}>{formatSyntheticTimestamp(observedAt)}</time>
        </li>
      ))}
    </ul>
  );
}

function Explanation({ explanation }: { explanation: ChallengeAlertExplanation }) {
  return (
    <div className="challenge-explanation">
      <div className="challenge-explanation-heading">
        <ShieldAlert aria-hidden="true" size={20} />
        <div>
          <p className="eyebrow">Explicación determinista</p>
          <h4>{explanation.headline}</h4>
          <p>{explanation.nextStep}</p>
        </div>
      </div>

      <div className="challenge-runbook">
        <h4>{explanation.action.responsePlan.title}</h4>
        <p>{explanation.action.responsePlan.summary}</p>
        <div>
          <section>
            <strong>Diagnóstico</strong>
            <ol>{explanation.action.responsePlan.diagnosticSteps.map((step) => <li key={step}>{step}</li>)}</ol>
          </section>
          <section>
            <strong>Verificación exigida</strong>
            <ul>{explanation.verification.checks.map((check) => (
              <li key={`${check.signal}-${check.condition}`}>
                {formatIdentifier(check.signal)}: {check.condition} por {check.stableMinutes} min
              </li>
            ))}</ul>
          </section>
        </div>
      </div>

      <p className="challenge-impact-boundary">
        <strong>Impacto:</strong> {explanation.impact.detail} El impacto al cliente no fue observado.
      </p>
      <details className="challenge-technical-details">
        <summary>Cadena completa y límites del análisis</summary>
        <div className="challenge-stage-grid">
          <Stage title={explanation.signal.title} status={explanation.signal.status} detail={explanation.signal.detail} />
          <Stage title={explanation.decision.title} status={explanation.decision.status} detail={explanation.decision.detail} />
          <Stage title={explanation.action.title} status={explanation.action.status} detail={explanation.action.detail} />
          <Stage title={explanation.verification.title} status={explanation.verification.status} detail={explanation.verification.detail} />
        </div>
        <ul className="challenge-explanation-limitations">
          {explanation.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
        </ul>
      </details>
    </div>
  );
}

function Investigation({ investigation }: { investigation: ChallengeIncidentInvestigation }) {
  return (
    <div className="challenge-ai-briefing">
      <div>
        <span>Qué ocurrió</span>
        <p>{investigation.briefing.whatHappened}</p>
      </div>
      <div>
        <span>Siguiente paso seguro</span>
        <p>{investigation.briefing.nextSafeStep}</p>
      </div>
      <details>
        <summary>Impacto, verificación e incógnitas</summary>
        <p><strong>Impacto:</strong> {investigation.briefing.customerImpact}</p>
        <p><strong>Acción de Sentinel:</strong> {investigation.briefing.sentinelAction}</p>
        <p><strong>Verificación:</strong> {investigation.briefing.verification}</p>
        {investigation.briefing.unknowns.length === 0 ? null : (
          <ul>{investigation.briefing.unknowns.map((unknown) => <li key={unknown}>{unknown}</li>)}</ul>
        )}
      </details>
      <small>
        {investigation.provider} · {investigation.trace.model ?? "modelo no informado"}
        {investigation.trace.mcpUsed ? " · MCP verificado" : ""}
      </small>
    </div>
  );
}

function Stage({ detail, status, title }: { detail: string; status: string; title: string }) {
  return (
    <article>
      <span>{formatIdentifier(status)}</span>
      <strong>{title}</strong>
      <p>{detail}</p>
    </article>
  );
}

function formatSignalName(key: string): string {
  const metric = key.split("_past_robust_z_")[0] ?? key;
  const names: Record<string, string> = {
    errores: "Errores de aplicación",
    latencia_ms: "Latencia",
    cpu: "Uso de CPU",
    ram: "Uso de memoria",
    disco: "Uso de disco",
  };
  return names[metric] ?? formatIdentifier(key);
}

function formatEvidenceValue(key: string, value: unknown): string {
  if (typeof value === "number" && key.includes("robust_z")) {
    const magnitude = Math.abs(value);
    if (magnitude >= 20) return "Desviación extrema respecto a su patrón";
    if (magnitude >= 8) return "Muy por encima de su patrón";
    if (magnitude >= 4) return "Por encima de su patrón";
  }
  if (typeof value === "number") return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 4 }).format(value);
  if (typeof value === "string" || typeof value === "boolean") return String(value);
  if (value === null) return "Sin valor";
  return JSON.stringify(value);
}
