import type { KaikuChallengeAlert } from "../../domain/kaikuChallenge";
import {
  formatIdentifier,
  formatRiskScore,
  formatSyntheticTimestamp,
} from "../../shared/format/challenge";

interface ChallengeAlertLedgerProps {
  alerts: KaikuChallengeAlert[];
}

export function ChallengeAlertLedger({ alerts }: ChallengeAlertLedgerProps) {
  const visibleAlerts = [...alerts]
    .sort((left, right) => right.eventId - left.eventId)
    .slice(0, 5);

  return (
    <section aria-labelledby="challenge-ledger-title" className="panel challenge-ledger">
      <div className="panel-heading challenge-panel-heading">
        <div>
          <p className="eyebrow">Registro auditable</p>
          <h3 id="challenge-ledger-title">Alertas más recientes</h3>
        </div>
        <span className="badge badge-neutral">{alerts.length} cargadas</span>
      </div>
      {visibleAlerts.length === 0 ? (
        <p className="challenge-empty-ledger">Aún no hay alertas persistidas. Ejecuta una corrida desde el laboratorio.</p>
      ) : (
        <div className="alert-table-wrap">
          <table className="alert-table">
            <thead>
              <tr>
                <th>Evento</th>
                <th>Corrida</th>
                <th>Detección</th>
                <th>Clase</th>
                <th>Score</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {visibleAlerts.map((alert) => (
                <tr key={alert.eventId}>
                  <td data-label="Evento">#{alert.eventId}</td>
                  <td data-label="Corrida">{alert.runId}</td>
                  <td data-label="Detección">
                    <time dateTime={alert.detectedAt.value}>
                      {formatSyntheticTimestamp(alert.detectedAt.value)}
                    </time>
                  </td>
                  <td data-label="Clase">
                    {alert.kind === "incident_risk"
                      ? formatIdentifier(alert.suspectedIncidentType ?? "sin clasificar")
                      : "calidad de datos"}
                  </td>
                  <td data-label="Score">
                    {alert.kind === "incident_risk" ? formatRiskScore(alert.risk.value) : "No aplica"}
                  </td>
                  <td data-label="Estado">
                    <span className={`badge ${alert.state === "open" ? "badge-warning" : "badge-success"}`}>
                      {alert.state === "open" ? "Abierta" : "Reconocida"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
