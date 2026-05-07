import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, ImageIcon, Plus, Receipt, Truck } from "lucide-react";

import { Badge, type BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  getOrderDetail,
  getPaymentFormData,
} from "@/lib/pedidos/detail-queries";
import { formatDOP, formatDate } from "@/lib/utils";
import { AREA_LABELS, type AreaCocinaValue } from "@/lib/categorias/schema";
import { RegistrarPagoDialog } from "./registrar-pago-dialog";
import { ReenviarReciboButton } from "./reenviar-recibo-button";

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

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PedidoDetailPage({ params }: PageProps) {
  const { id } = await params;
  const detail = await getOrderDetail(id);
  if (!detail) notFound();

  const { order, cliente, items, payments, references } = detail;
  const { methods, types } = await getPaymentFormData();

  const totalPagado = payments.reduce((sum, p) => sum + Number(p.monto), 0);
  const balance = Math.max(0, Number(order.totalNeto) - totalPagado);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/pedidos" aria-label="Volver">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <p className="text-xs uppercase tracking-wide text-neutral-500">
              Pedido
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
              #{order.numero ?? order.id.slice(0, 8)} ·{" "}
              <span className="text-brand-700">
                {cliente.nombres} {cliente.apellidos}
              </span>
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              {order.tema && <span>{order.tema}</span>}
              {order.tema && <span>·</span>}
              <span>
                Entrega {formatDate(order.fechaEntrega)}
                {order.horaEntrega && ` · ${order.horaEntrega.slice(0, 5)}`}
              </span>
              {order.delivery && (
                <span className="flex items-center gap-1">
                  · <Truck className="h-3 w-3" /> Delivery
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={ESTATUS_PAGO_VARIANT[order.estatusPago] ?? "secondary"}>
            Pago: {order.estatusPago}
          </Badge>
          <Badge
            variant={
              ESTATUS_PRODUCCION_VARIANT[order.estatusProduccion] ?? "secondary"
            }
          >
            Producción: {order.estatusProduccion.replace("_", " ")}
          </Badge>
        </div>
      </div>

      {/* Resumen económico */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Total
          </p>
          <p className="mt-1 text-2xl font-bold text-neutral-900">
            {formatDOP(order.totalNeto)}
          </p>
          <p className="text-xs text-neutral-500">
            Bruto {formatDOP(order.totalBruto)} · ITBIS {formatDOP(order.totalItbis)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Pagado
          </p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {formatDOP(totalPagado)}
          </p>
          <p className="text-xs text-neutral-500">
            {payments.length}{" "}
            {payments.length === 1 ? "pago registrado" : "pagos registrados"}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-neutral-500">
            Balance
          </p>
          <p className="mt-1 text-2xl font-bold text-amber-600">
            {formatDOP(balance)}
          </p>
          <p className="text-xs text-neutral-500">Pendiente de cobrar</p>
        </Card>
      </div>

      <Tabs defaultValue="productos">
        <TabsList>
          <TabsTrigger value="productos">
            Productos ({items.length})
          </TabsTrigger>
          <TabsTrigger value="pagos">
            Pagos ({payments.length})
          </TabsTrigger>
          <TabsTrigger value="referencias">
            Referencias ({references.length})
          </TabsTrigger>
        </TabsList>

        {/* Productos */}
        <TabsContent value="productos">
          <Card className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Cant.</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">ITBIS</TableHead>
                  <TableHead className="text-right">Neto</TableHead>
                  <TableHead>Listo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: it.product.categoria.colorHex }}
                        />
                        <div>
                          <div className="font-medium text-neutral-900">
                            {it.product.descripcion}
                          </div>
                          <div className="text-xs text-neutral-500">
                            {it.product.categoria.nombre} ·{" "}
                            {AREA_LABELS[it.product.categoria.areaCocina as AreaCocinaValue]}
                          </div>
                          {(it.relleno || it.topping || it.decoracion || it.notas) && (
                            <div className="mt-1 text-xs text-neutral-600">
                              {it.relleno && <>Relleno: {it.relleno.nombre}. </>}
                              {it.topping && <>Topping: {it.topping}. </>}
                              {it.decoracion && <>Decoración: {it.decoracion}. </>}
                              {it.notas && <>{it.notas}</>}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {Number(it.cantidad)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      {formatDOP(it.precioUnitario)}
                    </TableCell>
                    <TableCell className="text-right text-sm text-neutral-600">
                      {formatDOP(Number(it.itbisUnitario) * Number(it.cantidad))}
                    </TableCell>
                    <TableCell className="text-right text-sm font-medium">
                      {formatDOP(it.neto)}
                    </TableCell>
                    <TableCell>
                      {it.listo ? (
                        <Badge variant="success">Listo</Badge>
                      ) : (
                        <Badge variant="secondary">Pendiente</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* Pagos */}
        <TabsContent value="pagos">
          <Card className="p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">
                  Historial de pagos
                </h3>
                <p className="text-xs text-neutral-500">
                  Cada pago genera un recibo con su NCF si corresponde.
                </p>
              </div>
              <RegistrarPagoDialog
                orderId={order.id}
                totalNeto={order.totalNeto}
                totalPagado={totalPagado}
                methods={methods}
                ncfTypes={types}
                trigger={
                  <Button disabled={balance === 0}>
                    <Plus className="h-4 w-4" />
                    {balance === 0 ? "Pagado" : "Registrar pago"}
                  </Button>
                }
              />
            </div>
            {payments.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-neutral-500">
                Aún no hay pagos registrados.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Recibo</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead>Comprobante</TableHead>
                    <TableHead>NCF</TableHead>
                    <TableHead>Referencia</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                    <TableHead className="text-right">PDF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        <Link
                          href={`/api/recibos/${p.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-brand-600 hover:underline"
                        >
                          #{p.numeroRecibo}
                        </Link>
                      </TableCell>
                      <TableCell className="text-xs text-neutral-600">
                        {formatDate(p.fecha)}
                      </TableCell>
                      <TableCell className="text-sm">
                        {p.metodoPago.nombre}
                      </TableCell>
                      <TableCell className="text-sm text-neutral-600">
                        {p.tipoComprobante
                          ? `${p.tipoComprobante.codigo} · ${p.tipoComprobante.nombre}`
                          : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.numeroComprobante ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {p.numeroReferencia ?? "—"}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatDOP(p.monto)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Ver recibo PDF"
                        >
                          <Link
                            href={`/api/recibos/${p.id}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Receipt className="h-4 w-4 text-brand-600" />
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          aria-label="Descargar recibo"
                        >
                          <Link
                            href={`/api/recibos/${p.id}?download=1`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download className="h-4 w-4 text-brand-600" />
                          </Link>
                        </Button>
                        <ReenviarReciboButton paymentId={p.id} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* Referencias */}
        <TabsContent value="referencias">
          <Card className="p-4">
            {references.length === 0 ? (
              <p className="py-8 text-center text-sm text-neutral-500">
                Este pedido no tiene imágenes de referencia.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {references.map((r) => (
                  <a
                    key={r.id}
                    href={r.imagenUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="overflow-hidden rounded-lg border"
                  >
                    <div className="aspect-square bg-neutral-100">
                      {r.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={r.imagenUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-6 w-6 text-neutral-300" />
                      )}
                    </div>
                    {r.nota && (
                      <div className="p-2 text-xs text-neutral-700">
                        {r.nota}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
