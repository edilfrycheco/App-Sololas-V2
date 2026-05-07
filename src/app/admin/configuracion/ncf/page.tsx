import { AlertTriangle, FileWarning, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableEmpty,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  listNcfTypes,
  listNcfTypesWithSequences,
} from "@/lib/fiscal/queries";
import { formatDate } from "@/lib/utils";
import { formatNcf } from "@/lib/fiscal/schema";

import { NcfTypeFormDialog } from "./ncf-type-form-dialog";
import { NcfTypeRowActions } from "./ncf-type-row-actions";
import { NcfSequenceFormDialog } from "./ncf-sequence-form-dialog";
import { NcfSequenceRowActions } from "./ncf-sequence-row-actions";

export const dynamic = "force-dynamic";

export default async function NcfPage() {
  const [types, grouped] = await Promise.all([
    listNcfTypes(),
    listNcfTypesWithSequences(),
  ]);

  return (
    <div className="space-y-6">
      {/* Tipos de comprobante */}
      <Card className="p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Tipos de comprobante
            </h2>
            <p className="text-sm text-neutral-500">
              Códigos DGII (B01, B02, B14, B15, …) que aparecen al cobrar.
            </p>
          </div>
          <NcfTypeFormDialog
            mode={{ kind: "create" }}
            trigger={
              <Button>
                <Plus className="h-4 w-4" /> Nuevo tipo
              </Button>
            }
          />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Prefijo</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {types.length === 0 ? (
              <TableEmpty message="Crea los tipos que utilizas (Crédito Fiscal, Factura de Consumo, etc.)." />
            ) : (
              types.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-mono text-sm font-semibold">
                    {t.codigo}
                  </TableCell>
                  <TableCell>{t.nombre}</TableCell>
                  <TableCell className="font-mono text-xs text-neutral-600">
                    {t.prefijo}
                  </TableCell>
                  <TableCell>
                    {t.activo ? (
                      <Badge variant="success">Activo</Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <NcfTypeRowActions type={t} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Secuencias por tipo */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-900">
              Secuencias NCF
            </h2>
            <p className="text-sm text-neutral-500">
              Rangos asignados por DGII. La app consume el siguiente número
              automáticamente al facturar.
            </p>
          </div>
          {types.length > 0 && (
            <NcfSequenceFormDialog
              mode={{ kind: "create" }}
              types={types}
              trigger={
                <Button>
                  <Plus className="h-4 w-4" /> Nueva secuencia
                </Button>
              }
            />
          )}
        </div>

        {types.length === 0 ? (
          <Card className="p-6 text-center text-sm text-neutral-500">
            Crea primero un tipo de comprobante arriba.
          </Card>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {grouped.map(({ type, sequences }) => (
              <Card key={type.id} className="p-0">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">
                      <span className="font-mono">{type.codigo}</span> ·{" "}
                      {type.nombre}
                    </div>
                    <div className="text-xs text-neutral-500">
                      Prefijo {type.prefijo}
                    </div>
                  </div>
                  <NcfSequenceFormDialog
                    mode={{ kind: "create", defaultTypeId: type.id }}
                    types={types}
                    trigger={
                      <Button variant="outline" size="sm">
                        <Plus className="h-3.5 w-3.5" /> Agregar
                      </Button>
                    }
                  />
                </div>
                {sequences.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-neutral-500">
                    Aún no hay secuencias para este tipo.
                  </p>
                ) : (
                  <ul className="divide-y">
                    {sequences.map((s) => {
                      const total = s.secuenciaFinal - s.secuenciaInicial + 1;
                      const usados = Math.max(
                        0,
                        s.secuenciaActual - s.secuenciaInicial,
                      );
                      const restantes = Math.max(
                        0,
                        s.secuenciaFinal - s.secuenciaActual + 1,
                      );
                      const pct = Math.min(100, Math.round((usados / total) * 100));
                      const agotada = restantes === 0;
                      const lowAlert =
                        !agotada && restantes <= s.cantidadAlertaReorden;
                      return (
                        <li key={s.id} className="px-4 py-3">
                          <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex-1 space-y-1">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <span className="font-mono text-neutral-700">
                                  {formatNcf(type.prefijo, s.secuenciaInicial)}
                                  {" → "}
                                  {formatNcf(type.prefijo, s.secuenciaFinal)}
                                </span>
                                {agotada && (
                                  <Badge variant="destructive">
                                    <AlertTriangle className="mr-1 h-3 w-3" />
                                    Agotada
                                  </Badge>
                                )}
                                {lowAlert && (
                                  <Badge variant="warning">
                                    <FileWarning className="mr-1 h-3 w-3" />
                                    Quedan {restantes}
                                  </Badge>
                                )}
                                {!s.activo && (
                                  <Badge variant="secondary">Inactiva</Badge>
                                )}
                                {s.fechaVencimiento && (
                                  <span className="text-neutral-500">
                                    Vence {formatDate(s.fechaVencimiento)}
                                  </span>
                                )}
                              </div>
                              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
                                <div
                                  className={`h-full ${
                                    agotada
                                      ? "bg-red-500"
                                      : lowAlert
                                        ? "bg-amber-500"
                                        : "bg-brand-500"
                                  }`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <div className="text-xs text-neutral-500">
                                {usados.toLocaleString()} usados de{" "}
                                {total.toLocaleString()} ({pct}%) · Próximo:{" "}
                                <span className="font-mono">
                                  {agotada
                                    ? "—"
                                    : formatNcf(type.prefijo, s.secuenciaActual)}
                                </span>
                              </div>
                            </div>
                            <NcfSequenceRowActions
                              sequence={s}
                              types={types}
                            />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
