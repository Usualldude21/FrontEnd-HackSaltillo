import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { loadChallengeIncidentCase } from "../application/queries/challengeIncidentCases";
import { queryKeys } from "../application/queries/keys";
import { useKaikuChallengeDataSource } from "../app/useKaikuChallengeDataSource";
import { ChallengeRiskCaseDetail } from "../features/incidents/ChallengeRiskCaseDetail";
import { ErrorState } from "../shared/ui/ErrorState";
import { Skeleton } from "../shared/ui/Skeleton";

export function IncidentPage() {
  const { eventId: eventIdParam } = useParams();
  const source = useKaikuChallengeDataSource();
  const eventId = parseEventId(eventIdParam);
  const detail = useQuery({
    queryKey: queryKeys.challengeIncidentCase(eventId ?? 0),
    queryFn: ({ signal }) => {
      if (eventId === null) throw new Error("El identificador del evento no es válido.");
      return loadChallengeIncidentCase(source, eventId, signal);
    },
    enabled: eventId !== null,
  });

  if (eventId === null) {
    return (
      <section className="page">
        <ErrorState message="La ruta no contiene un eventId numérico válido." title="Caso de riesgo sin identificar" />
      </section>
    );
  }

  return (
    <section aria-labelledby="incident-title" className="page incident-page">
      <header className="page-heading incident-page-heading">
        <Link className="back-link" to="/incidentes"><ArrowLeft aria-hidden="true" size={16} />Volver a casos de riesgo</Link>
        <p className="eyebrow">Trazabilidad predictiva · Kaiku</p>
        <h2 id="incident-title">Evidencia del caso de riesgo</h2>
        <p>
          Vista del evento durable {eventId}. Distingue lo observado, lo inferido,
          lo recomendado y lo que todavía no ocurrió.
        </p>
      </header>

      {detail.isPending ? <IncidentDetailSkeleton /> : null}
      {detail.isError ? (
        <ErrorState
          message={detail.error instanceof Error ? detail.error.message : "No fue posible cargar el caso de riesgo."}
          onRetry={() => { void detail.refetch(); }}
        />
      ) : null}
      {detail.data === undefined ? null : (
        <ChallengeRiskCaseDetail alert={detail.data.alert} explanation={detail.data.explanation} />
      )}
    </section>
  );
}

function parseEventId(value: string | undefined): number | null {
  if (value === undefined || !/^\d+$/u.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function IncidentDetailSkeleton() {
  return (
    <div aria-label="Cargando caso de riesgo" className="incident-stack" role="status">
      <Skeleton height="11rem" width="100%" />
      <Skeleton height="14rem" width="100%" />
      <Skeleton height="18rem" width="100%" />
    </div>
  );
}
