import {
  boolean,
  date,
  integer,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Section 4.5 — Configuración fiscal (DGII RD).
 */

export const ncfTypes = pgTable(
  "ncf_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codigo: text("codigo").notNull(), // 'B01', 'B02', 'B14', etc.
    nombre: text("nombre").notNull(), // 'Crédito Fiscal', 'Factura de Consumo', ...
    prefijo: text("prefijo").notNull(),
    activo: boolean("activo").notNull().default(true),
  },
  (t) => [uniqueIndex("ncf_types_codigo_unique").on(t.codigo)],
);

export const ncfSequences = pgTable("ncf_sequences", {
  id: uuid("id").primaryKey().defaultRandom(),
  ncfTypeId: uuid("ncf_type_id")
    .notNull()
    .references(() => ncfTypes.id, { onDelete: "restrict" }),
  secuenciaActual: integer("secuencia_actual").notNull(),
  secuenciaInicial: integer("secuencia_inicial").notNull(),
  secuenciaFinal: integer("secuencia_final").notNull(),
  fechaVencimiento: date("fecha_vencimiento"),
  cantidadAlertaReorden: integer("cantidad_alerta_reorden")
    .notNull()
    .default(50),
  activo: boolean("activo").notNull().default(true),
});

export const paymentMethods = pgTable("payment_methods", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  activo: boolean("activo").notNull().default(true),
  requiereReferencia: boolean("requiere_referencia").notNull().default(false),
});

export type NcfType = typeof ncfTypes.$inferSelect;
export type NewNcfType = typeof ncfTypes.$inferInsert;
export type NcfSequence = typeof ncfSequences.$inferSelect;
export type NewNcfSequence = typeof ncfSequences.$inferInsert;
export type PaymentMethod = typeof paymentMethods.$inferSelect;
export type NewPaymentMethod = typeof paymentMethods.$inferInsert;
