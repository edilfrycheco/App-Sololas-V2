"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PersonasPagination({
  page,
  totalPages,
  total,
  pageSize,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
}) {
  const pathname = usePathname();
  const params = useSearchParams();

  const buildHref = (next: number) => {
    const sp = new URLSearchParams(params.toString());
    if (next <= 1) sp.delete("page");
    else sp.set("page", String(next));
    const qs = sp.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  };

  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t pt-4 sm:flex-row">
      <p className="text-xs text-neutral-500">
        {total === 0
          ? "Sin resultados"
          : `Mostrando ${start}–${end} de ${total} ${total === 1 ? "persona" : "personas"}`}
      </p>
      <div className="flex items-center gap-1">
        <Button
          asChild={page > 1}
          variant="outline"
          size="sm"
          disabled={page <= 1}
        >
          {page > 1 ? (
            <Link href={buildHref(page - 1)}>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </Link>
          ) : (
            <span>
              <ChevronLeft className="h-4 w-4" /> Anterior
            </span>
          )}
        </Button>
        <span className="px-3 text-xs font-medium text-neutral-700">
          Página {page} de {totalPages}
        </span>
        <Button
          asChild={page < totalPages}
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
        >
          {page < totalPages ? (
            <Link href={buildHref(page + 1)}>
              Siguiente <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <span>
              Siguiente <ChevronRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
