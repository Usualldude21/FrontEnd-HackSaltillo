import { z } from "zod";

export const CHALLENGE_CONTRACT_VERSION = "challenge-kaiku-delivery-contract-v2" as const;
export const CHALLENGE_ENVIRONMENT = "official_synthetic_challenge_replay" as const;

const syntheticTimestampSchema = z.string().regex(
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/u,
  "Se esperaba un timestamp del reloj sintético sin zona horaria.",
);
const timestampSchema = z.string().refine(
  (value) => Number.isFinite(Date.parse(value)),
  "Se esperaba un timestamp ISO válido.",
);
const nullableTimestampSchema = timestampSchema.nullable();
const jsonObjectSchema = z.record(z.string(), z.unknown());
const evidenceSchema = z.union([jsonObjectSchema, z.array(jsonObjectSchema)]);

export const challengeContractSchema = z.object({
  contract_version: z.literal(CHALLENGE_CONTRACT_VERSION),
  scope: z.string().min(1),
  tenant: z.literal("kaiku"),
  environment: z.literal(CHALLENGE_ENVIRONMENT),
  submission_columns: z.array(z.string()),
  aggregate_audit_columns: z.array(z.string()),
  partitioning: z.literal("one evaluator CSV per run_id"),
  submission_fields: z.array(z.object({
    name: z.string().min(1),
    data_type: z.string().min(1),
    required: z.boolean(),
    semantics: z.string().min(1),
  })),
  ordering: z.array(z.string()),
  identity: z.array(z.string()),
  endpoints: z.array(z.object({
    method: z.enum(["GET", "POST"]),
    path: z.string().startsWith("/api/"),
    authentication: z.string().min(1),
    purpose: z.string().min(1),
  })),
  stream_event: z.literal("challenge_alert"),
  stream_state_event: z.literal("challenge_alert_acknowledged"),
  stream_resume_header: z.literal("Last-Event-ID"),
  response_plan_version: z.string().min(1),
  supported_incident_types: z.array(z.string()),
  limitations: z.object({
    official_ground_truth_used: z.literal(false),
    confidence_is_calibrated_probability: z.literal(false),
    automatic_remediation: z.boolean(),
    gemini_required: z.literal(false),
  }),
});

export const verificationCheckSchema = z.object({
  signal: z.string().min(1),
  condition: z.string().min(1),
  stable_minutes: z.number().int().nonnegative(),
});

export const challengeResponsePlanSchema = z.object({
  runbook_id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  diagnostic_steps: z.array(z.string()),
  controlled_steps: z.array(z.string()),
  verification: z.array(verificationCheckSchema),
  stop_conditions: z.array(z.string()),
  version: z.string().min(1),
  requested_incident_type: z.string().min(1),
  matched_incident_type: z.string().min(1),
  execution_mode: z.literal("recommendation_only"),
  execution_authorized: z.literal(false),
  approval_required: z.literal(true),
  verification_status: z.literal("not_started"),
  environment: z.literal(CHALLENGE_ENVIRONMENT),
});

const clockDomainsSchema = z.object({
  signal_to_detection: z.literal("synthetic_replay_time"),
  delivery_to_acknowledgement: z.literal("operator_wall_clock"),
  cross_domain_duration_valid: z.literal(false),
});

export const challengeAlertSchema = z.object({
  id: z.number().int().positive(),
  prediction_id: z.number().int().positive(),
  event_id: z.number().int().positive(),
  outbox_alert_id: z.number().int().positive(),
  incident_id: z.string().nullable(),
  run_id: z.string().min(1),
  tenant: z.literal("kaiku"),
  signal_timestamp: syntheticTimestampSchema,
  timestamp: syntheticTimestampSchema,
  decision_latency_minutes: z.number().nonnegative(),
  alert_type: z.enum(["incident_risk", "data_quality_alert"]),
  confidence: z.number().min(0).max(1),
  suspected_incident_type: z.string().nullable(),
  model_version: z.string().min(1),
  policy_version: z.string().min(1),
  model_sha256: z.string().min(1),
  policy_sha256: z.string().min(1),
  data_quality: z.enum(["ok", "partial", "outage"]),
  context_known_event: z.boolean(),
  evidence: evidenceSchema,
  recommended_action: z.string().min(1),
  response_plan: challengeResponsePlanSchema,
  runbook_id: z.string().min(1),
  action_executed: z.boolean(),
  remediation: z.object({
    id: z.string().min(1),
    status: z.enum(["deciding", "decision_ready", "executing", "verifying", "recovered", "reverted", "escalated", "cancelled"]),
    eligible_at: timestampSchema,
    runbook_id: z.string().nullable(),
    decision_provider: z.string().nullable(),
    decision_reason: z.string().nullable(),
    failure_code: z.string().nullable(),
    action_started_at: nullableTimestampSchema,
    action_completed_at: nullableTimestampSchema,
    verification_completed_at: nullableTimestampSchema,
    audit: jsonObjectSchema,
  }).nullable(),
  delivered_at: timestampSchema,
  priority: z.enum(["warning", "critical"]),
  state: z.enum(["open", "acknowledged"]),
  acknowledged_at: nullableTimestampSchema,
  delivery_to_acknowledgement_seconds: z.number().nonnegative().nullable(),
  clock_domains: clockDomainsSchema,
}).superRefine((alert, context) => {
  if (alert.id !== alert.event_id) {
    context.addIssue({
      code: "custom",
      message: "id debe conservar la identidad del event_id.",
      path: ["id"],
    });
  }
  if (alert.alert_type === "incident_risk" && alert.incident_id === null) {
    context.addIssue({
      code: "custom",
      message: "Una alerta de riesgo debe estar enlazada a un incidente.",
      path: ["incident_id"],
    });
  }
  if (alert.alert_type === "data_quality_alert" && alert.incident_id !== null) {
    context.addIssue({
      code: "custom",
      message: "Una alerta de calidad no debe inventar un incidente.",
      path: ["incident_id"],
    });
  }
});

export const challengeCursorSchema = z.object({
  earliest_id: z.number().int().nonnegative(),
  latest_id: z.number().int().nonnegative(),
  retained_count: z.number().int().nonnegative(),
  storage: z.literal("durable_database_phase_7"),
  durable: z.literal(true),
});

export const challengeStreamHeartbeatSchema = z.object({
  cursor: z.number().int().nonnegative(),
});

export const challengeAcknowledgedStreamSchema = z.object({
  id: z.number().int().positive(),
  event_id: z.number().int().positive(),
  outbox_alert_id: z.number().int().positive(),
  incident_id: z.string().nullable(),
  run_id: z.string().min(1),
  tenant: z.literal("kaiku"),
  timestamp: timestampSchema,
  alert_type: z.literal("operator_acknowledgement"),
  state: z.literal("acknowledged"),
  action_executed: z.boolean(),
  delivery_to_acknowledgement_seconds: z.number().nonnegative(),
  clock_domain: z.literal("operator_wall_clock"),
  stream_event: z.literal("challenge_alert_acknowledged"),
}).superRefine((update, context) => {
  if (update.id !== update.event_id) {
    context.addIssue({
      code: "custom",
      message: "id debe conservar la identidad del cursor/event_id.",
      path: ["id"],
    });
  }
});

export const challengeRemediationStreamSchema = z.object({
  id: z.number().int().positive(),
  event_id: z.number().int().positive(),
  incident_id: z.string().min(1),
  alert_type: z.literal("autonomous_remediation"),
  state: z.enum(["deciding", "decision_ready", "executing", "verifying", "recovered", "reverted", "escalated", "cancelled"]),
  stream_event: z.literal("challenge_remediation_update"),
});

const distributionSchema = z.object({
  count: z.number().int().nonnegative(),
  min: z.number().nonnegative().nullable(),
  median: z.number().nonnegative().nullable(),
  max: z.number().nonnegative().nullable(),
});

export const challengeOperationsSchema = z.object({
  version: z.literal("challenge-kaiku-operations-v2"),
  environment: z.literal(CHALLENGE_ENVIRONMENT),
  alerts: z.object({
    total: z.number().int().nonnegative(),
    incident_risk: z.number().int().nonnegative(),
    data_quality: z.number().int().nonnegative(),
    open: z.number().int().nonnegative(),
    acknowledged: z.number().int().nonnegative(),
  }),
  remediations: z.object({
    total: z.number().int().nonnegative(),
    recovered: z.number().int().nonnegative(),
    reverted: z.number().int().nonnegative(),
    escalated: z.number().int().nonnegative(),
    active: z.number().int().nonnegative(),
  }),
  timing: z.object({
    signal_to_detection_seconds: distributionSchema.extend({
      clock_domain: z.literal("synthetic_replay_time"),
    }),
    delivery_to_acknowledgement_seconds: distributionSchema.extend({
      clock_domain: z.literal("operator_wall_clock"),
    }),
    signal_to_acknowledgement_seconds: z.object({
      valid: z.literal(false),
      value: z.null(),
      reason: z.string().min(1),
    }),
  }),
  cursor: z.object({
    earliest_id: z.number().int().nonnegative(),
    latest_id: z.number().int().nonnegative(),
    retained_count: z.number().int().nonnegative(),
  }),
  integrity: z.object({
    passed: z.boolean(),
    predictions_have_event_and_outbox: z.boolean(),
    incident_predictions_have_first_signal: z.boolean(),
    acknowledgements_have_single_event: z.boolean(),
    delivery_timestamps_share_wall_clock: z.boolean(),
    acknowledgement_not_before_delivery: z.boolean(),
  }),
  limitations: z.object({
    mitigation_executed: z.boolean(),
    recovery_verified: z.boolean(),
    remote_infrastructure_observed: z.literal(false),
    controlled_infrastructure_only: z.literal(true),
  }),
});

export const challengeRemediationSchema = z.object({
  remediation_id: z.string().min(1),
  incident_id: z.string().min(1),
  alert_id: z.number().int().positive(),
  status: z.enum(["deciding", "decision_ready", "executing", "verifying", "recovered", "reverted", "escalated", "cancelled"]),
  eligible_at: timestampSchema,
  decision_provider: z.string().nullable(),
  decision_reason: z.string().nullable(),
  runbook_id: z.string().nullable(),
  action_started_at: nullableTimestampSchema,
  action_completed_at: nullableTimestampSchema,
  verification_completed_at: nullableTimestampSchema,
  failure_code: z.string().nullable(),
  environment: z.literal("controlled_infrastructure_demo"),
  audit: jsonObjectSchema,
});

export const challengeRemediationOverviewSchema = z.object({
  version: z.literal("challenge-controlled-remediation-v1"),
  environment: z.literal("controlled_infrastructure_demo"),
  enabled: z.boolean(),
  wait_seconds: z.number().nonnegative(),
  verification_minutes: z.number().int().positive(),
  gemini_configured: z.boolean(),
  mcp_execution_available: z.boolean(),
  records: z.array(challengeRemediationSchema),
});

export const challengeReplayResultSchema = z.object({
  run_id: z.string().min(1),
  rows_processed: z.number().int().nonnegative(),
  tenants: z.array(z.literal("kaiku")).min(1),
  incident_alerts: z.number().int().nonnegative(),
  data_quality_alerts: z.number().int().nonnegative(),
  new_alerts: z.number().int().nonnegative(),
  existing_alerts: z.number().int().nonnegative(),
  latest_cursor: z.number().int().nonnegative(),
  elapsed_milliseconds: z.number().nonnegative(),
  model_sha256: z.string().min(1),
  policy_sha256: z.string().min(1),
  storage: z.literal("durable_database_phase_7"),
  execution: z.literal("inline_serialized_phase_7"),
});

export const challengeLiveReplaySchema = z.object({
  version: z.literal("challenge-kaiku-live-replay-v1"),
  environment: z.literal("official_synthetic_challenge_live_replay"),
  session_id: z.string().min(1),
  run_id: z.string().min(1),
  tenant: z.literal("kaiku"),
  status: z.enum(["preparing", "running", "paused", "completed", "stopped", "failed"]),
  speed_minutes_per_second: z.number().positive(),
  telemetry_interval_minutes: z.number().int().positive(),
  rows_processed: z.number().int().nonnegative(),
  total_rows: z.number().int().nonnegative(),
  progress: z.number().min(0).max(1),
  current_timestamp: z.string().nullable(),
  alerts: z.object({
    incident_risk: z.number().int().nonnegative(),
    data_quality: z.number().int().nonnegative(),
  }),
  started_at: timestampSchema,
  finished_at: nullableTimestampSchema,
  elapsed_wall_seconds: z.number().nonnegative().nullable(),
  latest_sequence: z.number().int().nonnegative(),
  error: z.string().nullable(),
}).passthrough();

export const challengeLiveReplayRunsSchema = z.object({
  tenant: z.literal("kaiku"),
  environment: z.literal("official_synthetic_challenge_live_replay"),
  runs: z.array(z.string().regex(/^corrida_\d{2}$/u)).min(1),
  count: z.number().int().positive(),
}).superRefine((catalog, context) => {
  if (catalog.count !== catalog.runs.length) {
    context.addIssue({
      code: "custom",
      message: "El conteo de corridas no coincide con el catálogo recibido.",
      path: ["count"],
    });
  }
  if (new Set(catalog.runs).size !== catalog.runs.length) {
    context.addIssue({
      code: "custom",
      message: "El catálogo de corridas contiene identificadores duplicados.",
      path: ["runs"],
    });
  }
});

const investigationBriefingSchema = z.object({
  what_happened: z.string().min(1),
  customer_impact: z.string().min(1),
  sentinel_action: z.string().min(1),
  verification: z.string().min(1),
  next_safe_step: z.string().min(1),
  unknowns: z.array(z.string()),
}).passthrough();

export const challengeIncidentInvestigationSchema = z.object({
  incident_id: z.string().min(1),
  provider: z.string().min(1),
  answer_kind: z.enum(["deterministic", "ai-hypothesis"]),
  operator_briefing: investigationBriefingSchema,
  trace: z.object({
    mcp_used: z.boolean(),
    model: z.string().nullable(),
    ai_duration_ms: z.number().nonnegative().nullable(),
  }).passthrough(),
}).passthrough();

export const challengeIncidentInvestigationListSchema = z.array(z.object({
  diagnosis: challengeIncidentInvestigationSchema,
}).passthrough());

const explanationStageSchema = z.object({
  title: z.string().min(1),
  status: z.string().min(1),
  detail: z.string().min(1),
});

const operatorResponseSchema = z.object({
  status: z.enum(["pending", "acknowledged"]),
  acknowledged_at: nullableTimestampSchema,
  delivery_to_acknowledgement_seconds: z.number().nonnegative().nullable(),
  clock_domain: z.literal("operator_wall_clock"),
  mitigation_executed: z.boolean(),
});

export const challengeExplanationSchema = z.object({
  version: z.literal("2"),
  source: z.literal("deterministic-local"),
  incident_id: z.string().nullable(),
  experiment_id: z.null().optional(),
  service: z.string().optional(),
  tenant: z.literal("kaiku"),
  run_id: z.string().min(1),
  severity: z.string().optional(),
  status: z.string().min(1),
  environment: z.literal(CHALLENGE_ENVIRONMENT),
  headline: z.string().min(1),
  summary: z.string().min(1),
  signal: explanationStageSchema.extend({
    observed_at: syntheticTimestampSchema,
    top_signals: z.union([jsonObjectSchema, z.array(jsonObjectSchema)]),
  }),
  decision: explanationStageSchema.extend({
    confidence: z.number().min(0).max(1).optional(),
    suspected_incident_type: z.string().nullable().optional(),
  }),
  action: explanationStageSchema.extend({
    runbook: z.string().min(1),
    response_plan: challengeResponsePlanSchema,
    execution_authorized: z.boolean(),
    approval_required: z.boolean(),
    started_at: nullableTimestampSchema,
    completed_at: nullableTimestampSchema,
    environment: z.literal("controlled_infrastructure_demo").optional(),
  }),
  operator_response: operatorResponseSchema,
  verification: explanationStageSchema.extend({
    metrics: jsonObjectSchema,
    contract: z.array(verificationCheckSchema),
  }),
  timing: z.object({
    measurement_valid: z.literal(false),
    signal_to_detection_measurement_valid: z.literal(true),
    first_signal_to_detection_seconds: z.number().nonnegative(),
    first_signal_to_action_seconds: z.null(),
    first_signal_to_recovery_seconds: z.null(),
    delivery_to_acknowledgement_seconds: z.number().nonnegative().nullable(),
    clock_domains: clockDomainsSchema,
  }),
  impact: z.object({
    label: z.enum(["potential_not_observed", "not_applicable"]),
    customer_impact_observed: z.literal(false),
    customer_complaint_simulated: z.literal(false),
    detail: z.string().min(1),
  }).passthrough(),
  next_step: z.string().min(1),
  evidence_event_ids: z.array(z.number().int().positive()),
  limitations: z.array(z.string()),
  provenance: z.object({
    source: z.string().min(1),
    model_version: z.string().min(1),
    model_sha256: z.string().min(1),
    policy_version: z.string().min(1),
    policy_sha256: z.string().min(1),
  }).optional(),
});

export const challengeShowcaseSchema = z.object({
  version: z.literal("challenge-kaiku-guided-showcase-v1"),
  status: z.literal("passed"),
  scope: z.string().min(1),
  company: z.object({
    tenant: z.literal("kaiku"),
    business: z.literal("tienda en línea"),
    critical_flow: z.string().min(1),
  }),
  selection_rule: z.string().min(1),
  representative_case: z.object({
    run_id: z.string().min(1),
    tenant: z.literal("kaiku"),
    split: z.literal("test"),
    signal_timestamp: syntheticTimestampSchema,
    alert_timestamp: syntheticTimestampSchema,
    signal_to_alert_minutes: z.number().nonnegative(),
    risk_score: z.number().min(0).max(1),
    confidence_semantics: z.string().min(1),
    suspected_incident_type: z.string().min(1),
    model_version: z.string().min(1),
    evidence: evidenceSchema,
    recommended_action: z.string().min(1),
    response_plan: challengeResponsePlanSchema,
    business_interpretation: z.string().min(1),
  }),
  false_alarm_control: z.object({
    known_event_alerts_with_context: z.number().int().nonnegative(),
    known_event_alerts_without_context: z.number().int().nonnegative(),
    interpretation: z.string().min(1),
  }),
  telemetry_outage_case: jsonObjectSchema,
  demo_api_sequence: z.array(jsonObjectSchema),
  gates: z.record(z.string(), z.object({ passed: z.boolean() }).passthrough()),
  claim_boundary: z.object({
    official_ground_truth_used: z.literal(false),
    representative_alert_confirmed_real_incident: z.literal(false),
    customer_impact_observed: z.literal(false),
    root_cause_demonstrated: z.literal(false),
    mitigation_executed: z.literal(false),
    recovery_verified: z.literal(false),
  }),
});

const challengeAcknowledgementTraceSchema = z.object({
  source: z.string().min(1),
  run_id: z.string().min(1),
  tenant: z.literal("kaiku"),
  alert_event_id: z.number().int().positive(),
  outbox_alert_id: z.number().int().positive(),
  clock_domain: z.literal("operator_wall_clock"),
  delivered_at: timestampSchema,
  acknowledged_at: timestampSchema,
  delivery_to_acknowledgement_seconds: z.number().nonnegative(),
  operator_action: z.literal("alert_acknowledged"),
  mitigation_executed: z.boolean(),
});

export const challengeAcknowledgementSchema = z.object({
  id: z.number().int().positive(),
  state: z.literal("acknowledged"),
  acknowledged_at: timestampSchema,
  challenge_trace: challengeAcknowledgementTraceSchema,
});

export const verifiedArtifactSchema = z.object({
  version: z.string().min(1),
  status: z.string().min(1),
  scope: z.string().min(1).optional(),
}).passthrough();

export type ChallengeContractDto = z.infer<typeof challengeContractSchema>;
export type ChallengeAlertDtoV1 = z.infer<typeof challengeAlertSchema>;
export type ChallengeCursorDto = z.infer<typeof challengeCursorSchema>;
export type ChallengeAcknowledgedStreamDto = z.infer<typeof challengeAcknowledgedStreamSchema>;
export type ChallengeOperationsDto = z.infer<typeof challengeOperationsSchema>;
export type ChallengeRemediationOverviewDto = z.infer<typeof challengeRemediationOverviewSchema>;
export type ChallengeReplayResultDto = z.infer<typeof challengeReplayResultSchema>;
export type ChallengeLiveReplayDto = z.infer<typeof challengeLiveReplaySchema>;
export type ChallengeLiveReplayRunsDto = z.infer<typeof challengeLiveReplayRunsSchema>;
export type ChallengeIncidentInvestigationDto = z.infer<typeof challengeIncidentInvestigationSchema>;
export type ChallengeIncidentInvestigationListDto = z.infer<typeof challengeIncidentInvestigationListSchema>;
export type ChallengeExplanationDto = z.infer<typeof challengeExplanationSchema>;
export type ChallengeShowcaseDto = z.infer<typeof challengeShowcaseSchema>;
export type ChallengeAcknowledgementDto = z.infer<typeof challengeAcknowledgementSchema>;
export type VerifiedArtifactDto = z.infer<typeof verifiedArtifactSchema>;
