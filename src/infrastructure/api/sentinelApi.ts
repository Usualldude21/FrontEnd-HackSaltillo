import { z } from "zod";
import type { BackendCapabilities } from "../../domain/backend";
import type { AlertQuery, SentinelDataSource, TelemetryQuery } from "../../domain/ports";
import { ApiError } from "./errors";
import { createHttpClient, type HttpClientOptions } from "./httpClient";
import {
  mapEvent,
  mapIncident,
  mapOperationalAlert,
  mapReadiness,
} from "./mappers";
import {
  alertAcknowledgementDtoSchema,
  eventDtoSchema,
  incidentDtoSchema,
  operationalAlertDtoSchema,
  readinessResponseSchema,
} from "./schemas";

const operationalCapabilities: BackendCapabilities = {
  operationalLab: true,
  challengePredictor: false,
  eventStream: true,
  administrativeActions: true,
};

function unavailable(capability: string): ApiError {
  return new ApiError({
    status: 0,
    code: "capability_unavailable",
    message: `${capability} todavía no está expuesto por este backend.`,
    retryAfterSeconds: null,
    validationIssues: [],
  });
}

function withSignal(signal?: AbortSignal): Pick<RequestInit, "signal"> {
  return signal === undefined ? {} : { signal };
}

export function createApiDataSource(options: HttpClientOptions): SentinelDataSource {
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
      return Promise.resolve(operationalCapabilities);
    },
    listTenants() {
      return Promise.reject(unavailable("El predictor de Kaiku"));
    },
    listRuns() {
      return Promise.reject(unavailable("Las corridas del predictor"));
    },
    listTelemetry(_query: TelemetryQuery) {
      void _query;
      return Promise.reject(unavailable("La telemetría del kit"));
    },
    async listAlerts(query: AlertQuery = {}, signal) {
      const params = new URLSearchParams();
      params.set("after_id", String(query.afterId ?? 0));
      params.set("limit", String(query.limit ?? 100));
      if (query.state !== undefined) params.set("state", query.state);
      const dtos = await http.request(
        `/api/alerts?${params.toString()}`,
        z.array(operationalAlertDtoSchema),
        withSignal(signal),
      );
      return dtos.map(mapOperationalAlert);
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
    startReplay() {
      return Promise.reject(unavailable("El predictor del kit"));
    },
    getReplay() {
      return Promise.reject(unavailable("El predictor del kit"));
    },
    stopReplay() {
      return Promise.reject(unavailable("El predictor del kit"));
    },
  };
}
