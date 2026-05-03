import type { FastifyReply, FastifyRequest } from "fastify";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { RawSwapError } from "@rawswap/shared";
import { statusCodeForRawSwapError } from "../utils/http-status.js";

function statusFromError(error: Error): number {
  if ("statusCode" in error && typeof (error as { statusCode?: unknown }).statusCode === "number") {
    return (error as { statusCode: number }).statusCode;
  }
  return 500;
}

const errorHandlerPluginImpl: FastifyPluginAsync = async (app) => {
  app.setErrorHandler(
    (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof RawSwapError) {
        const rawSwapError = error as RawSwapError;
        const status = statusCodeForRawSwapError(rawSwapError.shape.code);
        return reply.status(status).send(rawSwapError.shape);
      }
      request.log.error(error);
      const safeMessage =
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred."
          : error.message;
      return reply.status(statusFromError(error)).send({
        code: "UNKNOWN_EXECUTION_ERROR",
        message: safeMessage,
        retryable: false,
        userAction: "Try again or contact support.",
      });
    },
  );
};

export const errorHandlerPlugin = fp(errorHandlerPluginImpl, { name: "error-handler" });
export default errorHandlerPlugin;
