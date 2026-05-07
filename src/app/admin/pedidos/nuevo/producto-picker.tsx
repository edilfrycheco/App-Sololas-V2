"use client";

import { useEffect, useState, useTransition } from "react";
import { ImageIcon, Plus, Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";

import {
  searchProductos,
  type ProductoSuggestion,
} from "@/lib/productos/search-action";
import { AREA_LABELS, type AreaCocinaValue } from "@/lib/categorias/schema";
import { formatDOP } from "@/lib/utils";

export function ProductoPicker({
  onPick,
}: {
  onPick: (p: ProductoSuggestion) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductoSuggestion[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await searchProductos(query);
        setResults(r);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" className="w-full justify-start">
          <Plus className="h-4 w-4" />
          Agregar producto al pedido
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="start">
        <div className="border-b p-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar producto por nombre o categoría"
              className="h-8 pl-7"
            />
          </div>
        </div>
        <div className="max-h-80 overflow-y-auto py-1">
          {results.length === 0 ? (
            <p className="px-3 py-4 text-center text-sm text-neutral-500">
              {query ? "Sin resultados." : "Empieza a escribir para buscar."}
            </p>
          ) : (
            <ul>
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-brand-50"
                    onClick={() => {
                      onPick(p);
                      setOpen(false);
                      setQuery("");
                    }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border bg-neutral-50">
                      {p.imagenUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={p.imagenUrl}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-4 w-4 text-neutral-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-neutral-900">
                        {p.descripcion}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-neutral-500">
                        <span
                          className="inline-block h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: p.categoria.colorHex }}
                        />
                        {p.categoria.nombre} ·{" "}
                        {AREA_LABELS[p.categoria.areaCocina as AreaCocinaValue]}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm font-semibold text-brand-700">
                      {formatDOP(p.precio)}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
