/**
 * Bilge AI — Express (OpenAI + yapılandırılmış JSON)
 * Ortam: proje kökü `.env` → OPENAI_API_KEY, PORT, MONGO_URI
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { getRecommendations } from "./recommender.js";
import { connectDB } from "./config/db.js";
import taskRoutes from "./routes/taskRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import projectRoutes from "./routes/projectRoutes.js";
import ideaRoutes from "./routes/ideaRoutes.js";
import Task from "./models/Task.js";
import Idea from "./models/Idea.js";
import Project from "./models/Project.js";
import Finance from "./models/Finance.js";
import { runAiCommand } from "./lib/aiCommandEngine.js";
import { sendWhatsAppText } from "./lib/whatsapp.js";
import { startDailyReportJob } from "./jobs/dailyEmail.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (err) => {
  console.error("Unhandled Rejection:", err);
});

// Önce proje kökü .env (MONGO_URI, paylaşılan anahtarlar); cwd'ye bağlı kalma.
dotenv.config({ path: path.join(__dirname, "..", ".env") });
// server/.env varsa üsttekini ezer (PORT, OPENAI vb.); tanımlı olmayanlar kökten kalır.
dotenv.config({ path: path.join(__dirname, ".env"), override: true });

console.log("ENV CHECK:");
console.log("OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "OK" : "MISSING");
console.log("MONGO_URI:", process.env.MONGO_URI ? "OK" : "MISSING");
console.log("PORT:", process.env.PORT);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const BILGE_SYSTEM = `Sen "Bilge" adlı uygulama yönetici asistanısın. Sohbetten ziyade kullanıcının niyetini
tekrar sormadan uygun eyleme çevirmeyi tercih et. Her yanıt YALNIZCA şu formatta olsun (tırnak, virgüller ile geçerli JSON):

{
  "action": "create_task" | "create_project" | "create_idea" | "create_income" | "create_expense" | "chat",
  "data": { },
  "reply": "Kullanıcıya göstereceğin kısa, samimi, Türkçe mesaj (1–2 cümle, emoji sınırlı)"
}

AKSİYONLAR (data alanları):

1) create_task — görev
data: {
  "title": string (zorunlu, net başlık),
  "date": string (mümkünse YYYY-MM-DD veya: bugün, yarın, 3 gün sonra; boş bırakılamaz fakat niyet belirsizse chat)
  "time": string (HH:mm veya boş),
  "project": string (opsiyonel; aşağıdaki "Mevcut projeler" listesindeki isimle aynı veya en yakın eşleşme)
}
Tarih/saat tahmin edilebiliyorsa doldur; yoksa action: "chat" + eksik alanı kibarca sor.

2) create_project — yeni proje
data: {
  "name": string,
  "description": string (boş string olabilir),
  "status": "todo" | "in_progress" | "done" | "deferred" (yoksa "todo")
}

3) create_idea — fikir bankası
data: {
  "title": string,
  "note": string (boş string olabilir),
  "priority": "low" | "medium" | "high"
}

4) create_income — gelir kaydı
data: { "amount": number (pozitif, TRY), "description": string, "date": string (YYYY-MM-DD veya bugün/yarın) }

5) create_expense — gider kaydı
data: { "amount": number (pozitif, TRY), "description": string, "date": string (YYYY-MM-DD veya bugün/yarın) }

6) chat — normal sohbat veya eksik bilgiyi sorma
data: { }

EKSİK BİLGİ: Tarih/saat/tutar yok ve tahmin zorsa: action "chat", kısa soru ile cevap ver.

DİL: Türkçe. ÖRNEK: "Yarın saat 10 için toplantıyı ekledim."
SADECE JSON, başka açıklama ekleme.`;

const VALID_ACTIONS = new Set([
  "create_task",
  "create_project",
  "create_idea",
  "create_income",
  "create_expense",
  "chat",
  "none",
]);

const FALLBACK = {
  success: true,
  action: "chat",
  data: {},
  reply: "Bir hata oluştu, tekrar dener misiniz?",
};

/**
 * @param {string} raw
 * @returns {unknown | null}
 */
function tryParseBilgeJson(raw) {
  if (!raw || typeof raw !== "string") {
    return null;
  }
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
 * @param {unknown} parsed
 */
function normalizeBilgeResult(parsed) {
  if (parsed == null || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ...FALLBACK };
  }
  const o = /** @type {Record<string, unknown>} */ (parsed);
  const rawA = o.action;
  let action = typeof rawA === "string" && VALID_ACTIONS.has(rawA) ? rawA : "chat";
  if (action === "none") {
    action = "chat";
  }
  let data = o.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    data = {};
  }
  const d = /** @type {Record<string, unknown>} */ (data);
  const r = o.reply;
  const reply =
    typeof r === "string" && r.trim() ? r.trim() : String(FALLBACK.reply);
  return { success: true, action, data: d, reply };
}

/**
 * Bilge sistem mesajı → yapılandırılmış JSON yanıtı (OpenAI).
 * @param {string} userContent kullanıcıya giden tam prompt metni
 */
async function bilgeChatResponse(userContent) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.2,
    messages: [
      { role: "system", content: BILGE_SYSTEM },
      { role: "user", content: userContent },
    ],
  });
  const raw = completion.choices[0]?.message?.content;
  const parsed = tryParseBilgeJson(raw);
  return normalizeBilgeResult(parsed);
}

const app = express();

const defaultVite = ["http://localhost:5173", "http://127.0.0.1:5173"];
const fromEnv = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
const allowedOrigins = [...new Set([...defaultVite, ...fromEnv])];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    optionsSuccessStatus: 204,
  })
);
app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "bilge-server" });
});

/**
 * Basit niyet çıkarımı (mock). Kelime ipuçları → task | finance | idea | project
 */
function interpretAiMessage(message) {
  const lower = String(message).toLowerCase();
  let type = "task";
  let confidence = 0.55;
  let suggestion = "Kayıt";
  if (lower.includes("toplantı")) {
    type = "task";
    confidence = 0.82;
    suggestion = "Toplantı";
  } else if (lower.includes("para")) {
    type = "finance";
    confidence = 0.78;
    suggestion = "Finans";
  } else if (lower.includes("fikir")) {
    type = "idea";
    confidence = 0.76;
    suggestion = "Fikir";
  } else if (lower.includes("proje")) {
    type = "project";
    confidence = 0.77;
    suggestion = "Proje";
  }
  return { type, confidence, suggestion };
}

app.post("/api/ai-interpret", async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "message (string) gerekli" });
    }
    const out = interpretAiMessage(message.trim());
    return res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

/** Kural + isteğe bağlı OpenAI ile niyet → doğrudan MongoDB kaydı */
app.post("/api/ai-command", async (req, res) => {
  try {
    const { message } = req.body;
    console.log("[ai-command] incoming:", message);
    const out = await runAiCommand(message, {
      Task,
      Idea,
      Project,
      Finance,
      openai: process.env.OPENAI_API_KEY ? openai : null,
    });
    if (!out.ok) {
      return res.status(out.status).json(out.body);
    }
    return res.json(out.body);
  } catch (err) {
    console.error("[ai-command] error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/bilge", async (req, res) => {
  try {
    const { message, context } = req.body;
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message (string) gerekli" });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "API KEY YOK" });
    }

    let userContent = message;
    if (context && typeof context === "object" && !Array.isArray(context)) {
      const today = context.today;
      const projects = Array.isArray(context.projects) ? context.projects : [];
      const pLines = projects
        .map((p) => (p && p.title != null ? `- ${String(p.title)}` : null))
        .filter(Boolean);
      const ctxBlock = [
        "[Bağlam — yalnızca referans, cevabında ayrıca verme:]",
        today ? `Bugünün tarihi (Yerel, YYYY-MM-DD): ${String(today)}` : null,
        pLines.length
          ? `Mevcut projeler (görev atarken "project" alanında bire bir veya en yakın isim):\n${pLines.join("\n")}`
          : "Kullanıcının projesi yok; project alanını boş bırak veya yeni proje açtır.",
        "",
        "Kullanıcı mesajı:",
        message,
      ]
        .filter((x) => x != null)
        .join("\n");
      userContent = ctxBlock;
    }

    const out = await bilgeChatResponse(userContent);
    return res.json(out);
  } catch (err) {
    console.error("OPENAI ERROR:", err);
    res.status(500).json({ error: "AI error" });
  }
});

app.post("/api/recommendations", async (req, res) => {
  try {
    const { message, userData, useAi = true } = req.body;

    if (typeof message === "string" && message.trim()) {
      console.log("Incoming message:", message);
      const reply = `Şu an test modundayım: ${message.trim()}`;
      return res.json({ reply });
    }

    if (!userData || typeof userData !== "object") {
      return res.status(400).json({ error: "message (string) veya userData (object) gerekli" });
    }
    const out = await getRecommendations(userData, { openai, useAi: useAi !== false });
    return res.json(out);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

app.use("/api/tasks", taskRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/ideas", ideaRoutes);

/** Meta WhatsApp Cloud — doğrulama + gelen metin */
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];
  if (mode === "subscribe" && token && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(String(challenge ?? ""));
  }
  return res.sendStatus(403);
});

app.post("/webhook", (req, res) => {
  res.sendStatus(200);
  void (async () => {
    try {
      const entry = req.body?.entry?.[0]?.changes?.[0]?.value;
      const msg = entry?.messages?.[0];
      if (!msg || msg.type !== "text" || !msg.text?.body) {
        return;
      }
      const from = msg.from;
      const text = String(msg.text.body);
      const out = await runAiCommand(text, {
        Task,
        Idea,
        Project,
        Finance,
        openai: process.env.OPENAI_API_KEY ? openai : null,
      });
      if (out.ok && out.body?.reply) {
        await sendWhatsAppText(from, out.body.reply);
      }
    } catch (e) {
      console.error("[whatsapp webhook]", e);
    }
  })();
});

app.use((_req, res) => res.status(404).json({ error: "Not found" }));

async function start() {
  try {
    await connectDB();

    const PORT = process.env.PORT;

    app.listen(PORT, () => {
      console.log("Server running on port:", PORT);
    });

    // startDailyReportJob();
  } catch (err) {
    console.error("Server failed to start:", err);
  }
}

start();
