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

import { listMetodosPago } from "@/lib/metodos-pago/queries";
import { MetodoFormDialog } from "./metodo-form-dialog";
import { MetodoRowActions } from "./metodo-row-actions";

export const dynamic = "force-dynamic";

export default async function MetodosPagoPage() {
  const items = await listMetodosPago();

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">
            Métodos de pago
          </h2>
          <p className="text-sm text-neutral-500">
            Las opciones que aparecen al cobrar una factura o un abono.
          </p>
        </div>
        <MetodoFormDialog
          mode={{ kind: "create" }}
          trigger={
            <Button>
              <Plus className="h-4 w-4" /> Nuevo método
            </Button>
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Referencia</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableEmpty message="Aún no hay métodos de pago. Agrega los que aceptas (Efectivo, Tarjeta, Transferencia, etc.)." />
          ) : (
            items.map((m) => (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-neutral-900">
                  {m.nombre}
                </TableCell>
                <TableCell className="text-sm text-neutral-600">
                  {m.requiereReferencia ? (
                    <Badge variant="outline">Requerida</Badge>
                  ) : (
                    <span className="text-neutral-400">No</span>
                  )}
                </TableCell>
                <TableCell>
                  {m.activo ? (
                    <Badge variant="success">Activo</Badge>
                  ) : (
                    <Badge variant="secondary">Inactivo</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <MetodoRowActions metodo={m} />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
