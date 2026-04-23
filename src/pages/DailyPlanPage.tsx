import { useState } from "react";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { DailyPlan } from "@/components/plan/DailyPlan";
import { TaskFormModal } from "@/components/task/TaskFormModal";
import { removeTask } from "@/lib/mutations/tasks";
import type { Task } from "@/types";

export function DailyPlanPage() {
  const user = useAuthStore((s) => s.user);
  const { tasks, projects, dataLoading } = useDataStore();
  const [editTask, setEditTask] = useState<Task | null>(null);

  if (!user) {
    return null;
  }
  if (dataLoading) {
    return <p className="text-slate-500">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-2">
      <p className="text-slate-600">
        Görevleriniz, vade günü ve saate göre kronolojik zaman çizelgesi. Düzenle ve sil buradan
        da yapılabilir.
      </p>
      <DailyPlan
        title="Günlük plan"
        tasks={tasks}
        onEdit={(t) => setEditTask(t)}
        onDelete={(t) => {
          if (confirm("Görev silinsin mi?")) {
            void removeTask(user.uid, t.id);
          }
        }}
      />
      {editTask && (
        <TaskFormModal userId={user.uid} projects={projects} task={editTask} onClose={() => setEditTask(null)} />
      )}
    </div>
  );
}
