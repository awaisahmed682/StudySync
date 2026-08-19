import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** yyyy-mm-dd in local time, used as a daily dedupe key. */
export function dayKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** yyyy-Www week key, used as a weekly dedupe key. */
export function weekKey(d: Date) {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week = 1 + Math.round(
    ((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
  );
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Marshal a Date to a value the client can render without hydration mismatch. */
export function toIsoString(d: Date) {
  return d.toISOString();
}
