/** Tek veri kaynağı (Mongo/API) için tarih sarmalayıcı — Firestore Timestamp API’sine yakın */

export type AppTimestamp = {
  toDate(): Date;
  toMillis(): number;
};

export function tsFromDate(d: Date): AppTimestamp {
  const t = d.getTime();
  return {
    toDate: () => new Date(t),
    toMillis: () => t,
  };
}

export function tsFromMongoDate(v: string | Date | undefined | null): AppTimestamp | null {
  if (v == null || v === "") return null;
  const d =
    typeof v === "string"
      ? new Date(v.includes("T") ? v : `${v}T12:00:00`)
      : new Date(v.getTime());
  if (Number.isNaN(d.getTime())) return null;
  return tsFromDate(d);
}

export function tsFromMillis(ms: number): AppTimestamp {
  return tsFromDate(new Date(ms));
}
