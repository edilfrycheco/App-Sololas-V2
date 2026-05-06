import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const dopFormatter = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  minimumFractionDigits: 2,
});

export function formatDOP(value: number | string): string {
  const n = typeof value === "string" ? Number(value) : value;
  if (Number.isNaN(n)) return "RD$ 0.00";
  return dopFormatter.format(n).replace("DOP", "RD$");
}

const dateFormatter = new Intl.DateTimeFormat("es-DO", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Santo_Domingo",
});

export function formatDate(value: Date | string): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return dateFormatter.format(d);
}
