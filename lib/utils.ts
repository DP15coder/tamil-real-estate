import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString: string | null): string {
  if (!dateString) return "N/A";
  
  try {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatCurrency(value: string | null): string {
  if (!value) return "N/A";
  
  try {
    const numValue = parseFloat(value);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(numValue);
  } catch {
    return value;
  }
}

