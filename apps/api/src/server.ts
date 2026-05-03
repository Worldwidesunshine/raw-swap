import { buildApp } from "./app.js";
import { loadEnv } from "./env.js";

async function main() {
  const env = loadEnv();
  const app = await buildApp(env);
  await app.listen({ port: env.PORT, host: "0.0.0.0" });

  const shutdown = async (signal: string) => {
    app.log.info({ signal }, "shutting down");
    try {
      await app.close();
    } finally {
      process.exit(0);
    }
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
