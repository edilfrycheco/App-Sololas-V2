"use server";

import { and, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { people } from "@/lib/db/schema";

export interface PersonaSuggestion {
  id: string;
  nombres: string;
  apellidos: string;
  cedulaRnc: string | null;
  telefono: string | null;
  celular: string | null;
  correo: string | null;
  direccion: string | null;
  isCliente: boolean;
  isEstudiante: boolean;
}

export async function searchClientes(
  query: string,
): Promise<PersonaSuggestion[]> {
  const trimmed = query.trim();
  const conditions: SQL[] = [eq(people.isCliente, true)];

  if (trimmed.length > 0) {
    const term = `%${trimmed}%`;
    const matches = or(
      ilike(people.nombres, term),
      ilike(people.apellidos, term),
      ilike(people.correo, term),
      ilike(people.telefono, term),
      ilike(people.celular, term),
      ilike(people.cedulaRnc, term),
      sql`${people.nombres} || ' ' || ${people.apellidos} ILIKE ${term}`,
    );
    if (matches) conditions.push(matches);
  }

  const rows = await db
    .select({
      id: people.id,
      nombres: people.nombres,
      apellidos: people.apellidos,
      cedulaRnc: people.cedulaRnc,
      telefono: people.telefono,
      celular: people.celular,
      correo: people.correo,
      direccion: people.direccion,
      isCliente: people.isCliente,
      isEstudiante: people.isEstudiante,
    })
    .from(people)
    .where(and(...conditions))
    .limit(10);

  return rows;
}
