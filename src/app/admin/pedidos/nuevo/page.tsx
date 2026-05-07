import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { listRellenos } from "@/lib/rellenos/queries";
import { listCategoriasActivas } from "@/lib/productos/queries";
import { TomarPedidoForm } from "./tomar-pedido-form";

export const dynamic = "force-dynamic";

export default async function TomarPedidoPage() {
  const [rellenos, categorias] = await Promise.all([
    listRellenos(),
    listCategoriasActivas(),
  ]);

  if (categorias.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-neutral-700">
          Antes de tomar pedidos necesitas al menos una categoría de producto.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/configuracion/categorias">
            Configurar categorías
          </Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="icon">
          <Link href="/admin/pedidos" aria-label="Volver">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
            Nuevo pedido
          </h1>
          <p className="text-sm text-neutral-500">
            Captura el cliente, los productos y las referencias visuales.
          </p>
        </div>
      </div>

      <TomarPedidoForm rellenos={rellenos} />
    </div>
  );
}
