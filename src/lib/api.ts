import { parseBilgeResponse } from "./parseBilgeResponse";
import type { BilgeResponse } from "@/types";
import { API_BASE } from "./apiBase";

export type BilgeChatContext = {
  projects?: { id: string; title: string }[];
};

/**
 * OpenAI (Express). Geçici: Authorization başlığı yok (CORS / preflight testi).
 * Üretim: sunucu doğrulaması için 3. arg man ile Bearer eklenebilir.
 */
export async function postBilgeChat(
  message: string,
  _userId?: string,
  _idToken: string | null = null,
  context?: BilgeChatContext
) {
  void _userId;
  void _idToken;
  // eslint-disable-next-line no-console
  console.log("[Bilge API] API_CALLED", { API_BASE, url: `${API_BASE}/api/bilge` });
  const url = `${API_BASE}/api/bilge`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        context: {
          ...context,
          today: new Date().toISOString().slice(0, 10),
        },
      }),
    });

    let data: unknown;
    const ct = res.headers.get("content-type") || "";
    try {
      if (ct.includes("application/json")) {
        data = await res.json();
      } else {
        const t = await res.text();
        const err = new Error(t || `HTTP ${res.status}`);
        // eslint-disable-next-line no-console
        console.error("[Bilge API] Non-JSON response", res.status, t);
        throw err;
      }
    } catch (e) {
      if (e instanceof SyntaxError) {
        // eslint-disable-next-line no-console
        console.error("[Bilge API] JSON parse failed", e);
        throw new Error("Sunucu geçerli JSON döndürmedi.");
      }
      throw e;
    }

    if (!res.ok) {
      const errMsg =
        data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
          ? (data as { error: string }).error
          : `İstek başarısız (HTTP ${res.status})`;
      // eslint-disable-next-line no-console
      console.error("[Bilge API] Error response", res.status, data);
      throw new Error(errMsg);
    }

    return parseBilgeResponse(data) as BilgeResponse;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[Bilge API] postBilgeChat failed", { url, err: e });
    throw e;
  }
}
