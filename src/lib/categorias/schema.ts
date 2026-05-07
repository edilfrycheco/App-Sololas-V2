import { z } from "zod";

const HEX_REGEX = /^#?[0-9a-fA-F]{6}$/;

export const areaCocinaValues = ["postres", "salados"] as const;
export type AreaCocinaValue = (typeof areaCocinaValues)[number];

export const categoriaInputSchema = z.object({
  nombre: z.string().trim().min(1, "Nombre es requerido").max(80),
  areaCocina: z.enum(areaCocinaValues, {
    errorMap: () => ({ message: "Selecciona el área de cocina" }),
  }),
  colorHex: z
    .string()
    .trim()
    .regex(HEX_REGEX, "Color debe ser hexadecimal de 6 dígitos (ej: #8B5CF6)")
    .transform((v) => (v.startsWith("#") ? v : `#${v}`)),
  activo: z.boolean().default(true),
});
export type CategoriaInput = z.infer<typeof categoriaInputSchema>;

export const categoriaUpdateSchema = categoriaInputSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type CategoriaUpdate = z.infer<typeof categoriaUpdateSchema>;

export const AREA_LABELS: Record<AreaCocinaValue, string> = {
  postres: "Postres",
  salados: "Picadera (Salados)",
};

export const AREA_DEFAULT_COLORS: Record<AreaCocinaValue, string> = {
  postres: "#8B5CF6",
  salados: "#F59E0B",
};
