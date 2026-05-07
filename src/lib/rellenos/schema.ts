import { z } from "zod";

const optionalDescription = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => (v && v.length > 0 ? v : undefined));

export const rellenoInputSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre es requerido").max(80),
  descripcion: optionalDescription,
  activo: z.boolean().default(true),
});
export type RellenoInput = z.infer<typeof rellenoInputSchema>;

export const rellenoUpdateSchema = rellenoInputSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type RellenoUpdate = z.infer<typeof rellenoUpdateSchema>;
