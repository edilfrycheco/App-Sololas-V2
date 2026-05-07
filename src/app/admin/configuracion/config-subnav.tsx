"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin/configuracion", label: "Mi Negocio", exact: true },
  {
    href: "/admin/configuracion/categorias",
    label: "Categorías de producto",
  },
  { href: "/admin/configuracion/rellenos", label: "Rellenos" },
  { href: "/admin/configuracion/metodos-pago", label: "Métodos de pago" },
];

export function ConfigSubnav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-wrap gap-1 border-b border-neutral-200">
      {ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname?.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "border-brand-500 text-brand-700"
                : "border-transparent text-neutral-500 hover:text-neutral-900",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
