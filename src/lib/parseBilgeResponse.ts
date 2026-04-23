import type { BilgeResponse, BilgeAction } from "@/types";

const ACTIONS: string[] = [
  "create_task",
  "create_project",
  "create_idea",
  "create_income",
  "create_expense",
  "chat",
  "none",
];

function mapAction(a: string): BilgeAction {
  if (a === "none") {
    return "chat";
  }
  if (ACTIONS.includes(a)) {
    return a as BilgeAction;
  }
  return "chat";
}

/**
 * API gövdesini güvenle Bilge yanıtına dönüştürür.
 * success / data / reply şemasını biliyor; eski `payload` alanı varsa data'ya eşler.
 */
export function parseBilgeResponse(data: unknown): BilgeResponse {
  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    typeof (data as { error: unknown }).error === "string"
  ) {
    throw new Error((data as { error: string }).error);
  }
  if (!data || typeof data !== "object") {
    return {
      success: true,
      action: "chat",
      data: {},
      reply: "Beklenmeyen cevap.",
    };
  }
  const o = data as Record<string, unknown>;
  const rawAction = typeof o.action === "string" ? o.action : "chat";
  const action = mapAction(rawAction);
  const rawData = o.data;
  const legacy = o.payload;
  let d =
    rawData && typeof rawData === "object" && !Array.isArray(rawData)
      ? (rawData as Record<string, unknown>)
      : undefined;
  if (!d && legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
    d = legacy as Record<string, unknown>;
  }
  const dataObj = d ?? {};
  const reply = typeof o.reply === "string" && o.reply.trim() ? o.reply : "Tamamdır.";
  const success = typeof o.success === "boolean" ? o.success : true;
  return { success, action, data: dataObj, reply };
}
