import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Mic, MicOff } from "lucide-react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/useAuthStore";
import { API_BASE } from "@/lib/apiBase";
import { refreshAllFromApi } from "@/lib/api/refresh";
import { notifyTaskCreated, scheduleTaskReminder } from "@/lib/browserNotifications";

type ChatMsg = { role: "user" | "ai"; content: string };

type AiCommandResponse = {
  type: string;
  data: Record<string, unknown>;
  reply: string;
  saved?: boolean;
  id?: string;
};

async function postAiCommand(text: string): Promise<AiCommandResponse> {
  const res = await fetch(`${API_BASE}/api/ai-command`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message: text }),
  });
  if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);
  return res.json() as Promise<AiCommandResponse>;
}

type VoiceResultEvent = { results: { 0: { 0: { transcript: string } } } };

function getSpeechRecognitionCtor(): (new () => {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((ev: VoiceResultEvent) => void) | null;
  onerror: ((ev: unknown) => void) | null;
  onend: (() => void) | null;
}) | null {
  const w = window as unknown as Record<string, (new () => unknown) | undefined>;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  return Ctor as any;
}

export function ChatPage() {
  const user = useAuthStore((s) => s.user);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: "ai", content: "Merhaba! Görev (tarih/saat), finans tutarı, proje veya fikir yaz — doğrudan kaydedilir." },
  ]);
  const [sending, setSending] = useState(false);
  const [listening, setListening] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    bottom.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const appendAi = useCallback((content: string) => {
    setMessages((prev) => [...prev, { role: "ai", content }]);
  }, []);

  const processUserText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !user) return;

      setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
      setSending(true);
      try {
        const out = await postAiCommand(trimmed);
        appendAi(out.reply);

        await refreshAllFromApi();

        if (out.saved && out.type === "task" && out.data) {
          const title = String(out.data.title ?? "Görev");
          notifyTaskCreated(title);
          const date = typeof out.data.date === "string" ? out.data.date : "";
          const time = typeof out.data.time === "string" ? out.data.time : "";
          if (out.id && date) {
            scheduleTaskReminder(out.id, title, date, time);
          }
        }
      } catch (e) {
        appendAi(`Hata: ${e instanceof Error ? e.message : "Bağlantı sorunu"}`);
      } finally {
        setSending(false);
      }
    },
    [appendAi, user]
  );

  const handleSend = () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    void processUserText(text);
  };

  const toggleMic = () => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      appendAi("Tarayıcı ses tanımayı desteklemiyor (Chrome önerilir).");
      return;
    }

    if (listening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setListening(false);
      return;
    }

    const rec = new Ctor();
    rec.lang = "tr-TR";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.continuous = false;

    rec.onresult = (event: VoiceResultEvent) => {
      const text = event.results[0]?.[0]?.transcript ?? "";
      if (text.trim()) {
        void processUserText(text);
      }
      setListening(false);
      recognitionRef.current = null;
    };

    rec.onerror = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    rec.onend = () => {
      setListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
      appendAi("Mikrofon başlatılamadı.");
    }
  };

  if (!user) return null;

  return (
    <div className="flex min-h-[64dvh] flex-col pb-20 md:pb-0">
      <p className="mb-4 text-sm text-slate-500">
        Mesajın otomatik sınıflandırılır ve MongoDB&apos;ye kaydedilir — tek kaynak API.
      </p>
      <Card className="flex min-h-[440px] flex-1 flex-col !rounded-xl !p-0 !shadow-md">
        <div className="border-b border-slate-200/80 px-5 py-3.5">
          <p className="flex items-center gap-2.5 text-sm font-semibold text-brand-dark">
            <BrandMark size="md" title="" className="ring-1 ring-black/10" />
            Bilge
          </p>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto px-4 py-4 text-sm md:px-5">
          {messages.map((msg, i) => (
            <div key={i} className={msg.role === "user" ? "text-right" : ""}>
              <b className="text-slate-600">{msg.role === "user" ? "Sen" : "Bilge"}:</b>{" "}
              <span className="whitespace-pre-wrap text-slate-800">{msg.content}</span>
            </div>
          ))}
          <div ref={bottom} />
        </div>
        <div className="border-t border-slate-200/80 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
            <label className="sr-only" htmlFor="bilge-input">
              Mesaj
            </label>
            <textarea
              id="bilge-input"
              className="min-h-[3.5rem] w-full flex-1 resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-base leading-relaxed text-slate-900 shadow-sm transition duration-200 placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
              placeholder='Örn: yarın 10da toplantı — veya "150 TL market"'
              value={input}
              rows={2}
              disabled={sending}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                title="Konuş"
                onClick={() => toggleMic()}
                disabled={sending}
                className={`inline-flex h-12 min-w-[3rem] items-center justify-center rounded-lg border px-3 text-lg ${
                  listening
                    ? "border-red-300 bg-red-50 text-red-700"
                    : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                } disabled:opacity-50`}
              >
                {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button
                type="button"
                onClick={() => handleSend()}
                disabled={!input.trim() || sending}
                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span className="hidden sm:inline">Gönder</span>
              </button>
            </div>
          </div>
          <p className="mt-1.5 text-center text-xs text-slate-400 sm:text-left">
            Gönder: Ctrl+Enter · Kayıtlar sunucuya yazılır, sayfa yenilenince sohbet sıfırlanır.
          </p>
        </div>
      </Card>
    </div>
  );
}
