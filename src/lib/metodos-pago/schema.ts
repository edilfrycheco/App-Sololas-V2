import { z } from "zod";

export const metodoPagoInputSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre es requerido").max(80),
  requiereReferencia: z.boolean().default(false),
  activo: z.boolean().default(true),
});
export type MetodoPagoInput = z.infer<typeof metodoPagoInputSchema>;

export const metodoPagoUpdateSchema = metodoPagoInputSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type MetodoPagoUpdate = z.infer<typeof metodoPagoUpdateSchema>;
