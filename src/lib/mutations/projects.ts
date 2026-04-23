import { API_BASE } from "@/lib/apiBase";
import { refreshAllFromApi } from "@/lib/api/refresh";
import type { ProjectWorkStatus } from "@/types";

async function reload() {
  await refreshAllFromApi();
}

export async function createProject(
  _userId: string,
  p: {
    title: string;
    description?: string;
    workStatus?: ProjectWorkStatus;
    color?: string;
  }
) {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: p.title,
      description: p.description ?? "",
      workStatus: p.workStatus ?? "todo",
      color: p.color ?? "#64748b",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function patchProject(
  _userId: string,
  projectId: string,
  p: Partial<{
    title: string;
    description: string;
    workStatus: ProjectWorkStatus;
    color: string;
  }>
) {
  const body: Record<string, unknown> = {};
  if (p.title !== undefined) body.name = p.title;
  if (p.description !== undefined) body.description = p.description;
  if (p.workStatus !== undefined) body.workStatus = p.workStatus;
  if (p.color !== undefined) body.color = p.color;

  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function removeProject(_userId: string, projectId: string) {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}
