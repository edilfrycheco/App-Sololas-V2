"use server";

import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  orderPayments,
  orders,
  paymentMethods,
} from "@/lib/db/schema";
import { consumeNextNcf } from "@/lib/fiscal/consume-ncf";
import {
  registrarPagoInputSchema,
  type RegistrarPagoInput,
} from "./payment-schema";

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

export interface RegistrarPagoOk {
  paymentId: string;
  numeroRecibo: number;
  ncf: string | null;
  estatusPago: "pendiente" | "parcial" | "pagado";
  alertaNcfReorden: boolean;
  emailEnviado: { sent: boolean; reason?: string };
}

export async function registrarPago(
  input: RegistrarPagoInput,
): Promise<ActionResult<RegistrarPagoOk>> {
  const parsed = registrarPagoInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Datos inválidos",
      fieldErrors: flattenErrors(parsed.error),
    };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const orderRows = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, parsed.data.orderId))
        .limit(1)
        .for("update");
      const order = orderRows[0];
      if (!order) throw new Error("Pedido no encontrado");

      // Validate referencia required by payment method.
      const methodRows = await tx
        .select()
        .from(paymentMethods)
        .where(eq(paymentMethods.id, parsed.data.metodoPagoId))
        .limit(1);
      const method = methodRows[0];
      if (!method) throw new Error("Método de pago inválido");
      if (
        method.requiereReferencia &&
        !parsed.data.numeroReferencia
      ) {
        const err = new Error(
          `El método "${method.nombre}" requiere número de referencia`,
        );
        (err as { fieldKey?: string }).fieldKey = "numeroReferencia";
        throw err;
      }

      // Generate NCF if requested + ncfType provided.
      let ncfStr: string | null = null;
      let alertaNcfReorden = false;
      if (parsed.data.generarNcf && parsed.data.tipoComprobanteId) {
        const consumed = await consumeNextNcf(tx, parsed.data.tipoComprobanteId);
        ncfStr = consumed.ncf;
        alertaNcfReorden = consumed.alertaReorden;
      }

      // Insert the payment row (numero_recibo defaults to nextval('recibo_seq')).
      const [payment] = await tx
        .insert(orderPayments)
        .values({
          orderId: parsed.data.orderId,
          monto: parsed.data.monto,
          metodoPagoId: parsed.data.metodoPagoId,
          tipoComprobanteId: parsed.data.tipoComprobanteId,
          numeroComprobante: ncfStr,
          numeroReferencia: parsed.data.numeroReferencia,
        })
        .returning({
          id: orderPayments.id,
          numeroRecibo: orderPayments.numeroRecibo,
        });

      // Compute new pago status based on sum of payments vs order total.
      const sumRows = await tx
        .select({
          total: sql<string>`coalesce(sum(${orderPayments.monto}), 0)::text`,
        })
        .from(orderPayments)
        .where(eq(orderPayments.orderId, parsed.data.orderId));
      const totalPagado = Number(sumRows[0]?.total ?? "0");
      const totalNeto = Number(order.totalNeto);

      let nuevoEstatus: "pendiente" | "parcial" | "pagado" = "pendiente";
      if (totalPagado >= totalNeto && totalNeto > 0) nuevoEstatus = "pagado";
      else if (totalPagado > 0) nuevoEstatus = "parcial";

      await tx
        .update(orders)
        .set({ estatusPago: nuevoEstatus })
        .where(eq(orders.id, parsed.data.orderId));

      return {
        paymentId: payment.id,
        numeroRecibo: payment.numeroRecibo,
        ncf: ncfStr,
        estatusPago: nuevoEstatus,
        alertaNcfReorden,
      };
    });

    revalidatePath(`/admin/pedidos/${parsed.data.orderId}`);
    revalidatePath("/admin/pedidos");

    // Best-effort: enviar el recibo por correo si está configurado y el
    // cliente tiene email. No bloquea ni falla el pago si no se puede.
    let emailEnviado: { sent: boolean; reason?: string } = { sent: false };
    try {
      const { sendReciboToCliente } = await import(
        "@/lib/email/send-recibo"
      );
      const sent = await sendReciboToCliente(result.paymentId);
      emailEnviado = sent.ok
        ? { sent: true }
        : { sent: false, reason: sent.reason };
    } catch {
      emailEnviado = { sent: false, reason: "send_failed" };
    }

    return { ok: true, data: { ...result, emailEnviado } };
  } catch (error) {
    const fieldKey =
      error && typeof error === "object" && "fieldKey" in error
        ? String((error as { fieldKey: unknown }).fieldKey)
        : null;
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "No se pudo registrar el pago";
    return {
      ok: false,
      error: message,
      fieldErrors: fieldKey ? { [fieldKey]: [message] } : undefined,
    };
  }
}
