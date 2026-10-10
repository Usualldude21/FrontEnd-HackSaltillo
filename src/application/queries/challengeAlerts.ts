import type { ChallengeContract, KaikuChallengeAlert } from "../../domain/kaikuChallenge";
import type { ChallengeAlertQuery, KaikuChallengeDataSource } from "../../domain/ports";

export interface ChallengeAlertQueue {
  contract: ChallengeContract;
  alerts: KaikuChallengeAlert[];
}

/** The queue is not loaded until the frozen Kaiku contract validates. */
export async function loadChallengeAlertQueue(
  source: KaikuChallengeDataSource,
  query: ChallengeAlertQuery,
  signal?: AbortSignal,
): Promise<ChallengeAlertQueue> {
  const contract = await source.getContract(signal);
  const alerts = await source.listChallengeAlerts(query, signal);
  return { contract, alerts };
}
