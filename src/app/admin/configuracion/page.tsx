import { Card } from "@/components/ui/card";
import { getBusinessSettings } from "@/lib/business-settings/queries";
import { BusinessSettingsForm } from "./business-settings-form";

export const dynamic = "force-dynamic";

export default async function MiNegocioPage() {
  const current = await getBusinessSettings();

  return (
    <Card className="p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">Mi Negocio</h2>
        <p className="text-sm text-neutral-500">
          Datos que aparecen en el recibo y en correos al cliente.
        </p>
      </div>
      <BusinessSettingsForm current={current} />
    </Card>
  );
}
