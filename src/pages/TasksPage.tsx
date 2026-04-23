import { useMemo, useState, useCallback, useEffect } from "react";
import {
  addWeeks,
  isToday,
  isWithinInterval,
  startOfDay,
} from "date-fns";
import { Trash2, Pencil, GripVertical, Calendar, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { patchTask, removeTask } from "@/lib/mutations/tasks";
import { formatTs } from "@/lib/format";
import { WorkBoard } from "@/components/kanban/WorkBoard";
import { TaskFormModal } from "@/components/task/TaskFormModal";
import type { Task, TaskWorkStatus } from "@/types";
import { KANBAN_LABELS } from "@/types";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { refreshAllFromApi } from "@/lib/api/refresh";
import { googleCalendarTaskUrl } from "@/lib/googleCalendar";

type TFilter = "all" | "today" | "week";

function taskDateISO(t: Task): string | null {
  if (!t.dueDate) return null;
  return t.dueDate.toDate().toISOString().slice(0, 10);
}

function taskMatchesFilter(t: Task, f: TFilter): boolean {
  if (f === "all") {
    return true;
  }
  if (!t.dueDate) {
    return false;
  }
  const d = t.dueDate.toDate();
  if (f === "today") {
    return isToday(d);
  }
  if (f === "week") {
    const a = startOfDay(new Date());
    const b = addWeeks(a, 1);
    return isWithinInterval(d, { start: a, end: b });
  }
  return true;
}

export function TasksPage() {
  const user = useAuthStore((s) => s.user);
  const { tasks, projects, dataLoading } = useDataStore();
  const [taskFilter, setTaskFilter] = useState<TFilter>("all");
  const [taskQ, setTaskQ] = useState("");
  const [taskProject, setTaskProject] = useState<string>("all");
  const [editTask, setEditTask] = useState<Task | "new" | null>(null);

  const projectMap = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (taskQ.trim()) {
        const q = taskQ.toLowerCase();
        if (
          !t.title.toLowerCase().includes(q) &&
          !(t.description && t.description.toLowerCase().includes(q))
        ) {
          return false;
        }
      }
      if (taskProject !== "all" && t.projectId !== taskProject) {
        return false;
      }
      return taskMatchesFilter(t, taskFilter);
    });
  }, [tasks, taskQ, taskProject, taskFilter]);

  const onTaskStatus = useCallback(
    (id: string, status: TaskWorkStatus) => {
      if (!user) {
        return;
      }
      void patchTask(user.uid, id, { workStatus: status });
    },
    [user]
  );

  useEffect(() => {
    const fetchTasks = () => {
      void refreshAllFromApi();
    };
    fetchTasks();
    const interval = window.setInterval(fetchTasks, 3000);
    return () => clearInterval(interval);
  }, []);

  if (!user) {
    return null;
  }
  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-slate-500">
        Kanban panosu — projeleri <span className="font-medium text-slate-600">Projeler</span> sayfasında
        yönetin.
      </p>
      <WorkBoard<Task>
        title="Görevler"
        addLabel="Görev ekle"
        onAdd={() => setEditTask("new")}
        items={filteredTasks}
        onPatchStatus={onTaskStatus}
        filterSlot={
          <div className="mb-1 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-sm shadow-sm">
            <div className="min-w-[140px]">
              <label className="mb-1 block text-slate-600" htmlFor="t-q">
                Ara
              </label>
              <input
                id="t-q"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                value={taskQ}
                onChange={(e) => setTaskQ(e.target.value)}
                placeholder="Başlık, açıklama…"
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-600" htmlFor="t-pj">
                Proje
              </label>
              <select
                id="t-pj"
                className="rounded-lg border border-slate-200 px-2 py-1.5"
                value={taskProject}
                onChange={(e) => setTaskProject(e.target.value)}
              >
                <option value="all">Tümü</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="mb-1 text-slate-600">Dönem</p>
              <div className="flex gap-1">
                {(
                  [
                    ["all", "Tümü"],
                    ["today", "Bugün"],
                    ["week", "1 hafta"],
                  ] as [TFilter, string][]
                ).map(([v, l]) => (
                  <Button
                    key={v}
                    type="button"
                    variant={taskFilter === v ? "surface" : "ghost"}
                    className="!py-1 !text-xs"
                    onClick={() => setTaskFilter(v)}
                  >
                    {l}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        }
        renderCard={(t) => {
          const pj = t.projectId ? projectMap.get(t.projectId) : null;
          return (
            <Card className="!p-4 !shadow-sm">
              <div className="flex gap-1.5">
                <span className="pt-1 text-slate-300" aria-hidden>
                  <GripVertical className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-900">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{t.description}</p>
                  )}
                  <p className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    {pj && (
                      <span
                        className="font-medium"
                        style={{ color: pj.color || "#64748b" }}
                      >
                        {pj.title}
                      </span>
                    )}
                    {t.dueDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        {formatTs(t.dueDate, "d MMM yyyy")}
                      </span>
                    )}
                    {!t.dueDate && <span>Tarih yok</span>}
                    {t.time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        {t.time}
                      </span>
                    )}
                    <span className="text-slate-400">{KANBAN_LABELS[t.workStatus]}</span>
                  </p>
                </div>
                <div className="flex flex-col gap-0.5">
                  {taskDateISO(t) && (
                    <a
                      href={googleCalendarTaskUrl(t.title, taskDateISO(t)!, t.time)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Takvime ekle"
                      className="inline-flex items-center justify-center rounded-lg p-1.5 text-sm text-primary hover:bg-slate-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      📅
                    </a>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    className="!p-1.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditTask(t);
                    }}
                    title="Düzenle"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="!p-1.5 text-red-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Görevi silmek istiyor musun?")) {
                        void removeTask(user.uid, t.id);
                      }
                    }}
                    title="Sil"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          );
        }}
      />

      {editTask && (
        <TaskFormModal
          userId={user.uid}
          projects={projects}
          task={editTask === "new" ? null : editTask}
          onClose={() => setEditTask(null)}
        />
      )}
    </div>
  );
}
