import { useState } from "react";
import { tsFromDate } from "@/lib/appTimestamp";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, TextArea } from "@/components/ui/Input";
import { createTask, patchTask } from "@/lib/mutations/tasks";
import { formatDateInput } from "@/lib/format";
import { TIME_WINDOW_OPTIONS, decodeTimeWindows, encodeTimeWindows } from "@/lib/timeWindows";
import type { Task, Project, TaskPriority, TaskWorkStatus, ReminderFrequency } from "@/types";
import { KANBAN_LABELS } from "@/types";

function toTs(d: string, endOfDay: boolean) {
  const x = d + (endOfDay ? "T23:59:59" : "T00:00:00");
  const t = new Date(x);
  return Number.isNaN(t.getTime()) ? null : tsFromDate(t);
}

export function TaskFormModal({
  userId,
  projects,
  task,
  onClose,
}: {
  userId: string;
  projects: Project[];
  task: Task | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [projectId, setProjectId] = useState(task?.projectId ?? "");
  const [workStatus, setWorkStatus] = useState<TaskWorkStatus>(task?.workStatus ?? "todo");
  const [startStr, setStartStr] = useState(
    task?.startDate ? formatDateInput(task.startDate.toDate()) : ""
  );
  const [endStr, setEndStr] = useState(
    task?.endDate ? formatDateInput(task.endDate.toDate()) : ""
  );
  const [dueStr, setDueStr] = useState(
    task?.dueDate ? formatDateInput(task.dueDate.toDate()) : formatDateInput(new Date())
  );
  const [time, setTime] = useState(task?.time ?? "");
  const [reminder, setReminder] = useState<ReminderFrequency>(task?.reminderFrequency ?? "none");
  const [windows, setWindows] = useState<string[]>(() => decodeTimeWindows(task?.timeWindows ?? ""));
  const [priority, setPriority] = useState<TaskPriority>(task?.priority ?? "medium");
  const [saving, setSaving] = useState(false);

  const toggleWindow = (id: string) => {
    setWindows((w) => (w.includes(id) ? w.filter((x) => x !== id) : [...w, id]));
  };

  const save = async () => {
    if (!title.trim()) {
      return;
    }
    setSaving(true);
    try {
      const start = startStr ? toTs(startStr, false) : null;
      const end = endStr ? toTs(endStr, true) : null;
      const due = dueStr ? toTs(dueStr, true) : null;
      const tw = encodeTimeWindows(windows);
      const pid = projectId === "" ? null : projectId;
      if (task) {
        await patchTask(userId, task.id, {
          title: title.trim(),
          description: description || null,
          projectId: pid,
          workStatus,
          startDate: start,
          endDate: end,
          dueDate: due,
          time: time || null,
          reminderFrequency: reminder,
          timeWindows: tw,
          priority,
        });
      } else {
        await createTask(userId, {
          title: title.trim(),
          description: description || undefined,
          projectId: pid,
          workStatus,
          startDate: start,
          endDate: end,
          dueDate: due,
          time: time || null,
          reminderFrequency: reminder,
          timeWindows: tw,
          priority,
        });
      }
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={task ? "Görevi düzenle" : "Yeni görev"}>
      <div className="max-h-[70dvh] space-y-2 overflow-y-auto pr-1">
        <Input id="tt" label="Başlık" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <TextArea
          id="td"
          label="Açıklama"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Proje</p>
          <select
            className="w-full rounded-lg border border-slate-200 px-2 py-2"
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
          >
            <option value="">(Seçiniz)</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Durum</p>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {(["todo", "in_progress", "done", "deferred"] as const).map((s) => (
              <Button
                key={s}
                type="button"
                variant={workStatus === s ? "surface" : "outline"}
                className="!text-xs"
                onClick={() => setWorkStatus(s)}
              >
                {KANBAN_LABELS[s]}
              </Button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Input id="ts" type="date" label="Başlangıç" value={startStr} onChange={(e) => setStartStr(e.target.value)} />
          <Input id="te" type="date" label="Bitiş" value={endStr} onChange={(e) => setEndStr(e.target.value)} />
        </div>
        <Input
          id="tdu"
          type="date"
          label="Gün / vade (günlük planda)"
          value={dueStr}
          onChange={(e) => setDueStr(e.target.value)}
        />
        <Input
          id="tmt"
          type="time"
          label="Saat (isteğe bağlı)"
          value={time}
          onChange={(e) => setTime(e.target.value)}
        />
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Hatırlatma sıklığı</p>
          <select
            className="w-full rounded-lg border border-slate-200 px-2 py-2"
            value={reminder}
            onChange={(e) => setReminder(e.target.value as ReminderFrequency)}
          >
            <option value="none">Yok</option>
            <option value="daily">Günlük</option>
            <option value="weekly">Haftalık</option>
            <option value="monthly">Aylık</option>
            <option value="custom">Özel / not</option>
          </select>
        </div>
        <div>
          <p className="mb-1 text-sm font-medium text-slate-700">Günün pencereleri</p>
          <div className="space-y-1.5">
            {TIME_WINDOW_OPTIONS.map((o) => (
              <label key={o.id} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={windows.includes(o.id)}
                  onChange={() => toggleWindow(o.id)}
                />
                {o.label}
              </label>
            ))}
          </div>
        </div>
        <p className="text-sm font-medium text-slate-700">Öncelik</p>
        <div className="flex gap-2">
          {(["low", "medium", "high"] as const).map((p) => (
            <Button
              key={p}
              type="button"
              variant={priority === p ? "surface" : "ghost"}
              className="flex-1 !text-xs"
              onClick={() => setPriority(p)}
            >
              {p}
            </Button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            İptal
          </Button>
          <Button type="button" onClick={save} disabled={saving || !title.trim()}>
            {saving ? "…" : "Kaydet"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
