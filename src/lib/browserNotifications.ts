/** Tarayıcı bildirimleri — görev oluşturma ve hatırlatma */

const scheduled = new Map<string, number>();

export function ensureNotificationPermission(): void {
  if (typeof Notification === "undefined") return;
  if (Notification.permission === "default") {
    void Notification.requestPermission();
  }
}

export function notifyTaskCreated(title: string): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification("Yeni görev", { body: title.slice(0, 200) });
  } catch {
    /* ignore */
  }
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** YYYY-MM-DD + HH:mm (veya boş) → yerel zamanlayıcı */
export function scheduleTaskReminder(
  taskId: string,
  title: string,
  dateStr: string,
  timeStr: string
): void {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;

  const prev = scheduled.get(taskId);
  if (prev !== undefined) window.clearTimeout(prev);

  const timePart = timeStr && /^\d{1,2}:\d{2}/.test(timeStr) ? timeStr.slice(0, 5) : "09:00";
  const [hh, mm] = timePart.split(":").map((x) => Number.parseInt(x, 10));
  const when = new Date(`${dateStr}T${pad(hh)}:${pad(mm)}:00`);
  const ms = when.getTime() - Date.now();
  if (Number.isNaN(ms) || ms <= 0 || ms > 86400000 * 370) return;

  const id = window.setTimeout(() => {
    try {
      new Notification("Görev zamanı!", { body: title.slice(0, 200) });
    } catch {
      /* ignore */
    }
    scheduled.delete(taskId);
  }, ms);
  scheduled.set(taskId, id);
}
