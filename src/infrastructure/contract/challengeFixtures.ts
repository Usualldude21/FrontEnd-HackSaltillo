import type {
  ChallengeAlertDtoV1,
  ChallengeContractDto,
  ChallengeExplanationDto,
  ChallengeOperationsDto,
  ChallengeShowcaseDto,
} from "../api/challengeBackendSchemas";

const responsePlan = {
  runbook_id: "kaiku.database.connection-pressure.v1",
  title: "Recuperar capacidad de conexiones",
  summary: "Revisar conexiones activas, límites por cliente y consultas retenidas; proteger capacidad para el checkout.",
  diagnostic_steps: [
    "Inspeccionar uso del pool, conexiones por servicio y consultas lentas.",
    "Separar tráfico de checkout de trabajos no críticos y tareas masivas.",
  ],
  controlled_steps: [
    "Pausar trabajadores no críticos solamente con aprobación.",
    "Ajustar límites o capacidad únicamente después de confirmar headroom.",
  ],
  verification: [
    { signal: "db_pool", condition: "deja de reportar saturación", stable_minutes: 10 },
    { signal: "latencia_ms", condition: "permanece cerca del baseline", stable_minutes: 10 },
  ],
  stop_conditions: [
    "No se identificó qué consumidor retiene conexiones.",
    "Aumentar el pool agotaría memoria o conexiones de la base de datos.",
  ],
  version: "challenge-kaiku-response-plan-v1",
  requested_incident_type: "database_connection_pressure",
  matched_incident_type: "database_connection_pressure",
  execution_mode: "recommendation_only" as const,
  execution_authorized: false as const,
  approval_required: true as const,
  verification_status: "not_started" as const,
  environment: "official_synthetic_challenge_replay" as const,
};

export const challengeContractFixture: ChallengeContractDto = {
  contract_version: "challenge-kaiku-delivery-contract-v2",
  scope: "official synthetic Zikit public Kaiku runs",
  tenant: "kaiku",
  environment: "official_synthetic_challenge_replay",
  submission_columns: ["tenant", "timestamp", "confidence", "suspected_incident_type"],
  aggregate_audit_columns: ["run_id", "tenant", "timestamp", "confidence", "suspected_incident_type"],
  partitioning: "one evaluator CSV per run_id",
  submission_fields: [
    { name: "tenant", data_type: "string", required: true, semantics: "always kaiku in this solution" },
    { name: "timestamp", data_type: "YYYY-MM-DDTHH:MM:SS", required: true, semantics: "minute when the alert decision became effective" },
    { name: "confidence", data_type: "number[0,1]", required: true, semantics: "risk score; not a calibrated incident probability" },
    { name: "suspected_incident_type", data_type: "string|null", required: false, semantics: "causal classification when public evidence supports it" },
  ],
  ordering: ["tenant", "timestamp"],
  identity: ["tenant", "timestamp"],
  endpoints: [
    { method: "POST", path: "/api/challenge/replay", authentication: "X-Admin-Token", purpose: "process one frozen public feature run idempotently" },
    { method: "POST", path: "/api/challenge/live-replay", authentication: "X-Admin-Token", purpose: "start an observable minute-by-minute synthetic replay" },
    { method: "GET", path: "/api/challenge/live-replay/stream", authentication: "none", purpose: "stream synthetic observations and causal alerts over SSE" },
    { method: "GET", path: "/api/challenge/alerts", authentication: "none", purpose: "read durable alerts with cursor and run filters" },
    { method: "GET", path: "/api/challenge/alerts/stream", authentication: "none", purpose: "consume resumable challenge alerts over SSE" },
    { method: "GET", path: "/api/challenge/operations", authentication: "none", purpose: "read durable state and valid timing measurements" },
    { method: "GET", path: "/api/challenge/showcase", authentication: "none", purpose: "read the verified guided Kaiku demonstration" },
  ],
  stream_event: "challenge_alert",
  stream_state_event: "challenge_alert_acknowledged",
  stream_resume_header: "Last-Event-ID",
  response_plan_version: "challenge-kaiku-response-plan-v1",
  supported_incident_types: ["application_errors", "database_connection_pressure", "latency_degradation"],
  limitations: {
    official_ground_truth_used: false,
    confidence_is_calibrated_probability: false,
    automatic_remediation: false,
    gemini_required: false,
  },
};

export const challengeAlertFixtures: ChallengeAlertDtoV1[] = [
  {
    id: 301,
    prediction_id: 201,
    event_id: 301,
    outbox_alert_id: 401,
    incident_id: "challenge-corrida_03-20261011T152900",
    run_id: "corrida_03",
    tenant: "kaiku",
    signal_timestamp: "2026-10-11T14:37:00",
    timestamp: "2026-10-11T15:29:00",
    decision_latency_minutes: 52,
    alert_type: "incident_risk",
    confidence: 0.588354229927063,
    suspected_incident_type: "database_connection_pressure",
    model_version: "challenge-kaiku-early-warning-v3",
    policy_version: "challenge-kaiku-policy-v3",
    model_sha256: "contract-fixture-model-sha256",
    policy_sha256: "contract-fixture-policy-sha256",
    data_quality: "ok",
    context_known_event: false,
    evidence: [
      { signal: "log_db_pool_count_1440m", value: 1 },
      { signal: "log_deadlock_count_1440m", value: 1 },
      { signal: "latencia_ms_past_robust_z_1440m", value: 2.5012 },
    ],
    recommended_action: responsePlan.summary,
    response_plan: responsePlan,
    runbook_id: responsePlan.runbook_id,
    action_executed: false,
    delivered_at: "2026-10-09T21:10:00.000Z",
    priority: "warning",
    state: "open",
    acknowledged_at: null,
    delivery_to_acknowledgement_seconds: null,
    clock_domains: {
      signal_to_detection: "synthetic_replay_time",
      delivery_to_acknowledgement: "operator_wall_clock",
      cross_domain_duration_valid: false,
    },
  },
  {
    id: 302,
    prediction_id: 202,
    event_id: 302,
    outbox_alert_id: 402,
    incident_id: null,
    run_id: "corrida_03",
    tenant: "kaiku",
    signal_timestamp: "2026-10-09T09:33:00",
    timestamp: "2026-10-09T09:35:00",
    decision_latency_minutes: 2,
    alert_type: "data_quality_alert",
    confidence: 0,
    suspected_incident_type: null,
    model_version: "challenge-kaiku-early-warning-v3",
    policy_version: "challenge-kaiku-policy-v3",
    model_sha256: "contract-fixture-model-sha256",
    policy_sha256: "contract-fixture-policy-sha256",
    data_quality: "outage",
    context_known_event: false,
    evidence: { observed_metrics: 0, outage_streak_minutes: 3 },
    recommended_action: "Restablecer la telemetría antes de interpretar el riesgo del negocio.",
    response_plan: {
      ...responsePlan,
      runbook_id: "kaiku.telemetry.restore.v1",
      title: "Restablecer visibilidad",
      summary: "Verificar y recuperar la fuente de telemetría.",
      requested_incident_type: "data_quality_alert",
      matched_incident_type: "data_quality_alert",
    },
    runbook_id: "kaiku.telemetry.restore.v1",
    action_executed: false,
    delivered_at: "2026-10-09T21:10:01.000Z",
    priority: "critical",
    state: "open",
    acknowledged_at: null,
    delivery_to_acknowledgement_seconds: null,
    clock_domains: {
      signal_to_detection: "synthetic_replay_time",
      delivery_to_acknowledgement: "operator_wall_clock",
      cross_domain_duration_valid: false,
    },
  },
];

export const challengeOperationsFixture: ChallengeOperationsDto = {
  version: "challenge-kaiku-operations-v2",
  environment: "official_synthetic_challenge_replay",
  alerts: { total: 2, incident_risk: 1, data_quality: 1, open: 2, acknowledged: 0 },
  timing: {
    signal_to_detection_seconds: { clock_domain: "synthetic_replay_time", count: 2, min: 120, median: 1_620, max: 3_120 },
    delivery_to_acknowledgement_seconds: { clock_domain: "operator_wall_clock", count: 0, min: null, median: null, max: null },
    signal_to_acknowledgement_seconds: {
      valid: false,
      value: null,
      reason: "synthetic replay time and operator wall clock cannot be mixed",
    },
  },
  cursor: { earliest_id: 301, latest_id: 302, retained_count: 2 },
  integrity: {
    passed: true,
    predictions_have_event_and_outbox: true,
    incident_predictions_have_first_signal: true,
    acknowledgements_have_single_event: true,
    delivery_timestamps_share_wall_clock: true,
    acknowledgement_not_before_delivery: true,
  },
  limitations: {
    mitigation_executed: false,
    recovery_verified: false,
    remote_infrastructure_observed: false,
  },
};

export const challengeShowcaseFixture: ChallengeShowcaseDto = {
  version: "challenge-kaiku-guided-showcase-v1",
  status: "passed",
  scope: "demostración guiada del backend sobre el split sintético oficial de prueba de Kaiku",
  company: {
    tenant: "kaiku",
    business: "tienda en línea",
    critical_flow: "catálogo → carrito → checkout → pago → pedido",
  },
  selection_rule: "mayor score de riesgo entre alertas tipificadas fuera de eventos conocidos en el split de prueba congelado",
  representative_case: {
    run_id: "corrida_03",
    tenant: "kaiku",
    split: "test",
    signal_timestamp: "2026-10-11T14:37:00",
    alert_timestamp: "2026-10-11T15:29:00",
    signal_to_alert_minutes: 52,
    risk_score: 0.588354229927063,
    confidence_semantics: "score de riesgo, no probabilidad calibrada de incidente",
    suspected_incident_type: "database_connection_pressure",
    model_version: "challenge-kaiku-early-warning-v3",
    evidence: [
      { signal: "log_db_pool_count_1440m", value: 1 },
      { signal: "log_deadlock_count_1440m", value: 1 },
      { signal: "latencia_ms_past_robust_z_1440m", value: 2.5012 },
    ],
    recommended_action: responsePlan.summary,
    response_plan: responsePlan,
    business_interpretation: "Las señales observadas podrían degradar la capacidad del checkout; el kit público no demuestra impacto al cliente ni causa raíz.",
  },
  false_alarm_control: {
    known_event_alerts_with_context: 0,
    known_event_alerts_without_context: 92,
    interpretation: "La ablación cambia el comportamiento de alertas; no es una métrica oficial de precisión.",
  },
  telemetry_outage_case: { classification: "data_quality_alert" },
  demo_api_sequence: [{ method: "GET", path: "/api/challenge/showcase" }],
  gates: { contract_fixture: { passed: true } },
  claim_boundary: {
    official_ground_truth_used: false,
    representative_alert_confirmed_real_incident: false,
    customer_impact_observed: false,
    root_cause_demonstrated: false,
    mitigation_executed: false,
    recovery_verified: false,
  },
};

export function createChallengeExplanationFixture(
  alert: ChallengeAlertDtoV1,
): ChallengeExplanationDto {
  const isIncident = alert.alert_type === "incident_risk";
  const response = alert.response_plan;
  return {
    version: "2",
    source: "deterministic-local",
    incident_id: alert.incident_id,
    tenant: "kaiku",
    run_id: alert.run_id,
    severity: isIncident ? alert.priority : undefined,
    status: isIncident ? "active" : "data_quality_alert",
    environment: "official_synthetic_challenge_replay",
    headline: isIncident
      ? "kaiku: riesgo de incidente detectado anticipadamente"
      : "kaiku: telemetría incompleta",
    summary: isIncident
      ? "Las señales persistidas anticipan presión de conexiones. La clasificación es probable y no demuestra causa raíz."
      : "La ausencia persistente de datos impide evaluar el riesgo; se separó de los incidentes operativos.",
    signal: {
      title: isIncident ? "Primera señal causal" : "Señal de calidad",
      status: "observed",
      detail: isIncident
        ? "Coincidieron presión del pool, deadlocks y latencia fuera de su comportamiento histórico."
        : `Calidad observada: ${alert.data_quality}.`,
      observed_at: alert.signal_timestamp,
      top_signals: alert.evidence,
    },
    decision: {
      title: isIncident ? "Decisión de alerta" : "Decisión de calidad",
      status: isIncident ? "recommendation_ready" : "telemetry_unreliable",
      detail: isIncident
        ? "La política emitió una alerta de riesgo; no demuestra una causa raíz."
        : "Se alertó sobre la fuente sin inventar un incidente de TI.",
      ...(isIncident ? {
        confidence: alert.confidence,
        suspected_incident_type: alert.suspected_incident_type,
      } : {}),
    },
    action: {
      title: "Acción recomendada",
      status: "not_started",
      detail: `No se ejecutó una mitigación. ${alert.recommended_action}`,
      runbook: response.runbook_id,
      response_plan: response,
      execution_authorized: false,
      approval_required: true,
      started_at: null,
      completed_at: null,
    },
    operator_response: {
      status: alert.state === "acknowledged" ? "acknowledged" : "pending",
      acknowledged_at: alert.acknowledged_at,
      delivery_to_acknowledgement_seconds: alert.delivery_to_acknowledgement_seconds,
      clock_domain: "operator_wall_clock",
      mitigation_executed: false,
    },
    verification: {
      title: "Verificación posterior",
      status: "pending",
      detail: "No existe verificación posterior porque ninguna mitigación fue ejecutada.",
      metrics: {},
      contract: response.verification,
    },
    timing: {
      measurement_valid: false,
      signal_to_detection_measurement_valid: true,
      first_signal_to_detection_seconds: alert.decision_latency_minutes * 60,
      first_signal_to_action_seconds: null,
      first_signal_to_recovery_seconds: null,
      delivery_to_acknowledgement_seconds: alert.delivery_to_acknowledgement_seconds,
      clock_domains: alert.clock_domains,
    },
    impact: {
      label: isIncident ? "potential_not_observed" : "not_applicable",
      customer_impact_observed: false,
      customer_complaint_simulated: false,
      detail: isIncident
        ? "La presión podría degradar el checkout; no se observó impacto real en clientes."
        : "La pérdida de telemetría afecta visibilidad, no demuestra impacto al cliente.",
    },
    next_step: alert.recommended_action,
    evidence_event_ids: [alert.event_id],
    limitations: [
      "Datos sintéticos oficiales reproducidos minuto a minuto; no son máquinas remotas reales.",
      "La explicación traduce evidencia persistida y no modifica el score del modelo.",
      "La causa raíz, el impacto evitado y la recuperación no están demostrados por este replay.",
    ],
    provenance: {
      source: "challenge_predictor",
      model_version: alert.model_version,
      model_sha256: alert.model_sha256,
      policy_version: alert.policy_version,
      policy_sha256: alert.policy_sha256,
    },
  };
}
