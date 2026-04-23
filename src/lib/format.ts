import { format } from "date-fns";
import { tr } from "date-fns/locale";
import type { AppTimestamp } from "@/lib/appTimestamp";

export function formatTry(n: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatTs(ts: AppTimestamp | null | undefined, pattern = "d MMM yyyy, HH:mm") {
  if (!ts) return "—";
  const d = ts.toDate();
  return format(d, pattern, { locale: tr });
}

export function formatDateInput(d: Date) {
  return format(d, "yyyy-MM-dd");
}
