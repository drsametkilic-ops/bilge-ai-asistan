import { useState, useEffect } from "react";
import { tsFromDate } from "@/lib/appTimestamp";
import { Modal } from "./ui/Modal";
import { Button } from "./ui/Button";
import { Input, TextArea } from "./ui/Input";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";
import { createTask } from "@/lib/mutations/tasks";
import { createExpense } from "@/lib/mutations/expenses";
import { formatDateInput } from "@/lib/format";
import type { TaskPriority, ExpenseKind } from "@/types";

type Tab = "task" | "expense";

export function QuickAddModal() {
  const { quickOpen, closeQuick, quickMode } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const [tab, setTab] = useState<Tab>(() =>
    quickMode === "task" ? "task" : quickMode === "expense" ? "expense" : "task"
  );
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState(() => formatDateInput(new Date()));
  const [taskPrio, setTaskPrio] = useState<TaskPriority>("medium");

  const [expType, setExpType] = useState<ExpenseKind>("expense");
  const [expAmount, setExpAmount] = useState("");
  const [expCat, setExpCat] = useState("genel");
  const [expDesc, setExpDesc] = useState("");
  const [expDate, setExpDate] = useState(() => formatDateInput(new Date()));

  useEffect(() => {
    if (!quickOpen) return;
    if (quickMode === "expense") setTab("expense");
    else if (quickMode === "task") setTab("task");
  }, [quickOpen, quickMode]);

  if (!user) return null;

  const onlyTask = quickMode === "task";
  const onlyExp = quickMode === "expense";
  const showTabs = !onlyTask && !onlyExp;
  const mode: Tab = onlyTask ? "task" : onlyExp ? "expense" : tab;

  const handleSave = async () => {
    setErr("");
    setSaving(true);
    try {
      if (mode === "task") {
        if (!taskTitle.trim()) {
          setErr("Görev başlığı gerekli.");
          return;
        }
        const d = new Date(taskDue + "T12:00:00");
        const due = Number.isNaN(d.getTime()) ? null : tsFromDate(d);
        await createTask(user.uid, {
          title: taskTitle.trim(),
          projectId: null,
          workStatus: "todo",
          startDate: null,
          endDate: null,
          dueDate: due,
          time: null,
          reminderFrequency: "none",
          timeWindows: "",
          priority: taskPrio,
        });
      } else {
        const amt = Number(expAmount.replace(",", "."));
        if (!amt || amt < 0) {
          setErr("Geçerli tutar girin.");
          return;
        }
        const d = new Date(expDate + "T12:00:00");
        if (Number.isNaN(d.getTime())) {
          setErr("Tarih geçersiz.");
          return;
        }
        await createExpense(user.uid, {
          type: expType,
          amount: amt,
          category: expCat.trim() || "genel",
          description: expDesc.trim() || "—",
          date: tsFromDate(d),
        });
      }
      setTaskTitle("");
      setExpAmount("");
      setExpDesc("");
      closeQuick();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={quickOpen}
      onClose={closeQuick}
      title="Hızlı ekle"
      size="md"
    >
      {showTabs && (
        <div className="mb-4 flex gap-1 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setTab("task")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tab === "task" ? "bg-white shadow text-slate-900" : "text-slate-500"
            }`}
          >
            Görev
          </button>
          <button
            type="button"
            onClick={() => setTab("expense")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium ${
              tab === "expense" ? "bg-white shadow text-slate-900" : "text-slate-500"
            }`}
          >
            Gelir / Gider
          </button>
        </div>
      )}

      {mode === "task" && (
        <div className="space-y-3">
          <Input
            id="q-title"
            label="Görev"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Ne yapılacak?"
            autoFocus
          />
          <Input
            id="q-due"
            type="date"
            label="Bitiş (opsiyonel)"
            value={taskDue}
            onChange={(e) => setTaskDue(e.target.value)}
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-slate-700">Öncelik</p>
            <div className="flex gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPrio(p)}
                  className={`flex-1 rounded-lg py-2 text-xs font-medium ${
                    taskPrio === p
                      ? "bg-surface text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {p === "low" ? "Düşük" : p === "medium" ? "Orta" : "Yüksek"}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {mode === "expense" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setExpType("expense")}
              className={`flex-1 rounded-lg py-2 text-sm ${
                expType === "expense" ? "bg-red-100 text-red-800" : "bg-slate-100"
              }`}
            >
              Gider
            </button>
            <button
              type="button"
              onClick={() => setExpType("income")}
              className={`flex-1 rounded-lg py-2 text-sm ${
                expType === "income" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100"
              }`}
            >
              Gelir
            </button>
          </div>
          <Input
            id="q-amount"
            inputMode="decimal"
            label="Tutar (TRY)"
            value={expAmount}
            onChange={(e) => setExpAmount(e.target.value)}
            placeholder="0"
            autoFocus
          />
          <Input
            id="q-cat"
            label="Kategori"
            value={expCat}
            onChange={(e) => setExpCat(e.target.value)}
          />
          <TextArea
            id="q-edesc"
            label="Açıklama"
            value={expDesc}
            onChange={(e) => setExpDesc(e.target.value)}
          />
          <Input
            id="q-edate"
            type="date"
            label="Tarih"
            value={expDate}
            onChange={(e) => setExpDate(e.target.value)}
          />
        </div>
      )}

      {err && <p className="mb-2 text-sm text-red-600">{err}</p>}
      <div className="mt-6 flex justify-end gap-2">
        <Button variant="ghost" onClick={closeQuick}>
          İptal
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "…" : "Kaydet"}
        </Button>
      </div>
    </Modal>
  );
}
