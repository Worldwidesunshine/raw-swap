import { createServer, type Server } from "node:http";

type WorkerMetricsState = {
  startedAtIso: string;
  landedTotal: number;
  failedTotal: number;
  unknownTotal: number;
  retryableErrorsTotal: number;
  lastLandedAtIso: string | null;
  lastFailureAtIso: string | null;
};

const state: WorkerMetricsState = {
  startedAtIso: new Date().toISOString(),
  landedTotal: 0,
  failedTotal: 0,
  unknownTotal: 0,
  retryableErrorsTotal: 0,
  lastLandedAtIso: null,
  lastFailureAtIso: null,
};

export function recordWorkerLanded() {
  state.landedTotal += 1;
  state.lastLandedAtIso = new Date().toISOString();
}

export function recordWorkerFailed() {
  state.failedTotal += 1;
  state.lastFailureAtIso = new Date().toISOString();
}

export function recordWorkerUnknown() {
  state.unknownTotal += 1;
}

export function recordWorkerRetryableError() {
  state.retryableErrorsTotal += 1;
}

function renderMetrics(): string {
  return [
    "# HELP rawswap_worker_landed_total Landed executions processed by worker",
    "# TYPE rawswap_worker_landed_total counter",
    `rawswap_worker_landed_total ${state.landedTotal}`,
    "# HELP rawswap_worker_failed_total Failed executions processed by worker",
    "# TYPE rawswap_worker_failed_total counter",
    `rawswap_worker_failed_total ${state.failedTotal}`,
    "# HELP rawswap_worker_unknown_total Unknown executions processed by worker",
    "# TYPE rawswap_worker_unknown_total counter",
    `rawswap_worker_unknown_total ${state.unknownTotal}`,
    "# HELP rawswap_worker_retryable_errors_total Retryable worker errors",
    "# TYPE rawswap_worker_retryable_errors_total counter",
    `rawswap_worker_retryable_errors_total ${state.retryableErrorsTotal}`,
  ].join("\n");
}

export function startWorkerTelemetryServer(
  port = Number(process.env.WORKER_METRICS_PORT ?? "3002"),
  host = process.env.WORKER_METRICS_HOST ?? "0.0.0.0",
): Server {
  const server = createServer((req, res) => {
    if (req.url === "/health" || req.url === "/ready") {
      res.writeHead(200, { "content-type": "application/json" });
      res.end(
        JSON.stringify({
          ok: true,
          startedAt: state.startedAtIso,
          lastLandedAt: state.lastLandedAtIso,
          lastFailureAt: state.lastFailureAtIso,
        }),
      );
      return;
    }

    if (req.url === "/metrics") {
      res.writeHead(200, {
        "content-type": "text/plain; version=0.0.4; charset=utf-8",
      });
      res.end(renderMetrics());
      return;
    }

    res.writeHead(404, { "content-type": "application/json" });
    res.end(JSON.stringify({ ok: false }));
  });

  server.listen(port, host);
  return server;
}
