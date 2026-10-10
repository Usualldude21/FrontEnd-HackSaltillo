import type { ChallengeContract, ChallengeShowcase } from "../../domain/kaikuChallenge";
import type { KaikuChallengeDataSource } from "../../domain/ports";

export interface ChallengeReplaySetup {
  contract: ChallengeContract;
  showcase: ChallengeShowcase;
  runs: string[];
}

/** The verified showcase is requested only after the frozen contract validates. */
export async function loadChallengeReplaySetup(
  source: KaikuChallengeDataSource,
  signal?: AbortSignal,
): Promise<ChallengeReplaySetup> {
  const contract = await source.getContract(signal);
  const [showcase, runs] = await Promise.all([
    source.getChallengeShowcase(signal),
    source.listLiveReplayRuns(signal),
  ]);
  if (!runs.includes(showcase.representativeCase.runId)) {
    throw new Error("La corrida representativa no está disponible en el catálogo oficial.");
  }
  return { contract, showcase, runs };
}
