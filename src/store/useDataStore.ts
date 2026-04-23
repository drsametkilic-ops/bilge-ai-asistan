import { create } from "zustand";
import type { Task, Expense, Project, Idea } from "@/types";

interface DataState {
  tasks: Task[];
  expenses: Expense[];
  projects: Project[];
  ideas: Idea[];
  dataLoading: boolean;
  setTasks: (t: Task[]) => void;
  setExpenses: (e: Expense[]) => void;
  setProjects: (p: Project[]) => void;
  setIdeas: (i: Idea[]) => void;
  setDataLoading: (v: boolean) => void;
  reset: () => void;
}

export const useDataStore = create<DataState>((set) => ({
  tasks: [],
  expenses: [],
  projects: [],
  ideas: [],
  dataLoading: true,
  setTasks: (tasks) => set({ tasks }),
  setExpenses: (expenses) => set({ expenses }),
  setProjects: (projects) => set({ projects }),
  setIdeas: (ideas) => set({ ideas }),
  setDataLoading: (dataLoading) => set({ dataLoading }),
  reset: () =>
    set({ tasks: [], expenses: [], projects: [], ideas: [], dataLoading: true }),
}));
