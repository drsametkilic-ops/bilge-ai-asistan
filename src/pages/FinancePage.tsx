import { useMemo, useState } from "react";
import { tsFromDate } from "@/lib/appTimestamp";
import { Trash2, Pencil, Plus, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { createIncome, createScheduleExpense, patchExpense, removeExpense } from "@/lib/mutations/expenses";
import { formatTry, formatTs, formatDateInput } from "@/lib/format";
import type { Expense, ExpenseCategoryType } from "@/types";

const GIDER_TURU: { id: ExpenseCategoryType; label: string }[] = [
  { id: "fatura", label: "Fatura" },
  { id: "kira", label: "Kira" },
  { id: "borc", label: "Borç" },
  { id: "aidat", label: "Aidat" },
  { id: "banka", label: "Banka" },
];

function expLabel(t: Expense) {
  return t.name || t.description;
}

function incomeLabel(t: Expense) {
  return t.incomeName || t.name || t.description;
}

function IncomeFormModal({
  userId,
  row,
  onClose,
}: {
  userId: string;
  row: Expense | "new" | null;
  onClose: () => void;
}) {
  const e = row === "new" || !row || row.type !== "income" ? null : row;
  const [name, setName] = useState(e ? incomeLabel(e) : "");
  const [amount, setAmount] = useState(e ? String(e.amount) : "");
  const [date, setDate] = useState(
    e && e.date ? formatDateInput(e.date.toDate()) : formatDateInput(new Date())
  );
  const [description, setDescription] = useState(e?.description ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const n = Number(String(amount).replace(",", "."));
    if (!n || n <= 0) {
      return;
    }
    setSaving(true);
    try {
      const d = new Date(date + "T12:00:00");
      if (Number.isNaN(d.getTime())) {
        return;
      }
      const ts = tsFromDate(d);
      if (e) {
        await patchExpense(userId, e.id, {
          type: "income",
          amount: n,
          incomeName: name.trim(),
          name: name.trim(),
          description: description || "—",
          date: ts,
        });
      } else {
        await createIncome(userId, {
          incomeName: name.trim(),
          amount: n,
          date: ts,
          description: description || "—",
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={e ? "Gelir düzenle" : "Gelir ekle"}>
      <div className="space-y-2">
        <Input id="gname" label="Gelir adı" value={name} onChange={(x) => setName(x.target.value)} />
        <Input id="gam" inputMode="decimal" label="Miktar (TL)" value={amount} onChange={(x) => setAmount(x.target.value)} />
        <Input id="gdt" type="date" label="Tarih" value={date} onChange={(x) => setDate(x.target.value)} />
        <TextArea id="gdc" label="Açıklama" value={description} onChange={(x) => setDescription(x.target.value)} />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={save} disabled={saving || !name.trim()}>
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function GiderFormModal({
  userId,
  row,
  onClose,
}: {
  userId: string;
  row: Expense | "new" | null;
  onClose: () => void;
}) {
  const e = row === "new" || !row || row.type !== "expense" ? null : row;
  const [giderAdi, setGiderAdi] = useState(e ? expLabel(e) : "");
  const [expType, setExpType] = useState<ExpenseCategoryType>(e?.expenseType ?? "fatura");
  const [amount, setAmount] = useState(e ? String(e.amount) : "");
  const [due, setDue] = useState(
    e && e.date ? formatDateInput(e.date.toDate()) : formatDateInput(new Date())
  );
  const [description, setDescription] = useState(e?.description ?? "");
  const [saving, setSaving] = useState(false);
  const save = async () => {
    const n = Number(String(amount).replace(",", "."));
    if (!n || n <= 0) {
      return;
    }
    setSaving(true);
    try {
      const d = new Date(due + "T12:00:00");
      if (Number.isNaN(d.getTime())) {
        return;
      }
      const ts = tsFromDate(d);
      if (e) {
        await patchExpense(userId, e.id, {
          type: "expense",
          amount: n,
          name: giderAdi.trim(),
          expenseType: expType,
          description: description || "—",
          date: ts,
          category: expType,
        });
      } else {
        await createScheduleExpense(userId, {
          name: giderAdi.trim(),
          expenseType: expType,
          amount: n,
          dueDate: ts,
          description: description || "—",
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };
  return (
    <Modal open onClose={onClose} title={e ? "Gider düzenle" : "Gider ekle"}>
      <div className="space-y-2">
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Gider türü</p>
          <select
            className="w-full rounded-lg border border-slate-200 px-2 py-2"
            value={expType}
            onChange={(x) => setExpType(x.target.value as ExpenseCategoryType)}
          >
            {GIDER_TURU.map((g) => (
              <option key={g.id} value={g.id}>
                {g.label}
              </option>
            ))}
          </select>
        </div>
        <Input id="gn" label="Gider adı" value={giderAdi} onChange={(x) => setGiderAdi(x.target.value)} />
        <Input id="gamt" inputMode="decimal" label="Miktar (TL)" value={amount} onChange={(x) => setAmount(x.target.value)} />
        <Input
          id="gdu"
          type="date"
          label="Son ödeme tarihi"
          value={due}
          onChange={(x) => setDue(x.target.value)}
        />
        <TextArea id="gex" label="Açıklama" value={description} onChange={(x) => setDescription(x.target.value)} />
        <div className="mt-2 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button onClick={save} disabled={saving || !giderAdi.trim()}>
            Kaydet
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function FinancePage() {
  const user = useAuthStore((s) => s.user);
  const { expenses, dataLoading } = useDataStore();
  const [incomeModal, setIncomeModal] = useState<Expense | "new" | null>(null);
  const [giderModal, setGiderModal] = useState<Expense | "new" | null>(null);

  const incomeRows = useMemo(
    () =>
      expenses
        .filter((e) => e.type === "income")
        .sort((a, b) => b.date.toMillis() - a.date.toMillis()),
    [expenses]
  );
  const expenseRows = useMemo(
    () =>
      expenses
        .filter((e) => e.type === "expense")
        .sort((a, b) => b.date.toMillis() - a.date.toMillis()),
    [expenses]
  );

  if (!user) {
    return null;
  }
  if (dataLoading) {
    return <p className="text-slate-500">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-600">Gelir ve gider kayıtlarınız; tarih sırasına göre listelenir.</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
        <Button type="button" onClick={() => setIncomeModal("new")} className="inline-flex items-center justify-center gap-2">
          <Plus className="h-4 w-4" /> Gelir ekle
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setGiderModal("new")}
          className="inline-flex items-center justify-center gap-2 border-amber-200"
        >
          <Wallet className="h-4 w-4" /> Gider ekle
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-2 text-base font-bold text-slate-900">Gelirler</h2>
          <ul className="space-y-2">
            {incomeRows.length === 0 && <li className="text-sm text-slate-500">Kayıt yok</li>}
            {incomeRows.map((e) => (
              <li key={e.id}>
                <Card className="!p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-medium text-emerald-800">{incomeLabel(e)}</p>
                      <p className="text-sm text-slate-600">{formatTry(e.amount)}</p>
                      <p className="text-xs text-slate-400">
                        {formatTs(e.date, "d MMM yyyy")} · {e.description}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      <Button
                        type="button"
                        variant="ghost"
                        className="!p-1.5"
                        onClick={() => setIncomeModal(e)}
                        title="Düzenle"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="!p-1.5 text-red-600"
                        onClick={() => {
                          if (confirm("Silmek istiyor musun?")) {
                            void removeExpense(user.uid, e.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="mb-2 text-base font-bold text-slate-900">Giderler</h2>
          <ul className="space-y-2">
            {expenseRows.length === 0 && <li className="text-sm text-slate-500">Kayıt yok</li>}
            {expenseRows.map((e) => (
              <li key={e.id}>
                <Card className="!p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium uppercase text-amber-800/90">
                        {GIDER_TURU.find((x) => x.id === e.expenseType)?.label ?? e.expenseType}
                      </p>
                      <p className="font-medium text-slate-900">{expLabel(e)}</p>
                      <p className="text-sm text-red-700">{formatTry(e.amount)}</p>
                      <p className="text-xs text-slate-400">
                        Son ödeme: {formatTs(e.date, "d MMM yyyy")} · {e.description}
                      </p>
                    </div>
                    <div className="flex gap-0.5">
                      <Button type="button" variant="ghost" className="!p-1.5" onClick={() => setGiderModal(e)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="!p-1.5 text-red-600"
                        onClick={() => {
                          if (confirm("Silmek istiyor musun?")) {
                            void removeExpense(user.uid, e.id);
                          }
                        }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {incomeModal && <IncomeFormModal userId={user.uid} row={incomeModal} onClose={() => setIncomeModal(null)} />}
      {giderModal && <GiderFormModal userId={user.uid} row={giderModal} onClose={() => setGiderModal(null)} />}
    </div>
  );
}
