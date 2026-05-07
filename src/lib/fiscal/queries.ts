import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  ncfSequences,
  ncfTypes,
  type NcfSequence,
  type NcfType,
} from "@/lib/db/schema";

export async function listNcfTypes(): Promise<NcfType[]> {
  return db.select().from(ncfTypes).orderBy(asc(ncfTypes.codigo));
}

export interface NcfTypeWithSequences {
  type: NcfType;
  sequences: NcfSequence[];
}

export async function listNcfTypesWithSequences(): Promise<
  NcfTypeWithSequences[]
> {
  const [types, allSeqs] = await Promise.all([
    db.select().from(ncfTypes).orderBy(asc(ncfTypes.codigo)),
    db.select().from(ncfSequences).orderBy(asc(ncfSequences.secuenciaInicial)),
  ]);

  return types.map((t) => ({
    type: t,
    sequences: allSeqs.filter((s) => s.ncfTypeId === t.id),
  }));
}

export async function listActiveNcfTypes(): Promise<NcfType[]> {
  return db
    .select()
    .from(ncfTypes)
    .where(eq(ncfTypes.activo, true))
    .orderBy(asc(ncfTypes.codigo));
}
