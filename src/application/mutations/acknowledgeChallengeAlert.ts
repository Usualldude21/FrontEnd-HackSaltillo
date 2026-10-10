import type { ChallengeAcknowledgement } from "../../domain/kaikuChallenge";
import type { KaikuChallengeDataSource } from "../../domain/ports";
import { acknowledgeErrorMessage } from "./acknowledgeAlert";

export async function acknowledgeChallengeAlert(
  source: KaikuChallengeDataSource,
  outboxAlertId: number,
  adminToken: string,
  signal?: AbortSignal,
): Promise<ChallengeAcknowledgement> {
  return source.acknowledgeChallengeAlert(outboxAlertId, adminToken, signal);
}

export { acknowledgeErrorMessage as challengeAcknowledgementErrorMessage };
