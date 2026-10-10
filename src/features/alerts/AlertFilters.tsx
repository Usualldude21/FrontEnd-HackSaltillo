import type { SentinelAlert } from "../../domain/alert";
import type { AlertFilters as AlertFilterValues } from "../../application/selectors/alerts";

interface AlertFiltersProps {
  alerts: readonly SentinelAlert[];
  filters: AlertFilterValues;
  onChange: (filters: AlertFilterValues) => void;
}

export function AlertFilters({ alerts, filters, onChange }: AlertFiltersProps) {
  const runs = [...new Set(alerts.flatMap((alert) => alert.runId === null ? [] : [alert.runId]))].sort();
  const hasUnassignedRun = alerts.some((alert) => alert.runId === null);

  return (
    <fieldset className="alert-filters">
      <legend>Filtrar cola</legend>
      <label>
        Estado
        <select
          onChange={(event) => onChange({ ...filters, state: event.target.value as AlertFilterValues["state"] })}
          value={filters.state}
        >
          <option value="all">Todos</option>
          <option value="open">Abiertas</option>
          <option value="acknowledged">Reconocidas</option>
          <option value="resolved">Resueltas</option>
        </select>
      </label>
      <label>
        Severidad
        <select
          onChange={(event) => onChange({ ...filters, severity: event.target.value as AlertFilterValues["severity"] })}
          value={filters.severity}
        >
          <option value="all">Todas</option>
          <option value="critical">Crítica</option>
          <option value="warning">Advertencia</option>
          <option value="watch">Observación</option>
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
          {hasUnassignedRun ? <option value="unassigned">Sin corrida</option> : null}
        </select>
      </label>
    </fieldset>
  );
}
