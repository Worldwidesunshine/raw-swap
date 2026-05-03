import type { FastifyPluginAsync } from "fastify";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";

let sdk: NodeSDK | null = null;

const plugin: FastifyPluginAsync = async (app) => {
  if (process.env.OTEL_SDK_DISABLED === "1") return;
  if (!process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    app.log.info("OpenTelemetry: disabled (set OTEL_EXPORTER_OTLP_ENDPOINT to enable export)");
    return;
  }

  sdk = new NodeSDK({
    instrumentations: [
      getNodeAutoInstrumentations({
        "@opentelemetry/instrumentation-fs": { enabled: false },
      }),
    ],
  });
  sdk.start();
  app.log.info({ endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT }, "OpenTelemetry SDK started");

  app.addHook("onClose", async () => {
    if (sdk) {
      await sdk.shutdown();
      sdk = null;
    }
  });
};

export default plugin;
