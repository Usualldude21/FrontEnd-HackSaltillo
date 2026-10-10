import { useQuery } from "@tanstack/react-query";
import { Activity, ArrowRight, Database, Radio } from "lucide-react";
import { Link } from "react-router-dom";
import { readCurrentChallengeRun } from "../application/currentChallengeRun";
import { loadChallengeOverview } from "../application/queries/challengeOverview";
import { queryKeys } from "../application/queries/keys";
import { useKaikuChallengeDataSource } from "../app/useKaikuChallengeDataSource";
import type { KaikuChallengeAlert } from "../domain/kaikuChallenge";
import { OperationsCommandCenter } from "../features/challenge/OperationsCommandCenter";
import { ErrorState } from "../shared/ui/ErrorState";
import { Skeleton } from "../shared/ui/Skeleton";

export function OperationsPage() {
  const source = useKaikuChallengeDataSource();
  const overview = useQuery({
    queryKey: queryKeys.challengeOverview,
    queryFn: ({ signal }) => loadChallengeOverview(source, signal),
  });
  return (
    <section className="page operations-page" aria-labelledby="operations-title">
      <div className="operations-toolbar">
        <div>
          <h1 id="operations-title">Operación</h1>
          <p>La señal, la decisión y la evidencia que puede revisarse ahora.</p>
        </div>
      </div>

      {overview.isPending ? <OperationSkeleton /> : null}
      {overview.isError ? (
        <ErrorState
          message={overview.error instanceof Error
            ? overview.error.message
            : "No fue posible validar el contrato definitivo de Kaiku."}
          onRetry={() => { void overview.refetch(); }}
        />
      ) : null}
      {overview.data === undefined ? null : (
        <div className="operation-stack">
          <p aria-live="polite" className="sr-only">
            {overview.data.operations.alertCounts.open} alertas abiertas
          </p>
          {overview.data.alerts.length === 0 ? (
            <OperationsIdleState />
          ) : (
            <OperationsCommandCenter
              alerts={overview.data.alerts}
              runId={selectCurrentRunId(overview.data.alerts)}
            />
          )}
        </div>
      )}
    </section>
  );
}

function selectCurrentRunId(alerts: KaikuChallengeAlert[]): string {
  const storedRunId = readCurrentChallengeRun();
  if (storedRunId !== null && alerts.some((alert) => alert.runId === storedRunId)) {
    return storedRunId;
  }

  const latestRisk = [...alerts]
    .filter((alert) => alert.kind === "incident_risk")
    .sort((left, right) => right.eventId - left.eventId)[0];
  if (latestRisk !== undefined) return latestRisk.runId;

  return alerts.reduce((latest, alert) => (
    alert.eventId > latest.eventId ? alert : latest
  )).runId;
}

function OperationsIdleState() {
  return (
    <section aria-labelledby="operations-idle-title" className="operations-idle">
      <div className="operations-idle-status">
        <i aria-hidden="true" />
        <span>Sistema listo</span>
      </div>

      <div className="operations-idle-copy">
        <p className="section-label">Monitoreo en espera</p>
        <h2 id="operations-idle-title">Sin alertas activas</h2>
        <p>
          Sentinel está conectado y la cola comienza vacía. Inicia una corrida oficial para
          observar cómo aparecen las señales y las alertas sin resultados precargados.
        </p>
      </div>

      <div aria-label="Flujo de la demostración" className="operations-idle-flow">
        <article>
          <Database aria-hidden="true" size={18} />
          <span>01</span>
          <strong>Ingesta causal</strong>
          <small>Un minuto a la vez</small>
        </article>
        <article>
          <Activity aria-hidden="true" size={18} />
          <span>02</span>
          <strong>Detección</strong>
          <small>Sin mirar el futuro</small>
        </article>
        <article>
          <Radio aria-hidden="true" size={18} />
          <span>03</span>
          <strong>Alerta durable</strong>
          <small>Evidencia reproducible</small>
        </article>
      </div>

      <footer className="operations-idle-footer">
        <span>0 alertas precargadas</span>
        <Link className="button button-secondary" to="/replay">
          Abrir laboratorio <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </footer>
    </section>
  );
}

function OperationSkeleton() {
  return (
    <div aria-label="Validando contrato y operación de Kaiku" className="operation-stack" role="status">
      <Skeleton height="9rem" width="100%" />
      <Skeleton height="28rem" width="100%" />
      <Skeleton height="12rem" width="100%" />
    </div>
  );
}
