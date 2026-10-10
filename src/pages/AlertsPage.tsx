import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  acknowledgeChallengeAlert,
  challengeAcknowledgementErrorMessage,
} from "../application/mutations/acknowledgeChallengeAlert";
import { loadChallengeAlertQueue } from "../application/queries/challengeAlerts";
import { queryKeys } from "../application/queries/keys";
import {
  defaultChallengeAlertFilters,
  filterChallengeAlerts,
  type ChallengeAlertFilters as ChallengeAlertFilterValues,
} from "../application/selectors/challengeAlerts";
import { useKaikuChallengeDataSource } from "../app/useKaikuChallengeDataSource";
import { ChallengeAlertDetail } from "../features/alerts/ChallengeAlertDetail";
import { ChallengeAlertFilters } from "../features/alerts/ChallengeAlertFilters";
import { ChallengeAlertQueueTable } from "../features/alerts/ChallengeAlertQueueTable";
import { formatDuration } from "../shared/format/challenge";
import { EmptyState } from "../shared/ui/EmptyState";
import { ErrorState } from "../shared/ui/ErrorState";
import { Skeleton } from "../shared/ui/Skeleton";

const listQuery = { alertType: "all", limit: 1_000 } as const;

export function AlertsPage() {
  const source = useKaikuChallengeDataSource();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<ChallengeAlertFilterValues>(defaultChallengeAlertFilters);
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const alertsQuery = useQuery({
    queryKey: queryKeys.challengeAlerts(listQuery),
    queryFn: ({ signal }) => loadChallengeAlertQueue(source, listQuery, signal),
  });

  const allAlerts = useMemo(() => alertsQuery.data?.alerts ?? [], [alertsQuery.data]);
  const visibleAlerts = useMemo(
    () => filterChallengeAlerts(allAlerts, filters),
    [allAlerts, filters],
  );
  const selectedAlert = visibleAlerts.find((alert) => alert.eventId === selectedEventId) ?? null;

  const explanationQuery = useQuery({
    queryKey: queryKeys.challengeExplanation(selectedAlert?.eventId ?? 0),
    enabled: selectedAlert !== null,
    queryFn: ({ signal }) => {
      if (selectedAlert === null) throw new Error("No hay una alerta seleccionada.");
      return source.getChallengeExplanation(selectedAlert.eventId, signal);
    },
  });

  const investigationQuery = useQuery({
    queryKey: queryKeys.challengeInvestigation(selectedAlert?.incidentId ?? "none"),
    enabled: selectedAlert?.incidentId !== null && selectedAlert?.incidentId !== undefined,
    queryFn: ({ signal }) => {
      if (selectedAlert?.incidentId === null || selectedAlert?.incidentId === undefined) return null;
      return source.getLatestChallengeInvestigation(selectedAlert.incidentId, signal);
    },
  });

  const investigation = useMutation({
    mutationFn: (incidentId: string) => source.investigateChallengeIncident(incidentId),
    onSuccess: (result) => {
      queryClient.setQueryData(queryKeys.challengeInvestigation(result.incidentId), result);
    },
  });

  const acknowledgement = useMutation({
    mutationFn: (outboxAlertId: number) => acknowledgeChallengeAlert(
      source,
      outboxAlertId,
      "",
    ),
    onMutate: () => {
      setFeedback(null);
    },
    onSuccess: (result) => {
      setFilters((current) => ({ ...current, state: "all" }));
      setFeedback(
        `Recepción registrada en ${formatDuration(result.deliveryToAcknowledgementSeconds)}. `
        + "La mitigación continúa sin ejecutarse.",
      );
    },
    onSettled: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["challenge-alerts"] }),
        queryClient.invalidateQueries({ queryKey: ["challenge-overview"] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.challengeHeaderOperations }),
        queryClient.invalidateQueries({ queryKey: ["challenge-incident-cases"] }),
        queryClient.invalidateQueries({ queryKey: ["challenge-incident-case"] }),
        selectedAlert === null
          ? Promise.resolve()
          : queryClient.invalidateQueries({
            queryKey: queryKeys.challengeExplanation(selectedAlert.eventId),
          }),
      ]);
    },
  });

  const selectAlert = (eventId: number) => {
    setSelectedEventId((current) => current === eventId ? null : eventId);
    setFeedback(null);
    acknowledgement.reset();
    investigation.reset();
  };

  const updateFilters = (nextFilters: ChallengeAlertFilterValues) => {
    setFilters(nextFilters);
    setSelectedEventId(null);
    setFeedback(null);
    acknowledgement.reset();
    investigation.reset();
  };

  const openCount = allAlerts.filter((alert) => alert.state === "open").length;
  const incidentCount = allAlerts.filter((alert) => alert.kind === "incident_risk").length;
  const telemetryCount = allAlerts.filter((alert) => alert.kind === "data_quality_alert").length;

  return (
    <section aria-labelledby="alerts-title" className="page alerts-page">
      <header className="page-heading alerts-heading">
        <div>
          <p className="eyebrow">Decisiones operativas · Kaiku</p>
          <h2 id="alerts-title">Alertas que requieren atención</h2>
          <p>
            Primero aparecen los riesgos operativos. Las interrupciones de telemetría se
            conservan aparte para no confundir falta de datos con un incidente.
          </p>
        </div>
        <dl className="alert-counts" aria-label="Resumen de la cola">
          <div><dt>Riesgos</dt><dd>{incidentCount}</dd></div>
          <div><dt>Telemetría</dt><dd>{telemetryCount}</dd></div>
          <div><dt>Abiertas</dt><dd>{openCount}</dd></div>
        </dl>
      </header>

      {alertsQuery.isPending ? <AlertQueueSkeleton /> : null}
      {alertsQuery.isError ? (
        <ErrorState
          message={alertsQuery.error instanceof Error
            ? alertsQuery.error.message
            : "No fue posible validar y cargar las alertas Kaiku."}
          onRetry={() => { void alertsQuery.refetch(); }}
        />
      ) : null}
      {!alertsQuery.isPending && !alertsQuery.isError && allAlerts.length === 0 ? (
        <EmptyState
          description="El backend definitivo aún no contiene alertas. Ejecuta una corrida sintética oficial desde el laboratorio."
          title="La cola está vacía"
        />
      ) : null}

      {!alertsQuery.isPending && !alertsQuery.isError && allAlerts.length > 0 ? (
        <div className="alerts-stack">
          <section aria-labelledby="queue-title" className="panel alert-queue-panel">
            <div className="panel-heading queue-heading">
              <div>
                <p className="eyebrow">Prioridad operativa</p>
                <h3 id="queue-title">
                  {filters.kind === "data_quality_alert" ? "Interrupciones de telemetría" : "Riesgos detectados"}
                </h3>
              </div>
              <span className="queue-result-count">{visibleAlerts.length} de {allAlerts.length}</span>
            </div>
            <ChallengeAlertFilters alerts={allAlerts} filters={filters} onChange={updateFilters} />
            {visibleAlerts.length === 0 ? (
              <EmptyState
                description="Modifica los filtros para volver a mostrar registros."
                title="No hay alertas con estos filtros"
              />
            ) : (
              <ChallengeAlertQueueTable
                alerts={visibleAlerts}
                onSelect={selectAlert}
                selectedEventId={selectedAlert?.eventId ?? null}
              />
            )}
          </section>

          {selectedAlert === null ? null : (
              <ChallengeAlertDetail
              alert={selectedAlert}
              explanation={explanationQuery.data}
              explanationError={explanationQuery.error}
              explanationPending={explanationQuery.isPending}
              feedback={feedback}
              isAcknowledging={acknowledgement.isPending}
              mutationError={acknowledgement.isError
                ? challengeAcknowledgementErrorMessage(acknowledgement.error)
                : null}
              onAcknowledge={() => {
                setSelectedEventId(selectedAlert.eventId);
                acknowledgement.mutate(selectedAlert.outboxAlertId);
              }}
              onRetryExplanation={() => { void explanationQuery.refetch(); }}
              investigation={investigationQuery.data ?? undefined}
              investigationError={investigation.isError ? investigation.error : investigationQuery.error}
              investigationPending={investigation.isPending || investigationQuery.isPending}
              onInvestigate={() => {
                if (selectedAlert.incidentId !== null) investigation.mutate(selectedAlert.incidentId);
              }}
            />
          )}
        </div>
      ) : null}
    </section>
  );
}

function AlertQueueSkeleton() {
  return (
    <div aria-label="Validando contrato y cargando alertas" className="alerts-stack" role="status">
      <Skeleton height="8rem" width="100%" />
      <Skeleton height="22rem" width="100%" />
    </div>
  );
}
