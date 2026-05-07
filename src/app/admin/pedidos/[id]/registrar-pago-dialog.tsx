"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  registrarPagoInputSchema,
  type RegistrarPagoInput,
} from "@/lib/pedidos/payment-schema";
import { registrarPago } from "@/lib/pedidos/payment-actions";
import { formatDOP } from "@/lib/utils";
import type { NcfType, PaymentMethod } from "@/lib/db/schema";

interface Props {
  orderId: string;
  totalNeto: string;
  totalPagado: number;
  methods: PaymentMethod[];
  ncfTypes: NcfType[];
  trigger: React.ReactNode;
}

const CONCEPTOS = [
  "1ER PAGO",
  "2DO PAGO",
  "3ER PAGO",
  "ABONO",
  "PAGO COMPLETO",
  "FINALIZAR",
];

export function RegistrarPagoDialog({
  orderId,
  totalNeto,
  totalPagado,
  methods,
  ncfTypes,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const balance = Number(totalNeto) - totalPagado;

  const form = useForm<RegistrarPagoInput>({
    resolver: zodResolver(registrarPagoInputSchema),
    defaultValues: {
      orderId,
      monto: balance > 0 ? balance.toFixed(2) : "0.00",
      metodoPagoId: methods[0]?.id ?? "",
      tipoComprobanteId: ncfTypes[0]?.id ?? undefined,
      numeroReferencia: undefined,
      concepto: balance === Number(totalNeto) ? "1ER PAGO" : "ABONO",
      generarNcf: true,
    },
  });

  const watchedMethodId = form.watch("metodoPagoId");
  const selectedMethod = useMemo(
    () => methods.find((m) => m.id === watchedMethodId) ?? null,
    [methods, watchedMethodId],
  );

  const onSubmit = (values: RegistrarPagoInput) => {
    startTransition(async () => {
      const result = await registrarPago(values);
      if (!result.ok) {
        toast.error(result.error);
        if (result.fieldErrors) {
          for (const [field, msgs] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof RegistrarPagoInput, {
              message: msgs.join(", "),
            });
          }
        }
        return;
      }

      const { ncf, numeroRecibo, estatusPago, alertaNcfReorden } = result.data;
      toast.success(
        `Pago registrado · Recibo #${numeroRecibo}${ncf ? ` · NCF ${ncf}` : ""} · Estado: ${estatusPago}`,
      );
      if (alertaNcfReorden) {
        toast.warning(
          "Quedan pocos NCFs disponibles. Solicita una nueva secuencia a DGII pronto.",
        );
      }
      setOpen(false);
      form.reset();
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-brand-600" /> Registrar pago
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-lg border bg-brand-50/40 px-3 py-2 text-sm">
          <div className="flex justify-between">
            <span>Total del pedido</span>
            <span className="font-medium">{formatDOP(totalNeto)}</span>
          </div>
          <div className="flex justify-between">
            <span>Pagado</span>
            <span className="font-medium">{formatDOP(totalPagado)}</span>
          </div>
          <div className="mt-1 flex justify-between border-t border-neutral-200 pt-1 font-semibold text-brand-700">
            <span>Balance</span>
            <span>{formatDOP(Math.max(0, balance))}</span>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Monto a pagar"
              error={form.formState.errors.monto?.message}
            >
              <Input
                {...form.register("monto")}
                inputMode="decimal"
                autoFocus
              />
            </Field>
            <Field
              label="Concepto"
              error={form.formState.errors.concepto?.message}
            >
              <Select
                value={form.watch("concepto")}
                onValueChange={(v) =>
                  form.setValue("concepto", v, { shouldValidate: true })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Concepto" />
                </SelectTrigger>
                <SelectContent>
                  {CONCEPTOS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field
            label="Método de pago"
            error={form.formState.errors.metodoPagoId?.message}
          >
            <Select
              value={form.watch("metodoPagoId")}
              onValueChange={(v) =>
                form.setValue("metodoPagoId", v, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona método" />
              </SelectTrigger>
              <SelectContent>
                {methods.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nombre}
                    {m.requiereReferencia && (
                      <span className="ml-2 text-xs text-neutral-400">
                        (requiere referencia)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {selectedMethod?.requiereReferencia && (
            <Field
              label="Número de referencia"
              hint="Tarjeta/transferencia/cheque"
              error={form.formState.errors.numeroReferencia?.message}
            >
              <Input
                {...form.register("numeroReferencia")}
                placeholder="Ej: 1231"
              />
            </Field>
          )}

          <div className="space-y-2 rounded-lg border p-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Checkbox
                checked={form.watch("generarNcf")}
                onCheckedChange={(v) =>
                  form.setValue("generarNcf", v === true, {
                    shouldValidate: true,
                  })
                }
              />
              Generar comprobante fiscal (NCF)
            </label>
            {form.watch("generarNcf") && (
              <Field
                label="Tipo de comprobante"
                error={form.formState.errors.tipoComprobanteId?.message}
              >
                <Select
                  value={form.watch("tipoComprobanteId") ?? ""}
                  onValueChange={(v) =>
                    form.setValue("tipoComprobanteId", v, {
                      shouldValidate: true,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {ncfTypes.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.codigo} — {t.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Registrar pago
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
