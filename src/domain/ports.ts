import type { SentinelAlert } from "./alert";
import type { BackendCapabilities, BackendStatus } from "./backend";
import type { TimelineEvent } from "./event";
import type { Incident } from "./incident";
import type { ChallengeRun } from "./run";
import type { ChallengeReplay, StartReplayInput } from "./replay";
import type { TelemetryPoint } from "./telemetry";
import type { Tenant, TenantId } from "./tenant";
import type {
  ChallengeAcknowledgement,
  ChallengeAlertExplanation,
  ChallengeContract,
  ChallengeCursor,
  ChallengeOperations,
  ChallengeIncidentInvestigation,
  ChallengeLiveReplayStatus,
  ChallengeReplayResult,
  ChallengeRemediationOverview,
  ChallengeShowcase,
  ChallengeStreamUpdate,
  KaikuChallengeAlert,
  VerifiedChallengeArtifact,
} from "./kaikuChallenge";

export interface ChallengeAlertQuery {
  runId?: string;
  afterId?: number;
  limit?: number;
  alertType?: "incident_risk" | "data_quality_alert" | "all";
}

/** Definitive Kaiku-only port backed by the frozen challenge API. */
export interface KaikuChallengeDataSource {
  getContract(signal?: AbortSignal): Promise<ChallengeContract>;
  listLiveReplayRuns(signal?: AbortSignal): Promise<string[]>;
  replayRun(runId: string, adminToken: string, signal?: AbortSignal): Promise<ChallengeReplayResult>;
  startLiveReplay(
    runId: string,
    speedMinutesPerSecond: number,
    telemetryIntervalMinutes: number,
    signal?: AbortSignal,
  ): Promise<ChallengeLiveReplayStatus>;
  getLiveReplay(sessionId: string, signal?: AbortSignal): Promise<ChallengeLiveReplayStatus>;
  investigateChallengeIncident(
    incidentId: string,
    signal?: AbortSignal,
  ): Promise<ChallengeIncidentInvestigation>;
  getLatestChallengeInvestigation(
    incidentId: string,
    signal?: AbortSignal,
  ): Promise<ChallengeIncidentInvestigation | null>;
  listChallengeAlerts(
    query?: ChallengeAlertQuery,
    signal?: AbortSignal,
  ): Promise<KaikuChallengeAlert[]>;
  getChallengeCursor(signal?: AbortSignal): Promise<ChallengeCursor>;
  getChallengeOperations(signal?: AbortSignal): Promise<ChallengeOperations>;
  getChallengeRemediations(signal?: AbortSignal): Promise<ChallengeRemediationOverview>;
  getChallengeShowcase(signal?: AbortSignal): Promise<ChallengeShowcase>;
  getChallengeRehearsal(signal?: AbortSignal): Promise<VerifiedChallengeArtifact>;
  getChallengeDeployment(signal?: AbortSignal): Promise<VerifiedChallengeArtifact>;
  getChallengeExplanation(
    eventId: number,
    signal?: AbortSignal,
  ): Promise<ChallengeAlertExplanation>;
  acknowledgeChallengeAlert(
    outboxAlertId: number,
    adminToken: string,
    signal?: AbortSignal,
  ): Promise<ChallengeAcknowledgement>;
}

export interface ChallengeStreamCallbacks {
  onOpen: () => void;
  onUpdate: (update: ChallengeStreamUpdate) => void;
  onHeartbeat: (cursor: number) => void;
}

export interface KaikuChallengeStreamSource {
  getCursor(signal?: AbortSignal): Promise<number>;
  streamUpdates(
    afterId: number,
    callbacks: ChallengeStreamCallbacks,
    signal?: AbortSignal,
  ): Promise<void>;
}

export interface TelemetryQuery {
  runId: string;
  tenant: TenantId;
  from?: string;
  to?: string;
  limit?: number;
}

export interface AlertQuery {
  runId?: string;
  tenant?: TenantId;
  state?: "open" | "acknowledged" | "resolved";
  afterId?: number;
  limit?: number;
}

export interface SentinelDataSource {
  getBackendStatus(signal?: AbortSignal): Promise<BackendStatus>;
  getCapabilities(signal?: AbortSignal): Promise<BackendCapabilities>;
  listTenants(signal?: AbortSignal): Promise<Tenant[]>;
  listRuns(signal?: AbortSignal): Promise<ChallengeRun[]>;
  listTelemetry(query: TelemetryQuery, signal?: AbortSignal): Promise<TelemetryPoint[]>;
  listAlerts(query?: AlertQuery, signal?: AbortSignal): Promise<SentinelAlert[]>;
  listIncidents(signal?: AbortSignal): Promise<Incident[]>;
  getIncident(id: string, signal?: AbortSignal): Promise<Incident>;
  listIncidentEvents(id: string, signal?: AbortSignal): Promise<TimelineEvent[]>;
  acknowledgeAlert(id: string, adminToken: string, signal?: AbortSignal): Promise<void>;
  startReplay(input: StartReplayInput, adminToken: string, signal?: AbortSignal): Promise<ChallengeReplay>;
  getReplay(id: string, signal?: AbortSignal): Promise<ChallengeReplay>;
  stopReplay(id: string, adminToken: string, signal?: AbortSignal): Promise<ChallengeReplay>;
}

export interface EventStreamCallbacks {
  onOpen: () => void;
  onEvent: (event: TimelineEvent) => void;
  onHeartbeat: (cursor: number) => void;
}

export interface EventStreamSource {
  getEventCursor(signal?: AbortSignal): Promise<number>;
  listEvents(afterId: number, signal?: AbortSignal): Promise<TimelineEvent[]>;
  streamEvents(
    afterId: number,
    callbacks: EventStreamCallbacks,
    signal?: AbortSignal,
  ): Promise<void>;
}
