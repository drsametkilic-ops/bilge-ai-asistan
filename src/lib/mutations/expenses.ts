import { API_BASE } from "@/lib/apiBase";
import { refreshAllFromApi } from "@/lib/api/refresh";
import type { ExpenseKind, ExpenseCategoryType } from "@/types";
import type { AppTimestamp } from "@/lib/appTimestamp";

async function reload() {
  await refreshAllFromApi();
}

function iso(ts: AppTimestamp): string {
  return ts.toDate().toISOString().slice(0, 10);
}

export async function createIncome(
  _userId: string,
  p: { incomeName: string; amount: number; date: AppTimestamp; description: string }
) {
  const note = `${p.incomeName} — ${p.description}`;
  const res = await fetch(`${API_BASE}/api/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: p.amount,
      type: "income",
      date: iso(p.date),
      note,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function createScheduleExpense(
  _userId: string,
  p: {
    name: string;
    expenseType: ExpenseCategoryType;
    amount: number;
    dueDate: AppTimestamp;
    description: string;
  }
) {
  const note = `${p.name} [${p.expenseType}] — ${p.description}`;
  const res = await fetch(`${API_BASE}/api/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: p.amount,
      type: "expense",
      date: iso(p.dueDate),
      note,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function patchExpense(
  _userId: string,
  expenseId: string,
  p: Partial<{
    type: ExpenseKind;
    amount: number;
    category: string;
    description: string;
    date: AppTimestamp;
    name: string;
    incomeName: string;
    expenseType: ExpenseCategoryType;
  }>
) {
  const body: Record<string, unknown> = {};
  if (p.type !== undefined) body.type = p.type;
  if (p.amount !== undefined) body.amount = p.amount;
  if (p.date !== undefined) body.date = iso(p.date);
  const noteParts = [
    p.incomeName ?? p.name,
    p.expenseType != null ? `[${p.expenseType}]` : null,
    p.description,
  ].filter((x): x is string => Boolean(x));
  if (noteParts.length > 0) body.note = noteParts.join(" — ");

  const res = await fetch(`${API_BASE}/api/finance/${expenseId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function removeExpense(_userId: string, expenseId: string) {
  const res = await fetch(`${API_BASE}/api/finance/${expenseId}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}

export async function createExpense(
  _userId: string,
  p: { type: ExpenseKind; amount: number; category: string; description: string; date: AppTimestamp }
) {
  const note = `${p.category}: ${p.description}`;
  const res = await fetch(`${API_BASE}/api/finance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      amount: p.amount,
      type: p.type,
      date: iso(p.date),
      note,
    }),
  });
  if (!res.ok) throw new Error(await res.text());
  await reload();
}
