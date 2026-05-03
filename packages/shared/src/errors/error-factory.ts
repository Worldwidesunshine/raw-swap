import type { ErrorCode, RawSwapErrorShape } from "./error-codes.js";
import { ERROR_CATALOG } from "./error-codes.js";

/** Application error with a stable {@link RawSwapErrorShape} for API/clients. */
export class RawSwapError extends Error {
  public readonly shape: RawSwapErrorShape;

  constructor(code: ErrorCode, overrides: Partial<RawSwapErrorShape> = {}) {
    const base = ERROR_CATALOG[code];
    const shape: RawSwapErrorShape = { ...base, ...overrides, code };
    super(shape.message);
    this.name = "RawSwapError";
    this.shape = shape;
  }

  toJSON() {
    return this.shape;
  }
}

/** Shortcut: catalog entry for `code` plus optional structured `details` on the shape. */
export function apiError(code: ErrorCode, details?: Record<string, unknown>): RawSwapError {
  return new RawSwapError(code, details ? { details } : undefined);
}
