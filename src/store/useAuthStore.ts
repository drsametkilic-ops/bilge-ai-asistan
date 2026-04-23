import { create } from "zustand";
import type { AppUser } from "@/types";

interface AuthState {
  user: AppUser | null;
  idToken: string | null;
  authReady: boolean;
  /** API veya ağ; giriş engellenmez, mesaj gösterilir */
  authError: string | null;
  setUser: (user: AppUser | null) => void;
  setIdToken: (t: string | null) => void;
  setAuthReady: (v: boolean) => void;
  setAuthError: (msg: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  idToken: null,
  authReady: false,
  authError: null,
  setUser: (user) => set({ user }),
  setIdToken: (idToken) => set({ idToken }),
  setAuthReady: (authReady) => set({ authReady }),
  setAuthError: (authError) => set({ authError }),
}));
