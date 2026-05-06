import { defineConfig } from "drizzle-kit";

const url = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!url) {
  // Don't throw at import time so `drizzle-kit generate` (which only needs the
  // schema) keeps working without a database. `migrate` / `push` will fail
  // explicitly if the URL is missing, which is what we want.
  console.warn(
    "[drizzle.config] DATABASE_URL / DIRECT_DATABASE_URL not set. " +
      "`generate` will work; `push`/`migrate` will fail until configured.",
  );
}

export default defineConfig({
  schema: "./src/lib/db/schema/index.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: url ?? "postgres://placeholder",
  },
  strict: true,
  verbose: true,
});
