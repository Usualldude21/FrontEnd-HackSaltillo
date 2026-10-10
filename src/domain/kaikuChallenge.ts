export const kaikuTenantId = "kaiku" as const;
export const riskScoreSemantics = "risk_score_not_calibrated_probability" as const;

export type KaikuTenantId = typeof kaikuTenantId;
export type ChallengeAlertKind = "incident_risk" | "data_quality_alert";
export type ChallengeDataQuality = "ok" | "partial" | "outage";
export type ChallengeAlertPriority = "warning" | "critical";
export type ChallengeAlertState = "open" | "acknowledged";

export interface SyntheticReplayMoment {
  value: string;
  clock: "synthetic_replay_time";
}

export interface OperatorWallClockMoment {
  value: string;
  clock: "operator_wall_clock";
}

export interface ChallengeRiskScore {
  value: number;
  semantics: typeof riskScoreSemantics;
}

export interface ChallengeRiskSignal {
  key: string;
  value: unknown;
}

export type ChallengeEvidence =
  | {
    kind: "risk_signals";
    signals: ChallengeRiskSignal[];
  }
  | {
    kind: "telemetry_quality";
    details: Record<string, unknown>;
  };

export interface ChallengeVerificationCheck {
  signal: string;
  condition: string;
  stableMinutes: number;
}

export interface ChallengeResponsePlan {
  id: string;
  version: string;
  title: string;
  summary: string;
  requestedIncidentType: string;
  matchedIncidentType: string;
  diagnosticSteps: string[];
  controlledSteps: string[];
  verification: ChallengeVerificationCheck[];
  stopConditions: string[];
  executionMode: "recommendation_only";
  executionAuthorized: false;
  approvalRequired: true;
  verificationStatus: "not_started";
}

export interface KaikuChallengeAlert {
  eventId: number;
  predictionId: number;
  outboxAlertId: number;
  incidentId: string | null;
  runId: string;
  tenant: KaikuTenantId;
  kind: ChallengeAlertKind;
  signalAt: SyntheticReplayMoment;
  detectedAt: SyntheticReplayMoment;
  signalToDetectionSeconds: number;
  risk: ChallengeRiskScore;
  suspectedIncidentType: string | null;
  priority: ChallengeAlertPriority;
  state: ChallengeAlertState;
  dataQuality: ChallengeDataQuality;
  contextKnownEvent: boolean;
  evidence: ChallengeEvidence;
  recommendedAction: string;
  responsePlan: ChallengeResponsePlan;
  actionExecuted: false;
  deliveredAt: OperatorWallClockMoment;
  acknowledgedAt: OperatorWallClockMoment | null;
  deliveryToAcknowledgementSeconds: number | null;
  clocksAreComparable: false;
  provenance: {
    modelVersion: string;
    modelSha256: string;
    policyVersion: string;
    policySha256: string;
  };
}

export interface ChallengeContract {
  version: "challenge-kaiku-delivery-contract-v2";
  tenant: KaikuTenantId;
  environment: "official_synthetic_challenge_replay";
  scope: string;
  supportedIncidentTypes: string[];
  responsePlanVersion: string;
  stream: {
    alertEvent: "challenge_alert";
    stateEvent: "challenge_alert_acknowledged";
    resumeHeader: "Last-Event-ID";
  };
  limitations: {
    officialGroundTruthUsed: false;
    confidenceIsCalibratedProbability: false;
    automaticRemediation: false;
    geminiRequired: false;
  };
}

export interface ChallengeDistribution {
  count: number;
  min: number | null;
  median: number | null;
  max: number | null;
}

export interface ChallengeOperations {
  version: "challenge-kaiku-operations-v2";
  environment: "official_synthetic_challenge_replay";
  alertCounts: {
    total: number;
    incidentRisk: number;
    dataQuality: number;
    open: number;
    acknowledged: number;
  };
  timing: {
    signalToDetection: ChallengeDistribution & { clock: "synthetic_replay_time" };
    deliveryToAcknowledgement: ChallengeDistribution & { clock: "operator_wall_clock" };
    signalToAcknowledgement: {
      valid: false;
      reason: string;
    };
  };
  cursor: {
    earliestId: number;
    latestId: number;
    retainedCount: number;
  };
  integrity: {
    passed: boolean;
    predictionsHaveEventAndOutbox: boolean;
    incidentPredictionsHaveFirstSignal: boolean;
    acknowledgementsHaveSingleEvent: boolean;
    deliveryTimestampsShareWallClock: boolean;
    acknowledgementNotBeforeDelivery: boolean;
  };
  limitations: {
    mitigationExecuted: false;
    recoveryVerified: false;
    remoteInfrastructureObserved: false;
  };
}

export interface ChallengeReplayResult {
  runId: string;
  tenant: KaikuTenantId;
  rowsProcessed: number;
  incidentAlerts: number;
  dataQualityAlerts: number;
  newAlerts: number;
  existingAlerts: number;
  latestCursor: number;
  elapsedMilliseconds: number;
  modelSha256: string;
  policySha256: string;
  execution: "inline_serialized_phase_7";
}

export type ChallengeLiveReplayState = "preparing" | "running" | "paused" | "completed" | "stopped" | "failed";

export interface ChallengeLiveReplayStatus {
  version: "challenge-kaiku-live-replay-v1";
  environment: "official_synthetic_challenge_live_replay";
  sessionId: string;
  runId: string;
  tenant: KaikuTenantId;
  status: ChallengeLiveReplayState;
  speedMinutesPerSecond: number;
  telemetryIntervalMinutes: number;
  rowsProcessed: number;
  totalRows: number;
  progress: number;
  currentTimestamp: string | null;
  incidentAlerts: number;
  dataQualityAlerts: number;
  startedAt: string;
  finishedAt: string | null;
  elapsedWallSeconds: number | null;
  latestSequence: number;
  error: string | null;
}

export interface ChallengeInvestigationBriefing {
  whatHappened: string;
  customerImpact: string;
  sentinelAction: string;
  verification: string;
  nextSafeStep: string;
  unknowns: string[];
}

export interface ChallengeIncidentInvestigation {
  incidentId: string;
  provider: string;
  answerKind: "deterministic" | "ai-hypothesis";
  briefing: ChallengeInvestigationBriefing;
  trace: {
    mcpUsed: boolean;
    model: string | null;
    durationMilliseconds: number | null;
  };
}

export interface ChallengeOperatorResponse {
  status: "pending" | "acknowledged";
  acknowledgedAt: OperatorWallClockMoment | null;
  deliveryToAcknowledgementSeconds: number | null;
  mitigationExecuted: false;
}

export interface ChallengeExplanationStage {
  title: string;
  status: string;
  detail: string;
}

export interface ChallengeAlertExplanation {
  version: "2";
  incidentId: string | null;
  runId: string;
  tenant: KaikuTenantId;
  status: string;
  severity: string | null;
  headline: string;
  summary: string;
  signal: ChallengeExplanationStage & {
    observedAt: SyntheticReplayMoment;
    topSignals: unknown;
  };
  decision: ChallengeExplanationStage & {
    risk: ChallengeRiskScore | null;
    suspectedIncidentType: string | null;
  };
  action: ChallengeExplanationStage & {
    responsePlan: ChallengeResponsePlan;
    executionAuthorized: false;
    approvalRequired: true;
  };
  operatorResponse: ChallengeOperatorResponse;
  verification: ChallengeExplanationStage & {
    checks: ChallengeVerificationCheck[];
  };
  timing: {
    signalToDetectionMeasurementValid: true;
    signalToDetectionSeconds: number;
    signalToActionSeconds: null;
    signalToRecoverySeconds: null;
    deliveryToAcknowledgementSeconds: number | null;
    clocksAreComparable: false;
  };
  impact: {
    label: "potential_not_observed" | "not_applicable";
    customerImpactObserved: false;
    detail: string;
  };
  nextStep: string;
  evidenceEventIds: number[];
  limitations: string[];
}

export interface ChallengeShowcase {
  version: "challenge-kaiku-guided-showcase-v1";
  status: "passed";
  scope: string;
  company: {
    tenant: KaikuTenantId;
    business: "tienda en línea";
    criticalFlow: string;
  };
  representativeCase: {
    runId: string;
    signalAt: SyntheticReplayMoment;
    detectedAt: SyntheticReplayMoment;
    signalToDetectionSeconds: number;
    risk: ChallengeRiskScore;
    suspectedIncidentType: string;
    modelVersion: string;
    evidence: ChallengeEvidence;
    recommendedAction: string;
    responsePlan: ChallengeResponsePlan;
    businessInterpretation: string;
  };
  falseAlarmControl: {
    knownEventAlertsWithContext: number;
    knownEventAlertsWithoutContext: number;
    interpretation: string;
  };
  claimBoundary: {
    officialGroundTruthUsed: false;
    representativeAlertConfirmedRealIncident: false;
    customerImpactObserved: false;
    rootCauseDemonstrated: false;
    mitigationExecuted: false;
    recoveryVerified: false;
  };
}

export interface ChallengeAcknowledgement {
  outboxAlertId: number;
  eventId: number;
  runId: string;
  tenant: KaikuTenantId;
  state: "acknowledged";
  acknowledgedAt: OperatorWallClockMoment;
  deliveryToAcknowledgementSeconds: number;
  mitigationExecuted: false;
}

export interface ChallengeCursor {
  earliestId: number;
  latestId: number;
  retainedCount: number;
  durable: true;
}

export type ChallengeStreamUpdate =
  | {
    kind: "alert";
    cursor: number;
    alert: KaikuChallengeAlert;
  }
  | {
    kind: "acknowledgement";
    cursor: number;
    outboxAlertId: number;
    runId: string;
    tenant: KaikuTenantId;
    acknowledgedAt: OperatorWallClockMoment;
    deliveryToAcknowledgementSeconds: number;
    mitigationExecuted: false;
  };

export interface VerifiedChallengeArtifact {
  version: string;
  status: string;
  scope: string | null;
}
