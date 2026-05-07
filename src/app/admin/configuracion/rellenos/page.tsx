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

import { listRellenos } from "@/lib/rellenos/queries";
import { RellenoFormDialog } from "./relleno-form-dialog";
import { RellenoRowActions } from "./relleno-row-actions";

export const dynamic = "force-dynamic";

export default async function RellenosPage() {
  const items = await listRellenos();

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Rellenos</h2>
          <p className="text-sm text-neutral-500">
            Lista predefinida que aparece como dropdown al tomar pedido.
          </p>
        </div>
        <RellenoFormDialog
          mode={{ kind: "create" }}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Nuevo relleno
            </Button>
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableEmpty message="Aún no hay rellenos. Agrega los que usas en tus productos." />
          ) : (
            items.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium text-neutral-900">
                  {r.nombre}
                </TableCell>
                <TableCell className="text-sm text-neutral-600">
                  {r.descripcion ?? "—"}
                </TableCell>
                <TableCell>
                  {r.activo ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <RellenoRowActions relleno={r} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
