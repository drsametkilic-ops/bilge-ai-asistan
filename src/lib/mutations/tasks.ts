import { API_BASE } from "@/lib/apiBase";
import { refreshAllFromApi } from "@/lib/api/refresh";
import type { TaskPriority, TaskWorkStatus, ReminderFrequency } from "@/types";
import type { AppTimestamp } from "@/lib/appTimestamp";

function isoDate(ts: AppTimestamp | null): string {
  if (!ts) return "";
  return ts.toDate().toISOString().slice(0, 10);
}

async function reload() {
  await refreshAllFromApi();
}

export async function createTask(
  _userId: string,
  p: {
    title: string;
    description?: string;
    projectId?: string | null;
    workStatus?: TaskWorkStatus;
    startDate: AppTimestamp | null;
    endDate: AppTimestamp | null;
    dueDate: AppTimestamp | null;
    time: string | null;
    reminderFrequency: ReminderFrequency;
    timeWindows: string;
    priority: TaskPriority;
  }
) {
  const res = await fetch(`${API_BASE}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: p.title,
      date: isoDate(p.dueDate),
      time: p.time ?? "",
      description: p.description ?? "",
      completed: p.workStatus === "done",
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function patchTask(
  _userId: string,
  taskId: string,
  p: Partial<{
    title: string;
    description: string | null;
    projectId: string | null;
    workStatus: TaskWorkStatus;
    startDate: AppTimestamp | null;
    endDate: AppTimestamp | null;
    dueDate: AppTimestamp | null;
    time: string | null;
    reminderFrequency: ReminderFrequency;
    timeWindows: string;
    priority: TaskPriority;
  }>
) {
  const body: Record<string, unknown> = {};
  if (p.title !== undefined) body.title = p.title;
  if (p.workStatus !== undefined) body.completed = p.workStatus === "done";
  if (p.dueDate !== undefined) body.date = isoDate(p.dueDate);
  if (p.time !== undefined) body.time = p.time ?? "";
  if (p.description !== undefined) body.description = p.description ?? "";

  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function removeTask(_userId: string, taskId: string) {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}
