export interface ChallengeRun {
  id: string;
  status: "available" | "running" | "completed" | "failed";
  startedAt: string | null;
  completedAt: string | null;
  synthetic: true;
}
