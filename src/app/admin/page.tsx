export default function AdminHomePage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Panel de control</h1>
        <p className="text-sm text-muted-foreground">
          Bienvenido. M&eacute;tricas y accesos r&aacute;pidos van aqu&iacute;
          (Fase 4).
        </p>
      </header>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[
          "Pedidos del día",
          "Por entregar esta semana",
          "Ingresos del mes",
          "Cuentas por cobrar",
        ].map((label) => (
          <div
            key={label}
            className="rounded-lg border bg-white p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <p className="mt-2 text-3xl font-bold text-brand-700">—</p>
          </div>
        ))}
      </div>
    </div>
  );
}
