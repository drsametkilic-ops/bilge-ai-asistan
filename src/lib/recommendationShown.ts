const KEY = "bilge_reco_shown_v1";
const COOLDOWN_MS = 24 * 60 * 60 * 1000; /** tıklandıktan sonra aynı id: 24 saat */
const MAX_ENTRIES = 24;

type Entry = { id: string; at: number };

function load(): Entry[] {
  try {
    const r = localStorage.getItem(KEY);
    if (!r) {
      return [];
    }
    const a = JSON.parse(r) as Entry[];
    if (!Array.isArray(a)) {
      return [];
    }
    return a;
  } catch {
    return [];
  }
}

function save(entries: Entry[]) {
  const pruned = entries
    .filter((e) => Date.now() - e.at < 7 * 24 * 60 * 60 * 1000)
    .slice(-MAX_ENTRIES);
  try {
    localStorage.setItem(KEY, JSON.stringify(pruned));
  } catch {
    /* full storage */
  }
}

export function filterFreshSuggestions<T extends { id: string }>(suggestions: T[]): T[] {
  const now = Date.now();
  const seen = load();
  return suggestions.filter((s) => {
    const prev = seen.find((e) => e.id === s.id);
    if (!prev) {
      return true;
    }
    return now - prev.at > COOLDOWN_MS;
  });
}

export function markSuggestionShown(id: string) {
  const seen = load();
  const next = seen.filter((e) => e.id !== id);
  next.push({ id, at: Date.now() });
  save(next);
}
