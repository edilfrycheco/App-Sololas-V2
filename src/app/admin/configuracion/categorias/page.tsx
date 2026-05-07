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

import { listCategorias } from "@/lib/categorias/queries";
import {
  AREA_LABELS,
  areaCocinaValues,
  type AreaCocinaValue,
} from "@/lib/categorias/schema";

import { CategoriaFormDialog } from "./categoria-form-dialog";
import { CategoriaRowActions } from "./categoria-row-actions";

export const dynamic = "force-dynamic";

export default async function CategoriasPage() {
  const categorias = await listCategorias();
  const grouped = areaCocinaValues.reduce(
    (acc, area) => {
      acc[area] = categorias.filter((c) => c.areaCocina === area);
      return acc;
    },
    {} as Record<AreaCocinaValue, typeof categorias>,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Categorías de producto
          </h2>
          <p className="text-sm text-neutral-500">
            Cada categoría pertenece a un área de cocina (Postres o Picadera).
            No se permiten nombres duplicados dentro de la misma área.
          </p>
        </div>
        <CategoriaFormDialog
          mode={{ kind: "create" }}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Nueva categoría
            </Button>
          }
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {areaCocinaValues.map((area) => (
          <Card key={area} className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  {AREA_LABELS[area]}
                </h3>
                <p className="text-xs text-neutral-500">
                  {grouped[area].length}{" "}
                  {grouped[area].length === 1 ? "categoría" : "categorías"}
                </p>
              </div>
              <CategoriaFormDialog
                mode={{ kind: "create", defaultArea: area }}
                trigger={
                  <Button variant="outline" size="sm">
                    <Plus className="h-3.5 w-3.5" /> Agregar
                  </Button>
                }
              />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {grouped[area].length === 0 ? (
                  <TableEmpty
                    message={`Aún no hay categorías en ${AREA_LABELS[area]}.`}
                  />
                ) : (
                  grouped[area].map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-neutral-900">
                        {c.nombre}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span
                            className="h-4 w-4 rounded-sm border border-neutral-200"
                            style={{ backgroundColor: c.colorHex }}
                          />
                          <span className="text-xs uppercase tracking-wide text-neutral-500">
                            {c.colorHex}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {c.activo ? (
                          <Badge variant="success">Activa</Badge>
                        ) : (
                          <Badge variant="secondary">Inactiva</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <CategoriaRowActions categoria={c} />
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        ))}
      </div>
    </div>
  );
}
