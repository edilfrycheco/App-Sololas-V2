import "server-only";
import { renderToBuffer } from "@react-pdf/renderer";
import { getReciboData } from "@/lib/recibo/data";
import { ReciboPdf } from "@/lib/recibo/recibo-pdf";
import { getFromAddress, getResend, isEmailConfigured } from "./client";

export type SendReciboResult =
  | { ok: true; emailId: string | null; toEmail: string }
  | { ok: false; reason: "not_configured" | "no_email" | "not_found" | "send_failed"; message: string };

/**
 * Genera el PDF del recibo y lo envía por correo al cliente del pedido,
 * con el asunto "Recibo No. X · Solola's" y un cuerpo HTML simple.
 *
 * No falla la transacción del pago si esto falla — la idea es que el
 * pago ya quedó registrado y el correo es best-effort.
 */
export async function sendReciboToCliente(
  paymentId: string,
): Promise<SendReciboResult> {
  if (!isEmailConfigured()) {
    return {
      ok: false,
      reason: "not_configured",
      message: "RESEND_API_KEY no está configurado",
    };
  }

  const data = await getReciboData(paymentId);
  if (!data) {
    return {
      ok: false,
      reason: "not_found",
      message: "Recibo no encontrado",
    };
  }

  if (!data.cliente.correo) {
    return {
      ok: false,
      reason: "no_email",
      message: "El cliente no tiene correo registrado",
    };
  }

  const resend = getResend();
  if (!resend) {
    return {
      ok: false,
      reason: "not_configured",
      message: "Cliente Resend no inicializado",
    };
  }

  const pdfBuffer = await renderToBuffer(<ReciboPdf data={data} />);

  const subject = `Recibo No. ${data.numeroRecibo} · ${data.negocio.nombreComercial}`;
  const html = renderEmailHtml(data);
  const text = renderEmailText(data);

  try {
    const result = await resend.emails.send({
      from: getFromAddress(),
      to: data.cliente.correo,
      subject,
      html,
      text,
      attachments: [
        {
          filename: `recibo-${data.numeroRecibo}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    if (result.error) {
      return {
        ok: false,
        reason: "send_failed",
        message: result.error.message ?? "Resend devolvió error",
      };
    }

    return {
      ok: true,
      emailId: result.data?.id ?? null,
      toEmail: data.cliente.correo,
    };
  } catch (error) {
    const message =
      error && typeof error === "object" && "message" in error
        ? String((error as { message: unknown }).message)
        : "Error desconocido";
    return { ok: false, reason: "send_failed", message };
  }
}

function renderEmailText(data: import("@/lib/recibo/data").ReciboData): string {
  return [
    `¡Gracias por tu compra, ${data.cliente.nombre}!`,
    ``,
    `Adjuntamos el recibo No. ${data.numeroRecibo} de tu pago en ${data.negocio.nombreComercial}.`,
    data.numeroPedido ? `Pedido: #${data.numeroPedido}` : null,
    data.tema ? `Tema: ${data.tema}` : null,
    ``,
    `Total: RD$ ${data.total.toFixed(2)}`,
    `Recibido: RD$ ${data.recibido.toFixed(2)}`,
    data.balance > 0 ? `Balance pendiente: RD$ ${data.balance.toFixed(2)}` : "Pagado en su totalidad.",
    ``,
    `${data.negocio.nombreComercial}`,
    data.negocio.direccion,
    data.negocio.telefono,
    data.negocio.correo,
  ]
    .filter(Boolean)
    .join("\n");
}

function renderEmailHtml(data: import("@/lib/recibo/data").ReciboData): string {
  return `
<!DOCTYPE html>
<html lang="es">
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0a0a0a;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.06);">
        <tr>
          <td style="background:#1A6BB8;color:#fff;padding:24px;">
            <div style="font-size:22px;font-weight:700;letter-spacing:-0.01em;">${escapeHtml(data.negocio.nombreComercial)}</div>
            <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;opacity:.85;margin-top:2px;">${escapeHtml(data.negocio.tagline)}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <p style="margin:0 0 12px 0;font-size:15px;">¡Hola <strong>${escapeHtml(data.cliente.nombre)}</strong>!</p>
            <p style="margin:0 0 16px 0;font-size:14px;line-height:1.55;color:#374151;">
              Adjuntamos el <strong>recibo No. ${data.numeroRecibo}</strong> de tu pago.
              ${data.numeroPedido ? `Corresponde al pedido <strong>#${data.numeroPedido}</strong>.` : ""}
              ${data.tema ? `Tema: <em>${escapeHtml(data.tema)}</em>.` : ""}
            </p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#eef6fc;border-radius:8px;padding:14px;margin:12px 0;">
              <tr><td style="font-size:13px;color:#114676;">Total del pedido</td><td align="right" style="font-size:14px;font-weight:600;color:#0a0a0a;">RD$ ${data.total.toFixed(2)}</td></tr>
              <tr><td style="font-size:13px;color:#114676;padding-top:4px;">Recibido</td><td align="right" style="font-size:14px;font-weight:600;color:#10b981;padding-top:4px;">RD$ ${data.recibido.toFixed(2)}</td></tr>
              ${
                data.balance > 0
                  ? `<tr><td style="font-size:13px;color:#114676;padding-top:4px;">Balance pendiente</td><td align="right" style="font-size:14px;font-weight:600;color:#b45309;padding-top:4px;">RD$ ${data.balance.toFixed(2)}</td></tr>`
                  : `<tr><td colspan="2" align="center" style="padding-top:8px;"><span style="background:#10b981;color:#fff;font-size:11px;font-weight:600;padding:3px 8px;border-radius:999px;text-transform:uppercase;letter-spacing:0.5px;">Pagado</span></td></tr>`
              }
            </table>
            ${data.ncf ? `<p style="margin:12px 0;font-size:12px;color:#6b7280;">e-NCF: <strong style="font-family:monospace;color:#0a0a0a;">${escapeHtml(data.ncf)}</strong></p>` : ""}
            <p style="margin:16px 0 0 0;font-size:13px;color:#374151;">
              Encontrarás el detalle completo en el PDF adjunto.
            </p>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
            <strong style="color:#114676;">${escapeHtml(data.negocio.nombreComercial)}</strong><br />
            ${escapeHtml(data.negocio.direccion)}<br />
            ${escapeHtml(data.negocio.telefono)}<br />
            <a href="mailto:${escapeHtml(data.negocio.correo)}" style="color:#1A6BB8;">${escapeHtml(data.negocio.correo)}</a>
          </td>
        </tr>
      </table>
      <p style="font-size:11px;color:#9ca3af;margin:16px 0 0 0;">
        Este correo fue generado automáticamente al registrar tu pago.
      </p>
    </td></tr>
  </table>
</body>
</html>
  `.trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
