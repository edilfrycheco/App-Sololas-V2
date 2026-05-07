"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { paymentMethods } from "@/lib/db/schema";
import {
  metodoPagoInputSchema,
  metodoPagoUpdateSchema,
  type MetodoPagoInput,
  type MetodoPagoUpdate,
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

export async function createMetodoPago(
  input: MetodoPagoInput,
): Promise<ActionResult<{ id: string }>> {
  const parsed = metodoPagoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    const [row] = await db
      .insert(paymentMethods)
      .values(parsed.data)
      .returning({ id: paymentMethods.id });
    revalidatePath("/admin/configuracion/metodos-pago");
    return { ok: true, data: { id: row.id } };
  } catch {
    return { ok: false, error: "No se pudo crear el método de pago" };
  }
}

export async function updateMetodoPago(
  input: MetodoPagoUpdate,
): Promise<ActionResult> {
  const parsed = metodoPagoUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }
  try {
    await db
      .update(paymentMethods)
      .set({
        nombre: parsed.data.nombre,
        requiereReferencia: parsed.data.requiereReferencia,
        activo: parsed.data.activo,
      })
      .where(eq(paymentMethods.id, parsed.data.id));
    revalidatePath("/admin/configuracion/metodos-pago");
    return { ok: true, data: undefined };
  } catch {
    return { ok: false, error: "No se pudo actualizar el método de pago" };
  }
}

export async function deleteMetodoPago(input: {
  id: string;
}): Promise<ActionResult> {
  if (!input.id) return { ok: false, error: "ID requerido" };
  try {
    await db.delete(paymentMethods).where(eq(paymentMethods.id, input.id));
    revalidatePath("/admin/configuracion/metodos-pago");
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
          "No se puede eliminar: hay pagos registrados con este método",
      };
    }
    return { ok: false, error: "No se pudo eliminar el método de pago" };
  }
}
