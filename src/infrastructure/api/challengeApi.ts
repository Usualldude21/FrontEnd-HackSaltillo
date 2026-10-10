import { z } from "zod";
import type { BackendCapabilities } from "../../domain/backend";
import type { AlertQuery, SentinelDataSource } from "../../domain/ports";
import { createHttpClient, type HttpClientOptions } from "./httpClient";
import {
  mapChallengeAlert,
  mapEvent,
  mapIncident,
  mapReadiness,
  mapReplay,
  mapRun,
  mapTelemetryPoint,
  mapTenant,
} from "./mappers";
import {
  alertAcknowledgementDtoSchema,
  challengeAlertDtoSchema,
  challengeMetricPointDtoSchema,
  challengeRunDtoSchema,
  challengeReplayDtoSchema,
  eventDtoSchema,
  incidentDtoSchema,
  readinessResponseSchema,
  tenantDtoSchema,
} from "./schemas";

const challengeCapabilities: BackendCapabilities = {
  operationalLab: true,
  challengePredictor: true,
  eventStream: true,
  administrativeActions: true,
};

function withSignal(signal?: AbortSignal): Pick<RequestInit, "signal"> {
  return signal === undefined ? {} : { signal };
}

export function createChallengeDataSource(options: HttpClientOptions): SentinelDataSource {
  const http = createHttpClient(options);

  return {
    async getBackendStatus(signal) {
      const dto = await http.request(
        "/health/ready",
        readinessResponseSchema,
        { ...withSignal(signal), acceptedStatuses: [503] },
      );
      return mapReadiness(dto);
    },
    getCapabilities() {
      return Promise.resolve(challengeCapabilities);
    },
    async listTenants(signal) {
      const dtos = await http.request(
        "/api/challenge/tenants",
        z.array(tenantDtoSchema),
        withSignal(signal),
      );
      return dtos.map(mapTenant);
    },
    async listRuns(signal) {
      const dtos = await http.request(
        "/api/challenge/runs",
        z.array(challengeRunDtoSchema),
        withSignal(signal),
      );
      return dtos.map(mapRun);
    },
    async listTelemetry(query, signal) {
      const params = new URLSearchParams({ run_id: query.runId, tenant: query.tenant });
      if (query.from !== undefined) params.set("from", query.from);
      if (query.to !== undefined) params.set("to", query.to);
      params.set("limit", String(query.limit ?? 1000));
      const dtos = await http.request(
        `/api/challenge/metrics?${params.toString()}`,
        z.array(challengeMetricPointDtoSchema),
        withSignal(signal),
      );
      return dtos.map(mapTelemetryPoint);
    },
    async listAlerts(query: AlertQuery = {}, signal) {
      const params = new URLSearchParams();
      if (query.runId !== undefined) params.set("run_id", query.runId);
      if (query.tenant !== undefined) params.set("tenant", query.tenant);
      if (query.state !== undefined) params.set("state", query.state);
      params.set("after_id", String(query.afterId ?? 0));
      params.set("limit", String(query.limit ?? 100));
      const dtos = await http.request(
        `/api/challenge/alerts?${params.toString()}`,
        z.array(challengeAlertDtoSchema),
        withSignal(signal),
      );
      return dtos.map(mapChallengeAlert);
    },
    async listIncidents(signal) {
      const dtos = await http.request("/api/incidents", z.array(incidentDtoSchema), withSignal(signal));
      return dtos.map(mapIncident);
    },
    async getIncident(id, signal) {
      const dto = await http.request(
        `/api/incidents/${encodeURIComponent(id)}`,
        incidentDtoSchema,
        withSignal(signal),
      );
      return mapIncident(dto);
    },
    async listIncidentEvents(id, signal) {
      const dtos = await http.request(
        `/api/incidents/${encodeURIComponent(id)}/events`,
        z.array(eventDtoSchema),
        withSignal(signal),
      );
      return dtos.map(mapEvent);
    },
    async acknowledgeAlert(id, adminToken, signal) {
      await http.request(
        `/api/admin/alerts/${encodeURIComponent(id)}/acknowledge`,
        alertAcknowledgementDtoSchema,
        {
          method: "POST",
          headers: { "X-Admin-Token": adminToken },
          ...withSignal(signal),
        },
      );
    },
    async startReplay(input, adminToken, signal) {
      const dto = await http.request(
        "/api/admin/challenge/replays",
        challengeReplayDtoSchema,
        {
          method: "POST",
          headers: { "X-Admin-Token": adminToken },
          body: JSON.stringify({ run_id: input.runId, tenants: ["kaiku"], speed: input.speed }),
          ...withSignal(signal),
        },
      );
      return mapReplay(dto);
    },
    async getReplay(id, signal) {
      const dto = await http.request(
        `/api/challenge/replays/${encodeURIComponent(id)}`,
        challengeReplayDtoSchema,
        withSignal(signal),
      );
      return mapReplay(dto);
    },
    async stopReplay(id, adminToken, signal) {
      const dto = await http.request(
        `/api/admin/challenge/replays/${encodeURIComponent(id)}/stop`,
        challengeReplayDtoSchema,
        {
          method: "POST",
          headers: { "X-Admin-Token": adminToken },
          ...withSignal(signal),
        },
      );
      return mapReplay(dto);
    },
  };
}
