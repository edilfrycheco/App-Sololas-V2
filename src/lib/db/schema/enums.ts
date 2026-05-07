import { pgEnum } from "drizzle-orm/pg-core";

/**
 * `rolEnum` se eliminó en favor de la tabla `roles` configurable
 * (Decisión #3 con Raizel — ver `docs/AUDITORIA-APP-ACTUAL.md` § 6).
 */

export const areaCocinaEnum = pgEnum("area_cocina", ["postres", "salados"]);

export const cursoEstatusEnum = pgEnum("curso_estatus", [
  "programado",
  "en_curso",
  "finalizado",
  "cancelado",
]);

export const estatusPagoEnum = pgEnum("estatus_pago", [
  "pendiente",
  "parcial",
  "pagado",
]);

export const estatusProduccionEnum = pgEnum("estatus_produccion", [
  "pendiente",
  "en_proceso",
  "listo",
  "entregado",
  "cancelado",
]);
