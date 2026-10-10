export interface TimelineEvent {
  id: number;
  incidentId: string | null;
  experimentId: string | null;
  type: string;
  timestamp: string;
  details: Record<string, unknown>;
}
