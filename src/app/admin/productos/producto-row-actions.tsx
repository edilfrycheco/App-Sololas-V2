"use client";

import { useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { ProductoFormDialog } from "./producto-form-dialog";
import { deleteProducto } from "@/lib/productos/actions";
import type { Product, ProductCategory } from "@/lib/db/schema";

export function ProductoRowActions({
  producto,
  categorias,
}: {
  producto: Product;
  categorias: ProductCategory[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProducto({ id: producto.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Producto eliminado");
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <ProductoFormDialog
        mode={{ kind: "edit", producto }}
        categorias={categorias}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Editar">
            <Pencil className="h-4 w-4 text-brand-600" />
          </Button>
        }
      />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Eliminar">
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              ¿Eliminar &ldquo;{producto.descripcion}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              No podrás eliminarlo si está usado en pedidos. En ese caso
              márcalo como inactivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isPending}
            >
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
