import { boolean, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { areaCocinaEnum } from "./enums";
import { roles } from "./roles";

/**
 * Section 4.2 — Operadores del sistema.
 *
 * `id` mirrors `auth.users.id` from Supabase Auth. The FK is added in a SQL
 * migration step (cross-schema, can't be expressed in Drizzle directly).
 *
 * `rolId` apunta a la tabla `roles` configurable (Decisión #3, ya no enum).
 *
 * `areaCocina` solo se llena para roles de cocina; redundante con `roles.areaCocina`
 * pero se mantiene aquí para asignar tablets físicas independiente del rol.
 */
export const systemUsers = pgTable("system_users", {
  id: uuid("id").primaryKey(),
  nombres: text("nombres").notNull(),
  apellidos: text("apellidos").notNull(),
  rolId: uuid("rol_id")
    .notNull()
    .references(() => roles.id, { onDelete: "restrict" }),
  areaCocina: areaCocinaEnum("area_cocina"),
  tabletId: text("tablet_id"),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type SystemUser = typeof systemUsers.$inferSelect;
export type NewSystemUser = typeof systemUsers.$inferInsert;
