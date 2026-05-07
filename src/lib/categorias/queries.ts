import "server-only";
import { asc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { productCategories, type ProductCategory } from "@/lib/db/schema";

export async function listCategorias(): Promise<ProductCategory[]> {
  return db
    .select()
    .from(productCategories)
    .orderBy(asc(productCategories.areaCocina), asc(productCategories.nombre));
}
