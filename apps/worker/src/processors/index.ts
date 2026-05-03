import { createLandingWorker } from "../queue.js";
import { createLandingMonitorFactory } from "./landing-monitor.js";
import { startWorkerTelemetryServer } from "../telemetry.js";

const redisUrl = process.env.REDIS_URL ?? "redis://127.0.0.1:6379";

const landing = createLandingMonitorFactory();
const worker = createLandingWorker(landing.processJob, redisUrl);
const telemetryServer = startWorkerTelemetryServer();

worker.on("failed", (job, err) => {
  console.error("job failed", job?.id, err);
});

console.log("landing-monitor worker started");

async function shutdown(signal: string) {
  console.info("shutting down", signal);
  await worker.close();
  await landing.closePool();
  await new Promise<void>((resolve, reject) => {
    telemetryServer.close((err) => {
      if (err) reject(err);
      else resolve();
    });
  });
  process.exit(0);
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
