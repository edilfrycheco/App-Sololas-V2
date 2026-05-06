import Link from "next/link";

const NAV = [
  { href: "/admin", label: "Inicio" },
  { href: "/admin/personas", label: "Personas" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/cursos", label: "Cursos" },
  { href: "/admin/pizarra", label: "Pizarra" },
  { href: "/admin/reportes", label: "Reportes" },
  { href: "/admin/configuracion", label: "Configuración" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-brand-50 p-4">
        <Link href="/admin" className="block">
          <span className="text-xl font-bold text-brand-700">Solola&apos;s</span>
          <span className="block text-xs uppercase tracking-widest text-brand-500">
            Admin
          </span>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-brand-800 hover:bg-brand-100"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}
