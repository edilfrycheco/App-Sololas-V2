"use client";

import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  businessSettingsSchema,
  type BusinessSettingsInput,
} from "@/lib/business-settings/schema";
import { saveBusinessSettings } from "@/lib/business-settings/actions";
import type { BusinessSettings } from "@/lib/db/schema";

export function BusinessSettingsForm({
  current,
}: {
  current: BusinessSettings | null;
}) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<BusinessSettingsInput>({
    resolver: zodResolver(businessSettingsSchema),
    defaultValues: {
      nombreComercial: current?.nombreComercial ?? "Solola's",
      razonSocial: current?.razonSocial ?? undefined,
      rnc: current?.rnc ?? undefined,
      direccion:
        current?.direccion ??
        "Av. República de Argentina #54, Rincón Largo, Santiago, República Dominicana",
      telefono: current?.telefono ?? "(809) 241-1575",
      correo: current?.correo ?? "info@sololasrd.com",
      logoUrl: current?.logoUrl ?? undefined,
      reciboTemplate: current?.reciboTemplate ?? undefined,
    },
  });

  const onSubmit = (values: BusinessSettingsInput) => {
    startTransition(async () => {
      const result = await saveBusinessSettings(values);
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof BusinessSettingsInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }
      toast.success("Configuración del negocio guardada");
    });
  };

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="max-w-2xl space-y-4"
    >
      <Field
        label="Nombre comercial"
        error={form.formState.errors.nombreComercial?.message}
      >
        <Input {...form.register("nombreComercial")} />
      </Field>

      <Field
        label="Razón social"
        hint="Nombre legal registrado (opcional)"
        error={form.formState.errors.razonSocial?.message}
      >
        <Input {...form.register("razonSocial")} />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="RNC"
          hint="9 dígitos"
          error={form.formState.errors.rnc?.message}
        >
          <Input {...form.register("rnc")} inputMode="numeric" />
        </Field>
        <Field
          label="Teléfono"
          error={form.formState.errors.telefono?.message}
        >
          <Input {...form.register("telefono")} />
        </Field>
      </div>

      <Field label="Correo" error={form.formState.errors.correo?.message}>
        <Input {...form.register("correo")} type="email" />
      </Field>

      <Field
        label="Dirección"
        hint="Aparece en el recibo"
        error={form.formState.errors.direccion?.message}
      >
        <Textarea {...form.register("direccion")} rows={2} />
      </Field>

      <Field
        label="URL del logo"
        hint="Por ahora pega la URL pública del logo. En la próxima fase agregamos upload directo."
        error={form.formState.errors.logoUrl?.message}
      >
        <Input
          {...form.register("logoUrl")}
          placeholder="https://…/logo.png"
        />
      </Field>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
          Guardar cambios
        </Button>
      </div>
    </form>
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
