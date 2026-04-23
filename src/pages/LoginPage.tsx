import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BRAND_IMAGES } from "@/lib/brandAssets";
import { loginWithGoogle, loginEmailPassword, registerEmailPassword } from "@/lib/localAuth";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState<false | "google" | "email" | "reg">(false);

  const onGoogle = async () => {
    setErr("");
    setLoading("google");
    try {
      await loginWithGoogle();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const onEmail = async () => {
    setErr("");
    setLoading("email");
    try {
      await loginEmailPassword(email.trim(), password);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Giriş başarısız");
    } finally {
      setLoading(false);
    }
  };

  const onRegister = async () => {
    setErr("");
    if (password.length < 6) {
      setErr("Şifre en az 6 karakter olmalı.");
      return;
    }
    setLoading("reg");
    try {
      await registerEmailPassword(email.trim(), password);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Kayıt başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-gradient-to-b from-amber-50/60 to-slate-100">
      <div className="mx-auto grid min-h-dvh max-w-5xl items-stretch gap-0 lg:grid-cols-2">
        <div className="relative flex flex-col items-center justify-end bg-gradient-to-b from-slate-950 to-black px-4 pb-6 pt-8 lg:justify-center lg:pb-0 lg:pt-0">
          <img
            src={BRAND_IMAGES.heroWelcome}
            width={720}
            height={480}
            alt="Bilge AI asistan"
            className="h-auto max-h-[min(38vh,280px)] w-full max-w-md object-contain object-bottom lg:max-h-[min(70vh,560px)] lg:object-center"
            decoding="async"
            fetchPriority="high"
          />
        </div>
        <div className="flex items-center justify-center px-4 pb-10 pt-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200/80 bg-white/95 p-7 shadow-md backdrop-blur sm:p-8">
            <h1 className="text-center text-lg font-bold text-brand-dark">Giriş</h1>
            <p className="mb-6 text-center text-sm text-slate-500">Görev, finans ve yapay zekâ asistanı</p>
            {err && (
              <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>
            )}
            <Button className="w-full" onClick={onGoogle} disabled={!!loading}>
              {loading === "google" ? "…" : "Google ile devam et"}
            </Button>
            <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
              <span className="h-px flex-1 bg-slate-200" />
              veya e-posta
              <span className="h-px flex-1 bg-slate-200" />
            </div>
            <div className="space-y-3">
              <Input
                id="em"
                type="email"
                autoComplete="email"
                label="E-posta"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                id="pw"
                type="password"
                autoComplete="current-password"
                label="Şifre"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                variant="surface"
                className="flex-1"
                onClick={onEmail}
                disabled={!!loading}
              >
                {loading === "email" ? "…" : "Giriş"}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={onRegister}
                disabled={!!loading}
              >
                {loading === "reg" ? "…" : "Kayıt ol"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
