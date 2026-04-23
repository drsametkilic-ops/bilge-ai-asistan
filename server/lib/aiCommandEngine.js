/**
 * /api/ai-command — OpenAI + Türkçe niyet → Mongoose modelleriyle MongoDB kaydı.
 * OPENAI_API_KEY yoksa kural tabanlı yedek mantık devreye girer.
 */

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function addDaysISO(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** @param {string} lower @param {string} raw */
export function hasDateOrTimeSignal(lower, raw) {
  if (/\b(bugün|bugun|yarın|yarin|öbür gün|obur gun)\b/i.test(lower)) return true;
  if (/\b\d{4}-\d{2}-\d{2}\b/.test(raw)) return true;
  if (/\b\d{1,2}[.:]\d{2}\b/.test(raw)) return true;
  if (/\b\d{1,2}\s*['']?\s*(da|de|ta|te)\b/i.test(raw)) return true;
  if (/\bsaat\s*\d{1,2}\b/i.test(lower)) return true;
  return false;
}

/** @returns {{ amount: number|null, financeType: 'income'|'expense' }} */
export function parseFinanceHints(lower, raw) {
  const amtMatch = String(raw)
    .replace(/\s/g, "")
    .replace(",", ".")
    .match(/(\d+(?:\.\d+)?)/);
  let amount = amtMatch ? Number(amtMatch[1]) : null;
  if (!Number.isFinite(amount) || amount <= 0) amount = null;

  let financeType = "expense";
  if (/\bgelir|maaş|maas|kazanç|kazanc|\+|tahsilat/i.test(lower)) financeType = "income";
  if (/\bgider|harcama|ödeme|odeme|fatura|elektrik|kira|borç|borc/i.test(lower)) financeType = "expense";

  return { amount, financeType };
}

/** @param {string} raw */
export function extractTaskTime(raw) {
  const clock = raw.match(/\b(\d{1,2})[.:](\d{2})\b/);
  if (clock) {
    const h = Number.parseInt(clock[1], 10);
    const m = Number.parseInt(clock[2], 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  const da = raw.match(/(\d{1,2})\s*['']?\s*(da|de|ta|te)\b/i);
  if (da) {
    const h = Number.parseInt(da[1], 10);
    if (h >= 0 && h <= 23) return `${String(h).padStart(2, "0")}:00`;
  }
  const single = raw.match(/\b(\d{1,2})\b/);
  if (single) {
    const h = Number.parseInt(single[1], 10);
    if (h >= 6 && h <= 23) return `${String(h).padStart(2, "0")}:00`;
  }
  return "";
}

/**
 * @param {string} lower
 * @param {string} raw
 */
export function resolveTaskDate(lower, raw) {
  if (/\b(yarın|yarin)\b/i.test(lower)) return addDaysISO(1);
  if (/\b(bugün|bugun)\b/i.test(lower)) return todayISO();
  const iso = raw.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  return todayISO();
}

/**
 * @param {string} raw
 */
export function inferTaskTitle(raw) {
  let t = raw
    .replace(/\b(bugün|bugun|yarın|yarin|saat)\b/gi, "")
    .replace(/\b\d{1,2}[.:]\d{2}\b/g, "")
    .replace(/\b\d{1,2}\s*['']?\s*(da|de|ta|te)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) t = "Görev";
  return t.slice(0, 500);
}

/**
 * @param {string} raw
 * @param {'idea'|'project'} kind
 */
export function inferTitleForCategory(raw, kind) {
  let t = raw
    .replace(/\b(bir\s+)?(fikir|idea|proje)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) t = kind === "idea" ? "Yeni fikir" : "Yeni proje";
  return t.slice(0, 300);
}

/** Kullanıcı tarafından istenen ana sistem mesajı */
export const AI_COMMAND_SYSTEM_PROMPT = `
Sen bir kişisel asistan AI'sın.

Görevin:
Kullanıcının yazdığı Türkçe mesajı analiz etmek ve doğru kategoriye ayırmak.

KATEGORİLER:
- task → yapılacak işler, randevular, tarih/saat içeren işler
- idea → fikirler, notlar, "fikir" ile ilgili içerik
- project → projeler, uzun süreli çalışmalar
- finance → para, ödeme, gelir, gider, faturalar, TL tutarları
- chat → yalnızca sohbat / selamlaşma; kayıt oluşturulmaz

KURALLAR:
- Ek bilgi için kullanıcıya soru sorma; eksik alanları makul şekilde doldur (tarih: bugün ISO, saat boş olabilir).
- Her zaman geçerli tek bir JSON nesnesi döndür.
- Türkçe düşün; reply alanı kısa Türkçe onay olsun (ör: "Görev eklendi ✅").

ZAMAN:
- "yarın" → yarının tarihi (ISO YYYY-MM-DD)
- "bugün" → bugünün tarihi
- "saat 10" veya "10da" → time "10:00"

FORMAT (SADECE BU JSON, başka metin yok):

{
  "type": "task | idea | project | finance | chat",
  "data": { },
  "reply": "Kısa Türkçe mesaj"
}

data şemaları:
- task: { "title": string, "date": "YYYY-MM-DD", "time": "HH:mm veya \"\"", "description": string (isteğe bağlı) }
- idea: { "title": string, "description": string }
- project: { "name": string, "description": string }
- finance: { "amount": sayı (pozitif), "financeType": "income" | "expense", "note": string, "date": "YYYY-MM-DD" }
- chat: data boş nesne {}

SADECE JSON DÖN.
`.trim();

/**
 * @param {string} raw
 * @returns {unknown | null}
 */
function tryParseJsonContent(raw) {
  if (!raw || typeof raw !== "string") return null;
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const m = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (m) {
      try {
        return JSON.parse(m[1].trim());
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * @param {string} message
 * @param {import('openai').OpenAI} openaiClient
 */
async function fetchOpenAiIntent(message, openaiClient) {
  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: AI_COMMAND_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Bugünün tarihi (ISO YYYY-MM-DD): ${todayISO()}\n\nKullanıcı mesajı:\n${message}`,
      },
    ],
  });
  const text = completion.choices[0]?.message?.content;
  return tryParseJsonContent(text ?? "");
}

/**
 * @param {unknown} parsed
 */
function normalizeIntent(parsed) {
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  const o = /** @type {Record<string, unknown>} */ (parsed);
  const rawType = o.type;
  const allowed = new Set(["task", "idea", "project", "finance", "chat"]);
  if (typeof rawType !== "string" || !allowed.has(rawType)) return null;

  let data = o.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) data = {};
  const d = /** @type {Record<string, unknown>} */ (data);

  /** financeType / transactionType uyumu */
  if (rawType === "finance") {
    if (d.financeType == null && typeof d.transactionType === "string") {
      const t = d.transactionType.toLowerCase();
      if (t === "income" || t === "expense") d.financeType = t;
    }
  }

  const reply =
    typeof o.reply === "string" && o.reply.trim() ? o.reply.trim() : "Tamam.";

  return { type: rawType, data: d, reply };
}

/**
 * @param {{
 *   Task: import('mongoose').Model,
 *   Idea: import('mongoose').Model,
 *   Project: import('mongoose').Model,
 *   Finance: import('mongoose').Model,
 *   openai?: import('openai').OpenAI | null,
 * }} deps
 */
export async function runAiCommand(message, deps) {
  const { Task, Idea, Project, Finance, openai } = deps;
  const trimmed = String(message ?? "").trim();
  if (!trimmed) {
    return { ok: false, status: 400, body: { error: "message (string) gerekli" } };
  }

  const lower = trimmed.toLowerCase();

  let type = null;
  /** @type {Record<string, unknown>} */
  let data = {};
  let customReply = null;

  /** --- 1) OpenAI (birincil) --- */
  if (openai && process.env.OPENAI_API_KEY) {
    try {
      const parsed = await fetchOpenAiIntent(trimmed, openai);
      const norm = normalizeIntent(parsed);
      if (norm) {
        if (norm.type === "chat") {
          return {
            ok: true,
            body: {
              type: "chat",
              data: {},
              reply: norm.reply,
              saved: false,
            },
          };
        }
        type = norm.type;
        data = norm.data;
        customReply = norm.reply;
      }
    } catch (err) {
      console.error("[ai-command] OpenAI:", err);
    }
  }

  /** --- 2) Kural tabanlı yedek (API anahtarı yok veya model başarısız) --- */
  if (!type) {
    if (hasDateOrTimeSignal(lower, trimmed)) {
      type = "task";
      data = {
        title: inferTaskTitle(trimmed),
        date: resolveTaskDate(lower, trimmed),
        time: extractTaskTime(trimmed),
      };
    } else if (/\b(fikir|idea)\b/i.test(lower)) {
      type = "idea";
      data = {
        title: inferTitleForCategory(trimmed, "idea"),
        description: "",
      };
    } else if (/\bproje\b/i.test(lower)) {
      type = "project";
      data = {
        name: inferTitleForCategory(trimmed, "project"),
        description: "",
      };
    } else if (
      /\b(ödeme|odeme|para|gelir|gider|tl|try|₺|lira)\b/i.test(lower) ||
      /\d+[.,]?\d*\s*(tl|try|₺|lira)\b/i.test(lower)
    ) {
      type = "finance";
      const { amount, financeType } = parseFinanceHints(lower, trimmed);
      data = {
        amount,
        financeType,
        note: trimmed.slice(0, 500),
        date: todayISO(),
      };
    }
  }

  if (!type) {
    return {
      ok: true,
      body: {
        type: "chat",
        data: {},
        reply: process.env.OPENAI_API_KEY
          ? "Mesajı anlayamadım. Görev (tarih/saat), fikir, proje veya finans tutarı ile tekrar dene."
          : "OPENAI_API_KEY tanımlı değil ve mesaj otomatik sınıflandırılamadı. Anahtarı .env içine ekleyin veya daha açık yazın.",
        saved: false,
      },
    };
  }

  /** --- 3) MongoDB (Mongoose) --- */
  try {
    if (type === "task") {
      const title = String(data.title ?? inferTaskTitle(trimmed)).slice(0, 500);
      const date =
        typeof data.date === "string" && data.date.trim()
          ? data.date.trim()
          : resolveTaskDate(lower, trimmed);
      let time =
        typeof data.time === "string" ? data.time.trim() : extractTaskTime(trimmed);
      const doc = await Task.create({
        title,
        date,
        time: time ?? "",
        description: typeof data.description === "string" ? data.description : "",
        completed: false,
      });
      const reply = customReply || `Görev eklendi ✅`;
      return {
        ok: true,
        body: {
          type: "task",
          data: { title, date, time: time || "", status: "todo" },
          reply,
          saved: true,
          id: String(doc._id),
        },
      };
    }

    if (type === "idea") {
      const title = String(data.title ?? inferTitleForCategory(trimmed, "idea")).slice(0, 300);
      const doc = await Idea.create({
        title,
        description: typeof data.description === "string" ? data.description : "",
        priority:
          data.priority === "low" || data.priority === "high"
            ? data.priority
            : "medium",
      });
      const reply = customReply || `Fikir kaydedildi ✅`;
      return {
        ok: true,
        body: {
          type: "idea",
          data: { title, description: doc.description },
          reply,
          saved: true,
          id: String(doc._id),
        },
      };
    }

    if (type === "project") {
      const name = String(data.name ?? inferTitleForCategory(trimmed, "project")).slice(0, 200);
      const doc = await Project.create({
        name,
        description: typeof data.description === "string" ? data.description : "",
        workStatus: "todo",
      });
      const reply = customReply || `Proje oluşturuldu ✅`;
      return {
        ok: true,
        body: {
          type: "project",
          data: { name, description: doc.description },
          reply,
          saved: true,
          id: String(doc._id),
        },
      };
    }

    if (type === "finance") {
      let amount =
        typeof data.amount === "number" && data.amount > 0
          ? data.amount
          : parseFinanceHints(lower, trimmed).amount;
      if (amount == null || amount <= 0) {
        return {
          ok: true,
          body: {
            type: "finance",
            data: {},
            reply:
              customReply ||
              "Finans kaydı için pozitif tutar gerekli (örn: “250 TL elektrik gideri”).",
            saved: false,
          },
        };
      }
      const finType =
        data.financeType === "income" || data.financeType === "expense"
          ? data.financeType
          : parseFinanceHints(lower, trimmed).financeType;
      const date =
        typeof data.date === "string" && data.date.trim() ? data.date.trim() : todayISO();
      const note =
        typeof data.note === "string" && data.note.trim()
          ? data.note.trim()
          : trimmed.slice(0, 500);
      const doc = await Finance.create({
        amount,
        type: finType,
        date,
        note,
      });
      const reply = customReply || `Kayıt oluşturuldu ✅`;
      return {
        ok: true,
        body: {
          type: "finance",
          data: { amount, type: finType, date, note },
          reply,
          saved: true,
          id: String(doc._id),
        },
      };
    }
  } catch (err) {
    console.error("[ai-command] MongoDB:", err);
    return { ok: false, status: 500, body: { error: "Kayıt başarısız" } };
  }

  return {
    ok: true,
    body: {
      type: "chat",
      data: {},
      reply: "İşlem tamamlanamadı.",
      saved: false,
    },
  };
}
