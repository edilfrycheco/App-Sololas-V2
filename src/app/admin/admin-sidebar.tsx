"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ChartBar,
  Cookie,
  GraduationCap,
  Home,
  Settings,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Inicio", icon: Home },
  { href: "/admin/personas", label: "Personas", icon: Users },
  { href: "/admin/productos", label: "Productos", icon: Cookie },
  { href: "/admin/pedidos", label: "Pedidos", icon: CalendarDays },
  { href: "/admin/cursos", label: "Cursos", icon: GraduationCap },
  { href: "/admin/reportes", label: "Reportes", icon: ChartBar },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <Link href="/admin" className="block px-5 py-5">
        <div className="text-xl font-bold tracking-tight text-brand-700">
          Solola&apos;s
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-500">
          Admin
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-0.5 px-3">
        {NAV.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-50 text-brand-700"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-neutral-200 px-3 py-3">
        <Link
          href="/admin/configuracion"
          className={cn(
            "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium transition-colors",
            pathname?.startsWith("/admin/configuracion")
              ? "bg-brand-50 text-brand-700"
              : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900",
          )}
        >
          <Settings className="h-4 w-4" />
          Configuración
        </Link>
      </div>
    </aside>
  );
}
