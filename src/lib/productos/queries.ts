import "server-only";
import { and, asc, count, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  productCategories,
  products,
  type Product,
  type ProductCategory,
} from "@/lib/db/schema";

const PAGE_SIZE = 20;

export type ProductoListItem = Product & {
  categoria: Pick<ProductCategory, "id" | "nombre" | "areaCocina" | "colorHex">;
};

export interface ProductoListParams {
  area?: "postres" | "salados";
  categoryId?: string;
  search?: string;
  page?: number;
}

export interface ProductoListResult {
  items: ProductoListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listProductos({
  area,
  categoryId,
  search,
  page = 1,
}: ProductoListParams): Promise<ProductoListResult> {
  const conditions: SQL[] = [];

  if (area) conditions.push(eq(productCategories.areaCocina, area));
  if (categoryId) conditions.push(eq(products.categoryId, categoryId));

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    const searchClause = or(
      ilike(products.descripcion, term),
      ilike(products.subcategoria, term),
      ilike(productCategories.nombre, term),
    );
    if (searchClause) conditions.push(searchClause);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, totalRow] = await Promise.all([
    db
      .select({
        product: products,
        categoria: {
          id: productCategories.id,
          nombre: productCategories.nombre,
          areaCocina: productCategories.areaCocina,
          colorHex: productCategories.colorHex,
        },
      })
      .from(products)
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(whereClause)
      .orderBy(asc(products.descripcion))
      .limit(PAGE_SIZE)
      .offset(offset),
    db
      .select({ value: count() })
      .from(products)
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .where(whereClause),
  ]);

  const items: ProductoListItem[] = rows.map((r) => ({
    ...r.product,
    categoria: r.categoria,
  }));

  const total = Number(totalRow[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { items, total, page, pageSize: PAGE_SIZE, totalPages };
}

export async function listCategoriasActivas(): Promise<ProductCategory[]> {
  return db
    .select()
    .from(productCategories)
    .where(eq(productCategories.activo, true))
    .orderBy(asc(productCategories.areaCocina), asc(productCategories.nombre));
}
