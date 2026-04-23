import type { ReactNode } from "react";
import { lazy, Suspense, useEffect } from "react";
import { ensureNotificationPermission } from "@/lib/browserNotifications";
import { Routes, Route, Navigate } from "react-router-dom";
import { ApiDataBridge } from "@/providers/ApiDataBridge";
import { AppShell } from "@/components/layout/AppShell";
import { useAuthStore } from "@/store/useAuthStore";
import { RouteLoader } from "@/components/brand/RouteLoader";
import { SplashBlock } from "@/components/brand/SplashBlock";

const LoginPage = lazy(() => import("@/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() => import("@/pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const TasksPage = lazy(() => import("@/pages/TasksPage").then((m) => ({ default: m.TasksPage })));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage").then((m) => ({ default: m.ProjectsPage })));
const FinancePage = lazy(() => import("@/pages/FinancePage").then((m) => ({ default: m.FinancePage })));
const ChatPage = lazy(() => import("@/pages/ChatPage").then((m) => ({ default: m.ChatPage })));
const IdeasPage = lazy(() => import("@/pages/IdeasPage").then((m) => ({ default: m.IdeasPage })));
const DailyPlanPage = lazy(() => import("@/pages/DailyPlanPage").then((m) => ({ default: m.DailyPlanPage })));
const NotificationsPage = lazy(() =>
  import("@/pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage }))
);

function AuthGate({ children }: { children: ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);
  const user = useAuthStore((s) => s.user);
  const authError = useAuthStore((s) => s.authError);
  if (!authReady) {
    return <SplashBlock />;
  }
  if (authError && !user) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-app-bg px-4 text-center">
        <p className="max-w-md text-slate-800">API: {authError}</p>
        <p className="mt-2 text-sm text-slate-500">
          Sunucunun çalıştığından ve <code className="rounded bg-slate-200 px-1">VITE_API_BASE</code> /
          Vite proxy ile API adresinin doğru olduğundan emin olun.
        </p>
      </div>
    );
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function GuestOnly({ children }: { children: ReactNode }) {
  const authReady = useAuthStore((s) => s.authReady);
  const user = useAuthStore((s) => s.user);
  if (!authReady) {
    return <SplashBlock />;
  }
  if (user) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  useEffect(() => {
    ensureNotificationPermission();
  }, []);

  return (
    <>
      <ApiDataBridge />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          <Route
            path="/login"
            element={
              <GuestOnly>
                <LoginPage />
              </GuestOnly>
            }
          />
          <Route
            element={
              <AuthGate>
                <AppShell />
              </AuthGate>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="tasks" element={<TasksPage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="ideas" element={<IdeasPage />} />
            <Route path="plan" element={<DailyPlanPage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  );
}
