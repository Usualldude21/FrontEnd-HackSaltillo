import type { AlertSeverity, SentinelAlert } from "../../domain/alert";
import type { BackendStatus } from "../../domain/backend";
import type { TimelineEvent } from "../../domain/event";
import type { Incident } from "../../domain/incident";
import type { ChallengeRun } from "../../domain/run";
import type { ChallengeReplay } from "../../domain/replay";
import type { TelemetryPoint } from "../../domain/telemetry";
import type { Tenant } from "../../domain/tenant";
import type {
  ChallengeAlertDto,
  ChallengeMetricPointDto,
  ChallengeRunDto,
  ChallengeReplayDto,
  EventDto,
  IncidentDto,
  OperationalAlertDto,
  ReadinessResponseDto,
  TenantDto,
} from "./schemas";

function normalizeTimestamp(value: string): string {
  return new Date(value).toISOString();
}

function normalizeNullableTimestamp(value: string | null): string | null {
  return value === null ? null : normalizeTimestamp(value);
}

export function mapReadiness(dto: ReadinessResponseDto): BackendStatus {
  return { ready: dto.status === "ready", status: dto.status, checks: dto.checks };
}

export function mapTenant(dto: TenantDto): Tenant {
  return { ...dto, criticalSystems: [...dto.criticalSystems] };
}

export function mapRun(dto: ChallengeRunDto): ChallengeRun {
  return {
    id: dto.id,
    status: dto.status,
    startedAt: normalizeNullableTimestamp(dto.started_at),
    completedAt: normalizeNullableTimestamp(dto.completed_at),
    synthetic: true,
  };
}

export function mapReplay(dto: ChallengeReplayDto): ChallengeReplay {
  return {
    id: dto.id,
    runId: dto.run_id,
    status: dto.status,
    currentTimestamp: normalizeNullableTimestamp(dto.current_timestamp),
    processedRows: dto.processed_rows,
    totalRows: dto.total_rows,
    alertsCount: dto.alerts_count,
    synthetic: true,
  };
}

export function mapTelemetryPoint(dto: ChallengeMetricPointDto): TelemetryPoint {
  return {
    tenant: dto.tenant,
    runId: dto.run_id,
    timestamp: normalizeTimestamp(dto.timestamp),
    cpu: dto.cpu,
    ram: dto.ram,
    disk: dto.disco,
    latencyMs: dto.latencia_ms,
    errors: dto.errores,
    dataQuality: dto.data_quality,
  };
}

export function mapChallengeAlert(dto: ChallengeAlertDto): SentinelAlert {
  return {
    id: String(dto.id),
    source: "challenge_predictor",
    tenant: dto.tenant,
    runId: dto.run_id,
    incidentId: dto.incident_id,
    timestamp: normalizeTimestamp(dto.timestamp),
    confidence: dto.confidence,
    incidentType: dto.incident_type,
    severity: dto.severity,
    state: dto.state,
    dataQuality: dto.data_quality,
    evidence: dto.evidence.map((item) => ({
      feature: item.feature,
      observed: item.observed,
      baseline: item.baseline,
      unit: item.unit,
      direction: item.direction,
      observedAt: normalizeTimestamp(item.observed_at),
    })),
    modelVersion: dto.model_version,
  };
}

function mapOperationalPriority(priority: string): AlertSeverity {
  const normalized = priority.toLowerCase();
  if (normalized === "critical" || normalized === "p0") return "critical";
  if (normalized === "warning" || normalized === "high" || normalized === "p1") return "warning";
  return "watch";
}

export function mapOperationalAlert(dto: OperationalAlertDto): SentinelAlert {
  return {
    id: String(dto.id),
    source: "operational_lab",
    tenant: null,
    runId: dto.experiment_id,
    incidentId: dto.incident_id,
    timestamp: normalizeTimestamp(dto.created_at),
    confidence: null,
    incidentType: dto.type,
    severity: mapOperationalPriority(dto.priority),
    state: dto.state,
    dataQuality: "ok",
    evidence: [],
    modelVersion: null,
  };
}

export function mapIncident(dto: IncidentDto): Incident {
  return {
    id: dto.id,
    tenant: null,
    service: dto.service,
    severity: dto.severity,
    status: dto.status,
    firstSignalAt: normalizeTimestamp(dto.first_signal_at),
    detectedAt: normalizeTimestamp(dto.detected_at),
    recoveredAt: normalizeNullableTimestamp(dto.recovered_at),
    evidence: dto.evidence,
    experimentId: dto.experiment_id,
  };
}

export function mapEvent(dto: EventDto): TimelineEvent {
  return {
    id: dto.id,
    incidentId: dto.incident_id,
    experimentId: dto.experiment_id,
    type: dto.type,
    timestamp: normalizeTimestamp(dto.timestamp),
    details: dto.details,
  };
}
