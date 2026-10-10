import { CheckCircle2, Download, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import type { ChallengeLiveReplayStatus, ChallengeReplayResult } from "../../domain/kaikuChallenge";
import { Badge } from "../../shared/ui/Badge";

export function ChallengeReplayResultPanel({ result }: { result: ChallengeReplayResult }) {
  const idempotentReplay = result.newAlerts === 0 && result.existingAlerts > 0;

  return (
    <section aria-labelledby="challenge-replay-result-title" className="panel challenge-replay-result">
      <div className="panel-heading challenge-panel-heading">
        <div>
          <p className="eyebrow">Resultado persistido · {result.runId}</p>
          <h3 id="challenge-replay-result-title">Corrida procesada</h3>
        </div>
        <Badge tone={idempotentReplay ? "neutral" : "success"}>
          <CheckCircle2 aria-hidden="true" size={15} />
          {idempotentReplay ? "Resultado existente" : "Procesamiento completado"}
        </Badge>
      </div>

      <dl className="challenge-replay-stats">
        <div><dt>Filas procesadas</dt><dd>{result.rowsProcessed}</dd></div>
        <div><dt>Riesgos detectados</dt><dd>{result.incidentAlerts}</dd></div>
        <div><dt>Alertas de calidad</dt><dd>{result.dataQualityAlerts}</dd></div>
        <div><dt>Alertas nuevas</dt><dd>{result.newAlerts}</dd></div>
        <div><dt>Alertas existentes</dt><dd>{result.existingAlerts}</dd></div>
        <div><dt>Tiempo del backend</dt><dd>{formatElapsed(result.elapsedMilliseconds)}</dd></div>
      </dl>

      <div className="challenge-replay-links">
        <Link className="button button-secondary" to="/alertas">
          Revisar alertas <ExternalLink aria-hidden="true" size={15} />
        </Link>
        <Link className="button button-ghost" to="/operacion">
          Ver evidencia operativa <ExternalLink aria-hidden="true" size={15} />
        </Link>
      </div>
    </section>
  );
}

export function ChallengeLiveReplayPanel({ replay }: { replay: ChallengeLiveReplayStatus }) {
  const percentage = Math.round(replay.progress * 100);
  const complete = replay.status === "completed";
  return (
    <section aria-labelledby="live-replay-result-title" className="panel challenge-replay-result">
      <div className="panel-heading challenge-panel-heading">
        <div>
          <p className="eyebrow">Replay en vivo · {replay.runId}</p>
          <h3 id="live-replay-result-title">{complete ? "Corrida completada" : "Detector recorriendo la corrida"}</h3>
        </div>
        <Badge tone={complete ? "success" : "neutral"}>
          {complete ? <CheckCircle2 aria-hidden="true" size={15} /> : null}
          {complete ? "CSV listo" : `${percentage}%`}
        </Badge>
      </div>
      <div
        aria-label={`${percentage}% procesado`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percentage}
        className="challenge-live-progress"
        role="progressbar"
      >
        <span style={{ width: `${percentage}%` }} />
      </div>
      <dl className="challenge-replay-stats challenge-live-stats">
        <div><dt>Filas recorridas</dt><dd>{replay.rowsProcessed.toLocaleString("es-MX")} / {replay.totalRows.toLocaleString("es-MX")}</dd></div>
        <div><dt>Riesgos operativos</dt><dd>{replay.incidentAlerts}</dd></div>
        <div><dt>Cortes de telemetría</dt><dd>{replay.dataQualityAlerts}</dd></div>
        <div><dt>Tiempo sintético</dt><dd>{replay.currentTimestamp === null ? "Preparando" : formatReplayTime(replay.currentTimestamp)}</dd></div>
      </dl>
      <div className="challenge-replay-links">
        {complete ? (
          <a className="button button-primary" download href={`/api/challenge/live-replay/${encodeURIComponent(replay.sessionId)}/submission`}>
            Descargar CSV evaluable <Download aria-hidden="true" size={15} />
          </a>
        ) : null}
        <Link className="button button-secondary" to="/alertas">
          Ver alertas emitidas <ExternalLink aria-hidden="true" size={15} />
        </Link>
      </div>
    </section>
  );
}

function formatReplayTime(value: string): string {
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? value
    : new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(parsed);
}

function formatElapsed(milliseconds: number): string {
  if (milliseconds < 1_000) {
    return `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 1 }).format(milliseconds)} ms`;
  }
  return `${new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(milliseconds / 1_000)} s`;
}
