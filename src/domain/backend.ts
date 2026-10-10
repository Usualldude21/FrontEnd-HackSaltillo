export type ConnectionState =
  | "connecting"
  | "live"
  | "reconnecting"
  | "offline"
  | "incompatible";

export interface BackendCapabilities {
  operationalLab: boolean;
  challengePredictor: boolean;
  eventStream: boolean;
  administrativeActions: boolean;
}

export interface BackendStatus {
  ready: boolean;
  status: "ready" | "not_ready";
  checks: Record<
    "database" | "monitor" | "traffic" | "model" | "resources" | "evidence",
    "ok" | "failed" | "disabled" | "degraded"
  >;
}
