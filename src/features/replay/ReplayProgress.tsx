import type { ChallengeReplay } from "../../domain/replay";
import { replayProgress } from "../../application/selectors/replay";
import { formatTimestamp } from "../../shared/format/operations";
import { Badge, type BadgeTone } from "../../shared/ui/Badge";

const statusPresentation: Record<ChallengeReplay["status"], { label: string; tone: BadgeTone }> = {
  queued: { label: "En cola", tone: "neutral" },
  running: { label: "En ejecución", tone: "info" },
  completed: { label: "Completado", tone: "success" },
  failed: { label: "Fallido", tone: "danger" },
  stopped: { label: "Detenido", tone: "warning" },
};

export function ReplayProgress({ replay }: { replay: ChallengeReplay }) {
  const progress = replayProgress(replay);
  const presentation = statusPresentation[replay.status];
  return (
    <section aria-labelledby="replay-progress-title" className="panel replay-progress-panel">
      <div className="panel-heading replay-progress-heading">
        <div>
          <p className="eyebrow">Estado remoto · {replay.id}</p>
          <h3 id="replay-progress-title">Progreso del replay</h3>
        </div>
        <Badge tone={presentation.tone}>{presentation.label}</Badge>
      </div>
      <div
        aria-label={`${progress}% procesado`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={progress}
        className="replay-progress-track"
        role="progressbar"
      >
        <span style={{ width: `${progress}%` }} />
      </div>
      <dl className="replay-facts">
        <div><dt>Progreso</dt><dd>{progress}%</dd></div>
        <div><dt>Filas</dt><dd>{replay.processedRows} de {replay.totalRows}</dd></div>
        <div><dt>Momento simulado</dt><dd>{formatTimestamp(replay.currentTimestamp)}</dd></div>
        <div><dt>Alertas emitidas</dt><dd>{replay.alertsCount}</dd></div>
      </dl>
      <p className="replay-source-note">El avance y el timestamp provienen de la respuesta del backend.</p>
    </section>
  );
}
