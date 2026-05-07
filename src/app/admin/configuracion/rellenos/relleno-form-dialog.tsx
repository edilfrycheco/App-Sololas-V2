"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  rellenoInputSchema,
  type RellenoInput,
} from "@/lib/rellenos/schema";
import { createRelleno, updateRelleno } from "@/lib/rellenos/actions";
import type { Relleno } from "@/lib/db/schema";

type Mode = { kind: "create" } | { kind: "edit"; relleno: Relleno };

export function RellenoFormDialog({
  trigger,
  mode,
}: {
  trigger: React.ReactNode;
  mode: Mode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode.kind === "edit";

  const form = useForm<RellenoInput>({
    resolver: zodResolver(rellenoInputSchema),
    defaultValues:
      mode.kind === "edit"
        ? {
            nombre: mode.relleno.nombre,
            descripcion: mode.relleno.descripcion ?? undefined,
            activo: mode.relleno.activo,
          }
        : { nombre: "", descripcion: undefined, activo: true },
  });

  const onSubmit = (values: RellenoInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateRelleno({ id: mode.relleno.id, ...values })
        : await createRelleno(values);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof RellenoInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      toast.success(isEdit ? "Relleno actualizado" : "Relleno creado");
      setOpen(false);
      if (!isEdit) form.reset();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar relleno" : "Nuevo relleno"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              autoFocus
              {...form.register("nombre")}
              placeholder="Ej: Vainilla, Pollo y Queso"
            />
            {form.formState.errors.nombre?.message && (
              <p className="text-xs text-red-600">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Descripción</Label>
            <Textarea
              {...form.register("descripcion")}
              rows={2}
              placeholder="Notas adicionales (opcional)"
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.watch("activo")}
              onCheckedChange={(v) =>
                form.setValue("activo", v === true, { shouldValidate: true })
              }
            />
            Activo
          </label>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isEdit ? "Guardar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
