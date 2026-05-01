import { differenceInCalendarDays, format, isAfter, isBefore, isWithinInterval } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCOP(value: number | string) {
  const n = Number(value || 0);
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(n);
}

export function getProjectStatus(startDate: string, endDate: string) {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isBefore(now, start)) {
    return "Por iniciar";
  }

  if (isAfter(now, end)) {
    return "Vencido";
  }

  if (isWithinInterval(now, { start, end })) {
    return "Activo";
  }

  return "Sin estado";
}

export function getProjectDurationLabel(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = differenceInCalendarDays(end, start);
  return `${Math.max(totalDays, 0)} días`;
}

export function formatDate(dateStr: string) {
  return format(new Date(dateStr), "dd/MM/yyyy");
}
