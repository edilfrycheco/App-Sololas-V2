"use client";

import { useTransition } from "react";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { reenviarRecibo } from "@/lib/email/actions";

export function ReenviarReciboButton({ paymentId }: { paymentId: string }) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      const result = await reenviarRecibo(paymentId);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success(`Correo enviado a ${result.toEmail}`);
    });
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Reenviar recibo por correo"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin text-brand-600" />
      ) : (
        <Mail className="h-4 w-4 text-brand-600" />
      )}
    </Button>
  );
}
