import type { KaikuChallengeDataSource } from "../../domain/ports";
import { createChallengeBackendApi } from "./challengeBackendApi";
import type { HttpClientOptions } from "./httpClient";
import {
  mapChallengeAcknowledgement,
  mapChallengeAlert,
  mapChallengeContract,
  mapChallengeCursor,
  mapChallengeExplanation,
  mapChallengeOperations,
  mapChallengeRemediationOverview,
  mapChallengeIncidentInvestigation,
  mapChallengeLiveReplay,
  mapChallengeReplayResult,
  mapChallengeShowcase,
  mapVerifiedArtifact,
} from "./challengeBackendMappers";

export function createKaikuChallengeDataSource(
  options: HttpClientOptions,
): KaikuChallengeDataSource {
  const api = createChallengeBackendApi(options);
  return {
    async getContract(signal) {
      return mapChallengeContract(await api.getContract(signal));
    },
    async listLiveReplayRuns(signal) {
      const catalog = await api.listLiveReplayRuns(signal);
      return [...catalog.runs];
    },
    async replayRun(runId, adminToken, signal) {
      return mapChallengeReplayResult(await api.replayRun(runId, adminToken, signal));
    },
    async startLiveReplay(runId, speedMinutesPerSecond, telemetryIntervalMinutes, signal) {
      return mapChallengeLiveReplay(
        await api.startLiveReplay(
          runId,
          speedMinutesPerSecond,
          telemetryIntervalMinutes,
          signal,
        ),
      );
    },
    async getLiveReplay(sessionId, signal) {
      return mapChallengeLiveReplay(await api.getLiveReplay(sessionId, signal));
    },
    async investigateChallengeIncident(incidentId, signal) {
      return mapChallengeIncidentInvestigation(await api.investigateIncident(incidentId, signal));
    },
    async getLatestChallengeInvestigation(incidentId, signal) {
      const records = await api.listIncidentInvestigations(incidentId, signal);
      return records[0] === undefined
        ? null
        : mapChallengeIncidentInvestigation(records[0].diagnosis);
    },
    async listChallengeAlerts(query, signal) {
      return (await api.listAlerts(query, signal)).map(mapChallengeAlert);
    },
    async getChallengeCursor(signal) {
      return mapChallengeCursor(await api.getAlertCursor(signal));
    },
    async getChallengeOperations(signal) {
      return mapChallengeOperations(await api.getOperations(signal));
    },
    async getChallengeRemediations(signal) {
      return mapChallengeRemediationOverview(await api.getRemediations(signal));
    },
    async getChallengeShowcase(signal) {
      return mapChallengeShowcase(await api.getShowcase(signal));
    },
    async getChallengeRehearsal(signal) {
      return mapVerifiedArtifact(await api.getRehearsal(signal));
    },
    async getChallengeDeployment(signal) {
      return mapVerifiedArtifact(await api.getDeployment(signal));
    },
    async getChallengeExplanation(eventId, signal) {
      return mapChallengeExplanation(await api.getAlertExplanation(eventId, signal));
    },
    async acknowledgeChallengeAlert(outboxAlertId, adminToken, signal) {
      return mapChallengeAcknowledgement(
        await api.acknowledgeAlert(outboxAlertId, adminToken, signal),
      );
    },
  };
}
