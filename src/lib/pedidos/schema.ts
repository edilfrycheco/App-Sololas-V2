import { z } from "zod";

const numericString = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v.length > 0, `${label} es requerido`)
    .refine((v) => !Number.isNaN(Number(v)), `${label} debe ser un número`)
    .refine((v) => Number(v) >= 0, `${label} debe ser ≥ 0`);

const optionalString = (max = 500) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined));

export const orderItemInputSchema = z.object({
  productId: z.string().uuid("Producto inválido"),
  cantidad: numericString("Cantidad"),
  precioUnitario: numericString("Precio"),
  itbisUnitario: z.string().trim().default("0"),
  neto: numericString("Neto"),
  rellenoId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  topping: optionalString(120),
  decoracion: optionalString(120),
  notas: optionalString(500),
});
export type OrderItemInput = z.infer<typeof orderItemInputSchema>;

export const orderReferenceInputSchema = z.object({
  productId: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  imagenUrl: z.string().url("URL inválida"),
  nota: optionalString(500),
});
export type OrderReferenceInput = z.infer<typeof orderReferenceInputSchema>;

export const createOrderInputSchema = z.object({
  personId: z.string().uuid("Cliente requerido"),
  tema: optionalString(200),
  fechaEntrega: z
    .string()
    .trim()
    .min(1, "Fecha de entrega es requerida")
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Formato de fecha inválido"),
  horaEntrega: z
    .string()
    .trim()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/, "Formato de hora inválido")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  delivery: z.boolean().default(false),
  direccionDelivery: optionalString(300),
  notaGeneral: optionalString(1000),
  items: z
    .array(orderItemInputSchema)
    .min(1, "Agrega al menos un producto al pedido"),
  references: z.array(orderReferenceInputSchema).default([]),
});
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
