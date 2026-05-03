import pg from "pg";
import { Connection } from "@solana/web3.js";
import { parseTransactionOutput } from "@rawswap/tx-verifier";
import type { Job } from "bullmq";
import pino from "pino";
import {
  recordWorkerFailed,
  recordWorkerLanded,
  recordWorkerRetryableError,
} from "../telemetry.js";

const log = pino({ level: process.env.LOG_LEVEL ?? "info" });

function isRetryableLandingError(e: unknown): boolean {
  const msg = e instanceof Error ? e.message : String(e);
  return (
    msg.includes("ECONNRESET") ||
    msg.includes("ETIMEDOUT") ||
    msg.includes("timeout") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("socket hang up") ||
    msg.includes("503") ||
    msg.includes("429") ||
    msg.includes("Too Many Requests")
  );
}

export function createLandingMonitorFactory(): {
  processJob: (job: Job<{ executionId: string; signature: string }>) => Promise<void>;
  closePool: () => Promise<void>;
} {
  const dbUrl = process.env.DATABASE_URL;
  const rpcUrl = process.env.SOLANA_RPC_URL;
  if (!dbUrl || !rpcUrl) throw new Error("DATABASE_URL and SOLANA_RPC_URL required");

  const pool = new pg.Pool({
    connectionString: dbUrl,
    max: Number(process.env.PG_POOL_MAX ?? "8"),
    idleTimeoutMillis: 30_000,
  });
  const rpc = new Connection(rpcUrl, "confirmed");

  async function processJob(job: Job<{ executionId: string; signature: string }>) {
    const { executionId, signature } = job.data;
    try {
      const delay = () => new Promise((r) => setTimeout(r, 1_500));
      for (let i = 0; i < 240; i++) {
        const st = await rpc.getSignatureStatuses([signature], {
          searchTransactionHistory: true,
        });
        const val = st.value[0];
        const status = val?.confirmationStatus;
        if (val?.err) {
          const ex = await pool.query(
            `SELECT submitted_at, submitted_slot FROM executions WHERE id = $1`,
            [executionId],
          );
          const submittedAt = ex.rows[0]?.submitted_at
            ? new Date(ex.rows[0].submitted_at as string)
            : null;
          const submittedSlot = Number(ex.rows[0]?.submitted_slot ?? 0);
          const landedSlot = typeof val?.slot === "number" ? val.slot : null;
          const slotsToLand =
            landedSlot !== null && submittedSlot > 0 ? Math.max(landedSlot - submittedSlot, 0) : null;
          const timeToLandMs = submittedAt ? Math.max(Date.now() - submittedAt.getTime(), 0) : null;
          await pool.query(
            `UPDATE executions
             SET status = $1,
                 failure_reason = $2,
                 failed_at = NOW(),
                 landed_slot = $3,
                 slots_to_land = $4,
                 time_to_land_ms = $5,
                 raw_status_json = $6::jsonb,
                 error_code = $7,
                 updated_at = NOW()
             WHERE id = $8`,
            [
              "failed",
              JSON.stringify(val.err),
              landedSlot,
              slotsToLand,
              timeToLandMs,
              JSON.stringify(val),
              "TRANSACTION_FAILED_ONCHAIN",
              executionId,
            ],
          );
          await pool.query(
            `INSERT INTO execution_events (id, execution_id, event_type, event_json)
             VALUES (gen_random_uuid(), $1, $2, $3::jsonb)`,
            [executionId, "failed", JSON.stringify({ signature, status: val })],
          );
          recordWorkerFailed();
          return;
        }
        if (status === "finalized" || status === "confirmed") {
          const tx = await rpc.getParsedTransaction(signature, {
            maxSupportedTransactionVersion: 0,
            commitment: "confirmed",
          });
          const ex = await pool.query(
            `SELECT build_id, jito_tip_lamports, submitted_at, submitted_slot FROM executions WHERE id = $1`,
            [executionId],
          );
          const buildId = ex.rows[0]?.build_id as string;
          const jitoTipLamports = Number(ex.rows[0]?.jito_tip_lamports ?? 0);
          const submittedAt = ex.rows[0]?.submitted_at
            ? new Date(ex.rows[0].submitted_at as string)
            : null;
          const submittedSlot = Number(ex.rows[0]?.submitted_slot ?? 0);
          const q = await pool.query(
            `SELECT q.user_public_key, q.output_mint, q.expected_output_amount, b.build_metadata
             FROM transaction_builds b JOIN quotes q ON q.id = b.quote_id WHERE b.id = $1`,
            [buildId],
          );
          const row = q.rows[0];
          let actual: string | null = null;
          let slip: number | null = null;
          if (row && tx) {
            const buildMetadata =
              row.build_metadata && typeof row.build_metadata === "object"
                ? (row.build_metadata as {
                    providerAmounts?: { expectedOutputAmount?: string };
                  })
                : null;
            const parsed = parseTransactionOutput(tx as never, {
              userPublicKey: row.user_public_key,
              outputMint: row.output_mint,
              expectedOutputAmount:
                buildMetadata?.providerAmounts?.expectedOutputAmount ?? row.expected_output_amount,
              jitoTipLamports,
            });
            actual = parsed?.actualOutputAmount ?? null;
            slip = parsed?.realizedSlippageBps ?? null;
          }
          const landedSlot = typeof val?.slot === "number" ? val.slot : null;
          const slotsToLand =
            landedSlot !== null && submittedSlot > 0 ? Math.max(landedSlot - submittedSlot, 0) : null;
          const timeToLandMs = submittedAt ? Math.max(Date.now() - submittedAt.getTime(), 0) : null;
          await pool.query(
            `UPDATE executions
             SET status = $1,
                 landed_at = NOW(),
                 landed_slot = $2,
                 slots_to_land = $3,
                 time_to_land_ms = $4,
                 actual_output_amount = $5,
                 realized_slippage_bps = $6,
                 raw_status_json = $7::jsonb,
                 updated_at = NOW()
             WHERE id = $8`,
            [
              "landed",
              landedSlot,
              slotsToLand,
              timeToLandMs,
              actual,
              slip,
              JSON.stringify(val),
              executionId,
            ],
          );
          await pool.query(
            `INSERT INTO execution_events (id, execution_id, event_type, event_json)
             VALUES (gen_random_uuid(), $1, $2, $3::jsonb)`,
            [executionId, "landed", JSON.stringify({ signature, status: val, actualOutputAmount: actual })],
          );
          recordWorkerLanded();
          return;
        }
        await delay();
      }
      await pool.query(
        `UPDATE executions
         SET raw_status_json = $1::jsonb,
             updated_at = NOW()
         WHERE id = $2`,
        [JSON.stringify({ signature, reason: "timeout_waiting_for_confirmation" }), executionId],
      );
      throw new Error("landing monitor timeout waiting for confirmation");
    } catch (e) {
      log.error(e);
      if (isRetryableLandingError(e)) {
        recordWorkerRetryableError();
        throw e;
      }
      try {
        recordWorkerFailed();
        await pool.query(
          `UPDATE executions
           SET status = $1,
               failure_reason = $2,
               failed_at = NOW(),
               updated_at = NOW()
           WHERE id = $3`,
          ["failed", e instanceof Error ? e.message : String(e), executionId],
        );
      } catch (dbErr) {
        log.error(dbErr);
      }
    }
  }

  return {
    processJob,
    closePool: () => pool.end(),
  };
}
