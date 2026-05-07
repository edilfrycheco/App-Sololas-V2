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

import { CategoriaFormDialog } from "./categoria-form-dialog";
import { deleteCategoria } from "@/lib/categorias/actions";
import type { ProductCategory } from "@/lib/db/schema";

export function CategoriaRowActions({
  categoria,
}: {
  categoria: ProductCategory;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCategoria({ id: categoria.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Categoría eliminada");
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <CategoriaFormDialog
        mode={{ kind: "edit", categoria }}
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
              ¿Eliminar la categoría &ldquo;{categoria.nombre}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              No podrás eliminarla si tiene productos asociados.
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
