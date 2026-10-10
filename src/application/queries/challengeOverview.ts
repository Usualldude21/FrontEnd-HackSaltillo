import type {
  ChallengeContract,
  ChallengeOperations,
  ChallengeRemediationOverview,
  ChallengeShowcase,
  KaikuChallengeAlert,
} from "../../domain/kaikuChallenge";
import type { KaikuChallengeDataSource } from "../../domain/ports";

export interface ChallengeOverview {
  contract: ChallengeContract;
  operations: ChallengeOperations;
  remediations: ChallengeRemediationOverview;
  showcase: ChallengeShowcase;
  alerts: KaikuChallengeAlert[];
}

/**
 * The contract request is intentionally sequential: no challenge payload is trusted
 * until the frozen Kaiku delivery contract has validated successfully.
 */
export async function loadChallengeOverview(
  source: KaikuChallengeDataSource,
  signal?: AbortSignal,
): Promise<ChallengeOverview> {
  const contract = await source.getContract(signal);
  const [operations, remediations, showcase, alerts] = await Promise.all([
    source.getChallengeOperations(signal),
    source.getChallengeRemediations(signal),
    source.getChallengeShowcase(signal),
    source.listChallengeAlerts({ alertType: "all", limit: 1_000 }, signal),
  ]);
  return { contract, operations, remediations, showcase, alerts };
}
