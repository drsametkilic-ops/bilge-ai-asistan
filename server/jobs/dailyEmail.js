import cron from "node-cron";
import nodemailer from "nodemailer";
import Task from "../models/Task.js";

function buildTransporter() {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  if (!host || !user || !pass) return null;
  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

/**
 * Her gün 09:00 (CRON_TZ veya Europe/Istanbul) — DAILY_EMAIL_ENABLED=true gerekir.
 */
export function startDailyReportJob() {
  if (process.env.DAILY_EMAIL_ENABLED !== "true") {
    console.log("[cron] Günlük e-posta devre dışı (DAILY_EMAIL_ENABLED=true yapın)");
    return;
  }
  const to = process.env.DAILY_REPORT_TO;
  if (!to) {
    console.warn("[cron] DAILY_REPORT_TO tanımlı değil");
    return;
  }
  const transporter = buildTransporter();
  if (!transporter) {
    console.warn("[cron] SMTP ayarları eksik (SMTP_HOST, SMTP_USER, SMTP_PASS)");
    return;
  }

  const tz = process.env.CRON_TZ || "Europe/Istanbul";

  cron.schedule(
    "0 9 * * *",
    async () => {
      try {
        const today = new Date().toISOString().slice(0, 10);
        const tasks = await Task.find({ date: today }).sort({ createdAt: -1 }).lean();
        const lines = tasks.length
          ? tasks.map((t) => `- ${t.title}${t.time ? ` (${t.time})` : ""}`).join("\n")
          : "(Bugün için tarihli görev yok — Mongo task.date alanına göre)";

        const body = `Merhaba,\n\nBugün (${today}) için kayıtlı görevler:\n\n${lines}\n\n— Bilge`;

        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to,
          subject: `Günlük rapor — ${today}`,
          text: body,
        });
        console.log("[cron] Günlük rapor gönderildi:", to);
      } catch (e) {
        console.error("[cron] Günlük rapor hatası:", e);
      }
    },
    { timezone: tz }
  );

  console.log("[cron] Günlük e-posta zamanlandı: 09:00", tz);
}
