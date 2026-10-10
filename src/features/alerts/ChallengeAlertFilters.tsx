import type { KaikuChallengeAlert } from "../../domain/kaikuChallenge";
import type { ChallengeAlertFilters as FilterValues } from "../../application/selectors/challengeAlerts";

interface ChallengeAlertFiltersProps {
  alerts: readonly KaikuChallengeAlert[];
  filters: FilterValues;
  onChange: (filters: FilterValues) => void;
}

export function ChallengeAlertFilters({ alerts, filters, onChange }: ChallengeAlertFiltersProps) {
  const runs = [...new Set(alerts.map((alert) => alert.runId))].sort();

  return (
    <fieldset className="alert-filters">
      <legend>Filtrar cola</legend>
      <label>
        Estado
        <select
          onChange={(event) => onChange({ ...filters, state: event.target.value as FilterValues["state"] })}
          value={filters.state}
        >
          <option value="all">Todos</option>
          <option value="open">Abiertas</option>
          <option value="acknowledged">Reconocidas</option>
        </select>
      </label>
      <label>
        Clase
        <select
          onChange={(event) => onChange({ ...filters, kind: event.target.value as FilterValues["kind"] })}
          value={filters.kind}
        >
          <option value="all">Todas</option>
          <option value="incident_risk">Riesgo de incidente</option>
          <option value="data_quality_alert">Calidad de datos</option>
        </select>
      </label>
      <label>
        Corrida
        <select
          onChange={(event) => onChange({ ...filters, runId: event.target.value })}
          value={filters.runId}
        >
          <option value="all">Todas</option>
          {runs.map((run) => <option key={run} value={run}>{run}</option>)}
        </select>
      </label>
    </fieldset>
  );
}
