import { useEffect } from "react";
import { refreshAllFromApi } from "@/lib/api/refresh";
import { loadStoredUser } from "@/lib/localAuth";
import { useAuthStore } from "@/store/useAuthStore";
import { useDataStore } from "@/store/useDataStore";

/**
 * Oturumu (yerel depolama) ve Mongo API listelerini yükler; Firestore kullanılmaz.
 */
export function ApiDataBridge() {
  const setAuthReady = useAuthStore((s) => s.setAuthReady);
  const setAuthError = useAuthStore((s) => s.setAuthError);
  const setUser = useAuthStore((s) => s.setUser);
  const setDataLoading = useDataStore((s) => s.setDataLoading);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setAuthError(null);
      const stored = loadStoredUser();
      setUser(stored);
      if (stored) {
        setDataLoading(true);
        try {
          await refreshAllFromApi();
        } catch (e) {
          setAuthError(e instanceof Error ? e.message : "Veri yüklenemedi");
        } finally {
          if (!cancelled) setDataLoading(false);
        }
      } else {
        setDataLoading(false);
      }
      if (!cancelled) setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [setAuthReady, setAuthError, setUser, setDataLoading]);

  return null;
}
