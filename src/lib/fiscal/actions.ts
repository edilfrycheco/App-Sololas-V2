"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/db/client";
import { ncfSequences, ncfTypes } from "@/lib/db/schema";
import {
  ncfSequenceInputSchema,
  ncfSequenceUpdateSchema,
  ncfTypeInputSchema,
  ncfTypeUpdateSchema,
  type NcfSequenceInput,
  type NcfSequenceUpdate,
  type NcfTypeInput,
  type NcfTypeUpdate,
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
  if (msg.includes("ncf_types_codigo_unique")) {
    return "Ya existe un tipo de comprobante con ese código";
  }
  return fallback;
}

// ─── NCF Types ─────────────────────────────────────────────────────────────

export async function createNcfType(
  input: NcfTypeInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ncfTypeInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    const [row] = await db
      .insert(ncfTypes)
      .values({
        codigo: parsed.data.codigo.toUpperCase(),
        nombre: parsed.data.nombre,
        prefijo: parsed.data.prefijo.toUpperCase(),
        activo: parsed.data.activo,
      })
      .returning({ id: ncfTypes.id });
    revalidatePath("/admin/configuracion/ncf");
    return { ok: true, data: { id: row.id } };
  } catch (error) {
    return {
      ok: false,
      error: uniqueError(error, "No se pudo crear el tipo de comprobante"),
    };
  }
}

export async function updateNcfType(
  input: NcfTypeUpdate,
): Promise<ActionResult> {
  const parsed = ncfTypeUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    await db
      .update(ncfTypes)
      .set({
        codigo: parsed.data.codigo.toUpperCase(),
        nombre: parsed.data.nombre,
        prefijo: parsed.data.prefijo.toUpperCase(),
        activo: parsed.data.activo,
      })
      .where(eq(ncfTypes.id, parsed.data.id));
    revalidatePath("/admin/configuracion/ncf");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: uniqueError(error, "No se pudo actualizar"),
    };
  }
}

export async function deleteNcfType(input: {
  id: string;
}): Promise<ActionResult> {
  if (!input.id) return { ok: false, error: "ID requerido" };
  try {
    await db.delete(ncfTypes).where(eq(ncfTypes.id, input.id));
    revalidatePath("/admin/configuracion/ncf");
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
          "No se puede eliminar: hay secuencias o pagos asociados. Considera desactivarlo.",
      };
    }
    return { ok: false, error: "No se pudo eliminar" };
  }
}

// ─── NCF Sequences ─────────────────────────────────────────────────────────

type ParsedSequence = z.output<typeof ncfSequenceInputSchema>;
type ParsedSequenceUpdate = z.output<typeof ncfSequenceUpdateSchema>;

function toSequenceRow(input: ParsedSequence | ParsedSequenceUpdate) {
  return {
    ncfTypeId: input.ncfTypeId,
    secuenciaInicial: input.secuenciaInicial,
    secuenciaActual: input.secuenciaActual,
    secuenciaFinal: input.secuenciaFinal,
    fechaVencimiento: input.fechaVencimiento,
    cantidadAlertaReorden: input.cantidadAlertaReorden,
    activo: input.activo,
  };
}

export async function createNcfSequence(
  input: NcfSequenceInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = ncfSequenceInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    const [row] = await db
      .insert(ncfSequences)
      .values(toSequenceRow(parsed.data))
      .returning({ id: ncfSequences.id });
    revalidatePath("/admin/configuracion/ncf");
    return { ok: true, data: { id: row.id } };
  } catch {
    return { ok: false, error: "No se pudo crear la secuencia" };
  }
}

export async function updateNcfSequence(
  input: NcfSequenceUpdate,
): Promise<ActionResult> {
  const parsed = ncfSequenceUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    await db
      .update(ncfSequences)
      .set(toSequenceRow(parsed.data))
      .where(eq(ncfSequences.id, parsed.data.id));
    revalidatePath("/admin/configuracion/ncf");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "No se pudo actualizar la secuencia" };
  }
}

export async function deleteNcfSequence(input: {
  id: string;
}): Promise<ActionResult> {
  if (!input.id) return { ok: false, error: "ID requerido" };
  try {
    await db.delete(ncfSequences).where(eq(ncfSequences.id, input.id));
    revalidatePath("/admin/configuracion/ncf");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "No se pudo eliminar la secuencia" };
  }
}
