import type {
  ChallengeAlertDto,
  ChallengeMetricPointDto,
  ChallengeRunDto,
  EventDto,
  IncidentDto,
  TenantDto,
} from "../api/schemas";

export const fixtureMetadata = {
  source: "contract_fixture",
  synthetic: true,
  claimableAsBackendEvidence: false,
} as const;

export const fixtureScenarios = [
  "kaiku_estable",
  "kaiku_en_observacion",
  "kaiku_con_alerta",
  "respaldo_legitimo_sin_alerta",
  "apagon_de_telemetria",
  "alerta_reconocida",
  "incidente_recuperado_y_verificado",
] as const;

export const tenantFixtures: TenantDto[] = [
  {
    id: "kaiku",
    name: "Kaiku",
    business: "Comercio electrónico",
    criticalSystems: ["Catálogo", "Checkout", "Pedidos", "Inventario"],
    operatingWindow: "Todos los días · 24 horas",
  },
];

export const runFixtures: ChallengeRunDto[] = [
  {
    id: "run-contract-01",
    status: "completed",
    started_at: "2026-10-09T14:00:00.000Z",
    completed_at: "2026-10-09T15:00:00.000Z",
    synthetic: true,
  },
];

export const telemetryFixtures: ChallengeMetricPointDto[] = [
  {
    tenant: "kaiku",
    run_id: "run-contract-01",
    timestamp: "2026-10-09T14:10:00.000Z",
    cpu: 46,
    ram: 55,
    disco: 42,
    latencia_ms: 82,
    errores: 0,
    data_quality: "ok",
  },
  {
    tenant: "kaiku",
    run_id: "run-contract-01",
    timestamp: "2026-10-09T14:20:00.000Z",
    cpu: 51,
    ram: 57,
    disco: 42,
    latencia_ms: 146,
    errores: 2,
    data_quality: "ok",
  },
  {
    tenant: "kaiku",
    run_id: "run-contract-01",
    timestamp: "2026-10-09T14:30:00.000Z",
    cpu: 58,
    ram: 61,
    disco: 43,
    latencia_ms: 241,
    errores: 7,
    data_quality: "partial",
  },
  {
    tenant: "kaiku",
    run_id: "run-contract-01",
    timestamp: "2026-10-09T14:31:00.000Z",
    cpu: null,
    ram: null,
    disco: null,
    latencia_ms: null,
    errores: null,
    data_quality: "outage",
  },
];

export const alertFixtures: ChallengeAlertDto[] = [
  {
    id: 101,
    tenant: "kaiku",
    run_id: "run-contract-01",
    incident_id: "incident-contract-01",
    timestamp: "2026-10-09T14:30:00.000Z",
    confidence: 0.91,
    incident_type: "latency_degradation",
    severity: "critical",
    state: "open",
    data_quality: "partial",
    model_version: "contract-v1",
    evidence: [
      {
        feature: "latencia_ms",
        observed: 241,
        baseline: 82,
        unit: "ms",
        direction: "up",
        observed_at: "2026-10-09T14:30:00.000Z",
      },
      {
        feature: "errores",
        observed: 7,
        baseline: 0,
        unit: "errores/min",
        direction: "up",
        observed_at: "2026-10-09T14:30:00.000Z",
      },
      {
        feature: "telemetria",
        observed: null,
        baseline: null,
        unit: null,
        direction: "missing",
        observed_at: "2026-10-09T14:31:00.000Z",
      },
    ],
  },
  {
    id: 88,
    tenant: "kaiku",
    run_id: "run-contract-01",
    incident_id: null,
    timestamp: "2026-10-09T14:05:00.000Z",
    confidence: 0.63,
    incident_type: null,
    severity: "watch",
    state: "acknowledged",
    data_quality: "ok",
    model_version: "contract-v1",
    evidence: [],
  },
];

export const incidentFixtures: IncidentDto[] = [
  {
    id: "incident-contract-01",
    service: "checkout",
    severity: "critical",
    status: "recovered",
    first_signal_at: "2026-10-09T14:10:00.000Z",
    detected_at: "2026-10-09T14:30:00.000Z",
    recovered_at: "2026-10-09T14:48:00.000Z",
    evidence: { fixture: true, verification: "latency_returned_to_baseline" },
    experiment_id: "run-contract-01",
  },
];

export const eventFixtures: EventDto[] = [
  {
    id: 1,
    incident_id: "incident-contract-01",
    experiment_id: "run-contract-01",
    type: "FIRST_SIGNAL",
    timestamp: "2026-10-09T14:10:00.000Z",
    details: { feature: "latencia_ms", observed: 82 },
  },
  {
    id: 2,
    incident_id: "incident-contract-01",
    experiment_id: "run-contract-01",
    type: "ALERT_EMITTED",
    timestamp: "2026-10-09T14:30:00.000Z",
    details: { alert_id: 101 },
  },
  {
    id: 3,
    incident_id: "incident-contract-01",
    experiment_id: "run-contract-01",
    type: "ACTION_APPLIED",
    timestamp: "2026-10-09T14:37:00.000Z",
    details: { runbook: "checkout_latency_mitigation", result: "applied" },
  },
  {
    id: 4,
    incident_id: "incident-contract-01",
    experiment_id: "run-contract-01",
    type: "VERIFIED",
    timestamp: "2026-10-09T14:48:00.000Z",
    details: { result: "latency_returned_to_baseline" },
  },
];
