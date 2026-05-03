import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import client from "prom-client";

export const registry = new client.Registry();
client.collectDefaultMetrics({ register: registry });

function histogram(
  configuration: client.HistogramConfiguration<string>,
): client.Histogram<string> {
  const existing = registry.getSingleMetric(configuration.name) as
    | client.Histogram<string>
    | undefined;
  if (existing) return existing;
  return new client.Histogram({ ...configuration, registers: [registry] });
}

function counter(
  configuration: client.CounterConfiguration<string>,
): client.Counter<string> {
  const existing = registry.getSingleMetric(configuration.name) as client.Counter<string> | undefined;
  if (existing) return existing;
  return new client.Counter({ ...configuration, registers: [registry] });
}

export const quoteDuration = histogram({
  name: "rawswap_quote_duration_ms",
  help: "Quote duration ms",
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
});

export const buildDuration = histogram({
  name: "rawswap_build_duration_ms",
  help: "Build duration ms",
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
});

export const simulationDuration = histogram({
  name: "rawswap_simulation_duration_ms",
  help: "Simulation duration ms",
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
});

export const submitDuration = histogram({
  name: "rawswap_submit_duration_ms",
  help: "Submit duration ms",
  buckets: [10, 25, 50, 100, 250, 500, 1000, 2500],
});

export const timeToLand = histogram({
  name: "rawswap_time_to_land_ms",
  help: "Time to land ms",
  buckets: [10, 50, 100, 250, 500, 1000, 5000, 30_000, 120_000],
});

export const successTotal = counter({
  name: "rawswap_success_total",
  help: "Successful swaps",
});

export const failureTotal = counter({
  name: "rawswap_failure_total",
  help: "Failed swaps",
});

const plugin: FastifyPluginAsync = async (app) => {
  app.decorate("metricsRegistry", registry);
};

export default fp(plugin, { name: "metrics" });
