import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { businessSettings, type BusinessSettings } from "@/lib/db/schema";

export async function getBusinessSettings(): Promise<BusinessSettings | null> {
  const rows = await db
    .select()
    .from(businessSettings)
    .where(eq(businessSettings.singleton, "singleton"))
    .limit(1);
  return rows[0] ?? null;
}
