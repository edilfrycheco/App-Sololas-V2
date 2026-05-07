import { ConfigSubnav } from "./config-subnav";

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Configuración
        </h1>
        <p className="text-sm text-neutral-500">
          Ajustes que se tocan rara vez. Datos del negocio, parámetros y
          catálogos auxiliares.
        </p>
      </header>
      <ConfigSubnav />
      <div>{children}</div>
    </div>
  );
}
