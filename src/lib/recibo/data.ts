import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  ncfTypes,
  orderItems,
  orderPayments,
  orders,
  paymentMethods,
  people,
  productCategories,
  products,
  rellenos,
  systemUsers,
} from "@/lib/db/schema";

export interface ReciboData {
  // Negocio
  negocio: {
    nombreComercial: string;
    tagline: string;
    direccion: string;
    correo: string;
    telefono: string;
    rnc: string | null;
    logoUrl: string | null;
  };
  // Pago
  numeroRecibo: number;
  fecha: Date;
  atendidoPor: string;
  // Cliente
  cliente: {
    nombre: string;
    rnc: string | null;
    telefono: string | null;
    correo: string | null;
  };
  // Pedido
  numeroPedido: number | null;
  tema: string | null;
  // Comprobante
  tipoComprobante: string | null;
  ncf: string | null;
  formaPago: string;
  numeroTransaccion: string | null;
  notaPago: string | null;
  // Items
  items: Array<{
    cantidad: number;
    descripcion: string;
    extras: string;
    precio: number;
    neto: number;
  }>;
  // Totales
  subtotal: number;
  itbis: number;
  total: number;
  recibido: number;
  balance: number;
}

const FALLBACK_NEGOCIO = {
  nombreComercial: "Solola's",
  tagline: "TALLER CULINARIO & CATERING",
  direccion:
    "Av. República de Argentina #54, Rincón Largo, Santiago, República Dominicana",
  correo: "info@sololasrd.com",
  telefono: "Cel: (809) 879-2450 · Tel: (809) 241-1575",
  rnc: null as string | null,
  logoUrl: null as string | null,
};

export async function getReciboData(paymentId: string): Promise<ReciboData | null> {
  // 1. Pago con relations
  const paymentRows = await db
    .select({
      payment: orderPayments,
      method: paymentMethods,
      tipo: ncfTypes,
    })
    .from(orderPayments)
    .innerJoin(paymentMethods, eq(orderPayments.metodoPagoId, paymentMethods.id))
    .leftJoin(ncfTypes, eq(orderPayments.tipoComprobanteId, ncfTypes.id))
    .where(eq(orderPayments.id, paymentId))
    .limit(1);

  const row = paymentRows[0];
  if (!row) return null;

  // 2. Pedido + cliente
  const orderRows = await db
    .select({ order: orders, cliente: people })
    .from(orders)
    .innerJoin(people, eq(orders.personId, people.id))
    .where(eq(orders.id, row.payment.orderId))
    .limit(1);
  const orderRow = orderRows[0];
  if (!orderRow) return null;

  // 3. Items
  const itemRows = await db
    .select({
      item: orderItems,
      product: { descripcion: products.descripcion },
      categoria: { nombre: productCategories.nombre },
      relleno: { nombre: rellenos.nombre },
    })
    .from(orderItems)
    .innerJoin(products, eq(orderItems.productId, products.id))
    .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
    .leftJoin(rellenos, eq(orderItems.rellenoId, rellenos.id))
    .where(eq(orderItems.orderId, row.payment.orderId));

  // 4. Suma total pagado del pedido
  const allPayments = await db
    .select({ monto: orderPayments.monto })
    .from(orderPayments)
    .where(eq(orderPayments.orderId, row.payment.orderId));
  const totalPagado = allPayments.reduce((s, p) => s + Number(p.monto), 0);

  // 5. Operador (atendido por)
  let atendidoPor = "—";
  if (row.payment.registradoPor) {
    const op = await db
      .select({
        nombres: systemUsers.nombres,
        apellidos: systemUsers.apellidos,
      })
      .from(systemUsers)
      .where(eq(systemUsers.id, row.payment.registradoPor))
      .limit(1);
    if (op[0]) atendidoPor = `${op[0].nombres} ${op[0].apellidos}`;
  }

  // 6. Negocio
  const { getBusinessSettings } = await import(
    "@/lib/business-settings/queries"
  );
  const business = await getBusinessSettings();
  const negocio = business
    ? {
        nombreComercial: business.nombreComercial,
        tagline: FALLBACK_NEGOCIO.tagline,
        direccion: business.direccion ?? FALLBACK_NEGOCIO.direccion,
        correo: business.correo ?? FALLBACK_NEGOCIO.correo,
        telefono: business.telefono ?? FALLBACK_NEGOCIO.telefono,
        rnc: business.rnc,
        logoUrl: business.logoUrl,
      }
    : FALLBACK_NEGOCIO;

  const cliente = orderRow.cliente;
  const order = orderRow.order;

  return {
    negocio,
    numeroRecibo: row.payment.numeroRecibo,
    fecha: row.payment.fecha,
    atendidoPor,
    cliente: {
      nombre: `${cliente.nombres} ${cliente.apellidos}`,
      rnc: cliente.cedulaRnc,
      telefono: cliente.celular ?? cliente.telefono,
      correo: cliente.correo,
    },
    numeroPedido: order.numero,
    tema: order.tema,
    tipoComprobante: row.tipo?.nombre ?? null,
    ncf: row.payment.numeroComprobante,
    formaPago: row.method.nombre,
    numeroTransaccion: row.payment.numeroReferencia,
    notaPago: order.notaGeneral,
    items: itemRows.map((r) => {
      const extras = [
        r.relleno?.nombre && `Relleno: ${r.relleno.nombre}`,
        r.item.topping && `Topping: ${r.item.topping}`,
        r.item.decoracion && `Decoración: ${r.item.decoracion}`,
        r.item.notas,
      ]
        .filter(Boolean)
        .join(" · ");
      return {
        cantidad: Number(r.item.cantidad),
        descripcion: r.product.descripcion,
        extras,
        precio: Number(r.item.precioUnitario),
        neto: Number(r.item.neto),
      };
    }),
    subtotal: Number(order.totalBruto),
    itbis: Number(order.totalItbis),
    total: Number(order.totalNeto),
    recibido: totalPagado,
    balance: Math.max(0, Number(order.totalNeto) - totalPagado),
  };
}
