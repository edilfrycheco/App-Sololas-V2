import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rellenos, type Relleno } from "@/lib/db/schema";

export async function listRellenos(): Promise<Relleno[]> {
  return db.select().from(rellenos).orderBy(asc(rellenos.nombre));
}
