import { http, HttpResponse } from "msw";
import {
  alertFixtures,
  eventFixtures,
  incidentFixtures,
  runFixtures,
  telemetryFixtures,
  tenantFixtures,
} from "./fixtures";
import {
  challengeAlertFixtures,
  challengeContractFixture,
  createChallengeExplanationFixture,
  challengeOperationsFixture,
  challengeRemediationOverviewFixture,
  challengeShowcaseFixture,
} from "./challengeFixtures";

export function createContractHandlers() {
  const alerts = alertFixtures.map((alert) => ({ ...alert }));
  const challengeAlerts = challengeAlertFixtures.map((alert) => ({ ...alert }));
  const challengeOperations = {
    ...challengeOperationsFixture,
    alerts: { ...challengeOperationsFixture.alerts },
    cursor: { ...challengeOperationsFixture.cursor },
  };
  const challengeStreamUpdates: Array<Record<string, unknown>> = challengeAlerts.map((alert) => ({
    ...alert,
    stream_event: "challenge_alert",
  }));
  let challengeCursor = challengeAlerts.at(-1)?.event_id ?? 0;
  const replays = new Map<string, {
    id: string;
    run_id: string;
    status: "running" | "stopped";
    current_timestamp: string;
    processed_rows: number;
    total_rows: number;
    alerts_count: number;
    synthetic: true;
  }>();
  let replaySequence = 0;
  const processedChallengeRuns = new Set<string>();

  return [
    http.get("*/health/ready", () => HttpResponse.json({
      status: "ready",
      checks: {
        database: "ok",
        monitor: "ok",
        traffic: "ok",
        model: "ok",
        resources: "ok",
        evidence: "ok",
      },
    })),
    http.get("*/api/challenge/contract", () => HttpResponse.json(challengeContractFixture)),
    http.get("*/api/challenge/operations", () => HttpResponse.json(challengeOperations)),
    http.get("*/api/challenge/remediations", () => HttpResponse.json(challengeRemediationOverviewFixture)),
    http.get("*/api/challenge/remediations/audit.csv", () => new HttpResponse(
      "remediation_id,incident_id,status,environment\n",
      { headers: { "Content-Type": "text/csv" } },
    )),
    http.get("*/api/challenge/showcase", () => HttpResponse.json(challengeShowcaseFixture)),
    http.get("*/api/challenge/alerts/cursor", () => HttpResponse.json({
      earliest_id: challengeStreamUpdates.length === 0 ? 0 : 301,
      latest_id: challengeCursor,
      retained_count: challengeStreamUpdates.length,
      storage: "durable_database_phase_7",
      durable: true,
    })),
    http.get("*/api/challenge/alerts/stream", ({ request }) => {
      const url = new URL(request.url);
      const queryCursor = Number(url.searchParams.get("after_id") ?? 0);
      const headerCursor = Number(request.headers.get("Last-Event-ID") ?? 0);
      const requestedCursor = Math.max(queryCursor, headerCursor);
      if (requestedCursor > challengeCursor) {
        return HttpResponse.json({
          detail: {
            code: "cursor_ahead",
            message: "challenge cursor is ahead of the durable stream",
            earliest_id: challengeStreamUpdates.length === 0 ? 0 : 301,
            latest_id: challengeCursor,
            retained_count: challengeStreamUpdates.length,
          },
        }, { status: 409 });
      }
      const encoder = new TextEncoder();
      let currentCursor = requestedCursor;
      let closed = false;
      let interval: ReturnType<typeof setInterval> | undefined;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          const flush = () => {
            if (closed) return;
            for (const update of challengeStreamUpdates) {
              const id = Number(update.id);
              if (id <= currentCursor) continue;
              currentCursor = id;
              const eventName = String(update.stream_event);
              controller.enqueue(encoder.encode(
                `id: ${id}\nevent: ${eventName}\ndata: ${JSON.stringify(update)}\n\n`,
              ));
            }
            controller.enqueue(encoder.encode(
              `event: heartbeat\ndata: {"cursor":${currentCursor}}\n\n`,
            ));
          };
          flush();
          interval = setInterval(flush, 250);
          request.signal.addEventListener("abort", () => {
            closed = true;
            if (interval !== undefined) clearInterval(interval);
            controller.close();
          }, { once: true });
        },
        cancel() {
          closed = true;
          if (interval !== undefined) clearInterval(interval);
        },
      });
      return new HttpResponse(stream, {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "text/event-stream",
          "X-Challenge-Storage": "durable-database-phase-7",
        },
      });
    }),
    http.post("*/api/challenge/replay", async ({ request }) => {
      const token = request.headers.get("X-Admin-Token");
      if (token === null || token.length === 0) {
        return HttpResponse.json({ detail: "valid X-Admin-Token required" }, { status: 401 });
      }
      const body: unknown = await request.json();
      const runId = typeof body === "object" && body !== null && "run_id" in body
        ? body.run_id
        : null;
      if (runId !== "corrida_03") {
        return HttpResponse.json({ detail: "official run not found" }, { status: 404 });
      }
      const alreadyProcessed = processedChallengeRuns.has(runId);
      processedChallengeRuns.add(runId);
      return HttpResponse.json({
        run_id: runId,
        rows_processed: 4_320,
        tenants: ["kaiku"],
        incident_alerts: 1,
        data_quality_alerts: 1,
        new_alerts: alreadyProcessed ? 0 : 2,
        existing_alerts: alreadyProcessed ? 2 : 0,
        latest_cursor: 302,
        elapsed_milliseconds: 184.6,
        model_sha256: "contract-fixture-model-sha256",
        policy_sha256: "contract-fixture-policy-sha256",
        storage: "durable_database_phase_7",
        execution: "inline_serialized_phase_7",
      });
    }),
    http.get("*/api/challenge/alerts/:eventId/explanation", ({ params }) => {
      const eventId = Number(params.eventId);
      const alert = challengeAlerts.find((item) => item.event_id === eventId);
      return alert === undefined
        ? HttpResponse.json({ detail: "Alerta Kaiku no encontrada" }, { status: 404 })
        : HttpResponse.json(createChallengeExplanationFixture(alert));
    }),
    http.get("*/api/challenge/tenants", () => HttpResponse.json(tenantFixtures)),
    http.get("*/api/challenge/runs", () => HttpResponse.json(runFixtures)),
    http.get("*/api/challenge/metrics", ({ request }) => {
      const url = new URL(request.url);
      const runId = url.searchParams.get("run_id");
      const tenant = url.searchParams.get("tenant");
      return HttpResponse.json(
        telemetryFixtures.filter((point) => point.run_id === runId && point.tenant === tenant),
      );
    }),
    http.get("*/api/challenge/alerts", ({ request }) => {
      const url = new URL(request.url);
      if (url.searchParams.has("alert_type")) {
        const runId = url.searchParams.get("run_id");
        const afterId = Number(url.searchParams.get("after_id") ?? 0);
        const limit = Number(url.searchParams.get("limit") ?? 100);
        const alertType = url.searchParams.get("alert_type") ?? "incident_risk";
        return HttpResponse.json(challengeAlerts.filter((alert) =>
          alert.event_id > afterId
          && (runId === null || alert.run_id === runId)
          && (alertType === "all" || alert.alert_type === alertType)).slice(0, limit));
      }
      const runId = url.searchParams.get("run_id");
      const tenant = url.searchParams.get("tenant");
      const state = url.searchParams.get("state");
      return HttpResponse.json(alerts.filter((alert) =>
        (runId === null || alert.run_id === runId)
        && (tenant === null || alert.tenant === tenant)
        && (state === null || alert.state === state)));
    }),
    http.post("*/api/admin/challenge/replays", async ({ request }) => {
      const token = request.headers.get("X-Admin-Token");
      if (token === null || token.length === 0) {
        return HttpResponse.json({ detail: "Autorización requerida" }, { status: 401 });
      }
      const body: unknown = await request.json();
      const validBody = typeof body === "object"
        && body !== null
        && "run_id" in body
        && body.run_id === "run-contract-01"
        && "tenants" in body
        && Array.isArray(body.tenants)
        && body.tenants.length === 1
        && body.tenants[0] === "kaiku"
        && "speed" in body
        && [1, 10, 60, 300].includes(Number(body.speed));
      if (!validBody) {
        return HttpResponse.json({ detail: "Corrida no disponible" }, { status: 422 });
      }
      replaySequence += 1;
      const replay = {
        id: `replay-contract-${replaySequence}`,
        run_id: "run-contract-01",
        status: "running" as const,
        current_timestamp: "2026-10-09T14:30:00.000Z",
        processed_rows: 3,
        total_rows: 4,
        alerts_count: 2,
        synthetic: true as const,
      };
      replays.set(replay.id, replay);
      return HttpResponse.json(replay, { status: 201 });
    }),
    http.get("*/api/challenge/replays/:id", ({ params }) => {
      const replay = replays.get(String(params.id));
      return replay === undefined
        ? HttpResponse.json({ detail: "Replay no encontrado" }, { status: 404 })
        : HttpResponse.json(replay);
    }),
    http.post("*/api/admin/challenge/replays/:id/stop", ({ params, request }) => {
      const token = request.headers.get("X-Admin-Token");
      if (token === null || token.length === 0) {
        return HttpResponse.json({ detail: "Autorización requerida" }, { status: 401 });
      }
      const replay = replays.get(String(params.id));
      if (replay === undefined) {
        return HttpResponse.json({ detail: "Replay no encontrado" }, { status: 404 });
      }
      const stopped = { ...replay, status: "stopped" as const };
      replays.set(stopped.id, stopped);
      return HttpResponse.json(stopped);
    }),
    http.get("*/api/incidents", () => HttpResponse.json(incidentFixtures)),
    http.get("*/api/incidents/:id", ({ params }) => {
      const incident = incidentFixtures.find((item) => item.id === params.id);
      return incident === undefined
        ? HttpResponse.json({ detail: "Incidente no encontrado" }, { status: 404 })
        : HttpResponse.json(incident);
    }),
    http.get("*/api/incidents/:id/events", ({ params }) => HttpResponse.json(
      eventFixtures.filter((event) => event.incident_id === params.id),
    )),
    http.get("*/api/events/cursor", () => HttpResponse.json({
      latest_id: eventFixtures.at(-1)?.id ?? 0,
    })),
    http.get("*/api/events", ({ request }) => {
      const url = new URL(request.url);
      const afterId = Number(url.searchParams.get("after_id") ?? 0);
      const limit = Number(url.searchParams.get("limit") ?? 100);
      return HttpResponse.json(eventFixtures.filter((event) => event.id > afterId).slice(0, limit));
    }),
    http.get("*/api/events/stream", ({ request }) => {
      const encoder = new TextEncoder();
      const cursor = eventFixtures.at(-1)?.id ?? 0;
      const stream = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: {"cursor":${cursor}}\n\n`));
          request.signal.addEventListener("abort", () => controller.close(), { once: true });
        },
      });
      return new HttpResponse(stream, {
        headers: {
          "Cache-Control": "no-cache",
          "Content-Type": "text/event-stream",
        },
      });
    }),
    http.post("*/api/admin/alerts/:id/acknowledge", ({ params, request }) => {
      const token = request.headers.get("X-Admin-Token");
      if (token === null || token.length === 0) {
        return HttpResponse.json({ detail: "Autorización requerida" }, { status: 401 });
      }
      const id = Number(params.id);
      const challengeAlert = challengeAlerts.find((item) => item.outbox_alert_id === id);
      if (challengeAlert !== undefined) {
        const wasAcknowledged = challengeAlert.state === "acknowledged";
        const acknowledgedAt = challengeAlert.acknowledged_at ?? "2026-10-09T21:10:35.000Z";
        const elapsed = challengeAlert.delivery_to_acknowledgement_seconds ?? 35;
        challengeAlert.state = "acknowledged";
        challengeAlert.acknowledged_at = acknowledgedAt;
        challengeAlert.delivery_to_acknowledgement_seconds = elapsed;
        if (!wasAcknowledged) {
          challengeCursor += 1;
          challengeOperations.alerts.open -= 1;
          challengeOperations.alerts.acknowledged += 1;
          challengeOperations.cursor.latest_id = challengeCursor;
          challengeOperations.cursor.retained_count += 1;
          challengeStreamUpdates.push({
            id: challengeCursor,
            event_id: challengeCursor,
            outbox_alert_id: challengeAlert.outbox_alert_id,
            incident_id: challengeAlert.incident_id,
            run_id: challengeAlert.run_id,
            tenant: "kaiku",
            timestamp: acknowledgedAt,
            alert_type: "operator_acknowledgement",
            state: "acknowledged",
            action_executed: false,
            delivery_to_acknowledgement_seconds: elapsed,
            clock_domain: "operator_wall_clock",
            stream_event: "challenge_alert_acknowledged",
          });
        }
        return HttpResponse.json({
          id: challengeAlert.outbox_alert_id,
          state: "acknowledged",
          acknowledged_at: acknowledgedAt,
          challenge_trace: {
            source: "challenge_predictor",
            run_id: challengeAlert.run_id,
            tenant: "kaiku",
            alert_event_id: challengeAlert.event_id,
            outbox_alert_id: challengeAlert.outbox_alert_id,
            clock_domain: "operator_wall_clock",
            delivered_at: challengeAlert.delivered_at,
            acknowledged_at: acknowledgedAt,
            delivery_to_acknowledgement_seconds: elapsed,
            operator_action: "alert_acknowledged",
            mitigation_executed: false,
          },
        });
      }
      const alert = alerts.find((item) => item.id === id);
      if (alert === undefined) {
        return HttpResponse.json({ detail: "Alerta no encontrada" }, { status: 404 });
      }
      alert.state = "acknowledged";
      return HttpResponse.json({
        id,
        state: "acknowledged",
        acknowledged_at: "2026-10-09T14:35:00.000Z",
      });
    }),
  ];
}
