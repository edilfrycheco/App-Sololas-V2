"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { productCategories } from "@/lib/db/schema";
import {
  categoriaInputSchema,
  categoriaUpdateSchema,
  type CategoriaInput,
  type CategoriaUpdate,
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

function uniqueError(error: unknown, fallback: string): string {
  const msg =
    error && typeof error === "object" && "message" in error
      ? String((error as { message: unknown }).message)
      : "";
  if (msg.includes("product_categories_area_nombre_unique")) {
    return "Ya existe una categoría con ese nombre en esa área";
  }
  return fallback;
}

export async function createCategoria(
  input: CategoriaInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = categoriaInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  try {
    const [row] = await db
      .insert(productCategories)
      .values(parsed.data)
      .returning({ id: productCategories.id });
    revalidatePath("/admin/configuracion/categorias");
    return { ok: true, data: { id: row.id } };
  } catch (error) {
    return {
      ok: false,
      error: uniqueError(error, "No se pudo crear la categoría"),
    };
  }
}

export async function updateCategoria(
  input: CategoriaUpdate,
): Promise<ActionResult> {
  const parsed = categoriaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  try {
    await db
      .update(productCategories)
      .set({
        nombre: parsed.data.nombre,
        areaCocina: parsed.data.areaCocina,
        colorHex: parsed.data.colorHex,
        activo: parsed.data.activo,
      })
      .where(eq(productCategories.id, parsed.data.id));
    revalidatePath("/admin/configuracion/categorias");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: uniqueError(error, "No se pudo actualizar la categoría"),
    };
  }
}

export async function deleteCategoria(input: {
  id: string;
}): Promise<ActionResult> {
  if (!input.id) return { ok: false, error: "ID requerido" };
  try {
    await db.delete(productCategories).where(eq(productCategories.id, input.id));
    revalidatePath("/admin/configuracion/categorias");
    return { ok: true, data: undefined };
  } catch (error) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "";
    if (msg.includes("foreign key")) {
      return {
        ok: false,
        error: "No se puede eliminar: hay productos en esta categoría",
      };
    }
    return { ok: false, error: "No se pudo eliminar la categoría" };
  }
}
