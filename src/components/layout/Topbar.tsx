import { Menu } from "lucide-react";
import { useUIStore } from "@/store/useUIStore";

export function Topbar({ title }: { title: string }) {
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  return (
    <header className="sticky top-0 z-40 flex items-center gap-3 border-b border-slate-200/80 bg-app-bg/90 px-4 py-3.5 backdrop-blur-md transition duration-200 md:px-6">
      <button
        type="button"
        className="inline-flex rounded-lg p-2 text-slate-700 transition duration-200 hover:bg-slate-200/60 md:hidden"
        onClick={toggleSidebar}
        aria-label="Menüyü aç"
      >
        <Menu className="h-6 w-6" />
      </button>
      <h1 className="text-lg font-semibold tracking-tight text-brand-dark md:text-xl">{title}</h1>
    </header>
  );
}
