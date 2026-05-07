import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { paymentMethods, type PaymentMethod } from "@/lib/db/schema";

export async function listMetodosPago(): Promise<PaymentMethod[]> {
  return db.select().from(paymentMethods).orderBy(asc(paymentMethods.nombre));
}
