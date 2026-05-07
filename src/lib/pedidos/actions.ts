"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db/client";
import {
  orderItems as orderItemsTable,
  orderReferences as orderReferencesTable,
  orders,
} from "@/lib/db/schema";
import {
  createOrderInputSchema,
  type CreateOrderInput,
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

function sumItems(items: CreateOrderInput["items"]) {
  let bruto = 0;
  let itbis = 0;
  for (const it of items) {
    const cantidad = Number(it.cantidad);
    const precio = Number(it.precioUnitario);
    const itbisU = Number(it.itbisUnitario || "0");
    bruto += cantidad * precio;
    itbis += cantidad * itbisU;
  }
  return {
    totalBruto: bruto.toFixed(2),
    totalItbis: itbis.toFixed(2),
    totalNeto: (bruto + itbis).toFixed(2),
  };
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<ActionResult<{ id: string; numero: number | null }>> {
  const parsed = createOrderInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  const totals = sumItems(parsed.data.items);

  try {
    const result = await db.transaction(async (tx) => {
      const [order] = await tx
        .insert(orders)
        .values({
          personId: parsed.data.personId,
          tema: parsed.data.tema,
          fechaEntrega: parsed.data.fechaEntrega,
          horaEntrega: parsed.data.horaEntrega,
          delivery: parsed.data.delivery,
          direccionDelivery: parsed.data.direccionDelivery,
          notaGeneral: parsed.data.notaGeneral,
          totalBruto: totals.totalBruto,
          totalItbis: totals.totalItbis,
          totalNeto: totals.totalNeto,
        })
        .returning({ id: orders.id, numero: orders.numero });

      if (parsed.data.items.length > 0) {
        await tx.insert(orderItemsTable).values(
          parsed.data.items.map((it) => ({
            orderId: order.id,
            productId: it.productId,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            itbisUnitario: it.itbisUnitario || "0",
            neto: it.neto,
            rellenoId: it.rellenoId,
            topping: it.topping,
            decoracion: it.decoracion,
            notas: it.notas,
          })),
        );
      }

      if (parsed.data.references.length > 0) {
        await tx.insert(orderReferencesTable).values(
          parsed.data.references.map((r) => ({
            orderId: order.id,
            productId: r.productId,
            imagenUrl: r.imagenUrl,
            nota: r.nota,
          })),
        );
      }

      return order;
    });

    revalidatePath("/admin/pedidos");
    return { ok: true, data: { id: result.id, numero: result.numero } };
  } catch (error) {
    const msg =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "No se pudo crear el pedido";
    return { ok: false, error: msg };
  }
}
