import { z } from "zod";
import { isValidRnc, isValidRdPhone } from "@/lib/validators/rd";

const optional = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalEmail = z
  .string()
  .trim()
  .email("Correo no válido")
  .optional()
  .or(z.literal("").transform(() => undefined));

const optionalPhone = z
  .string()
  .trim()
  .optional()
  .superRefine((v, ctx) => {
    if (!v) return;
    if (!isValidRdPhone(v)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Teléfono debe tener formato (809|829|849) XXX-XXXX",
      });
    }
  })
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalRnc = z
  .string()
  .trim()
  .optional()
  .superRefine((v, ctx) => {
    if (!v) return;
    if (!isValidRnc(v)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "RNC debe tener 9 dígitos",
      });
    }
  })
  .transform((v) => (v ? v.replace(/\D/g, "") : undefined));

export const businessSettingsSchema = z.object({
  nombreComercial: z
    .string()
    .trim()
    .min(1, "Nombre comercial es requerido")
    .max(120),
  razonSocial: optional(200),
  rnc: optionalRnc,
  direccion: optional(300),
  telefono: optionalPhone,
  correo: optionalEmail,
  logoUrl: optional(500),
  reciboTemplate: optional(2000),
});

export type BusinessSettingsInput = z.infer<typeof businessSettingsSchema>;
