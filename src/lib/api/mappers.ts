import type { Task, Expense, Project, Idea, TaskWorkStatus, IdeaPriority } from "@/types";
import { tsFromMongoDate, tsFromDate } from "@/lib/appTimestamp";

type MongoTask = {
  _id: string;
  title: string;
  date?: string;
  time?: string;
  description?: string;
  completed?: boolean;
  createdAt?: string;
};

type MongoFinance = {
  _id: string;
  amount: number;
  type: "income" | "expense";
  date?: string;
  note?: string;
  createdAt?: string;
};

type MongoProject = {
  _id: string;
  name: string;
  description?: string;
  workStatus?: TaskWorkStatus;
  color?: string;
  createdAt?: string;
};

type MongoIdea = {
  _id: string;
  title: string;
  description?: string;
  priority?: string;
  projectId?: string | null;
  color?: string;
  createdAt?: string;
};

function workStatusFromTask(m: MongoTask): TaskWorkStatus {
  return m.completed ? "done" : "todo";
}

export function mapTaskFromMongo(m: MongoTask): Task {
  const due = m.date ? tsFromMongoDate(m.date) : null;
  const created = m.createdAt
    ? tsFromMongoDate(m.createdAt) ?? tsFromDate(new Date())
    : tsFromDate(new Date());

  return {
    id: String(m._id),
    title: m.title,
    description: m.description ?? "",
    projectId: null,
    workStatus: workStatusFromTask(m),
    status: undefined,
    startDate: null,
    endDate: null,
    dueDate: due,
    time: m.time && m.time.trim() ? m.time : null,
    reminderFrequency: "none",
    timeWindows: "",
    priority: "medium",
    createdAt: created,
    updatedAt: created,
  };
}

export function mapExpenseFromMongo(m: MongoFinance): Expense {
  const date = m.date ? tsFromMongoDate(m.date) ?? tsFromDate(new Date()) : tsFromDate(new Date());
  const created = m.createdAt
    ? tsFromMongoDate(m.createdAt) ?? tsFromDate(new Date())
    : tsFromDate(new Date());
  const note = m.note ?? "";

  return {
    id: String(m._id),
    type: m.type,
    amount: m.amount,
    category: "genel",
    description: note,
    date,
    name: note,
    createdAt: created,
    updatedAt: created,
  };
}

export function mapProjectFromMongo(m: MongoProject): Project {
  const created = m.createdAt
    ? tsFromMongoDate(m.createdAt) ?? tsFromDate(new Date())
    : tsFromDate(new Date());
  const ws: TaskWorkStatus = m.workStatus ?? "todo";

  return {
    id: String(m._id),
    title: m.name,
    description: m.description ?? "",
    workStatus: ws,
    color: m.color ?? "#64748b",
    createdAt: created,
    updatedAt: created,
  };
}

function ideaPriority(p?: string): IdeaPriority {
  if (p === "low" || p === "medium" || p === "high") return p;
  return "medium";
}

export function mapIdeaFromMongo(m: MongoIdea): Idea {
  const created = m.createdAt
    ? tsFromMongoDate(m.createdAt) ?? tsFromDate(new Date())
    : tsFromDate(new Date());

  return {
    id: String(m._id),
    title: m.title,
    projectId: m.projectId != null && m.projectId !== "" ? m.projectId : null,
    notes: m.description ?? "",
    priority: ideaPriority(m.priority),
    color: m.color ?? "#eab308",
    createdAt: created,
    updatedAt: created,
  };
}
