import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { people, type Person } from "@/lib/db/schema";
import type { PersonaFilter } from "./schema";

const PAGE_SIZE = 20;

export type PersonaListItem = Person;

export interface PersonaListParams {
  filter: PersonaFilter;
  search?: string;
  page?: number;
}

export interface PersonaListResult {
  items: PersonaListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export async function listPersonas({
  filter,
  search,
  page = 1,
}: PersonaListParams): Promise<PersonaListResult> {
  const conditions: SQL[] = [];

  if (filter === "clientes") {
    conditions.push(eq(people.isCliente, true));
  } else if (filter === "estudiantes") {
    conditions.push(eq(people.isEstudiante, true));
  } else if (filter === "ambos") {
    conditions.push(eq(people.isCliente, true));
    conditions.push(eq(people.isEstudiante, true));
  }

  if (search && search.trim().length > 0) {
    const term = `%${search.trim()}%`;
    const searchClause = or(
      ilike(people.nombres, term),
      ilike(people.apellidos, term),
      ilike(people.correo, term),
      ilike(people.telefono, term),
      ilike(people.celular, term),
      ilike(people.cedulaRnc, term),
      sql`${people.nombres} || ' ' || ${people.apellidos} ILIKE ${term}`,
    );
    if (searchClause) conditions.push(searchClause);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const offset = (page - 1) * PAGE_SIZE;

  const [items, totalRow] = await Promise.all([
    db
      .select()
      .from(people)
      .where(whereClause)
      .orderBy(asc(people.apellidos), asc(people.nombres))
      .limit(PAGE_SIZE)
      .offset(offset),
    db.select({ value: count() }).from(people).where(whereClause),
  ]);

  const total = Number(totalRow[0]?.value ?? 0);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return { items, total, page, pageSize: PAGE_SIZE, totalPages };
}

export async function getPersona(id: string): Promise<Person | null> {
  const rows = await db.select().from(people).where(eq(people.id, id)).limit(1);
  return rows[0] ?? null;
}

export interface PersonaCounts {
  total: number;
  clientes: number;
  estudiantes: number;
  ambos: number;
}

export async function getPersonaCounts(): Promise<PersonaCounts> {
  const [total, clientes, estudiantes, ambos] = await Promise.all([
    db.select({ v: count() }).from(people),
    db.select({ v: count() }).from(people).where(eq(people.isCliente, true)),
    db.select({ v: count() }).from(people).where(eq(people.isEstudiante, true)),
    db
      .select({ v: count() })
      .from(people)
      .where(and(eq(people.isCliente, true), eq(people.isEstudiante, true))),
  ]);

  return {
    total: Number(total[0]?.v ?? 0),
    clientes: Number(clientes[0]?.v ?? 0),
    estudiantes: Number(estudiantes[0]?.v ?? 0),
    ambos: Number(ambos[0]?.v ?? 0),
  };
}

// Silence unused-import warnings when builds tree-shake.
void desc;
