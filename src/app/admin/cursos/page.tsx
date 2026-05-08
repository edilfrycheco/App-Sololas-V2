import { Card } from "@/components/ui/card";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-static";

export default function CursosPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900">
          Cursos
        </h1>
        <p className="text-sm text-neutral-500">
          Gestión de cursos, sesiones e inscripciones de estudiantes.
        </p>
      </header>
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <GraduationCap className="h-12 w-12 text-brand-500" />
        <h2 className="text-lg font-semibold text-neutral-900">
          Próximamente — Fase 3
        </h2>
        <p className="max-w-md text-sm text-neutral-500">
          El módulo de cursos cubre catálogo, habilitación de sesiones,
          inscripciones de estudiantes con filtros de color por estado de
          pago, y emisión de recibos PDF tal como en la app actual.
        </p>
      </Card>
    </div>
  );
}
