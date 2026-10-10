import {
  Activity,
  ArrowRight,
  ChevronRight,
  DatabaseZap,
  FlaskConical,
  Radio,
  ShieldCheck,
  TriangleAlert,
} from "lucide-react";
import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { Link } from "react-router-dom";
import type { ChallengeEvidence, KaikuChallengeAlert } from "../../domain/kaikuChallenge";
import { formatDuration, formatSyntheticTimestamp } from "../../shared/format/challenge";

interface OperationsCommandCenterProps {
  alerts: KaikuChallengeAlert[];
  runId: string;
}

const incidentLabels: Record<string, string> = {
  application_errors: "Errores persistentes en la aplicación",
  checkout_degradation: "Degradación del checkout",
  cpu_saturation: "Saturación sostenida de CPU",
  database_connection_pressure: "Presión en conexiones de base de datos",
  latency_degradation: "Degradación de respuesta",
};

const incidentPresentations: Record<string, { explanation: string; service: string }> = {
  application_errors: {
    explanation: "El volumen de errores se apartó de su comportamiento habitual y coincidió con presión en latencia o capacidad. Es una señal temprana reproducible; no demuestra todavía la causa raíz ni impacto real en clientes.",
    service: "Aplicación y dependencias",
  },
  checkout_degradation: {
    explanation: "Las señales de errores y latencia se desviaron del patrón habitual del flujo de compra. Sentinel lo marca para revisión antes de atribuir una interrupción al checkout.",
    service: "Checkout y pago",
  },
  cpu_saturation: {
    explanation: "La CPU se apartó de su rango histórico junto con señales correlacionadas de carga. El hallazgo permite revisar capacidad antes de una degradación, sin afirmar una causa raíz.",
    service: "Capacidad de aplicación",
  },
  database_connection_pressure: {
    explanation: "La presión del pool y la latencia se apartaron de su comportamiento habitual. El patrón puede comprometer el flujo de compra, pero no demuestra causa raíz ni impacto real en clientes.",
    service: "Base de datos y checkout",
  },
  latency_degradation: {
    explanation: "La latencia mostró una desviación sostenida frente a su referencia histórica. La alerta acelera el diagnóstico sin presentar la correlación como una causa confirmada.",
    service: "Respuesta de la aplicación",
  },
};

export function OperationsCommandCenter({ alerts, runId }: OperationsCommandCenterProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const currentAlerts = alerts.filter((alert) => alert.runId === runId);
  const primaryAlert = selectPrimaryAlert(currentAlerts);
  const orderedAlerts = selectRepresentativeAlerts(currentAlerts);
  const presentation = alertPresentation(primaryAlert);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (root === null) return;
    const reduceMotion = /jsdom/iu.test(window.navigator.userAgent)
      || (typeof window.matchMedia === "function"
        && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    if (reduceMotion) return;

    const context = gsap.context(() => {
      gsap.timeline({ defaults: { ease: "power3.out" } })
        .from(".signature-alert", { opacity: 0, y: 16, duration: .42 })
        .from(".decision-rail", { opacity: 0, x: 14, duration: .36 }, "-=.27")
        .from(".timeline-point", { opacity: 0, y: 7, stagger: .07, duration: .24 }, "-=.2")
        .from(".priority-feed", { opacity: 0, y: 10, duration: .3 }, "-=.12");
    }, root);
    return () => context.revert();
  }, [runId]);

  return (
    <div className="command-center" ref={rootRef}>
      <section aria-labelledby="time-advantage-title" className="signature-alert">
        <header className="signature-alert-header">
          <div className="active-incident-label">
            <FlaskConical aria-hidden="true" size={15} />
            <span>{primaryAlert.kind === "incident_risk" ? "Alerta prioritaria" : "Calidad de telemetría"}</span>
            <strong>{primaryAlert.priority === "critical" ? "Hallazgo crítico" : "Hallazgo alto"}</strong>
          </div>
          <span className="data-origin">{humanRunId(runId)}</span>
        </header>

        <div className="signature-alert-copy">
          <div>
            <p className="section-label">Patrón técnico correlacionado</p>
            <h2 id="time-advantage-title">{presentation.title}</h2>
            <p>{presentation.explanation}</p>
          </div>
          <div className="signature-business-risk">
            <span>Servicio potencialmente afectado</span>
            <strong>{presentation.service}</strong>
          </div>
        </div>

        <div aria-label="Medición desde la primera señal hasta la detección" className="measured-timeline">
          <div aria-hidden="true" className="timeline-segment timeline-segment-measured">
            <span>{formatDuration(primaryAlert.signalToDetectionSeconds)} medidos</span>
          </div>
          <div aria-hidden="true" className="timeline-segment timeline-segment-unverified">
            <span>anticipación no calculable</span>
          </div>
          <TimelinePoint className="timeline-signal" eyebrow="Primera señal" label={formatSyntheticTimestamp(primaryAlert.signalAt.value)} />
          <TimelinePoint className="timeline-alert" eyebrow="Sentinel detecta" label={formatSyntheticTimestamp(primaryAlert.detectedAt.value)} />
          <TimelinePoint className="timeline-impact" eyebrow="Impacto" label="No observado" />
        </div>

        <div className="signature-evidence">
          {evidenceSignals(primaryAlert.evidence).map((signal) => (
            <article key={signal.key} title={signal.key}>
              <span>{signal.label}</span>
              <strong className="num">{signal.value}</strong>
              <small>{signal.raw}</small>
            </article>
          ))}
        </div>
      </section>

      <aside aria-labelledby="action-title" className="decision-rail">
        <div className="decision-rail-heading">
          <span className="status status-neutral">Pendiente</span>
          <span>Requiere revisión</span>
        </div>
        <p className="section-label">Siguiente acción segura</p>
        <h2 id="action-title">{primaryAlert.responsePlan.title}</h2>
        <p className="decision-summary">{primaryAlert.recommendedAction}</p>

        <div className="decision-checklist">
          <strong>Condiciones para verificar después de actuar</strong>
          <ul>
            {primaryAlert.responsePlan.verification.map((check) => (
              <li key={`${check.signal}-${check.condition}`}>
                <ShieldCheck aria-hidden="true" size={17} />
                <span>{verificationText(check.signal, check.condition, check.stableMinutes)}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="decision-actions">
          <Link
            className="decision-primary"
            to={primaryAlert.kind === "incident_risk" ? `/incidentes/${primaryAlert.eventId}` : "/alertas"}
          >
            <span>Examinar resultado</span>
            <i><ArrowRight aria-hidden="true" size={16} /></i>
          </Link>
          <Link className="decision-secondary" to="/replay">Abrir laboratorio</Link>
        </div>
        <p className="decision-boundary">Requiere aprobación antes de ejecutar cambios.</p>
      </aside>

      <section aria-labelledby="feed-title" className="priority-feed">
        <header className="command-section-heading">
          <div>
            <p className="section-label">Actividad reciente</p>
            <h2 id="feed-title">Hallazgos de la corrida</h2>
          </div>
          <Link className="text-action" to="/alertas">Ver historial <ChevronRight aria-hidden="true" size={16} /></Link>
        </header>
        {orderedAlerts.length === 0 ? (
          <p className="challenge-empty-ledger">No hay hallazgos para este escenario.</p>
        ) : (
          <ol className="priority-feed-list">
            {orderedAlerts.map((alert) => <AlertFeedItem alert={alert} key={alert.eventId} />)}
          </ol>
        )}
      </section>
    </div>
  );
}

function selectPrimaryAlert(alerts: KaikuChallengeAlert[]): KaikuChallengeAlert {
  const incident = [...alerts]
    .filter((alert) => alert.kind === "incident_risk")
    .sort((left, right) => right.eventId - left.eventId)[0];
  if (incident !== undefined) return incident;
  const latest = [...alerts].sort((left, right) => right.eventId - left.eventId)[0];
  if (latest === undefined) throw new Error("La corrida seleccionada no contiene hallazgos.");
  return latest;
}

function alertPresentation(alert: KaikuChallengeAlert): { title: string; explanation: string; service: string } {
  if (alert.kind === "data_quality_alert") {
    return {
      title: humanDataQuality(alert.dataQuality),
      explanation: "La fuente dejó de entregar observaciones suficientes para evaluar el riesgo con seguridad. Sentinel separa este problema de telemetría para no inventar un incidente operativo.",
      service: "Visibilidad operativa",
    };
  }
  const incidentType = alert.suspectedIncidentType;
  const fallback = {
    explanation: "Varias señales se apartaron de su comportamiento habitual. El hallazgo acelera la revisión técnica, pero no demuestra todavía una causa raíz ni impacto real en clientes.",
    service: "Aplicación",
  };
  return {
    title: humanIncident(incidentType),
    ...(incidentType === null ? fallback : incidentPresentations[incidentType] ?? fallback),
  };
}

function TimelinePoint({ className, eyebrow, label }: { className: string; eyebrow: string; label: string }) {
  return (
    <div className={`timeline-point ${className}`}>
      <i aria-hidden="true" />
      <span>{eyebrow}</span>
      <strong className="num">{label}</strong>
    </div>
  );
}

function AlertFeedItem({ alert }: { alert: KaikuChallengeAlert }) {
  const isIncident = alert.kind === "incident_risk";
  const presentation = isIncident
    ? alert.priority === "critical"
      ? { level: "Crítico", icon: TriangleAlert, tone: "critical" }
      : { level: "Alto", icon: Activity, tone: "high" }
    : alert.dataQuality === "outage"
      ? { level: "Crítico", icon: Radio, tone: "critical" }
      : { level: "Datos", icon: DatabaseZap, tone: "data" };
  const Icon = presentation.icon;

  return (
    <li className={`feed-item feed-item-${presentation.tone}`}>
      <span className="feed-icon"><Icon aria-hidden="true" size={19} /></span>
      <div className="feed-copy">
        <div>
          <span className={`priority-label priority-${presentation.tone}`}>{presentation.level}</span>
          <span className="feed-state">{alert.state === "open" ? "Sin revisar" : "Revisado"}</span>
        </div>
        <strong>{isIncident ? humanIncident(alert.suspectedIncidentType) : humanDataQuality(alert.dataQuality)}</strong>
        <small>{humanRunId(alert.runId)}</small>
      </div>
      <time className="num" dateTime={alert.detectedAt.value}>{formatSyntheticTimestamp(alert.detectedAt.value)}</time>
      <Link aria-label={`Abrir hallazgo ${alert.eventId}`} to="/alertas"><ChevronRight aria-hidden="true" size={18} /></Link>
    </li>
  );
}

function compareAlerts(left: KaikuChallengeAlert, right: KaikuChallengeAlert): number {
  const weight = (alert: KaikuChallengeAlert) => {
    if (alert.priority === "critical" || alert.dataQuality === "outage") return 3;
    if (alert.kind === "incident_risk") return 2;
    return 1;
  };
  return weight(right) - weight(left) || right.eventId - left.eventId;
}

function selectRepresentativeAlerts(alerts: KaikuChallengeAlert[]): KaikuChallengeAlert[] {
  const seen = new Set<string>();
  return [...alerts].sort(compareAlerts).filter((alert) => {
    const signature = alert.kind === "incident_risk"
      ? `${alert.kind}:${alert.suspectedIncidentType ?? "unknown"}`
      : `${alert.kind}:${alert.dataQuality}`;
    if (seen.has(signature)) return false;
    seen.add(signature);
    return true;
  }).slice(0, 5);
}

function humanRunId(runId: string): string {
  return runId.replace(/^corrida_/u, "Corrida ").replaceAll("_", " ");
}

function humanIncident(value: string | null): string {
  if (value === null) return "Riesgo operativo sin clasificar";
  return incidentLabels[value] ?? value.replaceAll("_", " ");
}

function humanDataQuality(quality: KaikuChallengeAlert["dataQuality"]): string {
  if (quality === "outage") return "Telemetría interrumpida";
  if (quality === "partial") return "Telemetría incompleta";
  return "Validación de telemetría";
}

function verificationText(signal: string, condition: string, minutes: number): string {
  const signalNames: Record<string, string> = {
    cpu: "CPU",
    db_pool: "Conexiones",
    errores: "Errores",
    latencia_ms: "Latencia",
  };
  const humanSignal = signalNames[signal] ?? signal.replaceAll("_", " ");
  return `${humanSignal}: ${condition} durante ${minutes} min`;
}

function evidenceSignals(evidence: ChallengeEvidence): Array<{
  key: string;
  label: string;
  value: string;
  raw: string;
}> {
  if (evidence.kind === "telemetry_quality") {
    return Object.entries(evidence.details).slice(0, 3).map(([key, value]) => ({
      key,
      label: key.replaceAll("_", " "),
      value: String(value),
      raw: "Calidad de telemetría",
    }));
  }
  return evidence.signals.slice(0, 3).map((signal) => {
    const numeric = typeof signal.value === "number" ? signal.value : null;
    if (signal.key.startsWith("log_db_pool")) {
      return { key: signal.key, label: "Pool de conexiones", value: numeric === 1 ? "Presión detectada" : String(signal.value), raw: signal.key };
    }
    if (signal.key.startsWith("log_deadlock")) {
      return { key: signal.key, label: "Bloqueos de base de datos", value: numeric === null ? String(signal.value) : `${numeric} evento`, raw: signal.key };
    }
    if (signal.key.startsWith("latencia_ms")) {
      return { key: signal.key, label: "Latencia fuera del rango habitual", value: formatEvidenceValue(signal.value), raw: evidenceWindow(signal.key) };
    }
    if (signal.key.startsWith("cpu")) {
      return { key: signal.key, label: "CPU fuera del rango habitual", value: formatEvidenceValue(signal.value), raw: evidenceWindow(signal.key) };
    }
    if (signal.key.startsWith("errores") || signal.key.startsWith("errors")) {
      return { key: signal.key, label: "Errores fuera del rango habitual", value: formatEvidenceValue(signal.value), raw: evidenceWindow(signal.key) };
    }
    if (signal.key.startsWith("risk")) {
      return { key: signal.key, label: "Riesgo sostenido", value: formatEvidenceValue(signal.value), raw: evidenceWindow(signal.key) };
    }
    return { key: signal.key, label: signal.key.replaceAll("_", " "), value: formatEvidenceValue(signal.value), raw: evidenceWindow(signal.key) };
  });
}

function formatEvidenceValue(value: unknown): string {
  if (typeof value !== "number") return String(value);
  return new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(value);
}

function evidenceWindow(key: string): string {
  const minutes = /_(\d+)m$/u.exec(key)?.[1];
  if (minutes === undefined) return "Evidencia persistida";
  const parsed = Number(minutes);
  return `Comparación robusta · ${parsed >= 60 ? `${parsed / 60} h` : `${parsed} min`}`;
}
