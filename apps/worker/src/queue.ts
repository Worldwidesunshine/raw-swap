import { Worker, type Job } from "bullmq";

export function parseRedisUrl(url: string) {
  const u = new URL(url);
  return {
    host: u.hostname,
    port: Number(u.port || 6379),
    username: u.username ? decodeURIComponent(u.username) : undefined,
    password: u.password ? decodeURIComponent(u.password) : undefined,
    maxRetriesPerRequest: null,
  };
}

export function createLandingWorker(
  processor: (job: Job<{ executionId: string; signature: string }>) => Promise<void>,
  redisUrl: string,
) {
  return new Worker("landing-monitor", processor, { connection: parseRedisUrl(redisUrl) });
}
