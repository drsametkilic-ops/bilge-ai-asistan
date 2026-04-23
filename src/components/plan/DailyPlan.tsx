import {
  addDays,
  endOfDay,
  format,
  isSameDay,
  isWithinInterval,
  startOfDay,
  subDays,
} from "date-fns";
import { tr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatTs } from "@/lib/format";
import type { Task, TaskWorkStatus } from "@/types";
import { KANBAN_LABELS } from "@/types";

const ACTIVE: TaskWorkStatus[] = ["todo", "in_progress", "deferred", "done"];

type Slot = { task: Task; at: Date };

function buildSlot(task: Task, day: Date): Date | null {
  const d0 = startOfDay(day);
  const d1 = endOfDay(day);
  const inRange = (d: Date) => isWithinInterval(d, { start: d0, end: d1 });

  if (task.dueDate) {
    const t = task.dueDate.toDate();
    if (inRange(t)) {
      if (task.time) {
        const m = String(task.time).match(/(\d{1,2})(?::(\d{2}))?/);
        if (m) {
          const c = new Date(t);
          c.setHours(
            Math.min(23, parseInt(m[1], 10)),
            m[2] != null && m[2] !== "" ? parseInt(m[2], 10) : 0,
            0,
            0
          );
          return c;
        }
      }
      const c = new Date(t);
      c.setHours(9, 0, 0, 0);
      return c;
    }
  }
  if (task.endDate) {
    const t = task.endDate.toDate();
    if (inRange(t)) {
      return t;
    }
  }
  if (task.startDate) {
    const t = task.startDate.toDate();
    if (inRange(t)) {
      return t;
    }
  }
  return null;
}

function byTime(a: Slot, b: Slot) {
  return a.at.getTime() - b.at.getTime();
}

const HOUR_START = 6;
const HOUR_END = 22;

type DailyPlanProps = {
  tasks: Task[];
  onEdit: (t: Task) => void;
  onDelete: (t: Task) => void;
  title?: string;
};

export function DailyPlan({ tasks, onEdit, onDelete, title = "Günlük plan" }: DailyPlanProps) {
  const [day, setDay] = useState(() => new Date());
  const slots: Slot[] = useMemo(() => {
    return tasks
      .filter((t) => ACTIVE.includes(t.workStatus))
      .map((t) => {
        const at = buildSlot(t, day);
        return at ? { task: t, at } : null;
      })
      .filter((x): x is Slot => x != null)
      .sort(byTime);
  }, [tasks, day]);

  const hours = useMemo(
    () => Array.from({ length: HOUR_END - HOUR_START + 1 }, (_, i) => HOUR_START + i),
    []
  );

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            className="!p-2"
            onClick={() => setDay((d) => subDays(d, 1))}
            aria-label="Önceki gün"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <p className="min-w-[10rem] text-center text-sm font-medium text-slate-800">
            {format(day, "d MMMM yyyy, EEEE", { locale: tr })}
          </p>
          <Button
            type="button"
            variant="ghost"
            className="!p-2"
            onClick={() => setDay((d) => addDays(d, 1))}
            aria-label="Sonraki gün"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        {isSameDay(day, new Date()) ? null : (
          <Button type="button" variant="ghost" onClick={() => setDay(new Date())}>
            Bugüne dön
          </Button>
        )}
      </div>
      {slots.length === 0 && (
        <p className="text-sm text-slate-500">Bu gün için planlanan görev yok.</p>
      )}
      <div className="grid gap-1">
        {hours.map((h) => {
          const inHour = slots.filter((s) => s.at.getHours() === h);
          return (
            <div
              key={h}
              className="grid min-h-14 grid-cols-[3.5rem,1fr] items-start gap-2 rounded-lg border border-slate-100 bg-white/80 px-2 py-1.5"
            >
              <span className="pt-1.5 text-xs tabular-nums text-slate-500">
                {h.toString().padStart(2, "0")}:00
              </span>
              <div className="flex min-h-[2.5rem] flex-col gap-1.5">
                {inHour.map(({ task }) => (
                  <Card
                    key={task.id}
                    className="!p-2.5 shadow-sm"
                    style={{
                      borderLeft: `3px solid ${
                        task.time ? "#0ea5e9" : "#94a3b8"
                      }`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-slate-900">{task.title}</p>
                        <p className="text-xs text-slate-500">
                          {formatTs(task.dueDate, "d MMM")}
                          {task.time ? ` · ${task.time}` : ""} · {KANBAN_LABELS[task.workStatus]}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          className="!h-7 !p-1.5"
                          onClick={() => onEdit(task)}
                          title="Düzenle"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          className="!h-7 !p-1.5 text-red-600"
                          onClick={() => onDelete(task)}
                          title="Sil"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
