import { z } from "zod";

const isoTimestampSchema = z.string().datetime({ offset: true });
const nullableIsoTimestampSchema = isoTimestampSchema.nullable();
const tenantIdSchema = z.literal("kaiku");
const dataQualitySchema = z.enum(["ok", "partial", "outage"]);
const detailsSchema = z.record(z.string(), z.unknown());

export const readinessResponseSchema = z.object({
  status: z.enum(["ready", "not_ready"]),
  checks: z.object({
    database: z.enum(["ok", "failed", "disabled", "degraded"]),
    monitor: z.enum(["ok", "failed", "disabled", "degraded"]),
    traffic: z.enum(["ok", "failed", "disabled", "degraded"]),
    model: z.enum(["ok", "failed", "disabled", "degraded"]),
    resources: z.enum(["ok", "failed", "disabled", "degraded"]),
    evidence: z.enum(["ok", "failed", "disabled", "degraded"]),
  }),
});

export const tenantDtoSchema = z.object({
  id: tenantIdSchema,
  name: z.string().min(1),
  business: z.string().min(1),
  criticalSystems: z.array(z.string()),
  operatingWindow: z.string().min(1),
});

export const challengeRunDtoSchema = z.object({
  id: z.string().min(1),
  status: z.enum(["available", "running", "completed", "failed"]),
  started_at: nullableIsoTimestampSchema,
  completed_at: nullableIsoTimestampSchema,
  synthetic: z.literal(true),
});

export const challengeReplayDtoSchema = z.object({
  id: z.string().min(1),
  run_id: z.string().min(1),
  status: z.enum(["queued", "running", "completed", "failed", "stopped"]),
  current_timestamp: nullableIsoTimestampSchema,
  processed_rows: z.number().int().nonnegative(),
  total_rows: z.number().int().nonnegative(),
  alerts_count: z.number().int().nonnegative(),
  synthetic: z.literal(true),
}).superRefine((replay, context) => {
  if (replay.processed_rows > replay.total_rows) {
    context.addIssue({
      code: "custom",
      message: "processed_rows no puede superar total_rows",
      path: ["processed_rows"],
    });
  }
});

export const challengeMetricPointDtoSchema = z.object({
  tenant: tenantIdSchema,
  run_id: z.string().min(1),
  timestamp: isoTimestampSchema,
  cpu: z.number().nullable(),
  ram: z.number().nullable(),
  disco: z.number().nullable(),
  latencia_ms: z.number().nullable(),
  errores: z.number().nullable(),
  data_quality: dataQualitySchema,
});

export const alertEvidenceDtoSchema = z.object({
  feature: z.string().min(1),
  observed: z.number().nullable(),
  baseline: z.number().nullable(),
  unit: z.string().nullable(),
  direction: z.enum(["up", "down", "missing", "stable"]),
  observed_at: isoTimestampSchema,
});

export const challengeAlertDtoSchema = z.object({
  id: z.number().int().nonnegative(),
  tenant: tenantIdSchema,
  run_id: z.string().min(1),
  incident_id: z.string().nullable(),
  timestamp: isoTimestampSchema,
  confidence: z.number().min(0).max(1),
  incident_type: z.string().nullable(),
  severity: z.enum(["watch", "warning", "critical"]),
  state: z.enum(["open", "acknowledged", "resolved"]),
  data_quality: dataQualitySchema,
  model_version: z.string().min(1),
  evidence: z.array(alertEvidenceDtoSchema),
});

export const operationalAlertDtoSchema = z.object({
  id: z.number().int().nonnegative(),
  event_id: z.number().int().nonnegative(),
  incident_id: z.string().nullable(),
  experiment_id: z.string().nullable(),
  type: z.string().min(1),
  priority: z.string().min(1),
  state: z.enum(["open", "acknowledged"]),
  created_at: isoTimestampSchema,
  acknowledged_at: nullableIsoTimestampSchema,
  details: detailsSchema,
});

export const incidentDtoSchema = z.object({
  id: z.string().min(1),
  service: z.string().min(1),
  severity: z.string().min(1),
  status: z.string().min(1),
  first_signal_at: isoTimestampSchema,
  detected_at: isoTimestampSchema,
  recovered_at: nullableIsoTimestampSchema,
  evidence: detailsSchema,
  experiment_id: z.string().nullable(),
}).superRefine((incident, context) => {
  if (Date.parse(incident.first_signal_at) > Date.parse(incident.detected_at)) {
    context.addIssue({
      code: "custom",
      message: "first_signal_at debe ser anterior o igual a detected_at",
      path: ["first_signal_at"],
    });
  }
  if (incident.recovered_at !== null
    && Date.parse(incident.recovered_at) < Date.parse(incident.detected_at)) {
    context.addIssue({
      code: "custom",
      message: "recovered_at no puede ser anterior a detected_at",
      path: ["recovered_at"],
    });
  }
});

export const eventDtoSchema = z.object({
  id: z.number().int().nonnegative(),
  incident_id: z.string().nullable(),
  experiment_id: z.string().nullable(),
  type: z.string().min(1),
  timestamp: isoTimestampSchema,
  details: detailsSchema,
});

export const eventCursorDtoSchema = z.object({
  latest_id: z.number().int().nonnegative(),
});

export const eventHeartbeatDtoSchema = z.object({
  cursor: z.number().int().nonnegative(),
});

export const alertAcknowledgementDtoSchema = z.object({
  id: z.number().int().nonnegative(),
  state: z.literal("acknowledged"),
  acknowledged_at: isoTimestampSchema,
});

export type ReadinessResponseDto = z.infer<typeof readinessResponseSchema>;
export type TenantDto = z.infer<typeof tenantDtoSchema>;
export type ChallengeRunDto = z.infer<typeof challengeRunDtoSchema>;
export type ChallengeReplayDto = z.infer<typeof challengeReplayDtoSchema>;
export type ChallengeMetricPointDto = z.infer<typeof challengeMetricPointDtoSchema>;
export type ChallengeAlertDto = z.infer<typeof challengeAlertDtoSchema>;
export type OperationalAlertDto = z.infer<typeof operationalAlertDtoSchema>;
export type IncidentDto = z.infer<typeof incidentDtoSchema>;
export type EventDto = z.infer<typeof eventDtoSchema>;
export type EventCursorDto = z.infer<typeof eventCursorDtoSchema>;
