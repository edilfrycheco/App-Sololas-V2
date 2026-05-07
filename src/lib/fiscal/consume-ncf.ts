import "server-only";
import { and, asc, eq, lte, sql } from "drizzle-orm";
import { ncfSequences, ncfTypes } from "@/lib/db/schema";
import { formatNcf } from "./schema";

type Tx = Parameters<
  Parameters<typeof import("@/lib/db/client").db.transaction>[0]
>[0];

export interface ConsumedNcf {
  ncf: string; // ej "B0200005720"
  numero: number; // 5720
  prefijo: string;
  tipoCodigo: string;
  tipoNombre: string;
  alertaReorden: boolean;
  restantes: number;
}

/**
 * Consume el siguiente número de la secuencia activa para un `ncfTypeId`.
 *
 * Usar dentro de una transacción de Drizzle. Hace SELECT … FOR UPDATE para
 * evitar que dos pagos concurrentes reciban el mismo NCF.
 *
 * Devuelve el NCF formateado y, si aplica, una alerta cuando los números
 * restantes son menores al `cantidad_alerta_reorden` configurado.
 */
export async function consumeNextNcf(
  tx: Tx,
  ncfTypeId: string,
): Promise<ConsumedNcf> {
  const typeRows = await tx
    .select()
    .from(ncfTypes)
    .where(eq(ncfTypes.id, ncfTypeId))
    .limit(1);

  const type = typeRows[0];
  if (!type) throw new Error("Tipo de comprobante no encontrado");
  if (!type.activo)
    throw new Error("El tipo de comprobante está inactivo");

  const seqRows = await tx
    .select()
    .from(ncfSequences)
    .where(
      and(
        eq(ncfSequences.ncfTypeId, ncfTypeId),
        eq(ncfSequences.activo, true),
        lte(ncfSequences.secuenciaActual, ncfSequences.secuenciaFinal),
      ),
    )
    .orderBy(asc(ncfSequences.secuenciaInicial))
    .limit(1)
    .for("update");

  const seq = seqRows[0];
  if (!seq) {
    throw new Error(
      `No hay secuencia disponible para "${type.nombre}". Configura una en /admin/configuracion/ncf.`,
    );
  }

  const numeroAsignado = seq.secuenciaActual;
  if (numeroAsignado > seq.secuenciaFinal) {
    throw new Error(`Secuencia agotada para "${type.nombre}".`);
  }

  await tx
    .update(ncfSequences)
    .set({ secuenciaActual: sql`${ncfSequences.secuenciaActual} + 1` })
    .where(eq(ncfSequences.id, seq.id));

  const restantes = seq.secuenciaFinal - numeroAsignado;
  const alertaReorden = restantes <= seq.cantidadAlertaReorden;

  return {
    ncf: formatNcf(type.prefijo, numeroAsignado),
    numero: numeroAsignado,
    prefijo: type.prefijo,
    tipoCodigo: type.codigo,
    tipoNombre: type.nombre,
    alertaReorden,
    restantes,
  };
}
