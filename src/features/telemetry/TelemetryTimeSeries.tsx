import { useMemo, useState } from "react";
import type { TooltipContentProps } from "recharts";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  downsampleTelemetry,
  filterTelemetryByRange,
  type TelemetryRange,
} from "../../application/selectors/telemetryVisualization";
import type { SentinelAlert } from "../../domain/alert";
import type { TelemetryPoint } from "../../domain/telemetry";
import { formatMetric } from "../../shared/format/operations";
import { EmptyState } from "../../shared/ui/EmptyState";

interface TelemetryTimeSeriesProps {
  alerts: readonly SentinelAlert[];
  points: readonly TelemetryPoint[];
  tenantName: string;
}

interface ChartRow extends TelemetryPoint {
  time: number;
}

type MetricKey = "cpu" | "ram" | "disk" | "latencyMs" | "errors";

interface MetricDefinition {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
}

const ranges: Array<{ value: TelemetryRange; label: string }> = [
  { value: "15m", label: "15 min" },
  { value: "30m", label: "30 min" },
  { value: "60m", label: "1 h" },
  { value: "all", label: "Todo" },
];

const percentageMetrics: MetricDefinition[] = [
  { key: "cpu", label: "CPU", color: "#66d9c1", unit: "%" },
  { key: "ram", label: "RAM", color: "#81c8f5", unit: "%" },
  { key: "disk", label: "Disco", color: "#b6a0ff", unit: "%" },
];
const latencyMetrics: MetricDefinition[] = [
  { key: "latencyMs", label: "Latencia", color: "#f2c26b", unit: " ms" },
];
const errorMetrics: MetricDefinition[] = [
  { key: "errors", label: "Errores", color: "#e59bcb", unit: "" },
];

export function TelemetryTimeSeries({ alerts, points, tenantName }: TelemetryTimeSeriesProps) {
  const [range, setRange] = useState<TelemetryRange>("60m");
  const rangedPoints = useMemo(() => filterTelemetryByRange(points, range), [points, range]);
  const visualPoints = useMemo(() => downsampleTelemetry(rangedPoints), [rangedPoints]);
  const rows = useMemo<ChartRow[]>(() => visualPoints.map((point) => ({
    ...point,
    time: Date.parse(point.timestamp),
  })), [visualPoints]);
  const pointsByTime = useMemo(() => new Map(rows.map((point) => [point.time, point])), [rows]);
  const bounds = rows.length === 0
    ? null
    : { start: rows[0]?.time ?? 0, end: rows.at(-1)?.time ?? 0 };
  const visibleAlerts = alerts.filter((alert) => {
    if (bounds === null) return false;
    const timestamp = Date.parse(alert.timestamp);
    return timestamp >= bounds.start && timestamp <= bounds.end;
  });

  return (
    <section aria-labelledby="time-series-title" className="panel operation-section telemetry-series">
      <div className="panel-heading telemetry-heading">
        <div>
          <p className="eyebrow">Serie temporal · {tenantName}</p>
          <h3 id="time-series-title">Comportamiento de las señales</h3>
          <p className="chart-description">Los apagones permanecen como huecos y las líneas verticales marcan alertas emitidas.</p>
        </div>
        <fieldset className="range-control">
          <legend>Rango temporal</legend>
          <div>
            {ranges.map((option) => (
              <button
                aria-pressed={range === option.value}
                className="range-button"
                key={option.value}
                onClick={() => setRange(option.value)}
                type="button"
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>
      </div>

      {rows.length < 2 ? (
        <EmptyState
          description="Se necesitan al menos dos muestras de Kaiku en la misma corrida para dibujar una serie temporal."
          title="Muestras insuficientes"
        />
      ) : (
        <div className="chart-stack">
          <ChartPanel
            alerts={visibleAlerts}
            domain={[0, 100]}
            metrics={percentageMetrics}
            points={pointsByTime}
            rows={rows}
            title="Recursos"
            unit="%"
          />
          <ChartPanel
            alerts={visibleAlerts}
            domain={[0, "auto"]}
            metrics={latencyMetrics}
            points={pointsByTime}
            rows={rows}
            title="Latencia"
            unit="ms"
          />
          <ChartPanel
            alerts={visibleAlerts}
            domain={[0, "auto"]}
            metrics={errorMetrics}
            points={pointsByTime}
            rows={rows}
            title="Errores"
            unit="eventos"
          />
        </div>
      )}
      <p className="visualization-note">
        Mostrando {visualPoints.length} de {rangedPoints.length} muestras en la visualización.
        La evidencia original no se modifica.
      </p>
    </section>
  );
}

interface ChartPanelProps {
  alerts: readonly SentinelAlert[];
  domain: [number | "auto", number | "auto"];
  metrics: MetricDefinition[];
  points: ReadonlyMap<number, TelemetryPoint>;
  rows: ChartRow[];
  title: string;
  unit: string;
}

function ChartPanel({ alerts, domain, metrics, points, rows, title, unit }: ChartPanelProps) {
  return (
    <figure className="chart-panel">
      <figcaption><strong>{title}</strong><span>{unit}</span></figcaption>
      <div className="chart-canvas" role="img" aria-label={`Gráfica temporal de ${title.toLowerCase()}`}>
        <ResponsiveContainer
          height="100%"
          initialDimension={{ height: 300, width: 800 }}
          width="100%"
        >
          <LineChart accessibilityLayer data={rows} margin={{ bottom: 6, left: 0, right: 44, top: 12 }} syncId="telemetry">
            <CartesianGrid stroke="var(--border)" strokeDasharray="3 4" vertical={false} />
            <XAxis
              dataKey="time"
              domain={["dataMin", "dataMax"]}
              minTickGap={36}
              scale="time"
              tickFormatter={formatAxisTimestamp}
              type="number"
            />
            <YAxis domain={domain} width={42} />
            <Tooltip<number, string>
              content={(props) => (
                <ChartTooltip
                  active={props.active}
                  label={props.label}
                  metrics={metrics}
                  points={points}
                />
              )}
              isAnimationActive={false}
            />
            {alerts.map((alert) => (
              <ReferenceLine
                key={alert.id}
                label={{ fill: "var(--danger)", fontSize: 11, position: "insideTopLeft", value: "Alerta" }}
                stroke="var(--danger)"
                strokeDasharray="4 4"
                x={Date.parse(alert.timestamp)}
              />
            ))}
            {metrics.map((metric) => (
              <Line
                activeDot={{ r: 4 }}
                connectNulls={false}
                dataKey={metric.key}
                dot={false}
                isAnimationActive={false}
                key={metric.key}
                name={metric.label}
                stroke={metric.color}
                strokeWidth={2}
                type="linear"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div aria-label={`Leyenda de ${title}`} className="chart-legend">
        {metrics.map((metric) => (
          <span key={metric.key}><i style={{ background: metric.color }} />{metric.label}</span>
        ))}
      </div>
    </figure>
  );
}

interface ChartTooltipProps {
  active?: boolean;
  label?: TooltipContentProps<number, string>["label"];
  metrics: MetricDefinition[];
  points: ReadonlyMap<number, TelemetryPoint>;
}

function ChartTooltip({ active, label, metrics, points }: ChartTooltipProps) {
  const timestamp = typeof label === "number" ? label : Number(label);
  const point = Number.isFinite(timestamp) ? points.get(timestamp) : undefined;
  if (active !== true || point === undefined) return null;

  return (
    <div className="chart-tooltip">
      <strong>{formatTooltipTimestamp(point.timestamp)}</strong>
      <span>Calidad: {qualityLabel(point.dataQuality)}</span>
      <dl>
        {metrics.map((metric) => (
          <div key={metric.key}>
            <dt>{metric.label}</dt>
            <dd>{formatMetric(point[metric.key], metric.unit)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function formatAxisTimestamp(value: number): string {
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(value);
}

function formatTooltipTimestamp(value: string): string {
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(new Date(value));
}

function qualityLabel(quality: TelemetryPoint["dataQuality"]): string {
  if (quality === "ok") return "Datos completos";
  if (quality === "partial") return "Datos parciales";
  return "Sin telemetría";
}
