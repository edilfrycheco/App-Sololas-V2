"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PersonaFilter } from "@/lib/personas/schema";
import type { PersonaCounts } from "@/lib/personas/queries";

const TAB_LABELS: Record<PersonaFilter, string> = {
  todos: "Todos",
  clientes: "Clientes",
  estudiantes: "Estudiantes",
  ambos: "Ambos",
};

export function PersonasTabs({
  current,
  counts,
}: {
  current: PersonaFilter;
  counts: PersonaCounts;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const onChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "todos") next.delete("filter");
    else next.set("filter", value);
    next.delete("page");
    const queryString = next.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    startTransition(() => router.replace(url, { scroll: false }));
  };

  const countFor = (filter: PersonaFilter) => {
    switch (filter) {
      case "todos":
        return counts.total;
      case "clientes":
        return counts.clientes;
      case "estudiantes":
        return counts.estudiantes;
      case "ambos":
        return counts.ambos;
    }
  };

  return (
    <Tabs value={current} onValueChange={onChange}>
      <TabsList>
        {(Object.keys(TAB_LABELS) as PersonaFilter[]).map((tab) => (
          <TabsTrigger key={tab} value={tab}>
            {TAB_LABELS[tab]}{" "}
            <span className="ml-1.5 rounded-full bg-neutral-200/60 px-1.5 text-[10px] font-semibold text-neutral-600 data-[state=active]:bg-brand-100 data-[state=active]:text-brand-700">
              {countFor(tab)}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
