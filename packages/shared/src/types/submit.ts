import type { z } from "zod";
import type { submitRequestSchema, submitResponseSchema } from "../schemas/submit.js";

export type SubmitRequest = z.infer<typeof submitRequestSchema>;
export type SubmitResponse = z.infer<typeof submitResponseSchema>;
