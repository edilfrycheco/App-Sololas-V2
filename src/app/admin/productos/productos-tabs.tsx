"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function ProductosTabs({ current }: { current: "todos" | "postres" | "salados" }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const onChange = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value === "todos") next.delete("area");
    else next.set("area", value);
    next.delete("page");
    const qs = next.toString();
    const url = qs ? `${pathname}?${qs}` : pathname;
    startTransition(() => router.replace(url, { scroll: false }));
  };

  return (
    <Tabs value={current} onValueChange={onChange}>
      <TabsList>
        <TabsTrigger value="todos">Todos</TabsTrigger>
        <TabsTrigger value="postres">Postres</TabsTrigger>
        <TabsTrigger value="salados">Picadera</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
