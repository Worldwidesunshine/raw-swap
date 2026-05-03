import { z } from "zod";
import {
  crossChainTransferCreateSchema,
  crossChainTransferPatchSchema,
  crossChainTransferRecordSchema,
} from "../schemas/cross-chain.js";

export type CrossChainTransferCreate = z.infer<typeof crossChainTransferCreateSchema>;
export type CrossChainTransferRecord = z.infer<typeof crossChainTransferRecordSchema>;
export type CrossChainTransferPatch = z.infer<typeof crossChainTransferPatchSchema>;
