import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and fill in Supabase credentials.",
  );
}

// Supabase recommends `prepare: false` when using the connection pooler.
const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
export type Db = typeof db;
