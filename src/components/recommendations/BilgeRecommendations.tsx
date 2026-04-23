import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import {
  Calendar,
  ChevronRight,
  FolderKanban,
  Lightbulb,
  ListTodo,
  Sparkles,
  Wallet,
} from "lucide-react";
import { fetchRecommendations, type RecommendationUserData } from "@/lib/recommendationApi";
import { filterFreshSuggestions, markSuggestionShown } from "@/lib/recommendationShown";
import type { BilgeSuggestion, Expense, Project, Task } from "@/types";

function buildPayload(
  tasks: Task[],
  expenses: Expense[],
  projects: Project[]
): RecommendationUserData {
  return {
    userActive: typeof document !== "undefined" ? !document.hidden : true,
    localDate: format(new Date(), "yyyy-MM-dd"),
    tasks: tasks.map((t) => ({
      id: t.id,
      workStatus: t.workStatus,
      status: t.status,
      projectId: t.projectId,
      dueDate: t.dueDate ? t.dueDate.toDate().toISOString() : null,
    })),
    expenses: expenses.map((e) => ({
      type: e.type,
      amount: e.amount,
      date: e.date.toDate().toISOString(),
    })),
    projects: projects.map((p) => ({ id: p.id, title: p.title })),
  };
}

function SuggestionIcon({ type }: { type: string }) {
  const c = "h-4 w-4 shrink-0 text-amber-600/90";
  if (type === "plan") {
    return <Calendar className={c} strokeWidth={2} />;
  }
  if (type === "task") {
    return <ListTodo className={c} strokeWidth={2} />;
  }
  if (type === "project") {
    return <FolderKanban className={c} strokeWidth={2} />;
  }
  if (type === "finance") {
    return <Wallet className={c} strokeWidth={2} />;
  }
  if (type === "insight") {
    return <Sparkles className={c} strokeWidth={2} />;
  }
  return <Lightbulb className={c} strokeWidth={2} />;
}

const POLL_MS = 30_000;

export function BilgeRecommendations({
  tasks,
  expenses,
  projects,
  dataLoading,
}: {
  tasks: Task[];
  expenses: Expense[];
  projects: Project[];
  dataLoading: boolean;
}) {
  const navigate = useNavigate();
  const [items, setItems] = useState<BilgeSuggestion[]>([]);
  const [loadFailed, setLoadFailed] = useState(false);
  const [initialDone, setInitialDone] = useState(false);
  const inFlight = useRef(false);
  const dataRef = useRef({ tasks, expenses, projects });
  dataRef.current = { tasks, expenses, projects };

  const runFetch = useCallback(async () => {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    try {
      const { tasks: t, expenses: e, projects: p } = dataRef.current;
      const body = buildPayload(t, e, p);
      body.userActive = !document.hidden;
      const res = await fetchRecommendations(body, true);
      setItems(filterFreshSuggestions(res.suggestions));
      setLoadFailed(false);
    } catch {
      setLoadFailed(true);
      setItems([]);
    } finally {
      inFlight.current = false;
      setInitialDone(true);
    }
  }, []);

  const dataSig = useMemo(
    () =>
      [
        tasks.length,
        expenses.length,
        projects.length,
        ...tasks.map((t) => `${t.id}:${t.workStatus}:${t.dueDate?.toMillis() ?? 0}:${t.projectId ?? ""}`),
        ...expenses.map((e) => `${e.id}:${e.type}:${e.amount}:${e.date.toMillis()}`),
        ...projects.map((p) => p.id),
      ].join("|"),
    [tasks, expenses, projects]
  );

  useEffect(() => {
    if (dataLoading) {
      return;
    }
    void runFetch();
  }, [dataLoading, runFetch, dataSig]);

  useEffect(() => {
    if (dataLoading) {
      return;
    }
    const id = window.setInterval(() => {
      if (document.hidden) {
        return;
      }
      void runFetch();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [dataLoading, runFetch]);

  const onCardClick = (s: BilgeSuggestion) => {
    markSuggestionShown(s.id);
    if (s.target) {
      navigate(s.target);
    } else {
      navigate("/chat");
    }
  };

  if (dataLoading) {
    return null;
  }
  if (loadFailed || (initialDone && items.length === 0)) {
    return null;
  }
  if (!initialDone) {
    return null;
  }

  return (
    <section className="space-y-3" aria-labelledby="bilge-suggest-heading">
      <div className="flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-primary" strokeWidth={2} />
        <h2 id="bilge-suggest-heading" className="text-lg font-semibold text-brand-dark">
          Bilge öneriyor
        </h2>
      </div>
      <ul className="m-0 grid list-none gap-2.5 p-0 sm:grid-cols-2">
        {items.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onCardClick(s)}
              className="group flex w-full items-start gap-3 rounded-xl border border-slate-200/60 bg-slate-100/90 px-4 py-3.5 text-left text-sm text-slate-800 shadow-sm transition duration-200 hover:border-slate-200 hover:bg-slate-100 hover:shadow-md"
            >
              <span className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white/90 shadow-sm ring-1 ring-slate-200/50">
                <SuggestionIcon type={s.type} />
              </span>
              <span className="min-w-0 flex-1 leading-relaxed">{s.text}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-slate-600" />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
