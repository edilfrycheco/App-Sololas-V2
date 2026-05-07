"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ImageIcon, Loader2, Upload, X } from "lucide-react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  productoInputSchema,
  type ProductoInput,
} from "@/lib/productos/schema";
import { createProducto, updateProducto } from "@/lib/productos/actions";
import { uploadProductoImage } from "@/lib/productos/storage";
import {
  AREA_LABELS,
  type AreaCocinaValue,
} from "@/lib/categorias/schema";
import type { Product, ProductCategory } from "@/lib/db/schema";

type Mode = { kind: "create" } | { kind: "edit"; producto: Product };

interface Props {
  trigger: React.ReactNode;
  mode: Mode;
  categorias: ProductCategory[];
}

function defaults(mode: Mode): ProductoInput {
  if (mode.kind === "edit") {
    const p = mode.producto;
    return {
      descripcion: p.descripcion,
      categoryId: p.categoryId,
      subcategoria: p.subcategoria ?? undefined,
      precio: p.precio,
      costo: p.costo ?? undefined,
      itbisPct: p.itbisPct,
      unidadMedida: p.unidadMedida,
      cantidadReorden: p.cantidadReorden ?? undefined,
      llevaIngredientes: p.llevaIngredientes,
      imagenUrl: p.imagenUrl ?? undefined,
      activo: p.activo,
    };
  }
  return {
    descripcion: "",
    categoryId: "",
    subcategoria: undefined,
    precio: "",
    costo: undefined,
    itbisPct: "0",
    unidadMedida: "unidad",
    cantidadReorden: undefined,
    llevaIngredientes: false,
    imagenUrl: undefined,
    activo: true,
  };
}

export function ProductoFormDialog({ trigger, mode, categorias }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const isEdit = mode.kind === "edit";

  const form = useForm<ProductoInput>({
    resolver: zodResolver(productoInputSchema),
    defaultValues: defaults(mode),
  });

  const imagenUrl = form.watch("imagenUrl");

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const result = await uploadProductoImage(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      form.setValue("imagenUrl", result.url, { shouldValidate: true });
      toast.success("Imagen cargada");
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = (values: ProductoInput) => {
    startTransition(async () => {
      const result = isEdit
        ? await updateProducto({ id: mode.producto.id, ...values })
        : await createProducto(values);

      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof ProductoInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      toast.success(isEdit ? "Producto actualizado" : "Producto creado");
      setOpen(false);
      if (!isEdit) form.reset(defaults({ kind: "create" }));
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) form.reset(defaults(mode));
      }}
    >
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Editar producto" : "Nuevo producto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Field
            label="Descripción"
            error={form.formState.errors.descripcion?.message}
          >
            <Input
              autoFocus
              {...form.register("descripcion")}
              placeholder="Ej: Cupcakes Vainilla"
            />
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Categoría"
              error={form.formState.errors.categoryId?.message}
              hint="Define el área de cocina (Postres o Picadera)"
            >
              <Select
                value={form.watch("categoryId")}
                onValueChange={(v) =>
                  form.setValue("categoryId", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categorias.length === 0 && (
                    <div className="p-2 text-xs text-neutral-500">
                      Crea categorías primero en Configuración.
                    </div>
                  )}
                  {categorias.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: c.colorHex }}
                        />
                        {c.nombre}
                        <span className="text-xs text-neutral-400">
                          · {AREA_LABELS[c.areaCocina as AreaCocinaValue]}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Subcategoría"
              hint="Texto libre para reportes (opcional)"
              error={form.formState.errors.subcategoria?.message}
            >
              <Input
                {...form.register("subcategoria")}
                placeholder="Ej: Galletas, Fríos…"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field
              label="Precio (RD$)"
              error={form.formState.errors.precio?.message}
            >
              <Input
                {...form.register("precio")}
                inputMode="decimal"
                placeholder="0.00"
              />
            </Field>
            <Field
              label="Costo (RD$)"
              hint="Opcional"
              error={form.formState.errors.costo?.message}
            >
              <Input
                {...form.register("costo")}
                inputMode="decimal"
                placeholder="0.00"
              />
            </Field>
            <Field
              label="ITBIS %"
              error={form.formState.errors.itbisPct?.message}
            >
              <Input
                {...form.register("itbisPct")}
                inputMode="decimal"
                placeholder="0"
              />
            </Field>
            <Field
              label="Unidad"
              error={form.formState.errors.unidadMedida?.message}
            >
              <Input
                {...form.register("unidadMedida")}
                placeholder="unidad, libra, docena"
              />
            </Field>
          </div>

          <Field
            label="Cantidad de reorden"
            hint="Stock mínimo antes de alertar (opcional)"
            error={form.formState.errors.cantidadReorden?.message}
          >
            <Input
              {...form.register("cantidadReorden")}
              inputMode="numeric"
              placeholder="Ej: 10"
            />
          </Field>

          <div className="space-y-1.5">
            <Label>Imagen</Label>
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-neutral-300 bg-neutral-50">
                {imagenUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imagenUrl}
                    alt="Vista previa"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="h-8 w-8 text-neutral-300" />
                )}
                {imagenUrl && (
                  <button
                    type="button"
                    className="absolute right-1 top-1 rounded-full bg-white/90 p-0.5 shadow"
                    onClick={() =>
                      form.setValue("imagenUrl", undefined, {
                        shouldValidate: true,
                      })
                    }
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInput.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Upload className="h-3.5 w-3.5" />
                  )}
                  {imagenUrl ? "Reemplazar imagen" : "Subir imagen"}
                </Button>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                    e.target.value = "";
                  }}
                />
                <p className="text-xs text-neutral-500">
                  PNG/JPG/WebP. Máximo 5 MB.
                </p>
              </div>
            </div>
            {form.formState.errors.imagenUrl?.message && (
              <p className="text-xs text-red-600">
                {form.formState.errors.imagenUrl.message}
              </p>
            )}
          </div>

          <Field label="Notas">
            <Textarea
              rows={2}
              placeholder="Información interna (opcional)"
              disabled
              value=""
            />
          </Field>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={form.watch("llevaIngredientes")}
                onCheckedChange={(v) =>
                  form.setValue("llevaIngredientes", v === true, {
                    shouldValidate: true,
                  })
                }
              />
              Lleva ingredientes (mostrar campo en pedido)
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
          </div>

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
              {isEdit ? "Guardar cambios" : "Crear producto"}
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

// Silence unused import lint for default Image (kept for future SSR optimization).
void Image;
