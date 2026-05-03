import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL required");

  const migrationsDir = path.join(__dirname, "../apps/api/src/db/migrations");
  const files = readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS _rawswap_migrations (
        filename TEXT PRIMARY KEY,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    for (const f of files) {
      const applied = await client.query(`SELECT 1 FROM _rawswap_migrations WHERE filename = $1`, [
        f,
      ]);
      if (applied.rowCount) {
        console.log("Skip (already applied):", f);
        continue;
      }
      const sqlPath = path.join(migrationsDir, f);
      const sql = readFileSync(sqlPath, "utf8");
      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(`INSERT INTO _rawswap_migrations (filename) VALUES ($1)`, [f]);
        await client.query("COMMIT");
        console.log("Applied migration:", f);
      } catch (e) {
        await client.query("ROLLBACK");
        throw e;
      }
    }
  } finally {
    await client.end();
  }
  console.log("Migrations complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
