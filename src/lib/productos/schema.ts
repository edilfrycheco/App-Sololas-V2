import { z } from "zod";

const optionalString = (max = 200) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, `${label} es requerido`)
    .refine((v) => !Number.isNaN(Number(v)), `${label} debe ser un número`)
    .refine((v) => Number(v) >= 0, `${label} debe ser ≥ 0`);

const optionalNumericString = z
  .string()
  .trim()
  .optional()
  .superRefine((v, ctx) => {
    if (!v) return;
    if (Number.isNaN(Number(v))) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe ser un número",
      });
      return;
    }
    if (Number(v) < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe ser ≥ 0",
      });
    }
  })
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalInt = z
  .union([z.string(), z.number()])
  .optional()
  .superRefine((v, ctx) => {
    if (v === undefined || v === "") return;
    const n = Number(v);
    if (!Number.isInteger(n) || n < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Debe ser un entero ≥ 0",
      });
    }
  })
  .transform((v) => {
    if (v === undefined || v === "") return undefined;
    return Number(v);
  });

export const productoInputSchema = z.object({
  descripcion: z
    .string()
    .trim()
    .min(1, "Descripción es requerida")
    .max(200),
  categoryId: z.string().uuid("Categoría es requerida"),
  subcategoria: optionalString(80),
  precio: numericString("Precio"),
  costo: optionalNumericString,
  itbisPct: numericString("ITBIS %"),
  unidadMedida: z.string().trim().min(1, "Unidad es requerida").max(40),
  cantidadReorden: optionalInt,
  llevaIngredientes: z.boolean().default(false),
  imagenUrl: optionalString(500),
  activo: z.boolean().default(true),
});
export type ProductoInput = z.infer<typeof productoInputSchema>;

export const productoUpdateSchema = productoInputSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type ProductoUpdate = z.infer<typeof productoUpdateSchema>;
