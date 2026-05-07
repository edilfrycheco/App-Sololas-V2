import { z } from "zod";

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, `${label} es requerido`)
    .refine((v) => !Number.isNaN(Number(v)), `${label} debe ser un número`)
    .refine((v) => Number(v) > 0, `${label} debe ser > 0`);

const optionalString = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const registrarPagoInputSchema = z.object({
  orderId: z.string().uuid(),
  monto: numericString("Monto"),
  metodoPagoId: z.string().uuid("Método de pago requerido"),
  tipoComprobanteId: z
    .string()
    .uuid("Tipo de comprobante requerido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  numeroReferencia: optionalString(120),
  concepto: z.string().trim().min(1, "Concepto es requerido").max(80),
  generarNcf: z.boolean().default(true),
});
export type RegistrarPagoInput = z.infer<typeof registrarPagoInputSchema>;
