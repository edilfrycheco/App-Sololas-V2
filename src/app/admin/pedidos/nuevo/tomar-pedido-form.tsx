"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ImageIcon,
  Loader2,
  Save,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { ClientePicker } from "./cliente-picker";
import { ProductoPicker } from "./producto-picker";
import type { PersonaSuggestion } from "@/lib/personas/search-action";
import type { ProductoSuggestion } from "@/lib/productos/search-action";
import type { Relleno } from "@/lib/db/schema";
import { createOrder } from "@/lib/pedidos/actions";
import { uploadReferenceImage } from "@/lib/pedidos/storage";
import { compressImage } from "@/lib/image/compress";
import { AREA_LABELS, type AreaCocinaValue } from "@/lib/categorias/schema";
import { formatDOP } from "@/lib/utils";

interface DraftItem {
  uid: string;
  product: ProductoSuggestion;
  cantidad: string;
  precioUnitario: string;
  itbisPct: string; // %
  rellenoId?: string;
  topping?: string;
  decoracion?: string;
  notas?: string;
}

interface DraftReference {
  uid: string;
  itemUid?: string;
  imagenUrl: string;
  nota?: string;
}

interface Props {
  rellenos: Relleno[];
}

function genUid() {
  return `tmp-${Math.random().toString(36).slice(2, 10)}`;
}

function calcLine(item: DraftItem) {
  const cantidad = Number(item.cantidad) || 0;
  const precio = Number(item.precioUnitario) || 0;
  const itbisPct = Number(item.itbisPct) || 0;
  const bruto = cantidad * precio;
  const itbis = (bruto * itbisPct) / 100;
  return {
    bruto,
    itbis,
    neto: bruto + itbis,
    itbisUnitario: precio * (itbisPct / 100),
  };
}

export function TomarPedidoForm({ rellenos }: Props) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"general" | "items" | "refs">(
    "general",
  );

  const [cliente, setCliente] = useState<PersonaSuggestion | null>(null);
  const [tema, setTema] = useState("");
  const [fechaEntrega, setFechaEntrega] = useState("");
  const [horaEntrega, setHoraEntrega] = useState("");
  const [delivery, setDelivery] = useState(false);
  const [direccionDelivery, setDireccionDelivery] = useState("");
  const [notaGeneral, setNotaGeneral] = useState("");

  const [items, setItems] = useState<DraftItem[]>([]);
  const [references, setReferences] = useState<DraftReference[]>([]);
  const [uploadingFor, setUploadingFor] = useState<string | null>(null);

  const [isPending, startTransition] = useTransition();

  const totals = useMemo(() => {
    let bruto = 0;
    let itbis = 0;
    for (const it of items) {
      const c = calcLine(it);
      bruto += c.bruto;
      itbis += c.itbis;
    }
    return { bruto, itbis, neto: bruto + itbis };
  }, [items]);

  const addItem = (p: ProductoSuggestion) => {
    setItems((prev) => [
      ...prev,
      {
        uid: genUid(),
        product: p,
        cantidad: "1",
        precioUnitario: p.precio,
        itbisPct: p.itbisPct,
        rellenoId: undefined,
        topping: "",
        decoracion: "",
        notas: "",
      },
    ]);
  };

  const updateItem = (uid: string, patch: Partial<DraftItem>) => {
    setItems((prev) =>
      prev.map((it) => (it.uid === uid ? { ...it, ...patch } : it)),
    );
  };

  const removeItem = (uid: string) => {
    setItems((prev) => prev.filter((it) => it.uid !== uid));
    setReferences((prev) => prev.filter((r) => r.itemUid !== uid));
  };

  const handleUploadRef = async (file: File, itemUid?: string) => {
    setUploadingFor(itemUid ?? "general");
    try {
      let toUpload: File;
      try {
        toUpload = await compressImage(file);
      } catch {
        toUpload = file;
      }
      const fd = new FormData();
      fd.append("file", toUpload);
      const result = await uploadReferenceImage(fd);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      setReferences((prev) => [
        ...prev,
        { uid: genUid(), itemUid, imagenUrl: result.url },
      ]);
      toast.success("Referencia agregada");
    } finally {
      setUploadingFor(null);
    }
  };

  const updateReferenceNote = (uid: string, nota: string) => {
    setReferences((prev) =>
      prev.map((r) => (r.uid === uid ? { ...r, nota } : r)),
    );
  };

  const removeReference = (uid: string) => {
    setReferences((prev) => prev.filter((r) => r.uid !== uid));
  };

  const handleSave = () => {
    if (!cliente) {
      toast.error("Selecciona un cliente");
      setActiveTab("general");
      return;
    }
    if (!fechaEntrega) {
      toast.error("Fecha de entrega es requerida");
      setActiveTab("general");
      return;
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto al pedido");
      setActiveTab("items");
      return;
    }
    if (delivery && !direccionDelivery.trim()) {
      toast.error("Dirección de delivery es requerida");
      setActiveTab("general");
      return;
    }

    startTransition(async () => {
      const result = await createOrder({
        personId: cliente.id,
        tema: tema || undefined,
        fechaEntrega,
        horaEntrega: horaEntrega || undefined,
        delivery,
        direccionDelivery: delivery ? direccionDelivery : undefined,
        notaGeneral: notaGeneral || undefined,
        items: items.map((it) => {
          const calc = calcLine(it);
          return {
            productId: it.product.id,
            cantidad: it.cantidad,
            precioUnitario: it.precioUnitario,
            itbisUnitario: calc.itbisUnitario.toFixed(2),
            neto: calc.neto.toFixed(2),
            rellenoId: it.rellenoId,
            topping: it.topping || undefined,
            decoracion: it.decoracion || undefined,
            notas: it.notas || undefined,
          };
        }),
        references: references.map((r) => ({
          productId: items.find((i) => i.uid === r.itemUid)?.product.id,
          imagenUrl: r.imagenUrl,
          nota: r.nota,
        })),
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      toast.success(
        result.data.numero
          ? `Pedido #${result.data.numero} creado`
          : "Pedido creado",
      );
      router.push("/admin/pedidos");
    });
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList>
          <TabsTrigger value="general">
            1. Información General
            {cliente && fechaEntrega && (
              <span className="ml-1.5 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
          </TabsTrigger>
          <TabsTrigger value="items">
            2. Información del Pedido
            {items.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-[10px] font-semibold text-brand-700">
                {items.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="refs">
            3. Referencias
            {references.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-100 px-1.5 text-[10px] font-semibold text-brand-700">
                {references.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="space-y-4 p-6">
            <div className="space-y-1.5">
              <Label>Cliente</Label>
              <ClientePicker value={cliente} onChange={setCliente} />
              {cliente && (
                <p className="text-xs text-neutral-500">
                  {[
                    cliente.cedulaRnc && `Cédula/RNC: ${cliente.cedulaRnc}`,
                    cliente.celular && `Cel: ${cliente.celular}`,
                    cliente.telefono && `Tel: ${cliente.telefono}`,
                    cliente.correo,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Tema del pedido</Label>
              <Input
                value={tema}
                onChange={(e) => setTema(e.target.value)}
                placeholder="Ej: Cumpleaños Mason 1 año"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Fecha de entrega *</Label>
                <Input
                  type="date"
                  value={fechaEntrega}
                  onChange={(e) => setFechaEntrega(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Hora de entrega</Label>
                <Input
                  type="time"
                  value={horaEntrega}
                  onChange={(e) => setHoraEntrega(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-lg border bg-brand-50/40 p-4">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={delivery}
                  onCheckedChange={(v) => setDelivery(v === true)}
                />
                Delivery
              </label>
              {delivery && (
                <div className="mt-3 space-y-1.5">
                  <Label>Dirección de delivery</Label>
                  <Textarea
                    rows={2}
                    value={direccionDelivery}
                    onChange={(e) => setDireccionDelivery(e.target.value)}
                    placeholder="Calle, sector, ciudad, referencia"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Nota general</Label>
              <Textarea
                rows={2}
                value={notaGeneral}
                onChange={(e) => setNotaGeneral(e.target.value)}
                placeholder="Información adicional del pedido (opcional)"
              />
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => setActiveTab("items")}>
                Siguiente: Productos
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="items">
          <Card className="space-y-4 p-6">
            <ProductoPicker onPick={addItem} />

            {items.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center text-sm text-neutral-500">
                Aún no hay productos en el pedido. Usa el buscador de arriba.
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((it) => {
                  const calc = calcLine(it);
                  return (
                    <div
                      key={it.uid}
                      className="rounded-lg border border-neutral-200 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span
                              className="inline-block h-2 w-2 rounded-full"
                              style={{
                                backgroundColor: it.product.categoria.colorHex,
                              }}
                            />
                            <span className="text-sm font-medium text-neutral-900">
                              {it.product.descripcion}
                            </span>
                            <span className="text-xs text-neutral-500">
                              ·{" "}
                              {
                                AREA_LABELS[
                                  it.product.categoria.areaCocina as AreaCocinaValue
                                ]
                              }
                            </span>
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeItem(it.uid)}
                          aria-label="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>

                      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
                        <div className="space-y-1">
                          <Label className="text-xs">Cantidad</Label>
                          <Input
                            value={it.cantidad}
                            onChange={(e) =>
                              updateItem(it.uid, { cantidad: e.target.value })
                            }
                            inputMode="decimal"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Precio unit.</Label>
                          <Input
                            value={it.precioUnitario}
                            onChange={(e) =>
                              updateItem(it.uid, {
                                precioUnitario: e.target.value,
                              })
                            }
                            inputMode="decimal"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">ITBIS %</Label>
                          <Input
                            value={it.itbisPct}
                            onChange={(e) =>
                              updateItem(it.uid, { itbisPct: e.target.value })
                            }
                            inputMode="decimal"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Bruto</Label>
                          <div className="flex h-9 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm text-neutral-700">
                            {formatDOP(calc.bruto)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Neto</Label>
                          <div className="flex h-9 items-center rounded-md border border-neutral-200 bg-neutral-50 px-3 text-sm font-medium text-brand-700">
                            {formatDOP(calc.neto)}
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Relleno</Label>
                          <Select
                            value={it.rellenoId ?? "none"}
                            onValueChange={(v) =>
                              updateItem(it.uid, {
                                rellenoId: v === "none" ? undefined : v,
                              })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Sin relleno" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Sin relleno</SelectItem>
                              {rellenos
                                .filter((r) => r.activo)
                                .map((r) => (
                                  <SelectItem key={r.id} value={r.id}>
                                    {r.nombre}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Topping</Label>
                          <Input
                            value={it.topping ?? ""}
                            onChange={(e) =>
                              updateItem(it.uid, { topping: e.target.value })
                            }
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Decoración</Label>
                          <Input
                            value={it.decoracion ?? ""}
                            onChange={(e) =>
                              updateItem(it.uid, {
                                decoracion: e.target.value,
                              })
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <Label className="text-xs">Notas / comentarios</Label>
                        <Textarea
                          rows={2}
                          value={it.notas ?? ""}
                          onChange={(e) =>
                            updateItem(it.uid, { notas: e.target.value })
                          }
                          placeholder="Detalles especiales para este producto"
                        />
                      </div>
                    </div>
                  );
                })}

                <div className="flex justify-between rounded-lg bg-brand-50 px-4 py-3 text-sm">
                  <div className="space-y-0.5">
                    <div className="text-neutral-700">
                      Subtotal: {formatDOP(totals.bruto)}
                    </div>
                    <div className="text-neutral-700">
                      ITBIS: {formatDOP(totals.itbis)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs uppercase tracking-wide text-neutral-500">
                      Total
                    </div>
                    <div className="text-xl font-bold text-brand-700">
                      {formatDOP(totals.neto)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("general")}
              >
                Atrás
              </Button>
              <Button onClick={() => setActiveTab("refs")}>
                Siguiente: Referencias
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="refs">
          <Card className="space-y-4 p-6">
            <p className="text-sm text-neutral-600">
              Sube fotos de referencia para cada producto del pedido. Las
              imágenes se optimizan automáticamente al subirlas.
            </p>

            <ReferenceUploader
              label="Referencia general del pedido"
              uploading={uploadingFor === "general"}
              onSelect={(file) => handleUploadRef(file)}
            />

            {items.length > 0 && (
              <div className="space-y-4 pt-2">
                {items.map((it) => (
                  <div key={it.uid}>
                    <ReferenceUploader
                      label={`Referencia para: ${it.product.descripcion}`}
                      uploading={uploadingFor === it.uid}
                      onSelect={(file) => handleUploadRef(file, it.uid)}
                    />
                  </div>
                ))}
              </div>
            )}

            {references.length > 0 && (
              <div className="space-y-2 pt-4">
                <Label className="text-xs uppercase tracking-wide text-neutral-500">
                  {references.length}{" "}
                  {references.length === 1 ? "referencia" : "referencias"}
                </Label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {references.map((r) => {
                    const item = items.find((i) => i.uid === r.itemUid);
                    return (
                      <div
                        key={r.uid}
                        className="overflow-hidden rounded-lg border border-neutral-200"
                      >
                        <div className="relative aspect-square bg-neutral-100">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={r.imagenUrl}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeReference(r.uid)}
                            className="absolute right-1 top-1 rounded-full bg-white/90 p-1 shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="p-2">
                          <div className="text-xs font-medium text-neutral-700">
                            {item?.product.descripcion ?? "Pedido completo"}
                          </div>
                          <Input
                            className="mt-1 h-7 text-xs"
                            placeholder="Nota (opcional)"
                            value={r.nota ?? ""}
                            onChange={(e) =>
                              updateReferenceNote(r.uid, e.target.value)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActiveTab("items")}
              >
                Atrás
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Guardar pedido
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReferenceUploader({
  label,
  uploading,
  onSelect,
}: {
  label: string;
  uploading: boolean;
  onSelect: (file: File) => void;
}) {
  const id = useMemo(() => `up-${Math.random().toString(36).slice(2, 8)}`, []);
  return (
    <div className="flex items-center gap-3 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-white">
        <ImageIcon className="h-4 w-4 text-neutral-400" />
      </div>
      <div className="flex-1 text-sm text-neutral-700">{label}</div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => document.getElementById(id)?.click()}
      >
        {uploading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Upload className="h-3.5 w-3.5" />
        )}
        Subir foto
      </Button>
      <input
        id={id}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onSelect(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
