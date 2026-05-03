import path from "node:path";
import { fileURLToPath } from "node:url";

/** Repository root (…/Raw Swap), stable regardless of `process.cwd()`. */
export const REPO_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
  "..",
  "..",
);
