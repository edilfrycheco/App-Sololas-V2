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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  ncfSequenceInputSchema,
  ncfSequenceUpdateSchema,
} from "@/lib/fiscal/schema";
import {
  createNcfSequence,
  updateNcfSequence,
} from "@/lib/fiscal/actions";
import type { NcfSequence, NcfType } from "@/lib/db/schema";

type Mode =
  | { kind: "create"; defaultTypeId?: string }
  | { kind: "edit"; sequence: NcfSequence };

interface FormValues {
  ncfTypeId: string;
  secuenciaInicial: string;
  secuenciaActual: string;
  secuenciaFinal: string;
  fechaVencimiento?: string;
  cantidadAlertaReorden: string;
  activo: boolean;
}

export function NcfSequenceFormDialog({
  trigger,
  mode,
  types,
}: {
  trigger: React.ReactNode;
  mode: Mode;
  types: NcfType[];
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode.kind === "edit";

  const form = useForm<FormValues>({
    resolver: zodResolver(isEdit ? ncfSequenceUpdateSchema : ncfSequenceInputSchema) as never,
    defaultValues:
      mode.kind === "edit"
        ? {
            ncfTypeId: mode.sequence.ncfTypeId,
            secuenciaInicial: String(mode.sequence.secuenciaInicial),
            secuenciaActual: String(mode.sequence.secuenciaActual),
            secuenciaFinal: String(mode.sequence.secuenciaFinal),
            fechaVencimiento: mode.sequence.fechaVencimiento ?? undefined,
            cantidadAlertaReorden: String(mode.sequence.cantidadAlertaReorden),
            activo: mode.sequence.activo,
          }
        : {
            ncfTypeId: mode.defaultTypeId ?? "",
            secuenciaInicial: "1",
            secuenciaActual: "1",
            secuenciaFinal: "1000",
            fechaVencimiento: undefined,
            cantidadAlertaReorden: "50",
            activo: true,
          },
  });

  const onSubmit = (values: FormValues) => {
    const numbers = {
      ncfTypeId: values.ncfTypeId,
      secuenciaInicial: Number(values.secuenciaInicial),
      secuenciaActual: Number(values.secuenciaActual),
      secuenciaFinal: Number(values.secuenciaFinal),
      fechaVencimiento: values.fechaVencimiento,
      cantidadAlertaReorden: Number(values.cantidadAlertaReorden),
      activo: values.activo,
    };
    startTransition(async () => {
      const result = isEdit
        ? await updateNcfSequence({ id: mode.sequence.id, ...numbers })
        : await createNcfSequence(numbers);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof FormValues, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      toast.success(isEdit ? "Secuencia actualizada" : "Secuencia creada");
      setOpen(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar secuencia NCF" : "Nueva secuencia NCF"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Tipo de comprobante"
            error={form.formState.errors.ncfTypeId?.message}
          >
            <Select
              value={form.watch("ncfTypeId")}
              onValueChange={(v) =>
                form.setValue("ncfTypeId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {types.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.codigo} — {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field
              label="Inicial"
              error={form.formState.errors.secuenciaInicial?.message}
            >
              <Input
                {...form.register("secuenciaInicial")}
                inputMode="numeric"
              />
            </Field>
            <Field
              label="Actual"
              error={form.formState.errors.secuenciaActual?.message}
              hint="Próximo a emitir"
            >
              <Input
                {...form.register("secuenciaActual")}
                inputMode="numeric"
              />
            </Field>
            <Field
              label="Final"
              error={form.formState.errors.secuenciaFinal?.message}
            >
              <Input
                {...form.register("secuenciaFinal")}
                inputMode="numeric"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Vencimiento"
              hint="Opcional"
              error={form.formState.errors.fechaVencimiento?.message}
            >
              <Input
                type="date"
                {...form.register("fechaVencimiento")}
              />
            </Field>
            <Field
              label="Alerta de reorden"
              hint="Restantes para alertar"
              error={form.formState.errors.cantidadAlertaReorden?.message}
            >
              <Input
                {...form.register("cantidadAlertaReorden")}
                inputMode="numeric"
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.watch("activo")}
              onCheckedChange={(v) =>
                form.setValue("activo", v === true, { shouldValidate: true })
              }
            />
            Activa
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
