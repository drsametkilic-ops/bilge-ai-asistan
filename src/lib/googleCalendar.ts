/** Google Takvim “şablon” bağlantısı (tek etkinlik) */

function fmtGoogleLocal(d: Date): string {
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}${m}${day}T${h}${min}${s}`;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/**
 * @param dateStr YYYY-MM-DD
 * @param timeStr HH:mm veya boş (gün ortası varsayılır)
 */
export function googleCalendarTaskUrl(title: string, dateStr: string, timeStr: string | null): string {
  const safeTitle = encodeURIComponent(title.slice(0, 500));
  const startBase = `${dateStr}T${timeStr && /^\d{1,2}:\d{2}/.test(timeStr) ? timeStr.slice(0, 5) : "10:00"}:00`;
  const start = new Date(startBase);
  if (Number.isNaN(start.getTime())) {
    const fallback = new Date(`${dateStr}T12:00:00`);
    const end = new Date(fallback.getTime() + 60 * 60 * 1000);
    const dates = `${fmtGoogleLocal(fallback)}/${fmtGoogleLocal(end)}`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${safeTitle}&dates=${dates}`;
  }
  const end = new Date(start.getTime() + 60 * 60 * 1000);
  const dates = `${fmtGoogleLocal(start)}/${fmtGoogleLocal(end)}`;
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${safeTitle}&dates=${dates}`;
}
