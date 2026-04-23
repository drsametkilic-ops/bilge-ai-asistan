import { API_BASE } from "@/lib/apiBase";
import { refreshAllFromApi } from "@/lib/api/refresh";
import type { IdeaPriority } from "@/types";

async function reload() {
  await refreshAllFromApi();
}

export async function createIdea(
  _userId: string,
  p: {
    title: string;
    notes: string;
    projectId?: string | null;
    priority: IdeaPriority;
    color: string;
  }
) {
  const res = await fetch(`${API_BASE}/api/ideas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: p.title,
      description: p.notes ?? "",
      priority: p.priority,
      projectId: p.projectId ?? null,
      color: p.color ?? "",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function patchIdea(
  _userId: string,
  ideaId: string,
  p: Partial<{
    title: string;
    notes: string;
    projectId: string | null;
    priority: IdeaPriority;
    color: string;
  }>
) {
  const body: Record<string, unknown> = {};
  if (p.title !== undefined) body.title = p.title;
  if (p.notes !== undefined) body.description = p.notes;
  if (p.projectId !== undefined) body.projectId = p.projectId;
  if (p.priority !== undefined) body.priority = p.priority;
  if (p.color !== undefined) body.color = p.color;

  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function removeIdea(_userId: string, ideaId: string) {
  const res = await fetch(`${API_BASE}/api/ideas/${ideaId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}
