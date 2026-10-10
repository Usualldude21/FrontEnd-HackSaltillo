import type {
  ChallengeAlertExplanation,
  ChallengeContract,
  KaikuChallengeAlert,
} from "../../domain/kaikuChallenge";
import type { KaikuChallengeDataSource } from "../../domain/ports";
import { sortChallengeAlerts } from "../selectors/challengeAlerts";

export interface ChallengeIncidentCases {
  contract: ChallengeContract;
  cases: KaikuChallengeAlert[];
}

export interface ChallengeIncidentCaseDetail {
  contract: ChallengeContract;
  alert: KaikuChallengeAlert;
  explanation: ChallengeAlertExplanation;
}

const incidentCaseQuery = { alertType: "incident_risk", limit: 1_000 } as const;

/** Loads only predictive risk cases after the frozen Kaiku contract has validated. */
export async function loadChallengeIncidentCases(
  source: KaikuChallengeDataSource,
  signal?: AbortSignal,
): Promise<ChallengeIncidentCases> {
  const contract = await source.getContract(signal);
  const alerts = await source.listChallengeAlerts(incidentCaseQuery, signal);
  const cases = sortChallengeAlerts(alerts.filter((alert) => alert.kind === "incident_risk"));
  return { contract, cases };
}

/** Resolves a detail by durable event id, never by the optional incident correlation id. */
export async function loadChallengeIncidentCase(
  source: KaikuChallengeDataSource,
  eventId: number,
  signal?: AbortSignal,
): Promise<ChallengeIncidentCaseDetail> {
  const { contract, cases } = await loadChallengeIncidentCases(source, signal);
  const alert = cases.find((candidate) => candidate.eventId === eventId);
  if (alert === undefined) {
    throw new Error(`No existe un caso de riesgo Kaiku para el evento ${eventId}.`);
  }
  const explanation = await source.getChallengeExplanation(eventId, signal);
  if (explanation.runId !== alert.runId || explanation.tenant !== alert.tenant) {
    throw new Error("La explicación no corresponde al caso de riesgo solicitado.");
  }
  return { contract, alert, explanation };
}
