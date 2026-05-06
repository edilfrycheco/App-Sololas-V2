import { jsonb, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { systemUsers } from "./system-users";

/**
 * Section 13 — Audit log. Required for fiscal compliance:
 * who created/modified/deleted orders, payments, and similar records.
 */
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: uuid("actor_id").references(() => systemUsers.id),
  accion: text("accion").notNull(), // 'create', 'update', 'delete', etc.
  entidad: text("entidad").notNull(), // 'order', 'order_payment', 'enrollment', ...
  entidadId: uuid("entidad_id"),
  diff: jsonb("diff"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type AuditLogEntry = typeof auditLog.$inferSelect;
export type NewAuditLogEntry = typeof auditLog.$inferInsert;
