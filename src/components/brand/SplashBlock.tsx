import { BrandMark } from "./BrandMark";

/**
 * Hafif tam ekran — auth veya uygulama eşlemesi
 */
export function SplashBlock() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-2 bg-app-bg"
      role="status"
    >
      <BrandMark size="lg" title="Bilge AI" className="opacity-95" priority />
      <p className="text-sm text-slate-400">Yükleniyor…</p>
    </div>
  );
}
