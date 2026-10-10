import { z } from "zod";
import { createHttpClient, type HttpClientOptions } from "./httpClient";
import {
  challengeAcknowledgementSchema,
  challengeAlertSchema,
  challengeContractSchema,
  challengeCursorSchema,
  challengeExplanationSchema,
  challengeOperationsSchema,
  challengeIncidentInvestigationSchema,
  challengeIncidentInvestigationListSchema,
  challengeLiveReplaySchema,
  challengeLiveReplayRunsSchema,
  challengeReplayResultSchema,
  challengeShowcaseSchema,
  verifiedArtifactSchema,
  type ChallengeAcknowledgementDto,
  type ChallengeAlertDtoV1,
  type ChallengeContractDto,
  type ChallengeCursorDto,
  type ChallengeExplanationDto,
  type ChallengeOperationsDto,
  type ChallengeIncidentInvestigationDto,
  type ChallengeIncidentInvestigationListDto,
  type ChallengeLiveReplayDto,
  type ChallengeLiveReplayRunsDto,
  type ChallengeReplayResultDto,
  type ChallengeShowcaseDto,
  type VerifiedArtifactDto,
} from "./challengeBackendSchemas";

export type ChallengeAlertTypeFilter = "incident_risk" | "data_quality_alert" | "all";

export interface ChallengeAlertRequest {
  afterId?: number;
  limit?: number;
  runId?: string;
  alertType?: ChallengeAlertTypeFilter;
}

export interface ChallengeBackendApi {
  getContract(signal?: AbortSignal): Promise<ChallengeContractDto>;
  listLiveReplayRuns(signal?: AbortSignal): Promise<ChallengeLiveReplayRunsDto>;
  replayRun(runId: string, adminToken: string, signal?: AbortSignal): Promise<ChallengeReplayResultDto>;
  startLiveReplay(
    runId: string,
    speedMinutesPerSecond: number,
    telemetryIntervalMinutes: number,
    signal?: AbortSignal,
  ): Promise<ChallengeLiveReplayDto>;
  getLiveReplay(sessionId: string, signal?: AbortSignal): Promise<ChallengeLiveReplayDto>;
  investigateIncident(incidentId: string, signal?: AbortSignal): Promise<ChallengeIncidentInvestigationDto>;
  listIncidentInvestigations(
    incidentId: string,
    signal?: AbortSignal,
  ): Promise<ChallengeIncidentInvestigationListDto>;
  listAlerts(query?: ChallengeAlertRequest, signal?: AbortSignal): Promise<ChallengeAlertDtoV1[]>;
  getAlertCursor(signal?: AbortSignal): Promise<ChallengeCursorDto>;
  getOperations(signal?: AbortSignal): Promise<ChallengeOperationsDto>;
  getShowcase(signal?: AbortSignal): Promise<ChallengeShowcaseDto>;
  getRehearsal(signal?: AbortSignal): Promise<VerifiedArtifactDto>;
  getDeployment(signal?: AbortSignal): Promise<VerifiedArtifactDto>;
  getAlertExplanation(eventId: number, signal?: AbortSignal): Promise<ChallengeExplanationDto>;
  acknowledgeAlert(
    outboxAlertId: number,
    adminToken: string,
    signal?: AbortSignal,
  ): Promise<ChallengeAcknowledgementDto>;
}

function withSignal(signal?: AbortSignal): Pick<RequestInit, "signal"> {
  return signal === undefined ? {} : { signal };
}

export function createChallengeBackendApi(options: HttpClientOptions): ChallengeBackendApi {
  const http = createHttpClient(options);

  return {
    getContract(signal) {
      return http.request("/api/challenge/contract", challengeContractSchema, withSignal(signal));
    },
    listLiveReplayRuns(signal) {
      return http.request(
        "/api/challenge/live-replay/runs",
        challengeLiveReplayRunsSchema,
        withSignal(signal),
      );
    },
    replayRun(runId, adminToken, signal) {
      return http.request("/api/challenge/replay", challengeReplayResultSchema, {
        method: "POST",
        ...(adminToken.trim().length > 0
          ? { headers: { "X-Admin-Token": adminToken } }
          : {}),
        body: JSON.stringify({ run_id: runId }),
        ...withSignal(signal),
      });
    },
    startLiveReplay(runId, speedMinutesPerSecond, telemetryIntervalMinutes, signal) {
      return http.request("/api/challenge/live-replay", challengeLiveReplaySchema, {
        method: "POST",
        body: JSON.stringify({
          run_id: runId,
          speed_minutes_per_second: speedMinutesPerSecond,
          telemetry_interval_minutes: telemetryIntervalMinutes,
        }),
        ...withSignal(signal),
      });
    },
    getLiveReplay(sessionId, signal) {
      const params = new URLSearchParams({ session_id: sessionId });
      return http.request(
        `/api/challenge/live-replay?${params.toString()}`,
        challengeLiveReplaySchema,
        withSignal(signal),
      );
    },
    investigateIncident(incidentId, signal) {
      return http.request(
        `/api/incidents/${encodeURIComponent(incidentId)}/investigate`,
        challengeIncidentInvestigationSchema,
        {
          method: "POST",
          body: JSON.stringify({
            question: "Resume para un administrador de TI qué ocurrió, qué tan urgente es y cuál es el siguiente paso seguro. Evita métricas internas crudas.",
            allow_external_ai: true,
          }),
          ...withSignal(signal),
        },
      );
    },
    listIncidentInvestigations(incidentId, signal) {
      return http.request(
        `/api/incidents/${encodeURIComponent(incidentId)}/investigations?limit=1`,
        challengeIncidentInvestigationListSchema,
        withSignal(signal),
      );
    },
    listAlerts(query = {}, signal) {
      const params = new URLSearchParams({
        after_id: String(query.afterId ?? 0),
        limit: String(query.limit ?? 100),
        tenant: "kaiku",
        alert_type: query.alertType ?? "all",
      });
      if (query.runId !== undefined) params.set("run_id", query.runId);
      return http.request(
        `/api/challenge/alerts?${params.toString()}`,
        z.array(challengeAlertSchema),
        withSignal(signal),
      );
    },
    getAlertCursor(signal) {
      return http.request("/api/challenge/alerts/cursor", challengeCursorSchema, withSignal(signal));
    },
    getOperations(signal) {
      return http.request("/api/challenge/operations", challengeOperationsSchema, withSignal(signal));
    },
    getShowcase(signal) {
      return http.request("/api/challenge/showcase", challengeShowcaseSchema, withSignal(signal));
    },
    getRehearsal(signal) {
      return http.request("/api/challenge/rehearsal", verifiedArtifactSchema, withSignal(signal));
    },
    getDeployment(signal) {
      return http.request("/api/challenge/deployment", verifiedArtifactSchema, withSignal(signal));
    },
    getAlertExplanation(eventId, signal) {
      return http.request(
        `/api/challenge/alerts/${encodeURIComponent(eventId)}/explanation`,
        challengeExplanationSchema,
        withSignal(signal),
      );
    },
    acknowledgeAlert(outboxAlertId, adminToken, signal) {
      return http.request(
        `/api/admin/alerts/${encodeURIComponent(outboxAlertId)}/acknowledge`,
        challengeAcknowledgementSchema,
        {
          method: "POST",
          ...(adminToken.trim().length > 0
            ? { headers: { "X-Admin-Token": adminToken } }
            : {}),
          ...withSignal(signal),
        },
      );
    },
  };
}
