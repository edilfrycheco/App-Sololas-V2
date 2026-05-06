import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/**
 * Section 4.1 — Personas (clientes y estudiantes unificados).
 *
 * Improvement over v2: a single table with two boolean flags so the same person
 * can be cliente, estudiante, or both — instead of two duplicated tables.
 */
export const people = pgTable(
  "people",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    nombres: text("nombres").notNull(),
    apellidos: text("apellidos").notNull(),
    cedulaRnc: text("cedula_rnc"),
    telefono: text("telefono"),
    celular: text("celular"),
    correo: text("correo"),
    direccion: text("direccion"),
    isCliente: boolean("is_cliente").notNull().default(false),
    isEstudiante: boolean("is_estudiante").notNull().default(false),
    notas: text("notas"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("people_cedula_rnc_unique")
      .on(t.cedulaRnc)
      .where(sql`${t.cedulaRnc} is not null`),
    index("people_correo_idx").on(t.correo),
    index("people_is_cliente_idx").on(t.isCliente),
    index("people_is_estudiante_idx").on(t.isEstudiante),
  ],
);

export type Person = typeof people.$inferSelect;
export type NewPerson = typeof people.$inferInsert;
