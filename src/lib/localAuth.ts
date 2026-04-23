import { refreshAllFromApi } from "@/lib/api/refresh";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";
import type { AppUser } from "@/types";

const STORAGE_KEY = "bilge_local_user_v1";

export function loadStoredUser(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as Partial<AppUser>;
    if (j && typeof j.uid === "string") {
      return {
        uid: j.uid,
        email: j.email ?? null,
        displayName: j.displayName ?? null,
        photoURL: j.photoURL ?? null,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function persist(user: AppUser | null) {
  if (!user) localStorage.removeItem(STORAGE_KEY);
  else localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

async function establishSession(user: AppUser) {
  persist(user);
  useAuthStore.getState().setUser(user);
  useAuthStore.getState().setIdToken(null);
  useAuthStore.getState().setAuthError(null);
  useDataStore.getState().setDataLoading(true);
  await refreshAllFromApi();
  useDataStore.getState().setDataLoading(false);
}

/** Demo: Firebase olmadan oturum — tarayıcıda saklanır; API ile aynı Mongo verisini kullanır. */
export async function loginWithGoogle(): Promise<void> {
  await establishSession({
    uid: "local-google",
    email: null,
    displayName: "Google kullanıcısı",
    photoURL: null,
  });
}

export async function loginEmailPassword(email: string, password: string): Promise<void> {
  const e = email.trim();
  if (!e) throw new Error("E-posta gerekli.");
  if (!password.length) throw new Error("Şifre gerekli.");
  await establishSession({
    uid: `local-${e}`,
    email: e,
    displayName: e.includes("@") ? e.split("@")[0] ?? e : e,
    photoURL: null,
  });
}

export async function registerEmailPassword(email: string, password: string): Promise<void> {
  if (password.length < 6) throw new Error("Şifre en az 6 karakter olmalı.");
  return loginEmailPassword(email, password);
}

export async function logoutUser(): Promise<void> {
  persist(null);
  useAuthStore.getState().setUser(null);
  useAuthStore.getState().setIdToken(null);
  useDataStore.getState().reset();
  useDataStore.getState().setDataLoading(false);
}
