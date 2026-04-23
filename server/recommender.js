/**
 * Akıllı öneri: çoğunluk kural tabanlı; isteğe bağlı 1x gpt-4o-mini
 * Girdi: { tasks, expenses, projects, userActive, completedTaskCount? }
 * Çıkış: { suggestions: [{ id, text, type, target? }] }
 */

const PENDING = new Set(["todo", "in_progress", "deferred"]);

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function toDayKey(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString().slice(0, 10);
}

function isOpen(t) {
  if (!t) {
    return false;
  }
  if (PENDING.has(t.workStatus)) {
    return true;
  }
  if (t.status === "open") {
    return true;
  }
  return false;
}

function isDone(t) {
  return t.workStatus === "done" || t.status === "done";
}

function getAnchorDate(userData) {
  if (
    userData &&
    typeof userData.localDate === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(userData.localDate)
  ) {
    return startOfDay(new Date(userData.localDate + "T12:00:00"));
  }
  return startOfDay(new Date());
}

function isSameDayAs(iso, dayStart) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) {
    return false;
  }
  return startOfDay(t).getTime() === startOfDay(dayStart).getTime();
}

function isTomorrowDay(iso, userData) {
  const anchor = getAnchorDate(userData);
  return isSameDayAs(iso, addDays(anchor, 1));
}

function isBeforeToday(iso, userData) {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) {
    return false;
  }
  return t.getTime() < getAnchorDate(userData).getTime();
}

function countData(userData) {
  const t = (userData.tasks || []).length;
  const e = (userData.expenses || []).length;
  const p = (userData.projects || []).length;
  return t + e + p;
}

/**
 * @param {any} userData
 */
function getRuleSuggestions(userData) {
  /** @type {Array<{ id: string, text: string, type: string, target: string }>} */
  const out = [];
  const tasks = Array.isArray(userData.tasks) ? userData.tasks : [];
  const open = tasks.filter(isOpen);
  const withDue = open.filter((t) => t.dueDate);

  const hasTomorrow = withDue.some((t) => isTomorrowDay(t.dueDate, userData));
  if (!hasTomorrow) {
    out.push({
      id: "plan_tomorrow",
      text: "Yarın için plan yapmak ister misin?",
      type: "plan",
      target: "/plan",
    });
  }

  const overdue = withDue.some((t) => isBeforeToday(t.dueDate, userData) && isOpen(t));
  if (overdue) {
    out.push({
      id: "task_overdue",
      text: "Tamamlanmamış ve gecikmiş görevlerin var.",
      type: "task",
      target: "/tasks",
    });
  }

  const unassigned = open.some((t) => !t.projectId || t.projectId === "");
  if (unassigned) {
    out.push({
      id: "link_project",
      text: "Görevlerini projelere bağlamak ister misin?",
      type: "project",
      target: "/tasks",
    });
  }

  const expenses = Array.isArray(userData.expenses) ? userData.expenses : [];
  const exOnly = expenses.filter((e) => e.type === "expense");
  const byDay = {};
  const windowStart = addDays(startOfDay(new Date()), -30);
  for (const e of exOnly) {
    if (!e.date) {
      continue;
    }
    const dk = toDayKey(e.date);
    if (!dk) {
      continue;
    }
    if (new Date(dk + "T12:00:00") < windowStart) {
      continue;
    }
    byDay[dk] = (byDay[dk] || 0) + Math.abs(Number(e.amount) || 0);
  }
  const dayTotals = Object.values(byDay);
  if (dayTotals.length >= 2) {
    const mean = dayTotals.reduce((a, b) => a + b, 0) / dayTotals.length;
    const todayK = typeof userData.localDate === "string" && userData.localDate.length === 10
      ? userData.localDate
      : toDayKey(new Date().toISOString());
    const tDay = byDay[todayK] || 0;
    if (tDay > 0 && mean > 0 && tDay > mean * 1.2) {
      out.push({
        id: "spend_spike",
        text: "Bugün harcamaların normalden yüksek.",
        type: "finance",
        target: "/finance",
      });
    }
  }

  return out;
}

/**
 * @param {any} userData
 * @param {import("openai").default} openai
 */
export async function getOptionalAiSuggestion(userData, openai) {
  if (countData(userData) < 10) {
    return null;
  }
  if (!userData.userActive) {
    return null;
  }
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  const summary = {
    taskCount: (userData.tasks || []).length,
    projectCount: (userData.projects || []).length,
    expenseCount: (userData.expenses || []).length,
    openTasks: (userData.tasks || []).filter(isOpen).length,
    doneTasks: (userData.tasks || []).filter(isDone).length,
  };

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    max_tokens: 80,
    messages: [
      {
        role: "system",
        content:
          "Kullanıcının kısa görev ve finans verilerine göre yalnızca TEK kısa Türkçe öneri cümlesi yaz. Başka metin, tırnak veya JSON ekleme.",
      },
      {
        role: "user",
        content: JSON.stringify(summary),
      },
    ],
  });
  const raw = completion.choices[0]?.message?.content;
  if (!raw || !String(raw).trim()) {
    return null;
  }
  return String(raw)
    .trim()
    .replace(/^["'"]|["'"]$/g, "")
    .slice(0, 200);
}

/**
 * @param {any} userData
 * @param {object} opts
 * @param {import("openai").default} [opts.openai]
 * @param {boolean} [opts.useAi] — AI öneri denensin mi
 */
export async function getRecommendations(userData, opts = {}) {
  const { openai, useAi = true } = opts;
  const rules = getRuleSuggestions(userData);
  const suggestions = rules.map((s) => ({ ...s }));

  if (useAi && openai) {
    try {
      const ai = await getOptionalAiSuggestion(userData, openai);
      if (ai) {
        suggestions.push({
          id: "ai_insight",
          text: ai,
          type: "insight",
          target: "/chat",
        });
      }
    } catch (e) {
      console.error("[recommender] AI öneri atlandı:", e?.message || e);
    }
  }

  return { suggestions };
}

export { getRuleSuggestions, countData };
