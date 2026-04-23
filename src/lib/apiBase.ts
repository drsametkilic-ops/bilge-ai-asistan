/**
 * Bilge Express API kök adresi — kök dizin `.env` içinde ayarlanır.
 * Öncelik: `VITE_API_BASE`, sonra `VITE_BILGE_API_BASE`; yoksa yerel varsayılan.
 */
const DEFAULT_API_BASE = "http://localhost:5001";

export function getApiBase(): string {
  const primary = (import.meta.env.VITE_API_BASE as string | undefined)?.trim();
  const legacy = (import.meta.env.VITE_BILGE_API_BASE as string | undefined)?.trim();
  const raw = primary || legacy || DEFAULT_API_BASE;
  return raw.replace(/\/$/, "");
}

export const API_BASE = getApiBase();
