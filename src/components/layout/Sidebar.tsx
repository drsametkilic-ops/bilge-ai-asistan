import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CheckSquare,
  MessageCircle,
  Bell,
  Wallet,
  LogOut,
  Lightbulb,
  CalendarDays,
  FolderKanban,
} from "lucide-react";
import { BilgeLogo } from "@/components/brand/BilgeLogo";
import { Button } from "@/components/ui/Button";
import { logoutUser } from "@/lib/localAuth";
import { useUIStore } from "@/store/useUIStore";
import { useAuthStore } from "@/store/useAuthStore";

const mainLinks = [
  { to: "/", label: "Ana sayfa", icon: LayoutDashboard, end: true },
  { to: "/tasks", label: "Görevler", icon: CheckSquare, end: false },
  { to: "/plan", label: "Günlük plan", icon: CalendarDays, end: false },
  { to: "/finance", label: "Finans", icon: Wallet, end: false },
  { to: "/chat", label: "Bilge", icon: MessageCircle, end: false },
] as const;

const subLinks = [
  { to: "/projects", label: "Projeler", icon: FolderKanban },
  { to: "/ideas", label: "Fikir bankası", icon: Lightbulb },
  { to: "/notifications", label: "Bildirimler", icon: Bell },
] as const;

function clsx(...a: (string | false | undefined)[]) {
  return a.filter(Boolean).join(" ");
}

function NavRow({
  to,
  label,
  icon: Icon,
  end = false,
  onNavigate,
}: {
  to: string;
  label: string;
  icon: (typeof mainLinks)[number]["icon"];
  end?: boolean;
  onNavigate: () => void;
}) {
  return (
    <NavLink to={to} end={end} onClick={onNavigate}>
      {({ isActive }) => (
        <span
          className={clsx(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition duration-200",
            isActive
              ? "bg-primary/12 text-brand-dark ring-1 ring-primary/20"
              : "text-slate-600 hover:bg-slate-100/90"
          )}
        >
          <Icon
            className={clsx(
              "h-[1.15rem] w-[1.15rem] shrink-0 transition duration-200",
              isActive ? "text-primary" : "text-slate-400 group-hover:text-primary"
            )}
            strokeWidth={2}
          />
          {label}
        </span>
      )}
    </NavLink>
  );
}

export function Sidebar() {
  const { user } = useAuthStore();
  const close = () => useUIStore.getState().setSidebarOpen(false);

  return (
    <aside className="flex h-dvh w-[260px] flex-shrink-0 flex-col border-r border-slate-200/90 bg-white px-3 py-5">
      <div className="mb-8 border-b border-slate-100 px-1 pb-6">
        <BilgeLogo size="md" />
        {user && <p className="mt-3 truncate text-sm text-slate-500">{user.email ?? user.displayName}</p>}
      </div>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto" aria-label="Ana menü">
        {mainLinks.map((l) => (
          <NavRow key={l.to} {...l} onNavigate={close} />
        ))}
        <p className="mb-1 mt-6 px-2 text-[0.7rem] font-semibold uppercase tracking-wider text-slate-400">
          Daha fazla
        </p>
        {subLinks.map((l) => (
          <NavRow key={l.to} {...l} onNavigate={close} />
        ))}
      </nav>
      <Button
        variant="outline"
        className="mt-4 w-full justify-center gap-2 rounded-lg border-slate-200"
        onClick={() => {
          void logoutUser();
          close();
        }}
      >
        <LogOut className="h-4 w-4" />
        Çıkış
      </Button>
    </aside>
  );
}
