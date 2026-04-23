import { API_BASE } from "@/lib/apiBase";
import { useDataStore } from "@/store/useDataStore";
import { mapExpenseFromMongo, mapIdeaFromMongo, mapProjectFromMongo, mapTaskFromMongo } from "./mappers";

async function jsonOrThrow(res: Response) {
  if (!res.ok) {
    throw new Error(await res.text());
  }
  return res.json() as Promise<unknown>;
}

/** Tüm listeleri API’den çek ve store’a yaz */
export async function refreshAllFromApi(): Promise<void> {
  const base = API_BASE;
  const [tasksRaw, financeRaw, projectsRaw, ideasRaw] = await Promise.all([
    jsonOrThrow(await fetch(`${base}/api/tasks`)),
    jsonOrThrow(await fetch(`${base}/api/finance`)),
    jsonOrThrow(await fetch(`${base}/api/projects`)),
    jsonOrThrow(await fetch(`${base}/api/ideas`)),
  ]);

  const tasks = Array.isArray(tasksRaw)
    ? tasksRaw.map((x) => mapTaskFromMongo(x as Parameters<typeof mapTaskFromMongo>[0]))
    : [];
  const expenses = Array.isArray(financeRaw)
    ? financeRaw.map((x) => mapExpenseFromMongo(x as Parameters<typeof mapExpenseFromMongo>[0]))
    : [];
  const projects = Array.isArray(projectsRaw)
    ? projectsRaw.map((x) => mapProjectFromMongo(x as Parameters<typeof mapProjectFromMongo>[0]))
    : [];
  const ideas = Array.isArray(ideasRaw)
    ? ideasRaw.map((x) => mapIdeaFromMongo(x as Parameters<typeof mapIdeaFromMongo>[0]))
    : [];

  useDataStore.getState().setTasks(tasks);
  useDataStore.getState().setExpenses(expenses);
  useDataStore.getState().setProjects(projects);
  useDataStore.getState().setIdeas(ideas);
}
