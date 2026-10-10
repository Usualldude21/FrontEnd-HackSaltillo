import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type PropsWithChildren } from "react";
import type { KaikuChallengeDataSource } from "../domain/ports";
import { KaikuChallengeDataSourceContext } from "./useKaikuChallengeDataSource";

interface AppProvidersProps extends PropsWithChildren {
  challengeDataSource: KaikuChallengeDataSource;
}

export function AppProviders({ challengeDataSource, children }: AppProvidersProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 15_000 },
      mutations: { retry: false },
    },
  }));

  return (
    <KaikuChallengeDataSourceContext.Provider value={challengeDataSource}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </KaikuChallengeDataSourceContext.Provider>
  );
}
