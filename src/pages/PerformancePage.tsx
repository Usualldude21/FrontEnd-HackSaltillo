import { useQuery } from "@tanstack/react-query";
import { loadChallengeOverview } from "../application/queries/challengeOverview";
import { queryKeys } from "../application/queries/keys";
import { useKaikuChallengeDataSource } from "../app/useKaikuChallengeDataSource";
import { ChallengePerformanceOverview } from "../features/challenge/ChallengePerformanceOverview";
import { ErrorState } from "../shared/ui/ErrorState";
import { Skeleton } from "../shared/ui/Skeleton";

export function PerformancePage() {
  const source = useKaikuChallengeDataSource();
  const overview = useQuery({
    queryKey: queryKeys.challengeOverview,
    queryFn: ({ signal }) => loadChallengeOverview(source, signal),
  });

  return (
    <section aria-labelledby="performance-page-title" className="page performance-page">
      <div className="performance-page-heading">
        <div>
          <h1 id="performance-page-title">Rendimiento</h1>
          <p>Qué detectó Sentinel, cuánto tardó y cuánto ruido evitó.</p>
        </div>
      </div>
      {overview.isPending ? <Skeleton height="28rem" width="100%" /> : null}
      {overview.isError ? (
        <ErrorState
          message={overview.error instanceof Error ? overview.error.message : "No fue posible cargar el rendimiento."}
          onRetry={() => { void overview.refetch(); }}
        />
      ) : null}
      {overview.data === undefined ? null : (
        <ChallengePerformanceOverview
          operations={overview.data.operations}
          showcase={overview.data.showcase}
        />
      )}
    </section>
  );
}
