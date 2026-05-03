import { z } from "zod";
import {
  liquidityPoolEntrySchema,
  liquidityPoolsResponseSchema,
  liquidityPreviewResponseSchema,
} from "../schemas/liquidity.js";

export type LiquidityPoolEntry = z.infer<typeof liquidityPoolEntrySchema>;
export type LiquidityPoolsResponse = z.infer<typeof liquidityPoolsResponseSchema>;
export type LiquidityPreviewResponse = z.infer<typeof liquidityPreviewResponseSchema>;
