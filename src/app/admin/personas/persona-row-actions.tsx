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

import { PersonaFormDialog } from "./persona-form-dialog";
import { deletePersona } from "@/lib/personas/actions";
import type { Person } from "@/lib/db/schema";

export function PersonaRowActions({ persona }: { persona: Person }) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deletePersona({ id: persona.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Persona eliminada");
    });
  };

  return (
    <div className="flex items-center justify-end gap-1">
      <PersonaFormDialog
        mode={{ kind: "edit", persona }}
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
            <AlertDialogTitle>¿Eliminar a {persona.nombres} {persona.apellidos}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción es permanente. Si la persona tiene pedidos o
              inscripciones asociadas la eliminación se bloqueará.
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
