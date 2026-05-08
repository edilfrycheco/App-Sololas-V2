import { Card } from "@/components/ui/card";
import { ChartBar } from "lucide-react";

export const dynamic = "force-static";

export default function ReportesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Reportes
        </h1>
        <p className="text-sm text-neutral-500">
          Historial de pagos y pedidos, cursos vendidos, clientes con atraso.
        </p>
      </header>
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <ChartBar className="h-12 w-12 text-brand-500" />
        <h2 className="text-lg font-semibold text-neutral-900">
          Próximamente — Fase 4
        </h2>
        <p className="max-w-md text-sm text-neutral-500">
          Historial unificado de pagos (cursos + pedidos), historial de
          pedidos con filtros, resumen de producción, cursos vendidos y
          clientes con atraso con recordatorios por correo.
        </p>
      </Card>
    </div>
  );
}
