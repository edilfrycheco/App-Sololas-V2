import { z } from "zod";

export const ncfTypeInputSchema = z.object({
  codigo: z
    .string()
    .trim()
    .min(2, "Código es requerido")
    .max(10)
    .regex(/^[A-Z0-9]+$/i, "Solo letras y números"),
  nombre: z.string().trim().min(1, "Nombre es requerido").max(100),
  prefijo: z
    .string()
    .trim()
    .min(1, "Prefijo es requerido")
    .max(10)
    .regex(/^[A-Z0-9]+$/i, "Solo letras y números"),
  activo: z.boolean().default(true),
});
export type NcfTypeInput = z.infer<typeof ncfTypeInputSchema>;

export const ncfTypeUpdateSchema = ncfTypeInputSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type NcfTypeUpdate = z.infer<typeof ncfTypeUpdateSchema>;

const intString = (label: string) =>
  z.coerce
    .number({ invalid_type_error: `${label} debe ser un número` })
    .refine((n) => Number.isInteger(n) && n >= 0, `${label} debe ser entero ≥ 0`);

export const ncfSequenceInputSchema = z
  .object({
    ncfTypeId: z.string().uuid("Tipo de comprobante requerido"),
    secuenciaInicial: intString("Secuencia inicial"),
    secuenciaActual: intString("Secuencia actual"),
    secuenciaFinal: intString("Secuencia final"),
    fechaVencimiento: z
      .string()
      .trim()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha en formato YYYY-MM-DD")
      .optional()
      .or(z.literal("").transform(() => undefined)),
    cantidadAlertaReorden: intString("Alerta de reorden"),
    activo: z.boolean().default(true),
  })
  .refine((d) => d.secuenciaFinal >= d.secuenciaInicial, {
    message: "Final debe ser ≥ inicial",
    path: ["secuenciaFinal"],
  })
  .refine(
    (d) =>
      d.secuenciaActual >= d.secuenciaInicial &&
      d.secuenciaActual <= d.secuenciaFinal + 1,
    { message: "Actual debe estar dentro del rango", path: ["secuenciaActual"] },
  );
export type NcfSequenceInput = z.input<typeof ncfSequenceInputSchema>;

export const ncfSequenceUpdateSchema = z.object({
  id: z.string().uuid(),
  ncfTypeId: z.string().uuid("Tipo de comprobante requerido"),
  secuenciaInicial: intString("Secuencia inicial"),
  secuenciaActual: intString("Secuencia actual"),
  secuenciaFinal: intString("Secuencia final"),
  fechaVencimiento: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha en formato YYYY-MM-DD")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  cantidadAlertaReorden: intString("Alerta de reorden"),
  activo: z.boolean().default(true),
});
export type NcfSequenceUpdate = z.input<typeof ncfSequenceUpdateSchema>;

/** Formato del e-NCF: prefijo + secuencia con 8 dígitos. Ej: B02 + 5720 = B0200005720 */
export function formatNcf(prefijo: string, secuencia: number): string {
  return `${prefijo}${String(secuencia).padStart(8, "0")}`;
}
