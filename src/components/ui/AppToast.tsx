import { useUIStore } from "@/store/useUIStore";

export function AppToast() {
  const toast = useUIStore((s) => s.toast);
  if (!toast) {
    return null;
  }
  return (
    <div
      className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl bg-slate-800 px-4 py-2.5 text-sm text-white shadow-lg"
      role="status"
    >
      {toast}
    </div>
  );
}
