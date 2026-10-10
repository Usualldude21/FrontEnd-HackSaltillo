import {
  riskScoreSemantics,
  type ChallengeAcknowledgement,
  type ChallengeAlertExplanation,
  type ChallengeContract,
  type ChallengeCursor,
  type ChallengeEvidence,
  type ChallengeOperations,
  type ChallengeIncidentInvestigation,
  type ChallengeLiveReplayStatus,
  type ChallengeReplayResult,
  type ChallengeResponsePlan,
  type ChallengeShowcase,
  type KaikuChallengeAlert,
  type OperatorWallClockMoment,
  type SyntheticReplayMoment,
  type VerifiedChallengeArtifact,
} from "../../domain/kaikuChallenge";
import type {
  ChallengeAcknowledgementDto,
  ChallengeAlertDtoV1,
  ChallengeContractDto,
  ChallengeCursorDto,
  ChallengeExplanationDto,
  ChallengeOperationsDto,
  ChallengeIncidentInvestigationDto,
  ChallengeLiveReplayDto,
  ChallengeReplayResultDto,
  ChallengeShowcaseDto,
  VerifiedArtifactDto,
} from "./challengeBackendSchemas";

function syntheticMoment(value: string): SyntheticReplayMoment {
  return { value, clock: "synthetic_replay_time" };
}

function operatorMoment(value: string): OperatorWallClockMoment {
  return { value, clock: "operator_wall_clock" };
}

function mapEvidence(value: ChallengeAlertDtoV1["evidence"]): ChallengeEvidence {
  if (Array.isArray(value)) {
    return {
      kind: "risk_signals",
      signals: value.map((item, index) => ({
        key: typeof item.signal === "string" ? item.signal : `signal_${index + 1}`,
        value: item.value,
      })),
    };
  }
  return { kind: "telemetry_quality", details: { ...value } };
}

function mapResponsePlan(
  value: ChallengeAlertDtoV1["response_plan"],
): ChallengeResponsePlan {
  return {
    id: value.runbook_id,
    version: value.version,
    title: value.title,
    summary: value.summary,
    requestedIncidentType: value.requested_incident_type,
    matchedIncidentType: value.matched_incident_type,
    diagnosticSteps: [...value.diagnostic_steps],
    controlledSteps: [...value.controlled_steps],
    verification: value.verification.map((check) => ({
      signal: check.signal,
      condition: check.condition,
      stableMinutes: check.stable_minutes,
    })),
    stopConditions: [...value.stop_conditions],
    executionMode: value.execution_mode,
    executionAuthorized: false,
    approvalRequired: true,
    verificationStatus: "not_started",
  };
}

export function mapChallengeContract(dto: ChallengeContractDto): ChallengeContract {
  return {
    version: dto.contract_version,
    tenant: dto.tenant,
    environment: dto.environment,
    scope: dto.scope,
    supportedIncidentTypes: [...dto.supported_incident_types],
    responsePlanVersion: dto.response_plan_version,
    stream: {
      alertEvent: dto.stream_event,
      stateEvent: dto.stream_state_event,
      resumeHeader: dto.stream_resume_header,
    },
    limitations: {
      officialGroundTruthUsed: false,
      confidenceIsCalibratedProbability: false,
      automaticRemediation: false,
      geminiRequired: false,
    },
  };
}

export function mapChallengeAlert(dto: ChallengeAlertDtoV1): KaikuChallengeAlert {
  return {
    eventId: dto.event_id,
    predictionId: dto.prediction_id,
    outboxAlertId: dto.outbox_alert_id,
    incidentId: dto.incident_id,
    runId: dto.run_id,
    tenant: dto.tenant,
    kind: dto.alert_type,
    signalAt: syntheticMoment(dto.signal_timestamp),
    detectedAt: syntheticMoment(dto.timestamp),
    signalToDetectionSeconds: dto.decision_latency_minutes * 60,
    risk: { value: dto.confidence, semantics: riskScoreSemantics },
    suspectedIncidentType: dto.suspected_incident_type,
    priority: dto.priority,
    state: dto.state,
    dataQuality: dto.data_quality,
    contextKnownEvent: dto.context_known_event,
    evidence: mapEvidence(dto.evidence),
    recommendedAction: dto.recommended_action,
    responsePlan: mapResponsePlan(dto.response_plan),
    actionExecuted: false,
    deliveredAt: operatorMoment(dto.delivered_at),
    acknowledgedAt: dto.acknowledged_at === null ? null : operatorMoment(dto.acknowledged_at),
    deliveryToAcknowledgementSeconds: dto.delivery_to_acknowledgement_seconds,
    clocksAreComparable: false,
    provenance: {
      modelVersion: dto.model_version,
      modelSha256: dto.model_sha256,
      policyVersion: dto.policy_version,
      policySha256: dto.policy_sha256,
    },
  };
}

export function mapChallengeCursor(dto: ChallengeCursorDto): ChallengeCursor {
  return {
    earliestId: dto.earliest_id,
    latestId: dto.latest_id,
    retainedCount: dto.retained_count,
    durable: true,
  };
}

function mapDistribution(value: {
  count: number;
  min: number | null;
  median: number | null;
  max: number | null;
}) {
  return { count: value.count, min: value.min, median: value.median, max: value.max };
}

export function mapChallengeOperations(dto: ChallengeOperationsDto): ChallengeOperations {
  return {
    version: dto.version,
    environment: dto.environment,
    alertCounts: {
      total: dto.alerts.total,
      incidentRisk: dto.alerts.incident_risk,
      dataQuality: dto.alerts.data_quality,
      open: dto.alerts.open,
      acknowledged: dto.alerts.acknowledged,
    },
    timing: {
      signalToDetection: {
        ...mapDistribution(dto.timing.signal_to_detection_seconds),
        clock: "synthetic_replay_time",
      },
      deliveryToAcknowledgement: {
        ...mapDistribution(dto.timing.delivery_to_acknowledgement_seconds),
        clock: "operator_wall_clock",
      },
      signalToAcknowledgement: {
        valid: false,
        reason: dto.timing.signal_to_acknowledgement_seconds.reason,
      },
    },
    cursor: {
      earliestId: dto.cursor.earliest_id,
      latestId: dto.cursor.latest_id,
      retainedCount: dto.cursor.retained_count,
    },
    integrity: {
      passed: dto.integrity.passed,
      predictionsHaveEventAndOutbox: dto.integrity.predictions_have_event_and_outbox,
      incidentPredictionsHaveFirstSignal: dto.integrity.incident_predictions_have_first_signal,
      acknowledgementsHaveSingleEvent: dto.integrity.acknowledgements_have_single_event,
      deliveryTimestampsShareWallClock: dto.integrity.delivery_timestamps_share_wall_clock,
      acknowledgementNotBeforeDelivery: dto.integrity.acknowledgement_not_before_delivery,
    },
    limitations: {
      mitigationExecuted: false,
      recoveryVerified: false,
      remoteInfrastructureObserved: false,
    },
  };
}

export function mapChallengeReplayResult(dto: ChallengeReplayResultDto): ChallengeReplayResult {
  return {
    runId: dto.run_id,
    tenant: "kaiku",
    rowsProcessed: dto.rows_processed,
    incidentAlerts: dto.incident_alerts,
    dataQualityAlerts: dto.data_quality_alerts,
    newAlerts: dto.new_alerts,
    existingAlerts: dto.existing_alerts,
    latestCursor: dto.latest_cursor,
    elapsedMilliseconds: dto.elapsed_milliseconds,
    modelSha256: dto.model_sha256,
    policySha256: dto.policy_sha256,
    execution: dto.execution,
  };
}

export function mapChallengeLiveReplay(dto: ChallengeLiveReplayDto): ChallengeLiveReplayStatus {
  return {
    version: dto.version,
    environment: dto.environment,
    sessionId: dto.session_id,
    runId: dto.run_id,
    tenant: dto.tenant,
    status: dto.status,
    speedMinutesPerSecond: dto.speed_minutes_per_second,
    telemetryIntervalMinutes: dto.telemetry_interval_minutes,
    rowsProcessed: dto.rows_processed,
    totalRows: dto.total_rows,
    progress: dto.progress,
    currentTimestamp: dto.current_timestamp,
    incidentAlerts: dto.alerts.incident_risk,
    dataQualityAlerts: dto.alerts.data_quality,
    startedAt: dto.started_at,
    finishedAt: dto.finished_at,
    elapsedWallSeconds: dto.elapsed_wall_seconds,
    latestSequence: dto.latest_sequence,
    error: dto.error,
  };
}

export function mapChallengeIncidentInvestigation(
  dto: ChallengeIncidentInvestigationDto,
): ChallengeIncidentInvestigation {
  return {
    incidentId: dto.incident_id,
    provider: dto.provider,
    answerKind: dto.answer_kind,
    briefing: {
      whatHappened: dto.operator_briefing.what_happened,
      customerImpact: dto.operator_briefing.customer_impact,
      sentinelAction: dto.operator_briefing.sentinel_action,
      verification: dto.operator_briefing.verification,
      nextSafeStep: dto.operator_briefing.next_safe_step,
      unknowns: [...dto.operator_briefing.unknowns],
    },
    trace: {
      mcpUsed: dto.trace.mcp_used,
      model: dto.trace.model,
      durationMilliseconds: dto.trace.ai_duration_ms,
    },
  };
}

export function mapChallengeExplanation(dto: ChallengeExplanationDto): ChallengeAlertExplanation {
  return {
    version: dto.version,
    incidentId: dto.incident_id,
    runId: dto.run_id,
    tenant: dto.tenant,
    status: dto.status,
    severity: dto.severity ?? null,
    headline: dto.headline,
    summary: dto.summary,
    signal: {
      title: dto.signal.title,
      status: dto.signal.status,
      detail: dto.signal.detail,
      observedAt: syntheticMoment(dto.signal.observed_at),
      topSignals: dto.signal.top_signals,
    },
    decision: {
      title: dto.decision.title,
      status: dto.decision.status,
      detail: dto.decision.detail,
      risk: dto.decision.confidence === undefined
        ? null
        : { value: dto.decision.confidence, semantics: riskScoreSemantics },
      suspectedIncidentType: dto.decision.suspected_incident_type ?? null,
    },
    action: {
      title: dto.action.title,
      status: dto.action.status,
      detail: dto.action.detail,
      responsePlan: mapResponsePlan(dto.action.response_plan),
      executionAuthorized: false,
      approvalRequired: true,
    },
    operatorResponse: {
      status: dto.operator_response.status,
      acknowledgedAt: dto.operator_response.acknowledged_at === null
        ? null
        : operatorMoment(dto.operator_response.acknowledged_at),
      deliveryToAcknowledgementSeconds: dto.operator_response.delivery_to_acknowledgement_seconds,
      mitigationExecuted: false,
    },
    verification: {
      title: dto.verification.title,
      status: dto.verification.status,
      detail: dto.verification.detail,
      checks: dto.verification.contract.map((check) => ({
        signal: check.signal,
        condition: check.condition,
        stableMinutes: check.stable_minutes,
      })),
    },
    timing: {
      signalToDetectionMeasurementValid: true,
      signalToDetectionSeconds: dto.timing.first_signal_to_detection_seconds,
      signalToActionSeconds: null,
      signalToRecoverySeconds: null,
      deliveryToAcknowledgementSeconds: dto.timing.delivery_to_acknowledgement_seconds,
      clocksAreComparable: false,
    },
    impact: {
      label: dto.impact.label,
      customerImpactObserved: false,
      detail: dto.impact.detail,
    },
    nextStep: dto.next_step,
    evidenceEventIds: [...dto.evidence_event_ids],
    limitations: [...dto.limitations],
  };
}

export function mapChallengeShowcase(dto: ChallengeShowcaseDto): ChallengeShowcase {
  return {
    version: dto.version,
    status: dto.status,
    scope: dto.scope,
    company: {
      tenant: dto.company.tenant,
      business: dto.company.business,
      criticalFlow: dto.company.critical_flow,
    },
    representativeCase: {
      runId: dto.representative_case.run_id,
      signalAt: syntheticMoment(dto.representative_case.signal_timestamp),
      detectedAt: syntheticMoment(dto.representative_case.alert_timestamp),
      signalToDetectionSeconds: dto.representative_case.signal_to_alert_minutes * 60,
      risk: { value: dto.representative_case.risk_score, semantics: riskScoreSemantics },
      suspectedIncidentType: dto.representative_case.suspected_incident_type,
      modelVersion: dto.representative_case.model_version,
      evidence: mapEvidence(dto.representative_case.evidence),
      recommendedAction: dto.representative_case.recommended_action,
      responsePlan: mapResponsePlan(dto.representative_case.response_plan),
      businessInterpretation: dto.representative_case.business_interpretation,
    },
    falseAlarmControl: {
      knownEventAlertsWithContext: dto.false_alarm_control.known_event_alerts_with_context,
      knownEventAlertsWithoutContext: dto.false_alarm_control.known_event_alerts_without_context,
      interpretation: dto.false_alarm_control.interpretation,
    },
    claimBoundary: {
      officialGroundTruthUsed: false,
      representativeAlertConfirmedRealIncident: false,
      customerImpactObserved: false,
      rootCauseDemonstrated: false,
      mitigationExecuted: false,
      recoveryVerified: false,
    },
  };
}

export function mapChallengeAcknowledgement(
  dto: ChallengeAcknowledgementDto,
): ChallengeAcknowledgement {
  return {
    outboxAlertId: dto.id,
    eventId: dto.challenge_trace.alert_event_id,
    runId: dto.challenge_trace.run_id,
    tenant: dto.challenge_trace.tenant,
    state: dto.state,
    acknowledgedAt: operatorMoment(dto.acknowledged_at),
    deliveryToAcknowledgementSeconds: dto.challenge_trace.delivery_to_acknowledgement_seconds,
    mitigationExecuted: false,
  };
}

export function mapVerifiedArtifact(dto: VerifiedArtifactDto): VerifiedChallengeArtifact {
  return { version: dto.version, status: dto.status, scope: dto.scope ?? null };
}
