import type { SentinelDataSource } from "../../domain/ports";
import { createChallengeDataSource } from "../api/challengeApi";

export function createContractDataSource(baseUrl = "/"): SentinelDataSource {
  return createChallengeDataSource({ baseUrl });
}
