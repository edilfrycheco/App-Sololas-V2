"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  metodoPagoInputSchema,
  type MetodoPagoInput,
} from "@/lib/metodos-pago/schema";
import {
  createMetodoPago,
  updateMetodoPago,
} from "@/lib/metodos-pago/actions";
import type { PaymentMethod } from "@/lib/db/schema";

type Mode = { kind: "create" } | { kind: "edit"; metodo: PaymentMethod };

export function MetodoFormDialog({
  trigger,
  mode,
}: {
  trigger: React.ReactNode;
  mode: Mode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode.kind === "edit";

  const form = useForm<MetodoPagoInput>({
    resolver: zodResolver(metodoPagoInputSchema),
    defaultValues:
      mode.kind === "edit"
        ? {
            nombre: mode.metodo.nombre,
            requiereReferencia: mode.metodo.requiereReferencia,
            activo: mode.metodo.activo,
          }
        : { nombre: "", requiereReferencia: false, activo: true },
  });

  const onSubmit = (values: MetodoPagoInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateMetodoPago({ id: mode.metodo.id, ...values })
        : await createMetodoPago(values);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof MetodoPagoInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      toast.success(isEdit ? "Método actualizado" : "Método creado");
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
            {isEdit ? "Editar método de pago" : "Nuevo método de pago"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nombre</Label>
            <Input
              autoFocus
              {...form.register("nombre")}
              placeholder="Ej: Efectivo, Tarjeta de Crédito, Transferencia"
            />
            {form.formState.errors.nombre?.message && (
              <p className="text-xs text-red-600">
                {form.formState.errors.nombre.message}
              </p>
            )}
          </div>

          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              className="mt-0.5"
              checked={form.watch("requiereReferencia")}
              onCheckedChange={(v) =>
                form.setValue("requiereReferencia", v === true, {
                  shouldValidate: true,
                })
              }
            />
            <span>
              Requiere número de referencia
              <span className="block text-xs text-neutral-500">
                Marca esto para tarjetas, transferencias, cheques.
              </span>
            </span>
          </label>

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
