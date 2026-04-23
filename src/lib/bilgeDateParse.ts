/**
 * AI / kullanıcı metninden Firestore Timestamp öncesi Date üretir.
 * Sunucu tercihen YYYY-MM-DD verir; yine de Türkçe ifadeler desteklenir.
 */

const TR_DOW: Record<string, number> = {
  pazar: 0,
  pazartesi: 1,
  salı: 2,
  sali: 2,
  çarşamba: 3,
  carsamba: 3,
  perşembe: 4,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(base: Date, n: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + n);
  return d;
}

/**
 * "bugün", "yarın", "3 gün sonra", "pazartesi" (en yakın), YYYY-MM-DD
 */
export function parseFlexibleDate(
  input: string | null | undefined,
  now: Date = new Date()
): Date | null {
  if (input == null) return null;
  const s = String(input).toLowerCase().trim();
  if (!s) return null;

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const d = new Date(s.slice(0, 10) + "T12:00:00");
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (s === "bugün" || s === "bugun" || s === "today") {
    return startOfDay(now);
  }
  if (s === "yarın" || s === "yarin" || s === "tomorrow") {
    return startOfDay(addDays(now, 1));
  }

  const m = s.match(/(\d+)\s*gün\s*sonra/i) || s.match(/(\d+)\s*gun\s*sonra/i);
  if (m) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n < 400) {
      return startOfDay(addDays(now, n));
    }
  }

  const entries = Object.entries(TR_DOW).sort((a, b) => b[0].length - a[0].length);
  for (const [k, target] of entries) {
    if (s.includes(k)) {
      const cur = now.getDay();
      const add = (target - cur + 7) % 7;
      return startOfDay(addDays(now, add));
    }
  }

  const tryD = new Date(s);
  if (!Number.isNaN(tryD.getTime())) {
    return startOfDay(tryD);
  }
  return null;
}

export function parseTimeString(time: string | null | undefined): { h: number; m: number } {
  if (time == null) {
    return { h: 9, m: 0 };
  }
  const s = time.toString().toLowerCase().replace(/saat/gi, "").trim();
  if (!s) {
    return { h: 9, m: 0 };
  }
  const match = s.match(/(\d{1,2})(?::(\d{2}))?/);
  if (match) {
    const h = Math.min(23, Math.max(0, parseInt(match[1], 10)));
    const min =
      match[2] != null && match[2] !== "" ? Math.min(59, Math.max(0, parseInt(match[2], 10))) : 0;
    return { h, m: min };
  }
  return { h: 9, m: 0 };
}
