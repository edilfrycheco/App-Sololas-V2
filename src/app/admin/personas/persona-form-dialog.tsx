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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  personaInputSchema,
  type PersonaInput,
} from "@/lib/personas/schema";
import { createPersona, updatePersona } from "@/lib/personas/actions";
import type { Person } from "@/lib/db/schema";

type Mode = { kind: "create" } | { kind: "edit"; persona: Person };

interface Props {
  trigger: React.ReactNode;
  mode: Mode;
  /** Pre-marca el flag al crear (ej. desde la pestaña Clientes). */
  prefill?: { isCliente?: boolean; isEstudiante?: boolean };
}

function defaultsFromMode(mode: Mode, prefill?: Props["prefill"]): PersonaInput {
  if (mode.kind === "edit") {
    const p = mode.persona;
    return {
      nombres: p.nombres,
      apellidos: p.apellidos,
      cedulaRnc: p.cedulaRnc ?? undefined,
      telefono: p.telefono ?? undefined,
      celular: p.celular ?? undefined,
      correo: p.correo ?? undefined,
      direccion: p.direccion ?? undefined,
      isCliente: p.isCliente,
      isEstudiante: p.isEstudiante,
      notas: p.notas ?? undefined,
    };
  }
  return {
    nombres: "",
    apellidos: "",
    cedulaRnc: undefined,
    telefono: undefined,
    celular: undefined,
    correo: undefined,
    direccion: undefined,
    isCliente: prefill?.isCliente ?? false,
    isEstudiante: prefill?.isEstudiante ?? false,
    notas: undefined,
  };
}

export function PersonaFormDialog({ trigger, mode, prefill }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode.kind === "edit";

  const form = useForm<PersonaInput>({
    resolver: zodResolver(personaInputSchema),
    defaultValues: defaultsFromMode(mode, prefill),
  });

  const onSubmit = (values: PersonaInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updatePersona({ id: mode.persona.id, ...values })
        : await createPersona(values);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof PersonaInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      toast.success(isEdit ? "Persona actualizada" : "Persona creada");
      setOpen(false);
      if (!isEdit) form.reset(defaultsFromMode({ kind: "create" }, prefill));
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(defaultsFromMode(mode, prefill));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar persona" : "Nueva persona"}
          </DialogTitle>
          <DialogDescription>
            Una persona puede ser cliente, estudiante o ambos.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nombres" error={form.formState.errors.nombres?.message}>
              <Input
                autoFocus
                {...form.register("nombres")}
                placeholder="Ej: Raquel"
              />
            </Field>
            <Field
              label="Apellidos"
              error={form.formState.errors.apellidos?.message}
            >
              <Input {...form.register("apellidos")} placeholder="Ej: Quezada" />
            </Field>
          </div>

          <Field
            label="Cédula / RNC"
            error={form.formState.errors.cedulaRnc?.message}
            hint="11 dígitos para cédula o 9 para RNC"
          >
            <Input
              {...form.register("cedulaRnc")}
              placeholder="Ej: 00112345678"
              inputMode="numeric"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Teléfono"
              error={form.formState.errors.telefono?.message}
            >
              <Input
                {...form.register("telefono")}
                placeholder="(809) 555-1234"
              />
            </Field>
            <Field
              label="Celular"
              error={form.formState.errors.celular?.message}
            >
              <Input
                {...form.register("celular")}
                placeholder="(829) 555-1234"
              />
            </Field>
          </div>

          <Field label="Correo" error={form.formState.errors.correo?.message}>
            <Input
              {...form.register("correo")}
              type="email"
              placeholder="cliente@correo.com"
            />
          </Field>

          <Field
            label="Dirección"
            error={form.formState.errors.direccion?.message}
          >
            <Input
              {...form.register("direccion")}
              placeholder="Calle, sector, ciudad"
            />
          </Field>

          <div className="rounded-lg border bg-brand-50/40 p-4">
            <p className="text-sm font-medium text-brand-800">
              Tipo de relación
            </p>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.watch("isCliente")}
                  onCheckedChange={(v) =>
                    form.setValue("isCliente", v === true, {
                      shouldValidate: true,
                    })
                  }
                />
                Es cliente de pedidos
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.watch("isEstudiante")}
                  onCheckedChange={(v) =>
                    form.setValue("isEstudiante", v === true, {
                      shouldValidate: true,
                    })
                  }
                />
                Es estudiante de cursos
              </label>
            </div>
            {form.formState.errors.isCliente?.message && (
              <p className="mt-2 text-xs text-red-600">
                {form.formState.errors.isCliente.message}
              </p>
            )}
          </div>

          <Field label="Notas internas" error={form.formState.errors.notas?.message}>
            <Textarea
              {...form.register("notas")}
              rows={3}
              placeholder="Información adicional (opcional)"
            />
          </Field>

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
              {isEdit ? "Guardar cambios" : "Crear persona"}
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
