import { check, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

/**
 * Section 4.6 — Configuración del negocio (single-row table).
 *
 * Enforced as singleton via a CHECK constraint on the `singleton` column.
 */
export const businessSettings = pgTable(
  "business_settings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    singleton: text("singleton").notNull().default("singleton"),
    nombreComercial: text("nombre_comercial").notNull(),
    razonSocial: text("razon_social"),
    rnc: text("rnc"),
    direccion: text("direccion"),
    telefono: text("telefono"),
    correo: text("correo"),
    logoUrl: text("logo_url"),
    reciboTemplate: text("recibo_template"),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    check(
      "business_settings_singleton",
      sql`${t.singleton} = 'singleton'`,
    ),
  ],
);

export type BusinessSettings = typeof businessSettings.$inferSelect;
export type NewBusinessSettings = typeof businessSettings.$inferInsert;
