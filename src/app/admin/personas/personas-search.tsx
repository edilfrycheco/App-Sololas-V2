"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function PersonasSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [value, setValue] = useState(params.get("q") ?? "");
  const [, startTransition] = useTransition();

  // Sync external param changes (eg. tab switch resets query string).
  useEffect(() => {
    setValue(params.get("q") ?? "");
  }, [params]);

  // Debounced URL update.
  useEffect(() => {
    const handle = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      const trimmed = value.trim();
      if (trimmed.length === 0) {
        next.delete("q");
      } else {
        next.set("q", trimmed);
      }
      next.delete("page");
      const queryString = next.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;
      startTransition(() => {
        router.replace(url, { scroll: false });
      });
    }, 250);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Buscar por nombre, cédula, teléfono o correo…"
        className="pl-9 pr-9"
      />
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
          onClick={() => setValue("")}
          aria-label="Limpiar"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
    </div>
  );
}
