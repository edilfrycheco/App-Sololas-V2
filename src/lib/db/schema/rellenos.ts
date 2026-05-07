import { boolean, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Rellenos (Decisión #4 — lista predefinida).
 *
 * Lista de rellenos / sabores que se pueden asignar por item de pedido.
 * Ejemplos: "Vainilla", "Chocolate", "Dulce de leche" (postres);
 * "Pollo", "Queso", "Pollo y queso" (salados).
 *
 * Raizel los gestiona desde Configuración → Rellenos.
 * Al tomar pedido aparece como dropdown opcional por item.
 */
export const rellenos = pgTable(
  "rellenos",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("rellenos_nombre_unique").on(t.nombre)],
);

export type Relleno = typeof rellenos.$inferSelect;
export type NewRelleno = typeof rellenos.$inferInsert;
