import "server-only";
import { Resend } from "resend";

let cached: Resend | null = null;

export function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

export function getFromAddress(): string {
  const explicit = process.env.RESEND_FROM_EMAIL;
  if (explicit) return explicit;
  // Default seguro de Resend (sólo para sandbox; en producción debe configurarse
  // un dominio verificado).
  return "Solola's <onboarding@resend.dev>";
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}
