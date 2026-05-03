import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { Env } from "../env.js";
import { getExecutionReport } from "../services/report.js";
import { hasExecutionAccess, readExecutionAccessToken } from "../utils/execution-access.js";

const executionIdSchema = z.string().uuid();

const plugin: FastifyPluginAsync<{ env: Env }> = async (app, opts) => {
  app.get<{ Params: { executionId: string } }>("/report/:executionId", async (request, reply) => {
    if (!executionIdSchema.safeParse(request.params.executionId).success) {
      return reply.status(404).send({
        code: "NOT_FOUND",
        message: "Execution not found.",
      });
    }
    if (
      !hasExecutionAccess(
        request.params.executionId,
        readExecutionAccessToken(request),
        opts.env.executionAccessTokenSecret,
      )
    ) {
      return reply.status(404).send({
        code: "NOT_FOUND",
        message: "Execution not found.",
      });
    }
    const row = await getExecutionReport(request.params.executionId);
    if (!row) {
      return reply.status(404).send({
        code: "NOT_FOUND",
        message: "Execution not found.",
      });
    }
    return row;
  });
};

export default plugin;
