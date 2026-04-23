import { useEffect } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { MessageCircle } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { QuickAddFAB } from "@/components/QuickAddFAB";
import { QuickAddModal } from "@/components/QuickAddModal";
import { AppToast } from "@/components/ui/AppToast";
import { useUIStore } from "@/store/useUIStore";

const titles: Record<string, string> = {
  "/": "Ana sayfa",
  "/tasks": "Görevler",
  "/projects": "Projeler",
  "/ideas": "Fikir bankası",
  "/plan": "Günlük plan",
  "/finance": "Finans",
  "/chat": "Bilge",
  "/notifications": "Bildirimler",
};

export function AppShell() {
  const { pathname: path } = useLocation();
  const title = titles[path] ?? "Bilge AI";
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const setSidebarOpen = useUIStore((s) => s.setSidebarOpen);

  useEffect(() => {
    if (window.innerWidth >= 900) setSidebarOpen(false);
  }, [path, setSidebarOpen]);

  return (
    <div className="flex h-dvh w-full min-w-0 max-w-full overflow-hidden bg-app-bg">
      <div
        className={`fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-[2px] transition md:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden
      />
      {/* Masaüstü: her zaman sola yapışık, sabit; mobil: çekmece + kaydırma */}
      <div
        className={`fixed left-0 top-0 z-50 h-dvh w-[260px] flex-shrink-0 bg-white shadow-sm transition-transform duration-200 ease-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:shadow-none`}
      >
        <Sidebar />
      </div>
      <div className="relative z-10 flex min-w-0 flex-1 flex-col pl-0 md:pl-[260px] h-dvh min-h-0 max-w-full overflow-hidden">
        <Topbar title={title} />
        <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
          <div className="mx-auto w-full max-w-5xl px-4 py-8 md:px-8">
            <Outlet />
          </div>
        </div>
        <QuickAddFAB />
        <QuickAddModal />
        <AppToast />
        <Link
          to="/chat"
          className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-slate-900 shadow-lg transition hover:opacity-90 md:bottom-6 md:right-6 lg:hidden"
          aria-label="Bilge sohbet"
        >
          <MessageCircle className="h-6 w-6" strokeWidth={2} />
        </Link>
      </div>
    </div>
  );
}
