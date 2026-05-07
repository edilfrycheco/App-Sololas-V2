"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { businessSettings } from "@/lib/db/schema";
import {
  businessSettingsSchema,
  type BusinessSettingsInput,
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

export async function saveBusinessSettings(
  input: BusinessSettingsInput,
): Promise<ActionResult> {
  const parsed = businessSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  try {
    const existing = await db
      .select({ id: businessSettings.id })
      .from(businessSettings)
      .where(eq(businessSettings.singleton, "singleton"))
      .limit(1);

    if (existing[0]) {
      await db
        .update(businessSettings)
        .set({
          nombreComercial: parsed.data.nombreComercial,
          razonSocial: parsed.data.razonSocial,
          rnc: parsed.data.rnc,
          direccion: parsed.data.direccion,
          telefono: parsed.data.telefono,
          correo: parsed.data.correo,
          logoUrl: parsed.data.logoUrl,
          reciboTemplate: parsed.data.reciboTemplate,
          updatedAt: new Date(),
        })
        .where(eq(businessSettings.id, existing[0].id));
    } else {
      await db.insert(businessSettings).values({
        nombreComercial: parsed.data.nombreComercial,
        razonSocial: parsed.data.razonSocial,
        rnc: parsed.data.rnc,
        direccion: parsed.data.direccion,
        telefono: parsed.data.telefono,
        correo: parsed.data.correo,
        logoUrl: parsed.data.logoUrl,
        reciboTemplate: parsed.data.reciboTemplate,
      });
    }

    revalidatePath("/admin/configuracion");
    return { ok: true, data: undefined };
  } catch (error) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "No se pudo guardar la configuración";
    return { ok: false, error: msg };
  }
}
