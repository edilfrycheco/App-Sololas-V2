"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Search, UserPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { searchClientes, type PersonaSuggestion } from "@/lib/personas/search-action";
import { PersonaFormDialog } from "@/app/admin/personas/persona-form-dialog";

interface Props {
  value: PersonaSuggestion | null;
  onChange: (persona: PersonaSuggestion | null) => void;
}

export function ClientePicker({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PersonaSuggestion[]>([]);
  const [, startTransition] = useTransition();
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      startTransition(async () => {
        const r = await searchClientes(query);
        setResults(r);
      });
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="space-y-1.5">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            ref={triggerRef}
            type="button"
            className="flex w-full items-center justify-between rounded-md border border-neutral-200 bg-white px-3 py-2 text-left text-sm shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-1"
          >
            {value ? (
              <span className="flex flex-col">
                <span className="font-medium text-neutral-900">
                  {value.nombres} {value.apellidos}
                </span>
                <span className="text-xs text-neutral-500">
                  {value.celular ?? value.telefono ?? value.correo ?? "Sin contacto"}
                </span>
              </span>
            ) : (
              <span className="text-neutral-400">Buscar cliente…</span>
            )}
            <Search className="h-4 w-4 text-neutral-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--radix-popover-trigger-width)] p-0"
          align="start"
        >
          <div className="border-b p-2">
            <Input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nombre, cédula, teléfono o correo"
              className="h-8"
            />
          </div>
          <div className="max-h-72 overflow-y-auto py-1">
            {results.length === 0 ? (
              <div className="space-y-2 px-3 py-4 text-center">
                <p className="text-sm text-neutral-500">
                  {query
                    ? "No se encontraron clientes."
                    : "Empieza a escribir para buscar."}
                </p>
                <PersonaFormDialog
                  mode={{ kind: "create" }}
                  prefill={{ isCliente: true }}
                  trigger={
                    <Button variant="outline" size="sm" type="button">
                      <UserPlus className="h-3.5 w-3.5" /> Nuevo cliente
                    </Button>
                  }
                />
              </div>
            ) : (
              <ul>
                {results.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left text-sm hover:bg-brand-50"
                      onClick={() => {
                        onChange(p);
                        setOpen(false);
                        setQuery("");
                      }}
                    >
                      <span className="font-medium text-neutral-900">
                        {p.nombres} {p.apellidos}
                      </span>
                      <span className="text-xs text-neutral-500">
                        {[p.celular, p.telefono, p.correo, p.cedulaRnc]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="border-t p-2">
              <PersonaFormDialog
                mode={{ kind: "create" }}
                prefill={{ isCliente: true }}
                trigger={
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="w-full justify-start"
                  >
                    <UserPlus className="h-3.5 w-3.5" /> Nuevo cliente
                  </Button>
                }
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
