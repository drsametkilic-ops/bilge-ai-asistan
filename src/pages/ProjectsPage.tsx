import { useMemo, useState, useCallback } from "react";
import { Trash2, Pencil, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { removeProject, patchProject } from "@/lib/mutations/projects";
import { WorkBoard } from "@/components/kanban/WorkBoard";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import type { Project, TaskWorkStatus } from "@/types";
import { KANBAN_LABELS, KANBAN_STATUSES } from "@/types";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export function ProjectsPage() {
  const user = useAuthStore((s) => s.user);
  const { projects, dataLoading } = useDataStore();
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskWorkStatus | "all">("all");
  const [edit, setEdit] = useState<Project | "new" | null>(null);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (q.trim()) {
        const n = q.toLowerCase();
        if (
          !p.title.toLowerCase().includes(n) &&
          !(p.description && p.description.toLowerCase().includes(n))
        ) {
          return false;
        }
      }
      if (statusFilter !== "all" && p.workStatus !== statusFilter) {
        return false;
      }
      return true;
    });
  }, [projects, q, statusFilter]);

  const onStatus = useCallback(
    (id: string, status: TaskWorkStatus) => {
      if (!user) {
        return;
      }
      void patchProject(user.uid, id, { workStatus: status });
    },
    [user]
  );

  if (!user) {
    return null;
  }
  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-2">
      <p className="text-slate-600">
        Projeler dört aşamada; kutuları sürükleyip bırakın. Düzenlerken <strong>renk</strong> atayın; kart
        sol çizgide bu renkte görünür.
      </p>
      <WorkBoard<Project>
        title="Projeler"
        addLabel="Proje ekle"
        onAdd={() => setEdit("new")}
        items={filtered}
        onPatchStatus={onStatus}
        filterSlot={
          <div className="mb-1 flex flex-wrap items-end gap-3 rounded-xl border border-slate-200/80 bg-white p-4 text-sm shadow-sm">
            <div className="min-w-[160px]">
              <label className="mb-1 block text-slate-600" htmlFor="p-q">
                Ara
              </label>
              <input
                id="p-q"
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Proje adı veya açıklama…"
              />
            </div>
            <div>
              <label className="mb-1 block text-slate-600" htmlFor="p-st">
                Durum
              </label>
              <select
                id="p-st"
                className="rounded-lg border border-slate-200 px-2 py-1.5"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as TaskWorkStatus | "all")}
              >
                <option value="all">Tümü</option>
                {KANBAN_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {KANBAN_LABELS[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        }
        renderCard={(p) => (
          <Card
            className="!bg-slate-50/95 !p-3 !shadow-sm"
            style={{ borderLeft: `4px solid ${p.color || "#94a3b8"}` }}
          >
            <div className="flex gap-1">
              <span className="pt-0.5 text-slate-400" aria-hidden>
                <GripVertical className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-slate-900">{p.title}</p>
                {p.description && (
                  <p className="line-clamp-2 text-xs text-slate-600">{p.description}</p>
                )}
                <p className="text-xs text-slate-500">{KANBAN_LABELS[p.workStatus]}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  className="!p-1.5"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEdit(p);
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
                    if (confirm("Projeyi silmek istiyor musun?")) {
                      void removeProject(user.uid, p.id);
                    }
                  }}
                  title="Sil"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </Card>
        )}
      />

      {edit && (
        <ProjectFormModal
          userId={user.uid}
          project={edit === "new" ? null : edit}
          onClose={() => setEdit(null)}
        />
      )}
    </div>
  );
}
