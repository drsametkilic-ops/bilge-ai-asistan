import type { AppTimestamp } from "@/lib/appTimestamp";

export type TaskPriority = "low" | "medium" | "high";
/** Eski alan: open | done — yalnızca dönüştürme için */
export type TaskLegacyStatus = "open" | "done";
/** Yapılacak | Devam ediyor | Tamamlandı | Ertelendi */
export type TaskWorkStatus = "todo" | "in_progress" | "done" | "deferred";
export type ProjectWorkStatus = TaskWorkStatus;

export type ReminderFrequency = "none" | "daily" | "weekly" | "monthly" | "custom";

export interface Task {
  id: string;
  title: string;
  description?: string;
  projectId: string | null;
  workStatus: TaskWorkStatus;
  /** Eski belgeler için */
  status?: TaskLegacyStatus;
  startDate: AppTimestamp | null;
  endDate: AppTimestamp | null;
  dueDate: AppTimestamp | null;
  /** "HH:mm" */
  time: string | null;
  reminderFrequency: ReminderFrequency;
  /** "Pencereler" (ör. seçilen aralık etiketleri) virgüllü */
  timeWindows: string;
  priority: TaskPriority;
  createdAt: AppTimestamp;
  updatedAt: AppTimestamp;
}

export type ExpenseKind = "income" | "expense";

export type ExpenseCategoryType = "fatura" | "kira" | "borc" | "aidat" | "banka";

export interface Expense {
  id: string;
  type: ExpenseKind;
  amount: number;
  /** Eski/özet: kategori veya tür yedeği */
  category: string;
  description: string;
  /** Listeleme tarihi: gelir = gelir günü; gider = son ödeme tarihi */
  date: AppTimestamp;
  name?: string;
  incomeName?: string;
  expenseType?: ExpenseCategoryType;
  isRecurring?: boolean;
  createdAt: AppTimestamp;
  updatedAt: AppTimestamp;
}

export type IdeaPriority = "low" | "medium" | "high";

export interface Idea {
  id: string;
  title: string;
  projectId: string | null;
  notes: string;
  priority: IdeaPriority;
  color: string;
  createdAt: AppTimestamp;
  updatedAt: AppTimestamp;
}

export interface Project {
  id: string;
  title: string;
  description?: string;
  workStatus: ProjectWorkStatus;
  color: string;
  createdAt: AppTimestamp;
  updatedAt: AppTimestamp;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
}

export type BilgeSuggestionType = "task" | "project" | "plan" | "finance" | "insight" | string;

export interface BilgeSuggestion {
  id: string;
  text: string;
  type: BilgeSuggestionType;
  target?: string;
}

export type BilgeAction =
  | "create_task"
  | "create_project"
  | "create_idea"
  | "create_income"
  | "create_expense"
  | "chat"
  /** Eski sürümler — ayrıştırıcıda "chat"e eşlenir */
  | "none";

export interface BilgeResponse {
  success: boolean;
  action: BilgeAction;
  data: Record<string, unknown>;
  reply: string;
}

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export const KANBAN_STATUSES: TaskWorkStatus[] = [
  "todo",
  "in_progress",
  "done",
  "deferred",
];

export const KANBAN_LABELS: Record<TaskWorkStatus, string> = {
  todo: "Yapılacak",
  in_progress: "Devam ediyor",
  done: "Tamamlandı",
  deferred: "Ertelendi",
};
