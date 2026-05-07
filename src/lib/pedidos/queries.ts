import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { orders, people, type Order } from "@/lib/db/schema";

export interface OrderListItem extends Order {
  cliente: {
    id: string;
    nombres: string;
    apellidos: string;
    correo: string | null;
    telefono: string | null;
    celular: string | null;
  };
}

export async function listOrders(limit = 50): Promise<OrderListItem[]> {
  const rows = await db
    .select({
      order: orders,
      cliente: {
        id: people.id,
        nombres: people.nombres,
        apellidos: people.apellidos,
        correo: people.correo,
        telefono: people.telefono,
        celular: people.celular,
      },
    })
    .from(orders)
    .innerJoin(people, eq(orders.personId, people.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit);

  return rows.map((r) => ({ ...r.order, cliente: r.cliente }));
}
