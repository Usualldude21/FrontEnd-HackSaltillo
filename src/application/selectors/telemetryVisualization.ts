import type { TelemetryPoint } from "../../domain/telemetry";

export type TelemetryRange = "15m" | "30m" | "60m" | "all";

const rangeMinutes: Record<Exclude<TelemetryRange, "all">, number> = {
  "15m": 15,
  "30m": 30,
  "60m": 60,
};

function sortByTimestamp(points: readonly TelemetryPoint[]): TelemetryPoint[] {
  return [...points].sort((left, right) => Date.parse(left.timestamp) - Date.parse(right.timestamp));
}

export function filterTelemetryByRange(
  points: readonly TelemetryPoint[],
  range: TelemetryRange,
): TelemetryPoint[] {
  const sorted = sortByTimestamp(points);
  if (range === "all" || sorted.length === 0) return sorted;
  const latestTimestamp = Date.parse(sorted.at(-1)?.timestamp ?? "");
  const threshold = latestTimestamp - rangeMinutes[range] * 60_000;
  return sorted.filter((point) => Date.parse(point.timestamp) >= threshold);
}

function gapSignature(point: TelemetryPoint): string {
  return [
    point.dataQuality,
    point.cpu === null,
    point.ram === null,
    point.disk === null,
    point.latencyMs === null,
    point.errors === null,
  ].join(":");
}

export function downsampleTelemetry(
  points: readonly TelemetryPoint[],
  targetPoints = 600,
): TelemetryPoint[] {
  const sorted = sortByTimestamp(points);
  if (sorted.length <= targetPoints || targetPoints < 3) return sorted;

  const protectedIndices = new Set<number>([0, sorted.length - 1]);
  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (previous !== undefined && current !== undefined && gapSignature(previous) !== gapSignature(current)) {
      protectedIndices.add(index - 1);
      protectedIndices.add(index);
    }
  }

  const candidates = sorted
    .map((_, index) => index)
    .filter((index) => !protectedIndices.has(index));
  const remaining = Math.max(0, targetPoints - protectedIndices.size);

  if (remaining > 0 && candidates.length > 0) {
    const step = candidates.length / remaining;
    for (let sample = 0; sample < remaining; sample += 1) {
      const candidate = candidates[Math.min(candidates.length - 1, Math.floor(sample * step))];
      if (candidate !== undefined) protectedIndices.add(candidate);
    }
  }

  return [...protectedIndices]
    .sort((left, right) => left - right)
    .map((index) => sorted[index])
    .filter((point): point is TelemetryPoint => point !== undefined);
}
