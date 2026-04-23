import { useCallback, useMemo } from "react";
import { startOfDay, isToday, isAfter, format } from "date-fns";
import { tr } from "date-fns/locale";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { patchTask } from "@/lib/mutations/tasks";
import { formatTry, formatTs } from "@/lib/format";
import { KANBAN_LABELS, type Task, type TaskWorkStatus } from "@/types";
import { BilgeRecommendations } from "@/components/recommendations/BilgeRecommendations";

const PENDING: TaskWorkStatus[] = ["todo", "in_progress", "deferred"];

function taskDateTimeValue(t: Task): number {
  if (!t.dueDate) return Number.POSITIVE_INFINITY;
  const d = t.dueDate.toDate();
  if (t.time) {
    const p = t.time.split(":");
    const h = Number(p[0]);
    const m = Number(p[1]);
    if (!Number.isNaN(h)) d.setHours(h, Number.isNaN(m) ? 0 : m, 0, 0);
  } else {
    d.setHours(9, 0, 0, 0);
  }
  return d.getTime();
}

function greetingTitle(now: Date): string {
  const h = now.getHours();
  if (h < 5) return "Gece ne yapıyoruz?";
  if (h < 12) return "Günaydın — bugün ne yapıyoruz?";
  if (h < 18) return "Bugün ne yapıyoruz?";
  return "Bugünü nasıl kapatıyoruz?";
}

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { tasks, expenses, projects, dataLoading } = useDataStore();
  const now = new Date();

  const openTasks = useMemo(
    () => tasks.filter((t) => PENDING.includes(t.workStatus)),
    [tasks]
  );

  const todayTasks = useMemo(
    () =>
      openTasks.filter((t) => t.dueDate && isToday(t.dueDate.toDate())),
    [openTasks]
  );

  const upcomingTasks = useMemo(() => {
    const dayStart = startOfDay(now);
    return openTasks
      .filter((t) => t.dueDate)
      .filter((t) => isAfter(startOfDay(t.dueDate!.toDate()), dayStart))
      .sort((a, b) => a.dueDate!.toMillis() - b.dueDate!.toMillis())
      .slice(0, 3);
  }, [openTasks, now]);

  const nearest = useMemo(() => {
    const withDue = openTasks.filter((t) => t.dueDate);
    if (withDue.length === 0) return null;
    const nowMs = now.getTime();
    const sorted = [...withDue].sort((a, b) => taskDateTimeValue(a) - taskDateTimeValue(b));
    const nextFuture = sorted.find((t) => taskDateTimeValue(t) >= nowMs);
    return nextFuture ?? sorted[0];
  }, [openTasks, now]);

  const todayNet = useMemo(() => {
    let inc = 0;
    let out = 0;
    for (const e of expenses) {
      if (!isToday(e.date.toDate())) continue;
      if (e.type === "income") inc += e.amount;
      else out += e.amount;
    }
    return inc - out;
  }, [expenses]);

  const completeToday = useCallback(
    (id: string) => {
      if (!user) return;
      void patchTask(user.uid, id, { workStatus: "done" });
    },
    [user]
  );

  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-10">
      <header className="space-y-1">
        <h2 className="text-2xl font-bold tracking-tight text-brand-dark md:text-3xl">
          {greetingTitle(now)}
        </h2>
        <p className="text-sm text-slate-500">
          {format(now, "d MMMM yyyy, EEEE", { locale: tr })}
        </p>
      </header>

      <BilgeRecommendations
        tasks={tasks}
        expenses={expenses}
        projects={projects}
        dataLoading={dataLoading}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="!p-5 transition duration-200 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bugünkü görev</p>
          <p className="mt-2 text-3xl font-bold tabular-nums text-brand-dark">{todayTasks.length}</p>
        </Card>
        <Card className="!p-5 transition duration-200 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Yaklaşan görev</p>
          {nearest ? (
            <div className="mt-2 min-w-0">
              <p className="truncate font-semibold text-brand-dark">{nearest.title}</p>
              <p className="mt-0.5 text-sm text-slate-500">
                {nearest.dueDate && formatTs(nearest.dueDate, "d MMM")}
                {nearest.time ? ` · ${nearest.time}` : ""}
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">Tarihli açık görev yok</p>
          )}
        </Card>
        <Card className="!p-5 transition duration-200 hover:shadow-md">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Günlük net (TRY)</p>
          <p
            className={`mt-2 text-3xl font-bold tabular-nums ${
              todayNet >= 0 ? "text-emerald-600" : "text-red-600"
            }`}
          >
            {formatTry(todayNet)}
          </p>
        </Card>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" strokeWidth={2} />
          <h3 className="text-lg font-semibold text-brand-dark">Bugün yapılacaklar</h3>
        </div>
        {todayTasks.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-sm">
            Bugüne vadesi olan açık görev yok.
          </p>
        ) : (
          <ul className="space-y-3">
            {todayTasks.map((t) => (
              <li key={t.id}>
                <Card className="!p-0 overflow-hidden transition duration-200 hover:shadow-md">
                  <div className="flex items-stretch gap-0">
                    <div className="flex w-14 shrink-0 items-center justify-center border-r border-slate-100 bg-slate-50/80">
                      <input
                        type="checkbox"
                        className="h-5 w-5 cursor-pointer rounded border-slate-300 text-primary accent-primary focus:ring-2 focus:ring-primary/30"
                        onChange={() => completeToday(t.id)}
                        title="Tamamlandı"
                        aria-label={`Tamamlandı: ${t.title}`}
                      />
                    </div>
                    <div className="min-w-0 flex-1 px-4 py-4">
                      <p className="font-semibold text-brand-dark">{t.title}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                        {t.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" />
                            {formatTs(t.dueDate, "d MMM")}
                          </span>
                        )}
                        {t.time && (
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {t.time}
                          </span>
                        )}
                        <span className="text-xs text-slate-400">{KANBAN_LABELS[t.workStatus]}</span>
                      </div>
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-slate-400" strokeWidth={2} />
          <h3 className="text-lg font-semibold text-brand-dark">Yaklaşanlar</h3>
          <span className="text-sm text-slate-400">en fazla 3</span>
        </div>
        {upcomingTasks.length === 0 ? (
          <p className="text-sm text-slate-500">Önümüzdeki günler için tarihli başka görev yok.</p>
        ) : (
          <ul className="space-y-2">
            {upcomingTasks.map((t) => (
              <li key={t.id}>
                <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm transition duration-200 hover:shadow-md">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{t.title}</p>
                    <p className="text-xs text-slate-500">
                      {t.dueDate && formatTs(t.dueDate, "d MMM yyyy")}
                      {t.time && ` · ${t.time}`}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-slate-400">{KANBAN_LABELS[t.workStatus]}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
