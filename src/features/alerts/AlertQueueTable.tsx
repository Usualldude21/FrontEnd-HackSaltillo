import type { SentinelAlert } from "../../domain/alert";
import { formatConfidence, formatTimestamp } from "../../shared/format/operations";
import { Button } from "../../shared/ui/Button";
import { DataQualityBadge } from "../../shared/ui/DataQualityBadge";
import { AlertSeverityBadge, AlertStateBadge } from "./AlertBadges";

interface AlertQueueTableProps {
  alerts: readonly SentinelAlert[];
  onSelect: (id: string) => void;
  selectedId: string | null;
}

export function AlertQueueTable({ alerts, onSelect, selectedId }: AlertQueueTableProps) {
  return (
    <div className="alert-table-wrap">
      <table className="alert-table">
        <caption className="sr-only">Cola de alertas priorizada</caption>
        <thead>
          <tr>
            <th scope="col">Señal</th>
            <th scope="col">Confianza</th>
            <th scope="col">Tipo</th>
            <th scope="col">Evidencia</th>
            <th scope="col">Calidad</th>
            <th scope="col">Estado</th>
            <th scope="col"><span className="sr-only">Acción</span></th>
          </tr>
        </thead>
        <tbody>
          {alerts.map((alert) => (
            <tr className={selectedId === alert.id ? "alert-row-selected" : ""} key={alert.id}>
              <td data-label="Señal"><time dateTime={alert.timestamp}>{formatTimestamp(alert.timestamp)}</time></td>
              <td data-label="Confianza">{formatConfidence(alert.confidence)}</td>
              <td data-label="Tipo">
                <AlertSeverityBadge severity={alert.severity} />
                <span>{alert.incidentType ?? "Sin tipo declarado"}</span>
              </td>
              <td data-label="Evidencia">{alert.evidence[0]?.feature ?? "Sin evidencia"}</td>
              <td data-label="Calidad"><DataQualityBadge quality={alert.dataQuality} /></td>
              <td data-label="Estado"><AlertStateBadge state={alert.state} /></td>
              <td className="alert-row-action">
                <Button
                  aria-pressed={selectedId === alert.id}
                  onClick={() => onSelect(alert.id)}
                  variant="secondary"
                >
                  Ver resumen
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
