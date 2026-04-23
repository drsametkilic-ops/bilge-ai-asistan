import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Pencil, Trash2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import { removeIdea } from "@/lib/mutations/ideas";
import { IdeaFormModal, IDEA_PRIO_TR } from "@/components/ideas/IdeaFormModal";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import type { Idea, IdeaPriority } from "@/types";

type IdeaFilter = { q: string; projectId: string; priority: IdeaPriority | "all" };

function fieldClass() {
  return "w-full min-w-0 rounded-lg border border-slate-200/90 bg-white px-3 py-2 text-sm text-slate-800 shadow-sm transition duration-200 placeholder:text-slate-400 focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/20";
}

export function IdeasPage() {
  const user = useAuthStore((s) => s.user);
  const { ideas, projects, dataLoading } = useDataStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [modal, setModal] = useState<Idea | "new" | null>(null);
  const [f, setF] = useState<IdeaFilter>({ q: "", projectId: "all", priority: "all" });

  useEffect(() => {
    const st = location.state as { openIdea?: boolean } | null;
    if (st?.openIdea) {
      setModal("new");
      navigate(".", { replace: true, state: {} });
    }
  }, [location, navigate]);

  const pMap = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);

  const filtered = useMemo(() => {
    return ideas.filter((i) => {
      if (f.q.trim()) {
        const q = f.q.toLowerCase();
        if (!i.title.toLowerCase().includes(q) && !i.notes.toLowerCase().includes(q)) {
          return false;
        }
      }
      if (f.projectId !== "all" && i.projectId !== f.projectId) {
        return false;
      }
      if (f.priority !== "all" && i.priority !== f.priority) {
        return false;
      }
      return true;
    });
  }, [ideas, f]);

  if (!user) {
    return null;
  }
  if (dataLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-brand-dark">Fikir bankası</h2>
          <p className="max-w-xl text-sm text-slate-500">
            Renkli notlar, proje bağlantısı ve önem. Kartları düzenleyin veya silin; filtrelerle hızlıca
            bulun.
          </p>
        </div>
        <Button
          type="button"
          onClick={() => setModal("new")}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 sm:w-auto"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Fikir ekle
        </Button>
      </div>

      <div className="grid gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500" htmlFor="id-q">
            Ara
          </label>
          <input
            id="id-q"
            className={fieldClass()}
            value={f.q}
            onChange={(e) => setF((x) => ({ ...x, q: e.target.value }))}
            placeholder="Fikir veya not…"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500" htmlFor="id-pj">
            Proje
          </label>
          <select
            id="id-pj"
            className={fieldClass()}
            value={f.projectId}
            onChange={(e) => setF((x) => ({ ...x, projectId: e.target.value }))}
          >
            <option value="all">Tüm projeler</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-500" htmlFor="id-pr">
            Önem
          </label>
          <select
            id="id-pr"
            className={fieldClass()}
            value={f.priority}
            onChange={(e) =>
              setF((x) => ({ ...x, priority: e.target.value as IdeaFilter["priority"] }))
            }
          >
            <option value="all">Tümü</option>
            <option value="low">Düşük</option>
            <option value="medium">Orta</option>
            <option value="high">Yüksek</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 py-16 text-center">
          <StickyNote className="mb-3 h-10 w-10 text-slate-300" />
          <p className="text-slate-500">Henüz fikir yok veya filtreye uygun sonuç yok.</p>
        </div>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((i) => {
            const accent = i.color || "#F59E0B";
            return (
              <li
                key={i.id}
                className="break-inside-avoid rounded-xl border border-slate-200/60 bg-white shadow-sm transition duration-200 hover:shadow-md"
                style={{
                  boxShadow: `inset 4px 0 0 0 ${accent}`,
                }}
              >
                <div
                  className="min-h-[120px] p-4 pl-5"
                  style={{ background: `linear-gradient(135deg, ${accent}12 0%, #fff 42%)` }}
                >
                  <p className="font-semibold text-brand-dark">{i.title}</p>
                  {i.projectId && pMap.get(i.projectId) && (
                    <p
                      className="mt-1 text-xs font-medium"
                      style={{ color: pMap.get(i.projectId)!.color || "#64748b" }}
                    >
                      {pMap.get(i.projectId)!.title}
                    </p>
                  )}
                  <p className="mt-2 line-clamp-4 text-sm leading-relaxed text-slate-600">
                    {i.notes || " "}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-500">
                    Önem: {IDEA_PRIO_TR[i.priority] ?? i.priority}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      className="!h-8 !px-2 !text-xs"
                      onClick={() => setModal(i)}
                    >
                      <Pencil className="mr-1 h-3.5 w-3.5" />
                      Düzenle
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      className="!h-8 !px-2 !text-xs text-red-600 hover:bg-red-50"
                      onClick={() => {
                        if (confirm("Bu fikir silinsin mi?")) {
                          void removeIdea(user.uid, i.id);
                        }
                      }}
                    >
                      <Trash2 className="mr-1 h-3.5 w-3.5" />
                      Sil
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modal && (
        <IdeaFormModal
          userId={user.uid}
          projects={projects}
          idea={modal === "new" ? null : modal}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
