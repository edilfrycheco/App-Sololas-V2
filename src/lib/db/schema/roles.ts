import { boolean, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

/**
 * Roles configurables (Decisión #3).
 *
 * Reemplaza el enum hardcoded de `system_users.rol`. Raizel puede agregar
 * nuevos roles desde Configuración. Los 5 roles base se siembran como datos
 * iniciales (admin, cajero, cocina_postres, cocina_salados, contable).
 *
 * `permisos` es un jsonb con flags granulares por módulo, ej:
 *   { pedidos: { ver: true, crear: true, eliminar: false }, ... }
 *
 * `area_cocina` solo aplica a roles de cocina; queda nullable para el resto.
 */
export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombre: text("nombre").notNull(),
    descripcion: text("descripcion"),
    areaCocina: text("area_cocina"), // 'postres' | 'salados' | null
    permisos: jsonb("permisos").$type<Record<string, Record<string, boolean>>>(),
    activo: boolean("activo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("roles_nombre_unique").on(t.nombre)],
);

export type Role = typeof roles.$inferSelect;
export type NewRole = typeof roles.$inferInsert;
