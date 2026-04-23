import { create } from "zustand";

export type QuickModal = "none" | "task" | "expense" | "both";

interface UIState {
  sidebarOpen: boolean;
  quickOpen: boolean;
  quickMode: QuickModal;
  /** Kısa süreli global bildirim (Bilge işlem sonrası vs.) */
  toast: string | null;
  setSidebarOpen: (v: boolean) => void;
  openQuick: (mode?: QuickModal) => void;
  closeQuick: () => void;
  toggleSidebar: () => void;
  setToast: (msg: string | null) => void;
  showAppToast: (msg: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  sidebarOpen: false,
  quickOpen: false,
  quickMode: "both",
  toast: null,
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  openQuick: (mode = "both") =>
    set({ quickOpen: true, quickMode: mode === "none" ? "both" : mode }),
  closeQuick: () => set({ quickOpen: false, quickMode: "both" }),
  toggleSidebar: () => set({ sidebarOpen: !get().sidebarOpen }),
  setToast: (toast) => set({ toast }),
  showAppToast: (msg) => {
    set({ toast: msg });
    window.setTimeout(() => {
      if (get().toast === msg) {
        set({ toast: null });
      }
    }, 3200);
  },
}));
