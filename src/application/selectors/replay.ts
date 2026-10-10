import type { SentinelAlert } from "../../domain/alert";
import type { TimelineEvent } from "../../domain/event";
import type { ChallengeReplay } from "../../domain/replay";
import type { TelemetryPoint } from "../../domain/telemetry";
import { sortAlertsByPriority } from "./alerts";
import { sortTimelineEvents } from "./incidents";

function isVisibleAt(timestamp: string, currentTimestamp: string | null): boolean {
  return currentTimestamp !== null && Date.parse(timestamp) <= Date.parse(currentTimestamp);
}

export function replayProgress(replay: ChallengeReplay): number {
  if (replay.totalRows === 0) return 0;
  return Math.min(100, Math.round((replay.processedRows / replay.totalRows) * 100));
}

export function selectReplayTelemetry(
  points: readonly TelemetryPoint[],
  replay: ChallengeReplay,
): TelemetryPoint[] {
  return points.filter((point) => point.runId === replay.runId
    && point.tenant === "kaiku"
    && isVisibleAt(point.timestamp, replay.currentTimestamp));
}

export function selectReplayAlerts(
  alerts: readonly SentinelAlert[],
  replay: ChallengeReplay,
): SentinelAlert[] {
  return sortAlertsByPriority(alerts.filter((alert) => alert.runId === replay.runId
    && alert.tenant === "kaiku"
    && isVisibleAt(alert.timestamp, replay.currentTimestamp)));
}

export function selectReplayEvents(
  events: readonly TimelineEvent[],
  replay: ChallengeReplay,
): TimelineEvent[] {
  return sortTimelineEvents(events.filter((event) =>
    isVisibleAt(event.timestamp, replay.currentTimestamp)));
}
