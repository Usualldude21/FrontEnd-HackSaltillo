import { useQuery } from "@tanstack/react-query";
import { loadChallengeIncidentCases } from "../application/queries/challengeIncidentCases";
import { queryKeys } from "../application/queries/keys";
import { useKaikuChallengeDataSource } from "../app/useKaikuChallengeDataSource";
import { ChallengeRiskCaseList } from "../features/incidents/ChallengeRiskCaseList";
import { EmptyState } from "../shared/ui/EmptyState";
import { ErrorState } from "../shared/ui/ErrorState";
import { Skeleton } from "../shared/ui/Skeleton";

export function IncidentsPage() {
  const source = useKaikuChallengeDataSource();
  const cases = useQuery({
    queryKey: queryKeys.challengeIncidentCases,
    queryFn: ({ signal }) => loadChallengeIncidentCases(source, signal),
  });

  return (
    <section aria-labelledby="incidents-title" className="page incidents-page">
      <header className="page-heading">
        <p className="eyebrow">Riesgo predictivo · Kaiku</p>
        <h2 id="incidents-title">Casos de riesgo</h2>
        <p>
          Alertas predictivas que ameritan investigación. No son incidentes confirmados:
          muestran evidencia, tiempo de detección y el siguiente paso permitido.
        </p>
      </header>
      {cases.isPending ? <Skeleton height="12rem" width="100%" /> : null}
      {cases.isError ? (
        <ErrorState
          message={cases.error instanceof Error ? cases.error.message : "No fue posible cargar los casos de riesgo."}
          onRetry={() => { void cases.refetch(); }}
        />
      ) : null}
      {cases.data?.cases.length === 0 ? (
        <EmptyState
          description="El backend no devolvió alertas incident_risk. Las alertas de calidad permanecen separadas en la cola."
          title="Sin casos de riesgo"
        />
      ) : null}
      {cases.data === undefined || cases.data.cases.length === 0
        ? null
        : <ChallengeRiskCaseList cases={cases.data.cases} />}
    </section>
  );
}
