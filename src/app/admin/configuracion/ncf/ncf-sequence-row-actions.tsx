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

import { NcfSequenceFormDialog } from "./ncf-sequence-form-dialog";
import { deleteNcfSequence } from "@/lib/fiscal/actions";
import type { NcfSequence, NcfType } from "@/lib/db/schema";

export function NcfSequenceRowActions({
  sequence,
  types,
}: {
  sequence: NcfSequence;
  types: NcfType[];
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteNcfSequence({ id: sequence.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Secuencia eliminada");
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <NcfSequenceFormDialog
        mode={{ kind: "edit", sequence }}
        types={types}
        trigger={
          <Button variant="ghost" size="icon" aria-label="Editar">
            <Pencil className="h-3.5 w-3.5 text-brand-600" />
          </Button>
        }
      />
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon" aria-label="Eliminar">
            <Trash2 className="h-3.5 w-3.5 text-red-600" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar secuencia?</AlertDialogTitle>
            <AlertDialogDescription>
              Solo elimina si esta secuencia no fue usada todavía.
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
