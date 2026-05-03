import { Connection } from "@solana/web3.js";
import { executeJupiterBuyback, planBuybackAmount } from "./buyback.js";
import { depositToOrcaPermanentLp } from "./deposit-orca.js";
import { depositToRaydiumPermanentLp } from "./deposit-raydium.js";
import { loadCompounderEnv } from "./env.js";
import { compounderLogJson, serializeError } from "./log.js";
import { pollFeeVaultLamports, shouldTriggerBuyback } from "./monitor.js";
import { startCompounderLoop } from "./scheduler.js";

/**
 * Fee vault → Jupiter SOL→RAWSWAP → Orca/Raydium permanent LP.
 *
 * Cycle:
 *   1. Poll fee vault balance
 *   2. If balance >= threshold (1 SOL default):
 *      a. Execute Jupiter buyback (SOL → RAWSWAP)
 *      b. Deposit to Orca permanent LP (when SDK wired)
 *      c. Deposit to Raydium permanent LP (when SDK wired)
 *   3. Sleep 60s and repeat
 */
export async function main() {
  try {
    const env = loadCompounderEnv();
    const connection = new Connection(env.SOLANA_RPC_URL, "confirmed");

    compounderLogJson("info", "compounder started", {
      nodeEnv: env.NODE_ENV,
      vault: env.PROTOCOL_FEE_VAULT,
      rawswapMint: env.RAWSWAP_MINT ?? "(not set)",
      threshold: `${(env.BUYBACK_THRESHOLD_LAMPORTS / 1e9).toFixed(2)} SOL`,
      keypair: env.compounderKeypair
        ? env.compounderKeypair.publicKey.toBase58()
        : "(read-only mode — no keypair)",
      orcaPool: env.ORCA_RAWSWAP_SOL_POOL ?? "(not set)",
      raydiumPool: env.RAYDIUM_RAWSWAP_SOL_POOL ?? "(not set)",
    });

    startCompounderLoop(async () => {
      // 1. Check fee vault balance
      const lamports = await pollFeeVaultLamports(connection, env.feeVaultPubkey);
      const solBalance = Number(lamports) / 1e9;

      compounderLogJson("info", "fee vault poll", {
        lamports: lamports.toString(),
        sol: solBalance.toFixed(4),
        threshold: (env.BUYBACK_THRESHOLD_LAMPORTS / 1e9).toFixed(2),
      });

      // 2. Check if buyback threshold met
      if (!shouldTriggerBuyback(lamports, env.BUYBACK_THRESHOLD_LAMPORTS)) {
        compounderLogJson("info", "below threshold — skipping buyback");
        return;
      }

      // 3. Plan buyback amount
      const buybackAmount = planBuybackAmount(lamports, env.BUYBACK_THRESHOLD_LAMPORTS);
      if (!buybackAmount) return;

      // 4. Execute buyback (requires keypair + RAWSWAP_MINT)
      if (!env.compounderKeypair) {
        compounderLogJson("warn", "buyback triggered but no keypair — set COMPOUNDER_KEYPAIR_PATH");
        return;
      }
      if (!env.RAWSWAP_MINT) {
        compounderLogJson("warn", "buyback triggered but no RAWSWAP_MINT — set after token deployment");
        return;
      }

      compounderLogJson("info", "buyback triggered", {
        amount: buybackAmount.toString(),
        sol: (Number(buybackAmount) / 1e9).toFixed(4),
      });

      try {
        const result = await executeJupiterBuyback({
          connection,
          compounderKeypair: env.compounderKeypair,
          rawswapMint: env.RAWSWAP_MINT,
          amountLamports: buybackAmount,
          apiKey: env.JUPITER_API_KEY,
        });

        compounderLogJson("info", "buyback completed", {
          signature: result.signature,
          inputSol: (Number(result.inputLamports) / 1e9).toFixed(4),
          outputRawswap: result.outputRawswapRaw,
          route: result.route,
        });

        // 5. Deposit to Orca LP (if pool configured)
        if (env.ORCA_RAWSWAP_SOL_POOL) {
          await depositToOrcaPermanentLp({
            connection,
            compounderKeypair: env.compounderKeypair,
            poolAddress: env.ORCA_RAWSWAP_SOL_POOL,
            rawswapAmount: result.outputRawswapRaw,
            solLamports: result.inputLamports / 2n, // Split: half goes to LP
          });
        }

        // 6. Deposit to Raydium LP (if pool configured)
        if (env.RAYDIUM_RAWSWAP_SOL_POOL) {
          await depositToRaydiumPermanentLp({
            connection,
            compounderKeypair: env.compounderKeypair,
            poolAddress: env.RAYDIUM_RAWSWAP_SOL_POOL,
            rawswapAmount: result.outputRawswapRaw,
            solLamports: result.inputLamports / 2n,
          });
        }
      } catch (err) {
        compounderLogJson("error", "buyback cycle failed", {
          err: serializeError(err),
        });
      }
    }, 60_000);
  } catch (err) {
    compounderLogJson("error", "compounder startup failed", {
      err: serializeError(err),
    });
    compounderLogJson(
      "warn",
      "compounder: set REDIS_URL, SOLANA_RPC_URL, PROTOCOL_FEE_VAULT, COMPOUNDER_KEYPAIR_PATH (see apps/compounder/README.md)",
    );
  }
}

void main();
