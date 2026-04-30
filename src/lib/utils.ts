import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmtEur = (n: number): string =>
  Math.round(n).toLocaleString('de-DE') + ' €';

export const fmtK = (n: number): string =>
  n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n);
