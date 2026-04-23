import type { BilgeSuggestion } from "@/types";
import { API_BASE } from "./apiBase";

export type RecommendationUserData = {
  userActive: boolean;
  /** YYYY-MM-DD — yerel gün (gider/tarih eşleşmesi) */
  localDate: string;
  tasks: Array<{
    id: string;
    workStatus: string;
    status?: string;
    projectId: string | null;
    dueDate: string | null;
  }>;
  expenses: Array<{
    type: string;
    amount: number;
    date: string;
  }>;
  projects: Array<{ id: string; title: string }>;
};

export type RecommendationResponse = {
  suggestions: BilgeSuggestion[];
};

/**
 * Sunucu öneri motoru: kural + isteğe bağlı 1x mini AI
 */
export async function fetchRecommendations(
  userData: RecommendationUserData,
  useAi = true
): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/api/recommendations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userData, useAi }),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || `HTTP ${res.status}`);
  }
  return res.json() as Promise<RecommendationResponse>;
}
