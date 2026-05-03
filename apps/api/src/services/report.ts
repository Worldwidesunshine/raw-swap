import { desc, eq } from "drizzle-orm";
import { getDb } from "../db/index.js";
import { executions } from "../db/schema/executions.js";
import { transactionBuilds } from "../db/schema/transaction-builds.js";
import { quotes } from "../db/schema/quotes.js";
import { simulations } from "../db/schema/simulations.js";

type BuildMetadata = {
  routePlan?: unknown;
  providerAmounts?: {
    expectedOutputAmount?: string;
    minimumOutputAmount?: string;
  };
  timings?: {
    buildMs?: number;
  };
};

type QuoteRouteMetadata = {
  _rawswapQuoteMs?: number;
};

export async function getExecutionReport(executionId: string) {
  const exRows = await getDb()
    .select()
    .from(executions)
    .where(eq(executions.id, executionId))
    .limit(1);
  const ex = exRows[0];
  if (!ex) return null;

  const buildRows = await getDb()
    .select()
    .from(transactionBuilds)
    .where(eq(transactionBuilds.id, ex.buildId))
    .limit(1);
  const build = buildRows[0];
  if (!build) return null;

  const quoteRows = await getDb()
    .select()
    .from(quotes)
    .where(eq(quotes.id, build.quoteId))
    .limit(1);
  const quote = quoteRows[0];
  if (!quote) return null;
  const simRows = await getDb()
    .select()
    .from(simulations)
    .where(eq(simulations.buildId, build.id))
    .orderBy(desc(simulations.createdAt))
    .limit(1);
  const simulation = simRows[0] ?? null;

  const buildMetadata = (build.buildMetadata as BuildMetadata | null) ?? null;
  const routePlan = buildMetadata?.routePlan;
  const venues =
    Array.isArray(routePlan) && routePlan.length
      ? [
          ...new Set(
            (routePlan as { swapInfo?: { label?: string } }[])
              .map((x) => x.swapInfo?.label ?? "")
              .filter(Boolean),
          ),
        ]
      : [];
  const hops = Array.isArray(routePlan) ? routePlan.length : 0;
  const providerAmounts = buildMetadata?.providerAmounts;
  const quoteRouteMetadata =
    quote.routeJson && typeof quote.routeJson === "object"
      ? (quote.routeJson as QuoteRouteMetadata)
      : null;

  return {
    executionId: ex.id,
    signature: ex.signature,
    status: ex.status,
    inputMint: quote.inputMint,
    outputMint: quote.outputMint,
    inputAmount: quote.inputAmount,
    expectedOutputAmount: providerAmounts?.expectedOutputAmount ?? quote.expectedOutputAmount,
    actualOutputAmount: ex.actualOutputAmount,
    realizedSlippageBps: ex.realizedSlippageBps,
    priorityFeeLamports: ex.priorityFeeLamports,
    jitoTipLamports: ex.jitoTipLamports,
    quoteMs: quoteRouteMetadata?._rawswapQuoteMs ?? null,
    buildMs: buildMetadata?.timings?.buildMs ?? null,
    simulationMs: simulation?.simulationMs ?? null,
    sendMs: ex.sendLatencyMs,
    timeToLandMs: ex.timeToLandMs,
    submittedSlot: ex.submittedSlot,
    landedSlot: ex.landedSlot,
    routeSummary: { venues, hops },
  };
}
