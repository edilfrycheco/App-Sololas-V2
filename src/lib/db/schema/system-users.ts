import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { areaCocinaEnum, rolEnum } from "./enums";

/**
 * Section 4.2 — Operadores del sistema.
 *
 * `id` mirrors `auth.users.id` from Supabase Auth. The FK is added in a SQL
 * migration step (cross-schema, can't be expressed in Drizzle directly).
 */
export const systemUsers = pgTable("system_users", {
  id: uuid("id").primaryKey(),
  nombres: text("nombres").notNull(),
  apellidos: text("apellidos").notNull(),
  rol: rolEnum("rol").notNull(),
  areaCocina: areaCocinaEnum("area_cocina"),
  tabletId: text("tablet_id"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SystemUser = typeof systemUsers.$inferSelect;
export type NewSystemUser = typeof systemUsers.$inferInsert;
