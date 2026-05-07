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
  ncfTypeInputSchema,
  type NcfTypeInput,
} from "@/lib/fiscal/schema";
import { createNcfType, updateNcfType } from "@/lib/fiscal/actions";
import type { NcfType } from "@/lib/db/schema";

type Mode = { kind: "create" } | { kind: "edit"; type: NcfType };

export function NcfTypeFormDialog({
  trigger,
  mode,
}: {
  trigger: React.ReactNode;
  mode: Mode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode.kind === "edit";

  const form = useForm<NcfTypeInput>({
    resolver: zodResolver(ncfTypeInputSchema),
    defaultValues:
      mode.kind === "edit"
        ? {
            codigo: mode.type.codigo,
            nombre: mode.type.nombre,
            prefijo: mode.type.prefijo,
            activo: mode.type.activo,
          }
        : { codigo: "", nombre: "", prefijo: "", activo: true },
  });

  const onSubmit = (values: NcfTypeInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateNcfType({ id: mode.type.id, ...values })
        : await createNcfType(values);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof NcfTypeInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      toast.success(isEdit ? "Tipo actualizado" : "Tipo creado");
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
            {isEdit ? "Editar tipo de comprobante" : "Nuevo tipo de comprobante"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field
              label="Código"
              error={form.formState.errors.codigo?.message}
              hint="Ej: B01, B02, B14"
            >
              <Input
                autoFocus
                {...form.register("codigo")}
                placeholder="B02"
              />
            </Field>
            <Field
              label="Prefijo"
              error={form.formState.errors.prefijo?.message}
              hint="Ej: B02, E31"
            >
              <Input {...form.register("prefijo")} placeholder="B02" />
            </Field>
          </div>

          <Field label="Nombre" error={form.formState.errors.nombre?.message}>
            <Input
              {...form.register("nombre")}
              placeholder="Factura de Consumo"
            />
          </Field>

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

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
