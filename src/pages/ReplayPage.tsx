import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ChevronDown, Play, RotateCcw } from "lucide-react";
import {
  validateChallengeRunId,
} from "../application/mutations/runChallengeReplay";
import { storeCurrentChallengeRun } from "../application/currentChallengeRun";
import { loadChallengeReplaySetup } from "../application/queries/challengeReplay";
import { queryKeys } from "../application/queries/keys";
import { useKaikuChallengeDataSource } from "../app/useKaikuChallengeDataSource";
import { ChallengeLiveReplayPanel } from "../features/replay/ChallengeReplayResult";
import { Button } from "../shared/ui/Button";
import { ErrorState } from "../shared/ui/ErrorState";
import { Skeleton } from "../shared/ui/Skeleton";

export function ReplayPage() {
  const source = useKaikuChallengeDataSource();
  const queryClient = useQueryClient();
  const [requestedRunId, setRequestedRunId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isRunPickerOpen, setIsRunPickerOpen] = useState(false);

  const setup = useQuery({
    queryKey: queryKeys.challengeReplaySetup,
    queryFn: ({ signal }) => loadChallengeReplaySetup(source, signal),
  });

  const runId = requestedRunId ?? setup.data?.showcase.representativeCase.runId ?? "";

  const startReplay = useMutation({
    mutationFn: () => source.startLiveReplay(runId, 600, 60),
    onSuccess: (result) => {
      storeCurrentChallengeRun(result.runId);
      setSessionId(result.sessionId);
    },
  });

  const liveReplay = useQuery({
    queryKey: ["challenge-live-replay", sessionId],
    enabled: sessionId !== null,
    queryFn: ({ signal }) => {
      if (sessionId === null) throw new Error("No existe una sesión de replay.");
      return source.getLiveReplay(sessionId, signal);
    },
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "completed" || status === "failed" || status === "stopped" ? false : 500;
    },
  });

  useEffect(() => {
    if (liveReplay.data?.status !== "completed") return;
    void Promise.all([
      queryClient.invalidateQueries({ queryKey: ["challenge-alerts"] }),
      queryClient.invalidateQueries({ queryKey: ["challenge-overview"] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.challengeHeaderOperations }),
      queryClient.invalidateQueries({ queryKey: ["challenge-explanation"] }),
      queryClient.invalidateQueries({ queryKey: ["challenge-incident-cases"] }),
      queryClient.invalidateQueries({ queryKey: ["challenge-incident-case"] }),
    ]);
  }, [liveReplay.data?.status, queryClient]);

  const runIdError = validateChallengeRunId(runId);
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (runIdError !== null || startReplay.isPending || isActive) return;
    setSessionId(null);
    startReplay.mutate();
  };
  const isActive = liveReplay.data?.status === "preparing" || liveReplay.data?.status === "running";

  return (
    <section aria-labelledby="replay-title" className="page replay-page">
      <header className="page-heading replay-heading">
        <div>
          <p className="eyebrow">Laboratorio reproducible · Kaiku</p>
          <h2 id="replay-title">Reproducir una corrida sintética oficial</h2>
          <p>
            Observa cómo el backend avanza minuto a minuto, emite hallazgos sin mirar el futuro
            y al terminar entrega el CSV que evaluaría el jurado.
          </p>
        </div>
      </header>

      {setup.isPending ? <ReplaySetupSkeleton /> : null}
      {setup.isError ? (
        <ErrorState
          message={setup.error instanceof Error
            ? setup.error.message
            : "No fue posible validar el contrato del laboratorio Kaiku."}
          onRetry={() => { void setup.refetch(); }}
        />
      ) : null}

      {setup.data === undefined ? null : (
        <div className="replay-stack">
          <p aria-live="polite" className="sr-only" role="status">
            {liveReplay.data === undefined
              ? "Laboratorio listo para reproducir una corrida autorizada."
              : `Corrida ${liveReplay.data.runId}: ${Math.round(liveReplay.data.progress * 100)} por ciento.`}
          </p>
          <form aria-labelledby="replay-controls-title" className="panel challenge-replay-form" onSubmit={submit}>
            <div>
              <p className="eyebrow">Entrada controlada</p>
              <h3 id="replay-controls-title">Ejecutar detector temprano</h3>
              <p>
                Elige una de las {setup.data.runs.length} corridas oficiales. Cada reproducción
                analiza su archivo Kaiku minuto a minuto y genera un resultado independiente.
              </p>
            </div>
            <div className="challenge-replay-control-grid">
              <div className="challenge-run-field">
                <span id="challenge-run-label">Corrida oficial</span>
                <div
                  className="challenge-run-picker"
                  onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) setIsRunPickerOpen(false);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Escape") setIsRunPickerOpen(false);
                  }}
                >
                  <button
                    aria-controls="challenge-run-options"
                    aria-describedby="run-id-help"
                    aria-expanded={isRunPickerOpen}
                    aria-haspopup="listbox"
                    aria-labelledby="challenge-run-label"
                    className="challenge-run-picker-trigger"
                    disabled={startReplay.isPending || isActive}
                    onClick={() => setIsRunPickerOpen((open) => !open)}
                    role="combobox"
                    type="button"
                  >
                    <span>{runId}</span>
                    <ChevronDown aria-hidden="true" size={17} />
                  </button>
                  {isRunPickerOpen ? (
                    <div className="challenge-run-options" id="challenge-run-options" role="listbox">
                      {setup.data.runs.map((availableRunId) => {
                        const selected = availableRunId === runId;
                        return (
                          <button
                            aria-selected={selected}
                            className={selected ? "challenge-run-option is-selected" : "challenge-run-option"}
                            key={availableRunId}
                            onClick={() => {
                              setRequestedRunId(availableRunId);
                              setSessionId(null);
                              startReplay.reset();
                              setIsRunPickerOpen(false);
                            }}
                            role="option"
                            type="button"
                          >
                            <span>{availableRunId}</span>
                            {selected ? <Check aria-hidden="true" size={15} /> : null}
                          </button>
                        );
                      })}
                    </div>
                  ) : null}
                </div>
              </div>
              <div className="replay-fixed-tenant">
                <span>Empresa</span>
                <strong>Kaiku</strong>
              </div>
              <Button disabled={runIdError !== null || startReplay.isPending || isActive} type="submit">
                {liveReplay.data === undefined
                  ? <Play aria-hidden="true" size={16} />
                  : <RotateCcw aria-hidden="true" size={16} />}
                {startReplay.isPending || isActive
                  ? "Reproduciendo…"
                  : liveReplay.data === undefined ? "Iniciar replay" : "Repetir replay"}
              </Button>
            </div>
            <p className={runIdError === null ? "replay-source-note" : "authorization-note"} id="run-id-help">
              {runIdError ?? `${setup.data.runs.length} corridas disponibles · sugerida para la demo: ${setup.data.showcase.representativeCase.runId}.`}
            </p>
            {startReplay.isError || liveReplay.isError ? (
              <p className="action-message action-message-error" role="alert">
                {(startReplay.error ?? liveReplay.error) instanceof Error
                  ? (startReplay.error ?? liveReplay.error)?.message
                  : "No fue posible ejecutar el replay en vivo."}
              </p>
            ) : null}
          </form>

          {liveReplay.data === undefined ? null : <ChallengeLiveReplayPanel replay={liveReplay.data} />}
        </div>
      )}
    </section>
  );
}

function ReplaySetupSkeleton() {
  return (
    <div aria-label="Validando laboratorio Kaiku" className="replay-stack" role="status">
      <Skeleton height="5rem" width="100%" />
      <Skeleton height="9rem" width="100%" />
      <Skeleton height="12rem" width="100%" />
    </div>
  );
}
