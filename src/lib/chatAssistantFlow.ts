export type FlowModule = "task" | "finance" | "idea" | "project";
export type FlowStep = "idle" | "category" | "collecting" | "ready";

export interface AssistantFlow {
  step: FlowStep;
  type: FlowModule | null;
  data: Record<string, string>;
  suggestedType?: FlowModule;
  suggestionLabel?: string;
}

export const INITIAL_FLOW: AssistantFlow = {
  step: "idle",
  type: null,
  data: {},
};

const REQUIRED: Record<FlowModule, string[]> = {
  task: ["title", "date"],
  finance: ["amount", "type"],
  idea: ["title"],
  project: ["name"],
};

/** Tüm alan sırası: zorunlular önce, sonra opsiyoneller */
const FIELD_ORDER: Record<FlowModule, string[]> = {
  task: ["title", "date", "time", "description"],
  finance: ["amount", "type", "date", "note"],
  idea: ["title", "description"],
  project: ["name", "description"],
};

export function parseCategory(text: string): FlowModule | null {
  const t = text.trim().toLowerCase();
  if (/^(1|görev|görevler|task)$/i.test(t) || /\bgörev\b/.test(t)) return "task";
  if (/^(2|finans|finance)$/i.test(t) || /\bfinans\b/.test(t) || /^para\b/.test(t)) return "finance";
  if (/^(3|proje|projeler|project)$/i.test(t) || /\bproje\b/.test(t)) return "project";
  if (/^(4|fikir|idea)$/i.test(t) || /\bfikir\b/.test(t)) return "idea";
  return null;
}

export function normalizeDateInput(raw: string): string {
  const t = raw.trim().toLowerCase();
  const today = new Date();
  if (t.includes("yarın") || t.includes("yarin")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d.toISOString().slice(0, 10);
  }
  if (t.includes("bugün") || t.includes("bugun")) {
    return today.toISOString().slice(0, 10);
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return raw.trim();
  return raw.trim();
}

export function parseAmount(raw: string): number | null {
  const m = raw.replace(/\s/g, "").replace(",", ".").match(/[\d.]+/);
  if (!m) return null;
  const n = Number(m[0]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function normalizeFinanceType(raw: string): "income" | "expense" | null {
  const t = raw.trim().toLowerCase();
  if (/gelir|^\+|income/i.test(t)) return "income";
  if (/gider|^\-|expense|harcama|çıkış|cıkış/i.test(t)) return "expense";
  return null;
}

export function nextField(module: FlowModule, data: Record<string, string>): string | null {
  const order = FIELD_ORDER[module];
  const reqSet = new Set(REQUIRED[module]);

  for (const key of order) {
    const hasKey = Object.prototype.hasOwnProperty.call(data, key);
    const val = data[key]?.trim?.() ?? "";

    if (reqSet.has(key)) {
      if (!hasKey || !val) return key;
      continue;
    }

    if (!hasKey) return key;
  }
  return null;
}

export function questionForField(module: FlowModule, field: string): string {
  const map: Record<string, Record<string, string>> = {
    task: {
      title: "Başlık ne olsun?",
      date: "Hangi gün? (örn. yarın veya 2026-04-24)",
      time: "Saat kaçta? (isteğe bağlı — atlamak için **hayır** yaz)",
      description: "Kısa açıklama eklemek ister misin? (yoksa **hayır**)",
    },
    finance: {
      amount: "Tutar kaç TL?",
      type: "Gelir mi, gider mi? (**gelir** veya **gider** yaz)",
      date: "Hangi güne yazalım? (isteğe bağlı — **hayır** ile geç)",
      note: "Not eklemek ister misin? (**hayır** ile geç)",
    },
    idea: {
      title: "Fikrin başlığı ne olsun?",
      description: "Açıklama eklemek ister misin? (**hayır** ile geç)",
    },
    project: {
      name: "Proje adı ne olsun?",
      description: "Açıklama eklemek ister misin? (**hayır** ile geç)",
    },
  };
  return map[module][field] ?? `${field}?`;
}

export function applyAnswer(
  module: FlowModule,
  field: string,
  raw: string
): { ok: true; value: string } | { ok: false; hint: string } {
  const trimmed = raw.trim();
  const skip = /^(hayır|yok|atla|-)$/i.test(trimmed);

  if (REQUIRED[module].includes(field) && skip) {
    return { ok: false, hint: "Bu bilgi zorunlu — lütfen doldur." };
  }

  if (module === "finance" && field === "amount") {
    const n = parseAmount(trimmed);
    if (n == null) return { ok: false, hint: "Pozitif bir tutar yaz (örn. 150 veya 150,50)." };
    return { ok: true, value: String(n) };
  }

  if (module === "finance" && field === "type") {
    const t = normalizeFinanceType(trimmed);
    if (!t) return { ok: false, hint: "**gelir** veya **gider** yazmalısın." };
    return { ok: true, value: t };
  }

  if ((field === "date" || field === "time") && skip) {
    return { ok: true, value: "" };
  }

  if ((field === "description" || field === "note") && skip) {
    return { ok: true, value: "" };
  }

  if (field === "date" && module === "task") {
    return { ok: true, value: normalizeDateInput(trimmed) };
  }

  if (field === "date" && module === "finance") {
    if (skip) return { ok: true, value: "" };
    return { ok: true, value: normalizeDateInput(trimmed) };
  }

  if (!trimmed && REQUIRED[module].includes(field)) {
    return { ok: false, hint: "Bu alan zorunlu, tekrar yazar mısın?" };
  }

  return { ok: true, value: trimmed };
}

export function isConfirm(text: string): boolean {
  return /^(evet|onayla|kaydet|tamam|yes|ok)$/i.test(text.trim());
}

export function isDeny(text: string): boolean {
  return /^(hayır|iptal|vazgeç|vazgec|no)$/i.test(text.trim());
}

export function coerceInterpretType(t: string): FlowModule | undefined {
  if (t === "task" || t === "finance" || t === "idea" || t === "project") return t;
  return undefined;
}

export function categoryPrompt(suggested?: FlowModule, label?: string): string {
  const lines = [
    "Bu işlemi **hangi bölüme** ekleyelim?",
    "",
    "• **Görevler** (görev / 1)",
    "• **Finans** (finans / 2)",
    "• **Projeler** (proje / 3)",
    "• **Fikir Bankası** (fikir / 4)",
  ];
  if (suggested && label) {
    lines.unshift(`Tahmin: **${label}** (${suggested}) — istersen bu satırdaki modülü yazarak seçebilirsin.`);
  }
  return lines.join("\n");
}

export function readyPrompt(module: FlowModule): string {
  const names: Record<FlowModule, string> = {
    task: "görev",
    finance: "finans kaydı",
    idea: "fikir",
    project: "proje",
  };
  return (
    `Kaydetmeye hazırım (${names[module]}).\n\n` +
    `Onaylıyor musun? Kaydetmek için **evet** yaz; iptal için **hayır**.`
  );
}
