import { pgEnum } from "drizzle-orm/pg-core";

export const rolEnum = pgEnum("rol", [
  "admin",
  "cajero",
  "cocina_postres",
  "cocina_salados",
  "contable",
]);

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
