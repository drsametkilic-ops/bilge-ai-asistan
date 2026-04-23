import { tsFromDate, type AppTimestamp } from "./appTimestamp";
import { parseFlexibleDate, parseTimeString } from "./bilgeDateParse";
import { createProject } from "./mutations/projects";
import { createIdea } from "./mutations/ideas";
import { createIncome, createExpense } from "./mutations/expenses";
import { createTask } from "./mutations/tasks";
import type { TaskPriority, IdeaPriority, ProjectWorkStatus, BilgeResponse } from "@/types";

export type BilgeExecuteContext = {
  /** İleride görev–proje eşlemesi için (şu an REST görev modeli proje taşımıyor) */
  projects?: { id: string; title: string }[];
};

function resolveTaskDue(p: { date?: unknown; time?: unknown; dueDate?: unknown }): AppTimestamp | null {
  const dStr0 = p.dueDate ?? p.date;
  if (dStr0 == null || String(dStr0).trim() === "") {
    return null;
  }
  const day = parseFlexibleDate(String(dStr0));
  if (!day) {
    return null;
  }
  const { h, m } = parseTimeString(p.time != null ? String(p.time) : null);
  day.setHours(h, m, 0, 0);
  return tsFromDate(day);
}

function resolveExpenseDate(d: unknown): Date {
  if (d == null || d === "") {
    return new Date();
  }
  const parsed = parseFlexibleDate(String(d));
  if (parsed) {
    return parsed;
  }
  const t = new Date(String(d));
  return Number.isNaN(t.getTime()) ? new Date() : t;
}

const DEFAULT_IDEA_COLOR = "#f59e0b";
const DEFAULT_PROJECT_COLOR = "#F59E0B";

/**
 * Bilge yanıtındaki kayıt aksiyonlarını REST API üzerinden MongoDB’ye yazar.
 */
export async function executeBilgeAction(
  res: BilgeResponse,
  userId: string,
  _ctx: BilgeExecuteContext
): Promise<void> {
  const p = res.data;
  if (!p || typeof p !== "object") {
    return;
  }

  if (res.action === "create_task") {
    const titleRaw = p.title;
    const title = (titleRaw == null ? "Görev" : String(titleRaw)).slice(0, 500);
    const desc = p.description;
    const dueDate = resolveTaskDue({
      dueDate: p.dueDate,
      date: p.date,
      time: p.time,
    });
    const pr: TaskPriority = ["low", "medium", "high"].includes(String(p.priority || ""))
      ? (p.priority as TaskPriority)
      : "medium";

    await createTask(userId, {
      title,
      description: desc != null ? String(desc).slice(0, 2000) : undefined,
      projectId: null,
      workStatus: "todo",
      startDate: null,
      endDate: null,
      dueDate,
      time: p.time != null ? String(p.time) : null,
      reminderFrequency: "none",
      timeWindows: "",
      priority: pr,
    });
    return;
  }

  if (res.action === "create_project") {
    const name = p.name != null ? String(p.name).trim() : "";
    if (!name) {
      throw new Error("Proje adı gerekli.");
    }
    const description = p.description != null ? String(p.description).slice(0, 2000) : undefined;
    const st = String(p.status || "todo").toLowerCase();
    const workStatus: ProjectWorkStatus = (["todo", "in_progress", "done", "deferred"] as const).includes(
      st as ProjectWorkStatus
    )
      ? (st as ProjectWorkStatus)
      : "todo";
    await createProject(userId, {
      title: name.slice(0, 200),
      description,
      color: DEFAULT_PROJECT_COLOR,
      workStatus,
    });
    return;
  }

  if (res.action === "create_idea") {
    const title = p.title != null ? String(p.title).trim() : "";
    if (!title) {
      throw new Error("Fikir başlığı gerekli.");
    }
    const note = p.note != null ? String(p.note) : "";
    const pr: IdeaPriority = ["low", "medium", "high"].includes(String(p.priority || ""))
      ? (p.priority as IdeaPriority)
      : "medium";
    await createIdea(userId, {
      title: title.slice(0, 300),
      projectId: null,
      notes: note.slice(0, 5000),
      priority: pr,
      color: p.color != null && String(p.color) ? String(p.color) : DEFAULT_IDEA_COLOR,
    });
    return;
  }

  if (res.action === "create_income") {
    const amount = Math.abs(Number(p.amount)) || 0;
    if (amount <= 0) {
      throw new Error("Gelir tutarı geçersiz veya eksik.");
    }
    const description = p.description != null ? String(p.description) : "Gelir";
    const when = resolveExpenseDate(p.date);
    await createIncome(userId, {
      incomeName: description.slice(0, 200) || "Gelir",
      amount,
      date: tsFromDate(when),
      description: description.slice(0, 2000) || "—",
    });
    return;
  }

  if (res.action === "create_expense") {
    const amount = Math.abs(Number(p.amount)) || 0;
    if (amount <= 0) {
      throw new Error("Gider tutarı geçersiz veya eksik.");
    }
    const description = p.description != null ? String(p.description) : "Gider";
    const when = resolveExpenseDate(p.date);
    await createExpense(userId, {
      type: "expense",
      amount,
      category: "fatura",
      description: description.slice(0, 2000) || "—",
      date: tsFromDate(when),
    });
    return;
  }
}
