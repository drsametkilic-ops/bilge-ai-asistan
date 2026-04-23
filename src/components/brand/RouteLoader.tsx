import { BrandMark } from "./BrandMark";

export function RouteLoader() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-app-bg px-4"
      role="status"
      aria-live="polite"
    >
      <div className="flex flex-col items-center gap-3">
        <BrandMark size="xl" priority title="Bilge AI" className="shadow-md" />
        <p className="text-sm text-slate-500">Bilge AI açılıyor…</p>
      </div>
    </div>
  );
}
