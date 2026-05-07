import { sql } from "drizzle-orm";
import {
  boolean,
  date,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { cursoEstatusEnum, estatusPagoEnum } from "./enums";
import { paymentMethods, ncfTypes } from "./fiscal";
import { people } from "./people";
import { systemUsers } from "./system-users";

/**
 * Section 4.3 — Módulo Clases.
 */

export const courses = pgTable("courses", {
  id: uuid("id").primaryKey().defaultRandom(),
  nombre: text("nombre").notNull(),
  descripcion: text("descripcion"),
  costo: numeric("costo", { precision: 12, scale: 2 }).notNull(),
  frecuencia: text("frecuencia"), // 'Semanal', 'Quincenal', etc.
  duracion: text("duracion"), // '4 semanas', '20 horas', etc.
  cantidadPagos: integer("cantidad_pagos").notNull().default(1),
  activo: boolean("activo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const courseSessions = pgTable("course_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseId: uuid("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "restrict" }),
  fechaInicio: date("fecha_inicio").notNull(),
  fechaFin: date("fecha_fin").notNull(),
  horaInicio: time("hora_inicio").notNull(),
  horaFin: time("hora_fin").notNull(),
  diasSemana: jsonb("dias_semana").$type<string[]>().notNull(), // ['lunes', 'miercoles']
  impartidoPor: uuid("impartido_por").references(() => systemUsers.id),
  limiteEstudiantes: integer("limite_estudiantes").notNull(),
  estatus: cursoEstatusEnum("estatus").notNull().default("programado"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const enrollments = pgTable("enrollments", {
  id: uuid("id").primaryKey().defaultRandom(),
  courseSessionId: uuid("course_session_id")
    .notNull()
    .references(() => courseSessions.id, { onDelete: "cascade" }),
  personId: uuid("person_id")
    .notNull()
    .references(() => people.id, { onDelete: "restrict" }),
  fechaInscripcion: timestamp("fecha_inscripcion", { withTimezone: true })
    .notNull()
    .defaultNow(),
  costoAcordado: numeric("costo_acordado", { precision: 12, scale: 2 })
    .notNull(),
  descuento: numeric("descuento", { precision: 12, scale: 2 })
    .notNull()
    .default("0"),
  estatusPago: estatusPagoEnum("estatus_pago").notNull().default("pendiente"),
});

export const coursePayments = pgTable("course_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  numeroRecibo: integer("numero_recibo")
    .notNull()
    .default(sql`nextval('recibo_seq')`),
  enrollmentId: uuid("enrollment_id")
    .notNull()
    .references(() => enrollments.id, { onDelete: "cascade" }),
  monto: numeric("monto", { precision: 12, scale: 2 }).notNull(),
  fecha: timestamp("fecha", { withTimezone: true }).notNull().defaultNow(),
  metodoPagoId: uuid("metodo_pago_id")
    .notNull()
    .references(() => paymentMethods.id),
  tipoComprobanteId: uuid("tipo_comprobante_id").references(() => ncfTypes.id),
  numeroComprobante: text("numero_comprobante"), // e-NCF
  numeroReferencia: text("numero_referencia"),
  concepto: text("concepto").notNull(), // '1ER PAGO', 'ABONO', etc.
  reciboUrl: text("recibo_url"),
  registradoPor: uuid("registrado_por").references(() => systemUsers.id),
});

export type Course = typeof courses.$inferSelect;
export type NewCourse = typeof courses.$inferInsert;
export type CourseSession = typeof courseSessions.$inferSelect;
export type NewCourseSession = typeof courseSessions.$inferInsert;
export type Enrollment = typeof enrollments.$inferSelect;
export type NewEnrollment = typeof enrollments.$inferInsert;
export type CoursePayment = typeof coursePayments.$inferSelect;
export type NewCoursePayment = typeof coursePayments.$inferInsert;
