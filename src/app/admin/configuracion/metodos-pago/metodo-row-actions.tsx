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

import { MetodoFormDialog } from "./metodo-form-dialog";
import { deleteMetodoPago } from "@/lib/metodos-pago/actions";
import type { PaymentMethod } from "@/lib/db/schema";

export function MetodoRowActions({ metodo }: { metodo: PaymentMethod }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteMetodoPago({ id: metodo.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Método eliminado");
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <MetodoFormDialog
        mode={{ kind: "edit", metodo }}
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
              ¿Eliminar &ldquo;{metodo.nombre}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              No podrás eliminarlo si hay pagos registrados con este método.
              Considera marcarlo como inactivo en su lugar.
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
