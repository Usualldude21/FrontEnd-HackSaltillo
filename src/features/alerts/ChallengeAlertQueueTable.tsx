import type { KaikuChallengeAlert } from "../../domain/kaikuChallenge";
import {
  formatDuration,
  formatIncidentType,
  formatRiskScore,
  formatSyntheticTimestamp,
} from "../../shared/format/challenge";
import { Button } from "../../shared/ui/Button";
import {
  ChallengePriorityBadge,
  ChallengeStateBadge,
} from "./ChallengeAlertBadges";

interface ChallengeAlertQueueTableProps {
  alerts: readonly KaikuChallengeAlert[];
  onSelect: (eventId: number) => void;
  selectedEventId: number | null;
}

export function ChallengeAlertQueueTable({
  alerts,
  onSelect,
  selectedEventId,
}: ChallengeAlertQueueTableProps) {
  return (
    <div className="alert-table-wrap">
      <table className="alert-table">
        <caption className="sr-only">Cola definitiva de alertas Kaiku</caption>
        <thead>
          <tr>
            <th scope="col">Hallazgo</th>
            <th scope="col">Detectado</th>
            <th scope="col">Tiempo ganado</th>
            <th scope="col">Prioridad</th>
            <th scope="col">Estado</th>
            <th scope="col"><span className="sr-only">Acción</span></th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr className={selectedEventId === alert.eventId ? "alert-row-selected" : ""} key={alert.eventId}>
              <td data-label="Hallazgo">
                <strong>{alert.kind === "incident_risk"
                  ? formatIncidentType(alert.suspectedIncidentType)
                  : "Interrupción de telemetría"}</strong>
                <span>{alert.kind === "incident_risk"
                  ? `Score ${formatRiskScore(alert.risk.value)} · ${alert.runId}`
                  : `${telemetryQualityLabel(alert.dataQuality)} · ${alert.runId}`}</span>
              </td>
              <td data-label="Detectado"><time dateTime={alert.detectedAt.value}>{formatSyntheticTimestamp(alert.detectedAt.value)}</time></td>
              <td data-label="Tiempo ganado">{formatDuration(alert.signalToDetectionSeconds)}</td>
              <td data-label="Prioridad"><ChallengePriorityBadge priority={alert.priority} /></td>
              <td data-label="Estado"><ChallengeStateBadge state={alert.state} /></td>
              <td className="alert-row-action">
                <Button
                  aria-pressed={selectedEventId === alert.eventId}
                  onClick={() => onSelect(alert.eventId)}
                  variant="secondary"
                >
                  {selectedEventId === alert.eventId ? "Ocultar" : "Revisar"}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function telemetryQualityLabel(quality: KaikuChallengeAlert["dataQuality"]): string {
  if (quality === "outage") return "Telemetría interrumpida";
  if (quality === "partial") return "Telemetría parcial";
  return "Telemetría validada";
}
