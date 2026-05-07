"use client";

import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";

import {
  AREA_DEFAULT_COLORS,
  AREA_LABELS,
  areaCocinaValues,
  categoriaInputSchema,
  type AreaCocinaValue,
  type CategoriaInput,
} from "@/lib/categorias/schema";
import {
  createCategoria,
  updateCategoria,
} from "@/lib/categorias/actions";
import type { ProductCategory } from "@/lib/db/schema";

type Mode = { kind: "create"; defaultArea?: AreaCocinaValue } | { kind: "edit"; categoria: ProductCategory };

export function CategoriaFormDialog({
  trigger,
  mode,
}: {
  trigger: React.ReactNode;
  mode: Mode;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const isEdit = mode.kind === "edit";

  const defaultArea: AreaCocinaValue =
    mode.kind === "edit"
      ? (mode.categoria.areaCocina as AreaCocinaValue)
      : (mode.defaultArea ?? "postres");

  const form = useForm<CategoriaInput>({
    resolver: zodResolver(categoriaInputSchema),
    defaultValues:
      mode.kind === "edit"
        ? {
            nombre: mode.categoria.nombre,
            areaCocina: mode.categoria.areaCocina as AreaCocinaValue,
            colorHex: mode.categoria.colorHex,
            activo: mode.categoria.activo,
          }
        : {
            nombre: "",
            areaCocina: defaultArea,
            colorHex: AREA_DEFAULT_COLORS[defaultArea],
            activo: true,
          },
  });

  const onSubmit = (values: CategoriaInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateCategoria({ id: mode.categoria.id, ...values })
        : await createCategoria(values);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof CategoriaInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      toast.success(isEdit ? "Categoría actualizada" : "Categoría creada");
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
            {isEdit ? "Editar categoría" : "Nueva categoría"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Nombre"
            error={form.formState.errors.nombre?.message}
            hint="Ej: Bizcocho, Cupcakes, Empanadas"
          >
            <Input
              autoFocus
              {...form.register("nombre")}
              placeholder="Nombre de la categoría"
            />
          </Field>

          <Field
            label="Área de cocina"
            error={form.formState.errors.areaCocina?.message}
            hint="Define a qué tablet va el producto"
          >
            <Select
              value={form.watch("areaCocina")}
              onValueChange={(v) => {
                const area = v as AreaCocinaValue;
                form.setValue("areaCocina", area, { shouldValidate: true });
                if (mode.kind === "create") {
                  form.setValue("colorHex", AREA_DEFAULT_COLORS[area]);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona área" />
              </SelectTrigger>
              <SelectContent>
                {areaCocinaValues.map((area) => (
                  <SelectItem key={area} value={area}>
                    {AREA_LABELS[area]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field
            label="Color"
            error={form.formState.errors.colorHex?.message}
            hint="Se usa en las pizarras para identificar la categoría"
          >
            <div className="flex items-center gap-2">
              <Input {...form.register("colorHex")} className="w-32" />
              <span
                className="h-9 w-9 rounded-md border border-neutral-200"
                style={{ backgroundColor: form.watch("colorHex") }}
              />
            </div>
          </Field>

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
