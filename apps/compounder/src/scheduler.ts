import { compounderLogJson, serializeError } from "./log.js";

/**
 * Periodic compounder tick with overlap protection (one run at a time).
 */
export function startCompounderLoop(
  callback: () => Promise<void>,
  intervalMs: number,
  opts?: { unref?: boolean },
): { stop(): void } {
  let running = false;
  const id = setInterval(() => {
    if (running) return;
    running = true;
    void callback()
      .catch((err: unknown) => {
        compounderLogJson("error", "compounder loop tick failed", { err: serializeError(err) });
      })
      .finally(() => {
        running = false;
      });
  }, intervalMs);

  if (opts?.unref && typeof id.unref === "function") {
    id.unref();
  }

  return {
    stop() {
      clearInterval(id);
    },
  };
}
