import { Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getPersonaCounts,
  listPersonas,
} from "@/lib/personas/queries";
import {
  personaFilters,
  type PersonaFilter,
} from "@/lib/personas/schema";
import { formatCedula, formatRdPhone } from "@/lib/validators/rd";

import { PersonaFormDialog } from "./persona-form-dialog";
import { PersonaRowActions } from "./persona-row-actions";
import { PersonasPagination } from "./personas-pagination";
import { PersonasSearch } from "./personas-search";
import { PersonasTabs } from "./personas-tabs";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{
    filter?: string;
    q?: string;
    page?: string;
  }>;
}

function parseFilter(value: string | undefined): PersonaFilter {
  if (!value) return "todos";
  return (personaFilters as string[]).includes(value)
    ? (value as PersonaFilter)
    : "todos";
}

export default async function PersonasPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const filter = parseFilter(params.filter);
  const search = params.q?.trim() ?? undefined;
  const page = Math.max(1, Number(params.page ?? 1) || 1);

  const [counts, list] = await Promise.all([
    getPersonaCounts(),
    listPersonas({ filter, search, page }),
  ]);

  const prefill =
    filter === "clientes"
      ? { isCliente: true }
      : filter === "estudiantes"
        ? { isEstudiante: true }
        : filter === "ambos"
          ? { isCliente: true, isEstudiante: true }
          : undefined;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Personas
          </h1>
          <p className="text-sm text-neutral-500">
            Clientes de pedidos y estudiantes de cursos en una sola base.
          </p>
        </div>
        <PersonaFormDialog
          mode={{ kind: "create" }}
          prefill={prefill}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Nueva persona
            </Button>
          }
        />
      </header>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <PersonasTabs current={filter} counts={counts} />
        <PersonasSearch />
      </div>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Cédula / RNC</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.items.length === 0 ? (
              <TableEmpty
                message={
                  search
                    ? "No se encontraron personas con esa búsqueda."
                    : "Aún no hay personas registradas. Crea la primera con el botón de arriba."
                }
              />
            ) : (
              list.items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="font-medium text-neutral-900">
                      {p.nombres} {p.apellidos}
                    </div>
                    {p.direccion && (
                      <div className="text-xs text-neutral-500 line-clamp-1">
                        {p.direccion}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {p.cedulaRnc ? formatCedula(p.cedulaRnc) : "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    {p.celular && (
                      <div className="text-neutral-900">
                        {formatRdPhone(p.celular)}
                      </div>
                    )}
                    {p.telefono && !p.celular && (
                      <div className="text-neutral-900">
                        {formatRdPhone(p.telefono)}
                      </div>
                    )}
                    {p.correo && (
                      <div className="text-xs text-neutral-500">{p.correo}</div>
                    )}
                    {!p.telefono && !p.celular && !p.correo && (
                      <span className="text-neutral-400">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {p.isCliente && <Badge variant="default">Cliente</Badge>}
                      {p.isEstudiante && (
                        <Badge variant="secondary">Estudiante</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <PersonaRowActions persona={p} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <PersonasPagination
        page={list.page}
        totalPages={list.totalPages}
        total={list.total}
        pageSize={list.pageSize}
      />
    </div>
  );
}
