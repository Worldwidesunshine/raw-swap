import { v4 as uuidv4 } from "uuid";
import { eq, and } from "drizzle-orm";
import { VersionedTransaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  type ErrorCode,
  RawSwapError,
  submitRequestSchema,
  type SubmitResponse,
} from "@rawswap/shared";
import { verifySignedTransaction, classifyRiskFlags } from "@rawswap/tx-verifier";
import { getDb } from "../db/index.js";
import { simulations } from "../db/schema/simulations.js";
import { executions } from "../db/schema/executions.js";
import { executionEvents } from "../db/schema/execution-events.js";
import { getBuildRecord } from "./build.js";
import { SolanaRpcClient } from "../clients/solana-rpc.js";
import { Connection } from "@solana/web3.js";
import { JitoJsonRpcClient } from "../clients/jito.js";
import type { Env } from "../env.js";
import { simulationDuration, submitDuration } from "../plugins/metrics.js";
import type { Queue } from "bullmq";
import { issueExecutionAccessToken } from "../utils/execution-access.js";

type SubmitRedisAdapter = {
  get(key: string): Promise<string | null>;
  setex(key: string, s: number, v: string): Promise<void>;
};

type ExecutionRow = typeof executions.$inferSelect;
type SubmissionFailureMode = "jito" | "rpc";

function inferredSubmittedVia(mode: string): SubmitResponse["submittedVia"] {
  return mode === "fallback_rpc" ? "fallback_rpc" : "jito";
}

function toSubmitResponse(
  row: ExecutionRow,
  fallbackMode: string,
  accessTokenSecret: string,
): SubmitResponse {
  return {
    executionId: row.id,
    signature: row.signature ?? "",
    bundleId: row.bundleId,
    executionAccessToken: issueExecutionAccessToken(row.id, accessTokenSecret),
    status: row.status,
    submittedVia:
      (row.submittedVia as SubmitResponse["submittedVia"] | null) ??
      inferredSubmittedVia(fallbackMode),
    submittedAt: (row.submittedAt ?? row.createdAt ?? new Date()).toISOString(),
  };
}

async function findExistingExecution(
  buildId: string,
  idempotencyKey: string,
  signature: string,
): Promise<ExecutionRow | null> {
  const byIdem = await getDb()
    .select()
    .from(executions)
    .where(and(eq(executions.buildId, buildId), eq(executions.idempotencyKey, idempotencyKey)))
    .limit(1);
  const idemRow = byIdem[0];
  if (idemRow) return idemRow;

  const bySig = await getDb()
    .select()
    .from(executions)
    .where(eq(executions.signature, signature))
    .limit(1);
  return bySig[0] ?? null;
}

async function getExecutionById(executionId: string): Promise<ExecutionRow | null> {
  const rows = await getDb().select().from(executions).where(eq(executions.id, executionId)).limit(1);
  return rows[0] ?? null;
}

async function queueLandingMonitor(
  landingQueue: Queue,
  executionId: string,
  signature: string,
): Promise<void> {
  await landingQueue.add(
    "poll",
    { executionId, signature },
    {
      jobId: `landing:${executionId}`,
      attempts: 10,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { count: 100 },
    },
  );
}

function signedTxSignature(signed: VersionedTransaction): string {
  const sig = signed.signatures[0];
  if (!sig || sig.every((b) => b === 0)) {
    throw new RawSwapError("WALLET_SIGNING_FAILED");
  }
  return bs58.encode(sig);
}

function isSubmissionFailureCode(code: ErrorCode): code is "JITO_SUBMIT_FAILED" | "RPC_FALLBACK_FAILED" {
  return code === "JITO_SUBMIT_FAILED" || code === "RPC_FALLBACK_FAILED";
}

export function normalizeSubmissionFailure(
  error: unknown,
  mode: SubmissionFailureMode,
): RawSwapError {
  if (error instanceof RawSwapError) {
    const rawSwapError = error as RawSwapError;
    if (isSubmissionFailureCode(rawSwapError.shape.code)) {
      return rawSwapError;
    }
  }
  return new RawSwapError(mode === "rpc" ? "RPC_FALLBACK_FAILED" : "JITO_SUBMIT_FAILED", {
    details: { cause: String(error) },
  });
}

async function markExecutionFailed(
  executionId: string,
  error: RawSwapError,
  failureReason: string,
) {
  await getDb()
    .update(executions)
    .set({
      status: "failed",
      failedAt: new Date(),
      failureReason,
      errorCode: error.shape.code,
    })
    .where(eq(executions.id, executionId));
}

async function reconcileExecutionFromChain(
  row: ExecutionRow,
  rpc: SolanaRpcClient,
  landingQueue: Queue,
): Promise<ExecutionRow | null> {
  if (!row.signature) return null;
  const statuses = await rpc.getSignatureStatuses([row.signature]);
  const observed = statuses.value[0];
  if (!observed) return null;

  if (observed.err) {
    await getDb()
      .update(executions)
      .set({
        status: "failed",
        failedAt: new Date(),
        failureReason: JSON.stringify(observed.err),
        errorCode: "TRANSACTION_FAILED_ONCHAIN",
        rawStatusJson: observed,
      })
      .where(eq(executions.id, row.id));
    return await getExecutionById(row.id);
  }

  if (row.status !== "submitted" && row.status !== "landed") {
    await getDb()
      .update(executions)
      .set({
        status: "submitted",
        submittedAt: row.submittedAt ?? new Date(),
        rawStatusJson: observed,
      })
      .where(eq(executions.id, row.id));
  }
  await queueLandingMonitor(landingQueue, row.id, row.signature).catch(() => {});
  return await getExecutionById(row.id);
}

export async function submitSignedTransaction(
  body: unknown,
  env: Env,
  redisGetter: () => SubmitRedisAdapter,
  landingQueue: Queue,
): Promise<SubmitResponse> {
  const parsed = submitRequestSchema.safeParse(body);
  if (!parsed.success) {
    throw new RawSwapError("INVALID_REQUEST", {
      message: "Submit request body is invalid.",
      details: { issues: parsed.error.flatten() },
    });
  }

  const { buildId, signedTransactionBase64, executionMode, allowFallback, idempotencyKey } =
    parsed.data;

  const build = await getBuildRecord(buildId);
  if (!build) throw new RawSwapError("BUILD_NOT_FOUND");
  if (build.expiresAt < new Date()) throw new RawSwapError("QUOTE_EXPIRED");

  let signed: VersionedTransaction;
  try {
    signed = VersionedTransaction.deserialize(Buffer.from(signedTransactionBase64, "base64"));
  } catch {
    throw new RawSwapError("WALLET_SIGNING_FAILED");
  }

  const verify = verifySignedTransaction(signed, {
    transactionMessageHash: build.transactionMessageHash,
    userPublicKey: build.userPublicKey,
    unsignedTransactionBase64: build.unsignedTransactionBase64,
  });
  if (!verify.ok) throw new RawSwapError("SIGNED_TX_MESSAGE_MISMATCH");
  if (build.executionMode !== executionMode) {
    throw new RawSwapError("BUILD_FAILED", {
      message: "Submit request does not match the build execution mode.",
      retryable: false,
    });
  }

  const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");
  const rpc = new SolanaRpcClient(connection);
  const signature = signedTxSignature(signed);
  let executionRow = await findExistingExecution(buildId, idempotencyKey, signature);
  if (executionRow) {
    if (
      executionRow.status === "failed" ||
      executionRow.status === "simulation_failed" ||
      executionRow.status === "landed"
    ) {
      return toSubmitResponse(executionRow, build.executionMode, env.executionAccessTokenSecret);
    }
    if (executionRow.status === "submitted" || executionRow.status === "unknown") {
      if (executionRow.signature) {
        await queueLandingMonitor(landingQueue, executionRow.id, executionRow.signature).catch(() => {});
      }
      const repaired = await reconcileExecutionFromChain(executionRow, rpc, landingQueue).catch(
        () => null,
      );
      return toSubmitResponse(
        repaired ?? executionRow,
        build.executionMode,
        env.executionAccessTokenSecret,
      );
    }

    const repaired = await reconcileExecutionFromChain(executionRow, rpc, landingQueue).catch(
      () => null,
    );
    if (
      repaired &&
      (repaired.status === "submitted" ||
        repaired.status === "failed" ||
        repaired.status === "landed")
    ) {
      return toSubmitResponse(repaired, build.executionMode, env.executionAccessTokenSecret);
    }
  } else {
    const executionId = uuidv4();
    try {
      await getDb().insert(executions).values({
        id: executionId,
        buildId,
        idempotencyKey,
        signature,
        bundleId: null,
        signedTransactionBase64,
        signedMessageHash: build.transactionMessageHash,
        status: "verified",
        submittedVia: null,
        submittedAt: null,
        priorityFeeLamports: build.estimatedPriorityFeeLamports,
        jitoTipLamports: build.estimatedJitoTipLamports,
        protocolFeeLamports: build.estimatedProtocolBuybackFeeLamports ?? null,
        treasuryFeeLamports: build.estimatedProtocolTreasuryFeeLamports ?? null,
      });
      executionRow = await getExecutionById(executionId);
    } catch (e: unknown) {
      const pgErr = e as { code?: string };
      if (pgErr.code === "23505") {
        executionRow = await findExistingExecution(buildId, idempotencyKey, signature);
      } else {
        throw e;
      }
    }
  }
  if (!executionRow) {
    throw new RawSwapError("UNKNOWN_EXECUTION_ERROR", {
      message: "Execution record could not be created.",
      retryable: true,
    });
  }
  if (
    executionRow.status === "failed" ||
    executionRow.status === "simulation_failed" ||
    executionRow.status === "landed"
  ) {
    return toSubmitResponse(executionRow, build.executionMode, env.executionAccessTokenSecret);
  }
  if (executionRow.status === "submitted" || executionRow.status === "unknown") {
    if (executionRow.signature) {
      await queueLandingMonitor(landingQueue, executionRow.id, executionRow.signature).catch(() => {});
    }
    const repaired = await reconcileExecutionFromChain(executionRow, rpc, landingQueue).catch(
      () => null,
    );
    return toSubmitResponse(
      repaired ?? executionRow,
      build.executionMode,
      env.executionAccessTokenSecret,
    );
  }
  const repairedAfterCreate = await reconcileExecutionFromChain(
    executionRow,
    rpc,
    landingQueue,
  ).catch(() => null);
  if (
    repairedAfterCreate &&
    (repairedAfterCreate.status === "submitted" ||
      repairedAfterCreate.status === "failed" ||
      repairedAfterCreate.status === "landed")
  ) {
    return toSubmitResponse(
      repairedAfterCreate,
      build.executionMode,
      env.executionAccessTokenSecret,
    );
  }
  const executionId = executionRow.id;

  if (executionRow.status !== "simulated") {
    const simStart = Date.now();
    const sim = await rpc.simulateTransaction(signedTransactionBase64, { sigVerify: true });
    simulationDuration.observe({}, Date.now() - simStart);
    const risk = classifyRiskFlags({
      err: sim.err,
      unitsConsumed: sim.unitsConsumed,
      logs: sim.logs ?? undefined,
    });
    const simId = uuidv4();
    await getDb().insert(simulations).values({
      id: simId,
      buildId,
      ok: !sim.err,
      unitsConsumed: sim.unitsConsumed ?? null,
      errorJson: sim.err ?? null,
      logs: sim.logs ?? [],
      riskFlags: risk,
      simulationMs: Date.now() - simStart,
      simulatedTransactionHash: null,
    });

    if (sim.err) {
      await getDb()
        .update(executions)
        .set({
          status: "simulation_failed",
          failedAt: new Date(),
          failureReason: JSON.stringify(sim.err),
          errorCode: "SIMULATION_FAILED",
        })
        .where(eq(executions.id, executionId));
      throw new RawSwapError("SIMULATION_FAILED", { details: { logs: sim.logs } });
    }

    await getDb()
      .update(executions)
      .set({
        status: "simulated",
      })
      .where(eq(executions.id, executionId));
  }

  const submitStart = Date.now();

  const redis = redisGetter();
  const jito = new JitoJsonRpcClient(env.effectiveJitoBlockEngineUrl, redis);

  let bundleId: string | null = null;
  let submittedVia: SubmitResponse["submittedVia"] = "jito";
  const submittedAt = new Date();

  try {
    if (build.executionMode === "jito_single_tx" || build.executionMode === "jito_bundle_only") {
      const res = await jito.sendTransaction(signedTransactionBase64, {
        bundleOnly: build.executionMode === "jito_bundle_only",
      });
      bundleId = res.bundleId;
      if (res.signature !== signature) {
        throw new RawSwapError("JITO_SUBMIT_FAILED", {
          message: "Submit provider returned a signature that does not match the signed transaction.",
        });
      }
    } else {
      const rpcSignature = await rpc.sendRawTransaction(signedTransactionBase64);
      if (rpcSignature !== signature) {
        throw new RawSwapError("RPC_FALLBACK_FAILED", {
          message: "RPC returned a signature that does not match the signed transaction.",
        });
      }
      submittedVia = "fallback_rpc";
    }
  } catch (e) {
    if (allowFallback && build.executionMode === "jito_single_tx") {
      try {
        const rpcSignature = await rpc.sendRawTransaction(signedTransactionBase64);
        if (rpcSignature !== signature) {
          throw new RawSwapError("RPC_FALLBACK_FAILED", {
            message: "RPC returned a signature that does not match the signed transaction.",
          });
        }
        submittedVia = "fallback_rpc";
      } catch (fallbackError) {
        const submissionError = normalizeSubmissionFailure(fallbackError, "rpc");
        await markExecutionFailed(
          executionId,
          submissionError,
          JSON.stringify({
            primaryCause: String(e),
            fallbackCause: String(fallbackError),
          }),
        );
        throw submissionError;
      }
    } else {
      const submissionError = normalizeSubmissionFailure(
        e,
        build.executionMode === "fallback_rpc" ? "rpc" : "jito",
      );
      await markExecutionFailed(executionId, submissionError, String(e));
      throw submissionError;
    }
  }

  const sendLatencyMs = Date.now() - submitStart;
  submitDuration.observe({}, sendLatencyMs);
  const submittedSlot = await rpc.getSlot().catch(() => null);

  await getDb()
    .update(executions)
    .set({
      bundleId,
      status: "submitted",
      submittedVia,
      submittedAt,
      submittedSlot,
      sendLatencyMs,
    })
    .where(eq(executions.id, executionId))
    .catch(() => {});

  await getDb()
    .insert(executionEvents)
    .values({
      id: uuidv4(),
      executionId,
      eventType: "submitted",
      eventJson: { submittedVia, signature, bundleId },
    })
    .catch(() => {});

  await queueLandingMonitor(landingQueue, executionId, signature).catch(() => {});

  return {
    executionId,
    signature,
    bundleId,
    executionAccessToken: issueExecutionAccessToken(executionId, env.executionAccessTokenSecret),
    status: "submitted",
    submittedVia,
    submittedAt: submittedAt.toISOString(),
  };
}
