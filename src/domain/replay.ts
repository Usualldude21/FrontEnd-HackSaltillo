export const replaySpeeds = [1, 10, 60, 300] as const;

export type ReplaySpeed = (typeof replaySpeeds)[number];
export type ReplayStatus = "queued" | "running" | "completed" | "failed" | "stopped";

export interface StartReplayInput {
  runId: string;
  speed: ReplaySpeed;
}

export interface ChallengeReplay {
  id: string;
  runId: string;
  status: ReplayStatus;
  currentTimestamp: string | null;
  processedRows: number;
  totalRows: number;
  alertsCount: number;
  synthetic: true;
}
