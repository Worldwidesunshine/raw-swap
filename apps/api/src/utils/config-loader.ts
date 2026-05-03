import { readFileSync } from "node:fs";

/** `filePath` should be absolute or resolved against a stable root (see `REPO_ROOT`). */
export function loadJsonConfig<T>(filePath: string): T {
  return JSON.parse(readFileSync(filePath, "utf8")) as T;
}
