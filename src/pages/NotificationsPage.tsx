import { addDays, isBefore, isAfter, startOfDay, endOfDay } from "date-fns";
import { Card } from "@/components/ui/Card";
import { useDataStore } from "@/store/useDataStore";
import { formatTry, formatTs } from "@/lib/format";

/**
 * Temel hatırlatmalar: yakın vadeli görevler + ileri tarihli gider notları
 */
export function NotificationsPage() {
  const { tasks, expenses, dataLoading } = useDataStore();
  const now = new Date();
  const in3 = addDays(now, 3);

  const taskAlerts = tasks
    .filter((t) => t.workStatus !== "done" && t.dueDate)
    .filter((t) => {
      const d = t.dueDate!.toDate();
      return !isBefore(d, startOfDay(now)) && !isAfter(d, endOfDay(in3));
    })
    .sort((a, b) => a.dueDate!.toMillis() - b.dueDate!.toMillis());

  const payAlerts = expenses
    .filter((e) => e.type === "expense")
    .filter((e) => {
      const d = e.date.toDate();
      return !isBefore(d, startOfDay(now)) && !isAfter(d, endOfDay(addDays(now, 14)));
    })
    .sort((a, b) => a.date.toMillis() - b.date.toMillis())
    .slice(0, 20);

  if (dataLoading) {
    return <p className="text-slate-500">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-600">Önümüzdeki günler için özet hatırlatmalar.</p>
      <Card title="3 gün içinde vadesi olan görevler">
        <ul className="space-y-2 text-sm">
          {taskAlerts.length === 0 && <li className="text-slate-500">Kayıt yok</li>}
          {taskAlerts.map((t) => (
            <li
              key={t.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-amber-50/90 px-3 py-2"
            >
              <span className="font-medium text-slate-800">{t.title}</span>
              <span className="text-amber-800">
                {t.dueDate && formatTs(t.dueDate, "d MMM")}
              </span>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Yaklaşan ödemeler (14 gün)">
        <ul className="space-y-2 text-sm">
          {payAlerts.length === 0 && <li className="text-slate-500">Kayıt yok</li>}
          {payAlerts.map((e) => (
            <li
              key={e.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2"
            >
              <span className="truncate">{e.description}</span>
              <span className="shrink-0 text-red-600">
                {formatTry(e.amount)} · {formatTs(e.date, "d MMM")}
              </span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
