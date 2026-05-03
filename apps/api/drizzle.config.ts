import { defineConfig } from "drizzle-kit";

export default defineConfig({
  /** Drizzle Kit meta output; canonical hand-written SQL is in ./src/db/migrations (see `pnpm db:migrate`). */
  schema: "./src/db/schema/index.ts",
  out: "./src/db/migrations-generated",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
