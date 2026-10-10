import { createContext, useContext } from "react";
import type { KaikuChallengeDataSource } from "../domain/ports";

export const KaikuChallengeDataSourceContext = createContext<KaikuChallengeDataSource | null>(null);

export function useKaikuChallengeDataSource(): KaikuChallengeDataSource {
  const value = useContext(KaikuChallengeDataSourceContext);
  if (value === null) throw new Error("KaikuChallengeDataSourceContext no está configurado.");
  return value;
}
