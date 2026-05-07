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

import { RellenoFormDialog } from "./relleno-form-dialog";
import { deleteRelleno } from "@/lib/rellenos/actions";
import type { Relleno } from "@/lib/db/schema";

export function RellenoRowActions({ relleno }: { relleno: Relleno }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteRelleno({ id: relleno.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Relleno eliminado");
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <RellenoFormDialog
        mode={{ kind: "edit", relleno }}
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
              ¿Eliminar el relleno &ldquo;{relleno.nombre}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Los pedidos previos que ya lo usaban conservan el dato; los
              nuevos pedidos no podrán seleccionarlo.
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
