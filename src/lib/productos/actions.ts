"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { products } from "@/lib/db/schema";
import {
  productoInputSchema,
  productoUpdateSchema,
  type ProductoInput,
  type ProductoUpdate,
} from "./schema";

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

function flattenErrors(error: import("zod").ZodError): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    fieldErrors[key] = fieldErrors[key] ?? [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

function toRow(input: ProductoInput) {
  return {
    descripcion: input.descripcion,
    categoryId: input.categoryId,
    subcategoria: input.subcategoria,
    precio: input.precio,
    costo: input.costo,
    itbisPct: input.itbisPct,
    unidadMedida: input.unidadMedida,
    cantidadReorden: input.cantidadReorden,
    llevaIngredientes: input.llevaIngredientes,
    imagenUrl: input.imagenUrl,
    activo: input.activo,
  };
}

export async function createProducto(
  input: ProductoInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = productoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    const [row] = await db
      .insert(products)
      .values(toRow(parsed.data))
      .returning({ id: products.id });
    revalidatePath("/admin/productos");
    return { ok: true, data: { id: row.id } };
  } catch {
    return { ok: false, error: "No se pudo crear el producto" };
  }
}

export async function updateProducto(
  input: ProductoUpdate,
): Promise<ActionResult> {
  const parsed = productoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    await db
      .update(products)
      .set(toRow(parsed.data))
      .where(eq(products.id, parsed.data.id));
    revalidatePath("/admin/productos");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "No se pudo actualizar el producto" };
  }
}

export async function deleteProducto(input: {
  id: string;
}): Promise<ActionResult> {
  if (!input.id) return { ok: false, error: "ID requerido" };
  try {
    await db.delete(products).where(eq(products.id, input.id));
    revalidatePath("/admin/productos");
    return { ok: true, data: undefined };
  } catch (error) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
    if (msg.includes("foreign key")) {
      return {
        ok: false,
        error:
          "No se puede eliminar: hay pedidos con este producto. Considera marcarlo como inactivo.",
      };
    }
    return { ok: false, error: "No se pudo eliminar el producto" };
  }
}
