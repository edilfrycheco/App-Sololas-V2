import {
  boolean,
  date,
  integer,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { areaCocinaEnum, estatusPagoEnum, estatusProduccionEnum } from "./enums";
import { ncfTypes, paymentMethods } from "./fiscal";
import { people } from "./people";
import { systemUsers } from "./system-users";

/**
 * Section 4.4 — Módulo Pedidos.
 *
 * Improvement over v2: only two base categories (Dulces / Salados) and each
 * one is bound to a `area_cocina`, which the kitchen tablet uses to filter.
 */

export const productCategories = pgTable("product_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(), // 'Dulces' | 'Salados'
  areaCocina: areaCocinaEnum("area_cocina").notNull(),
  colorHex: text("color_hex").notNull(),
});

export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  descripcion: text("descripcion").notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => productCategories.id, { onDelete: "restrict" }),
  subcategoria: text("subcategoria"),
  precio: numeric("precio", { precision: 12, scale: 2 }).notNull(),
  costo: numeric("costo", { precision: 12, scale: 2 }),
  itbisPct: numeric("itbis_pct", { precision: 5, scale: 2 })
    .notNull()
    .default("0"),
  unidadMedida: text("unidad_medida").notNull().default("unidad"),
  cantidadReorden: integer("cantidad_reorden"),
  llevaIngredientes: boolean("lleva_ingredientes").notNull().default(false),
  imagenUrl: text("imagen_url"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  numero: integer("numero").generatedAlwaysAsIdentity({ startWith: 1500 }),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "restrict" }),
  tema: text("tema"),
  fechaEntrega: date("fecha_entrega").notNull(),
  horaEntrega: time("hora_entrega"),
  delivery: boolean("delivery").notNull().default(false),
  direccionDelivery: text("direccion_delivery"),
  notaGeneral: text("nota_general"),
  totalBruto: numeric("total_bruto", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  totalItbis: numeric("total_itbis", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  totalNeto: numeric("total_neto", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  estatusPago: estatusPagoEnum("estatus_pago").notNull().default("pendiente"),
  estatusProduccion: estatusProduccionEnum("estatus_produccion")
    .notNull()
    .default("pendiente"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  createdBy: uuid("created_by").references(() => systemUsers.id),
});

export const orderItems = pgTable("order_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "restrict" }),
  cantidad: numeric("cantidad", { precision: 12, scale: 2 }).notNull(),
  precioUnitario: numeric("precio_unitario", { precision: 12, scale: 2 })
    .notNull(),
  itbisUnitario: numeric("itbis_unitario", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  neto: numeric("neto", { precision: 12, scale: 2 }).notNull(),
  relleno: text("relleno"),
  topping: text("topping"),
  decoracion: text("decoracion"),
  notas: text("notas"),
  listo: boolean("listo").notNull().default(false),
  marcadoListoPor: uuid("marcado_listo_por").references(() => systemUsers.id),
  marcadoListoAt: timestamp("marcado_listo_at", { withTimezone: true }),
});

export const orderReferences = pgTable("order_references", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  productId: uuid("product_id").references(() => products.id, {
    onDelete: "set null",
  }),
  imagenUrl: text("imagen_url").notNull(),
  nota: text("nota"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const orderPayments = pgTable("order_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  orderId: uuid("order_id")
    .notNull()
    .references(() => orders.id, { onDelete: "cascade" }),
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  metodoPagoId: uuid("metodo_pago_id")
    .notNull()
    .references(() => paymentMethods.id),
  tipoComprobanteId: uuid("tipo_comprobante_id").references(() => ncfTypes.id),
  numeroComprobante: text("numero_comprobante"),
  numeroReferencia: text("numero_referencia"),
  reciboUrl: text("recibo_url"),
  registradoPor: uuid("registrado_por").references(() => systemUsers.id),
});

export type ProductCategory = typeof productCategories.$inferSelect;
export type NewProductCategory = typeof productCategories.$inferInsert;
export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;
export type OrderReference = typeof orderReferences.$inferSelect;
export type NewOrderReference = typeof orderReferences.$inferInsert;
export type OrderPayment = typeof orderPayments.$inferSelect;
export type NewOrderPayment = typeof orderPayments.$inferInsert;
