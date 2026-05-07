import Link from "next/link";
import { Plus } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
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

import { listOrders } from "@/lib/pedidos/queries";
import { formatDOP, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ESTATUS_PRODUCCION_VARIANT: Record<string, BadgeProps["variant"]> = {
  pendiente: "secondary",
  en_proceso: "warning",
  listo: "success",
  entregado: "outline",
  cancelado: "destructive",
};

const ESTATUS_PAGO_VARIANT: Record<string, BadgeProps["variant"]> = {
  pendiente: "destructive",
  parcial: "warning",
  pagado: "success",
};

export default async function PedidosPage() {
  const items = await listOrders();

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Pedidos
          </h1>
          <p className="text-sm text-neutral-500">
            Últimos pedidos registrados. Las pizarras y reportes detallados
            están en otras secciones.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/pedidos/nuevo">
            <Plus className="h-4 w-4" /> Nuevo pedido
          </Link>
        </Button>
      </header>

      <Card className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Tema</TableHead>
              <TableHead>Entrega</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead>Pago</TableHead>
              <TableHead>Producción</TableHead>
              <TableHead>Creado</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableEmpty message="Aún no hay pedidos. Crea el primero con el botón." />
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="text-brand-600 hover:underline"
                    >
                      {p.numero ?? "—"}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/pedidos/${p.id}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {p.cliente.nombres} {p.cliente.apellidos}
                    </Link>
                    <div className="block text-xs text-neutral-500">
                      {p.cliente.celular ?? p.cliente.telefono ?? p.cliente.correo ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-neutral-700">
                    {p.tema ?? "—"}
                  </TableCell>
                  <TableCell className="text-sm">
                    <div>{formatDate(p.fechaEntrega)}</div>
                    {p.horaEntrega && (
                      <div className="text-xs text-neutral-500">
                        {p.horaEntrega.slice(0, 5)}
                        {p.delivery && " · Delivery"}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatDOP(p.totalNeto)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={ESTATUS_PAGO_VARIANT[p.estatusPago] ?? "secondary"}
                    >
                      {p.estatusPago}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        ESTATUS_PRODUCCION_VARIANT[p.estatusProduccion] ??
                        "secondary"
                      }
                    >
                      {p.estatusProduccion.replace("_", " ")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-neutral-500">
                    {formatDate(p.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
