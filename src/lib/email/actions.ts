"use server";

import { sendReciboToCliente } from "./send-recibo";

export type ReenviarReciboResult =
  | { ok: true; toEmail: string }
  | { ok: false; error: string };

export async function reenviarRecibo(
  paymentId: string,
): Promise<ReenviarReciboResult> {
  if (!paymentId) return { ok: false, error: "ID requerido" };

  const result = await sendReciboToCliente(paymentId);
  if (result.ok) {
    return { ok: true, toEmail: result.toEmail };
  }

  switch (result.reason) {
    case "not_configured":
      return {
        ok: false,
        error:
          "Correo no configurado. Agrega RESEND_API_KEY en variables de entorno.",
      };
    case "no_email":
      return {
        ok: false,
        error: "El cliente no tiene correo registrado.",
      };
    case "not_found":
      return { ok: false, error: "Recibo no encontrado." };
    default:
      return { ok: false, error: result.message };
  }
}
