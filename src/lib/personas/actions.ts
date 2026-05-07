"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { people } from "@/lib/db/schema";
import {
  personaIdSchema,
  personaInputSchema,
  personaUpdateSchema,
  type PersonaInput,
  type PersonaUpdate,
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

export async function createPersona(
  input: PersonaInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = personaInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  try {
    const [row] = await db
      .insert(people)
      .values({
        nombres: parsed.data.nombres,
        apellidos: parsed.data.apellidos,
        cedulaRnc: parsed.data.cedulaRnc,
        telefono: parsed.data.telefono,
        celular: parsed.data.celular,
        correo: parsed.data.correo,
        direccion: parsed.data.direccion,
        isCliente: parsed.data.isCliente,
        isEstudiante: parsed.data.isEstudiante,
        notas: parsed.data.notas,
      })
      .returning({ id: people.id });

    revalidatePath("/admin/personas");
    return { ok: true, data: { id: row.id } };
  } catch (error) {
    return {
      ok: false,
      error: errorMessage(error, "No se pudo crear la persona"),
    };
  }
}

export async function updatePersona(
  input: PersonaUpdate,
): Promise<ActionResult<{ id: string }>> {
  const parsed = personaUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  try {
    await db
      .update(people)
      .set({
        nombres: parsed.data.nombres,
        apellidos: parsed.data.apellidos,
        cedulaRnc: parsed.data.cedulaRnc,
        telefono: parsed.data.telefono,
        celular: parsed.data.celular,
        correo: parsed.data.correo,
        direccion: parsed.data.direccion,
        isCliente: parsed.data.isCliente,
        isEstudiante: parsed.data.isEstudiante,
        notas: parsed.data.notas,
        updatedAt: new Date(),
      })
      .where(eq(people.id, parsed.data.id));

    revalidatePath("/admin/personas");
    return { ok: true, data: { id: parsed.data.id } };
  } catch (error) {
    return {
      ok: false,
      error: errorMessage(error, "No se pudo actualizar la persona"),
    };
  }
}

export async function deletePersona(
  input: { id: string },
): Promise<ActionResult> {
  const parsed = personaIdSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "ID inválido" };
  }

  try {
    await db.delete(people).where(eq(people.id, parsed.data.id));
    revalidatePath("/admin/personas");
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: errorMessage(error, "No se pudo eliminar la persona"),
    };
  }
}

function errorMessage(error: unknown, fallback: string): string {
  if (
    error &&
    typeof error === "object" &&
    "message" in error &&
    typeof (error as { message: unknown }).message === "string"
  ) {
    const message = (error as { message: string }).message;
    if (message.includes("people_cedula_rnc_unique")) {
      return "Ya existe una persona con esa cédula o RNC";
    }
    return fallback;
  }
  return fallback;
}
