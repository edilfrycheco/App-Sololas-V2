import { z } from "zod";
import { isValidCedulaOrRnc, isValidRdPhone } from "@/lib/validators/rd";

const optionalString = (max = 200) =>
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
  .superRefine((value, ctx) => {
    if (!value) return;
    if (!isValidRdPhone(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Teléfono debe tener formato (809|829|849) XXX-XXXX",
      });
    }
  })
  .transform((v) => (v && v.length > 0 ? v : undefined));

const optionalCedulaRnc = z
  .string()
  .trim()
  .optional()
  .superRefine((value, ctx) => {
    if (!value) return;
    if (!isValidCedulaOrRnc(value)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cédula (11 dígitos) o RNC (9 dígitos) inválido",
      });
    }
  })
  .transform((v) => (v ? v.replace(/\D/g, "") : undefined));

export const personaInputSchema = z
  .object({
    nombres: z.string().trim().min(1, "Nombres es requerido").max(100),
    apellidos: z.string().trim().min(1, "Apellidos es requerido").max(100),
    cedulaRnc: optionalCedulaRnc,
    telefono: optionalPhone,
    celular: optionalPhone,
    correo: optionalEmail,
    direccion: optionalString(300),
    isCliente: z.boolean().default(false),
    isEstudiante: z.boolean().default(false),
    notas: optionalString(1000),
  })
  .refine((data) => data.isCliente || data.isEstudiante, {
    message: "Debe marcar al menos uno: cliente o estudiante",
    path: ["isCliente"],
  });

export type PersonaInput = z.infer<typeof personaInputSchema>;

export const personaUpdateSchema = personaInputSchema.and(
  z.object({ id: z.string().uuid() }),
);
export type PersonaUpdate = z.infer<typeof personaUpdateSchema>;

export const personaIdSchema = z.object({ id: z.string().uuid() });

export type PersonaFilter = "todos" | "clientes" | "estudiantes" | "ambos";
export const personaFilters: PersonaFilter[] = [
  "todos",
  "clientes",
  "estudiantes",
  "ambos",
];
