"use server";

import { and, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { productCategories, products } from "@/lib/db/schema";

export interface ProductoSuggestion {
  id: string;
  descripcion: string;
  precio: string;
  itbisPct: string;
  unidadMedida: string;
  imagenUrl: string | null;
  llevaIngredientes: boolean;
  categoryId: string;
  categoria: {
    nombre: string;
    areaCocina: "postres" | "salados";
    colorHex: string;
  };
}

export async function searchProductos(
  query: string,
): Promise<ProductoSuggestion[]> {
  const trimmed = query.trim();
  const conditions: SQL[] = [eq(products.activo, true)];

  if (trimmed.length > 0) {
    const term = `%${trimmed}%`;
    const matches = or(
      ilike(products.descripcion, term),
      ilike(products.subcategoria, term),
      ilike(productCategories.nombre, term),
    );
    if (matches) conditions.push(matches);
  }

  const rows = await db
    .select({
      id: products.id,
      descripcion: products.descripcion,
      precio: products.precio,
      itbisPct: products.itbisPct,
      unidadMedida: products.unidadMedida,
      imagenUrl: products.imagenUrl,
      llevaIngredientes: products.llevaIngredientes,
      categoryId: products.categoryId,
      categoryNombre: productCategories.nombre,
      categoryArea: productCategories.areaCocina,
      categoryColor: productCategories.colorHex,
    })
    .from(products)
    .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
    .where(and(...conditions))
    .limit(15);

  return rows.map((r) => ({
    id: r.id,
    descripcion: r.descripcion,
    precio: r.precio,
    itbisPct: r.itbisPct,
    unidadMedida: r.unidadMedida,
    imagenUrl: r.imagenUrl,
    llevaIngredientes: r.llevaIngredientes,
    categoryId: r.categoryId,
    categoria: {
      nombre: r.categoryNombre,
      areaCocina: r.categoryArea as "postres" | "salados",
      colorHex: r.categoryColor,
    },
  }));
}
