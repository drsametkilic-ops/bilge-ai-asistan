export const TIME_WINDOW_OPTIONS = [
  { id: "morn", label: "Sabah (09:00–12:00)" },
  { id: "noon", label: "Öğle (12:00–15:00)" },
  { id: "eve", label: "Akşam (15:00–19:00)" },
] as const;

export function encodeTimeWindows(selected: string[]): string {
  return selected.join(", ");
}

export function decodeTimeWindows(s: string): string[] {
  if (!s.trim()) {
    return [];
  }
  return s
    .split(/[,;]+/)
    .map((w) => w.trim())
    .filter(Boolean);
}

export function isWindowSelected(s: string, id: string): boolean {
  return decodeTimeWindows(s).includes(id);
}
