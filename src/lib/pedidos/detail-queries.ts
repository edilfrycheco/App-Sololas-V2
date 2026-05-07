import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  ncfTypes as ncfTypesTable,
  orderItems,
  orderPayments,
  orderReferences,
  orders,
  paymentMethods,
  people,
  productCategories,
  products,
  rellenos as rellenosTable,
  type NcfType,
  type Order,
  type OrderItem,
  type OrderPayment,
  type OrderReference,
  type PaymentMethod,
  type Person,
  type Product,
  type ProductCategory,
  type Relleno,
} from "@/lib/db/schema";

export interface OrderDetailItem extends OrderItem {
  product: Pick<Product, "id" | "descripcion" | "imagenUrl"> & {
    categoria: Pick<ProductCategory, "nombre" | "areaCocina" | "colorHex">;
  };
  relleno: Pick<Relleno, "id" | "nombre"> | null;
}

export interface OrderDetailPayment extends OrderPayment {
  metodoPago: Pick<PaymentMethod, "nombre">;
  tipoComprobante: Pick<NcfType, "codigo" | "nombre"> | null;
}

export interface OrderDetail {
  order: Order;
  cliente: Person;
  items: OrderDetailItem[];
  payments: OrderDetailPayment[];
  references: OrderReference[];
}

export async function getOrderDetail(orderId: string): Promise<OrderDetail | null> {
  const orderRows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1);
  const order = orderRows[0];
  if (!order) return null;

  const [clienteRows, itemRows, paymentRows, refRows] = await Promise.all([
    db.select().from(people).where(eq(people.id, order.personId)).limit(1),
    db
      .select({
        item: orderItems,
        product: {
          id: products.id,
          descripcion: products.descripcion,
          imagenUrl: products.imagenUrl,
        },
        categoria: {
          nombre: productCategories.nombre,
          areaCocina: productCategories.areaCocina,
          colorHex: productCategories.colorHex,
        },
        relleno: { id: rellenosTable.id, nombre: rellenosTable.nombre },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(productCategories, eq(products.categoryId, productCategories.id))
      .leftJoin(rellenosTable, eq(orderItems.rellenoId, rellenosTable.id))
      .where(eq(orderItems.orderId, orderId))
      .orderBy(asc(orderItems.id)),
    db
      .select({
        payment: orderPayments,
        metodoPago: { nombre: paymentMethods.nombre },
        tipoComprobante: {
          codigo: ncfTypesTable.codigo,
          nombre: ncfTypesTable.nombre,
        },
      })
      .from(orderPayments)
      .innerJoin(paymentMethods, eq(orderPayments.metodoPagoId, paymentMethods.id))
      .leftJoin(
        ncfTypesTable,
        eq(orderPayments.tipoComprobanteId, ncfTypesTable.id),
      )
      .where(eq(orderPayments.orderId, orderId))
      .orderBy(asc(orderPayments.fecha)),
    db
      .select()
      .from(orderReferences)
      .where(eq(orderReferences.orderId, orderId))
      .orderBy(asc(orderReferences.createdAt)),
  ]);

  const cliente = clienteRows[0];
  if (!cliente) return null;

  const items: OrderDetailItem[] = itemRows.map((r) => ({
    ...r.item,
    product: {
      id: r.product.id,
      descripcion: r.product.descripcion,
      imagenUrl: r.product.imagenUrl,
      categoria: {
        nombre: r.categoria.nombre,
        areaCocina: r.categoria.areaCocina as "postres" | "salados",
        colorHex: r.categoria.colorHex,
      },
    },
    relleno: r.relleno?.id ? { id: r.relleno.id, nombre: r.relleno.nombre } : null,
  }));

  const payments: OrderDetailPayment[] = paymentRows.map((r) => ({
    ...r.payment,
    metodoPago: r.metodoPago,
    tipoComprobante: r.tipoComprobante?.codigo
      ? { codigo: r.tipoComprobante.codigo, nombre: r.tipoComprobante.nombre }
      : null,
  }));

  return {
    order,
    cliente,
    items,
    payments,
    references: refRows,
  };
}

export async function getPaymentFormData() {
  const [methods, types] = await Promise.all([
    db
      .select()
      .from(paymentMethods)
      .where(eq(paymentMethods.activo, true))
      .orderBy(asc(paymentMethods.nombre)),
    db
      .select()
      .from(ncfTypesTable)
      .where(eq(ncfTypesTable.activo, true))
      .orderBy(asc(ncfTypesTable.codigo)),
  ]);
  return { methods, types };
}
