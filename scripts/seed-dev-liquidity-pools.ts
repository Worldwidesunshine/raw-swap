import pg from "pg";

/**
 * Inserts demo rows into `liquidity_pools` for local UI/API testing.
 * Requires `DATABASE_URL` and migration `0003_liquidity_and_fees.sql` applied.
 *
 * Mint strings kept in sync with `packages/shared/src/constants/mints.ts`.
 */
const SOL_MINT = "So11111111111111111111111111111111111111112";
const RAWSWAP_MINT_PLACEHOLDER =
  "RAW111111111111111111111111111111111111111";

const POOLS: Array<{
  venue: string;
  poolAddress: string;
  feeTierBps: number;
  label: string;
}> = [
  {
    venue: "orca_whirlpool",
    poolAddress: "DevOrca1111111111111111111111111111111111",
    feeTierBps: 30,
    label: "Dev Orca RAW/SOL (stub pool id)",
  },
  {
    venue: "raydium_cpmm",
    poolAddress: "DevRaydium2222222222222222222222222222222222",
    feeTierBps: 25,
    label: "Dev Raydium RAW/SOL (stub pool id)",
  },
];

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    for (const p of POOLS) {
      await client.query(
        `INSERT INTO liquidity_pools (
          venue, chain, pool_address, mint_a, mint_b, fee_tier_bps, is_protocol_owned, metadata
        ) VALUES ($1, 'solana', $2, $3, $4, $5, true, $6::jsonb)
        ON CONFLICT (chain, venue, pool_address) DO NOTHING`,
        [
          p.venue,
          p.poolAddress,
          SOL_MINT,
          RAWSWAP_MINT_PLACEHOLDER,
          p.feeTierBps,
          JSON.stringify({ label: p.label, seededBy: "seed-dev-liquidity-pools" }),
        ],
      );
      console.log("Seeded (or skipped):", p.venue, p.poolAddress);
    }
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
