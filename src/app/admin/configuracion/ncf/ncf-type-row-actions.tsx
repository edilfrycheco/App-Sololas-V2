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

import { NcfTypeFormDialog } from "./ncf-type-form-dialog";
import { deleteNcfType } from "@/lib/fiscal/actions";
import type { NcfType } from "@/lib/db/schema";

export function NcfTypeRowActions({ type }: { type: NcfType }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteNcfType({ id: type.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Tipo eliminado");
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <NcfTypeFormDialog
        mode={{ kind: "edit", type }}
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
              ¿Eliminar &ldquo;{type.nombre}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              No podrás eliminarlo si tiene secuencias o pagos asociados.
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
