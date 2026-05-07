"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { rellenos } from "@/lib/db/schema";
import {
  rellenoInputSchema,
  rellenoUpdateSchema,
  type RellenoInput,
  type RellenoUpdate,
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
  if (msg.includes("rellenos_nombre_unique")) {
    return "Ya existe un relleno con ese nombre";
  }
  return fallback;
}

export async function createRelleno(
  input: RellenoInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = rellenoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    const [row] = await db
      .insert(rellenos)
      .values(parsed.data)
      .returning({ id: rellenos.id });
    revalidatePath("/admin/configuracion/rellenos");
    return { ok: true, data: { id: row.id } };
  } catch (error) {
    return {
      ok: false,
      error: uniqueError(error, "No se pudo crear el relleno"),
    };
  }
}

export async function updateRelleno(
  input: RellenoUpdate,
): Promise<ActionResult> {
  const parsed = rellenoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    await db
      .update(rellenos)
      .set({
        nombre: parsed.data.nombre,
        descripcion: parsed.data.descripcion,
        activo: parsed.data.activo,
      })
      .where(eq(rellenos.id, parsed.data.id));
    revalidatePath("/admin/configuracion/rellenos");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: uniqueError(error, "No se pudo actualizar el relleno"),
    };
  }
}

export async function deleteRelleno(input: { id: string }): Promise<ActionResult> {
  if (!input.id) return { ok: false, error: "ID requerido" };
  try {
    await db.delete(rellenos).where(eq(rellenos.id, input.id));
    revalidatePath("/admin/configuracion/rellenos");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "No se pudo eliminar el relleno" };
  }
}
