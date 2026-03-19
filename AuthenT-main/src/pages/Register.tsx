import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../store/auth";
import { AnimatedSection } from "../components/AnimatedSection";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      await register(email, displayName, password);
      nav("/");
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Kayıt hatası");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatedSection>
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl2 border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold">Kayıt</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Yeni kullanıcılar “user” rolü ile oluşturulur.
          </p>

          <form onSubmit={submit} className="mt-5 flex flex-col gap-3">
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
              placeholder="Görünen ad"
            />
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
              placeholder="Email"
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
              placeholder="Şifre (ör. EnAz8Karakter)"
            />

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {err}
              </div>
            )}

            <button
              disabled={busy}
              className="mt-2 rounded-full bg-zinc-900 px-5 py-3 text-sm text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
            >
              {busy ? "Oluşturuluyor..." : "Hesap Oluştur"}
            </button>
          </form>

          <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-300">
            Zaten hesabın var mı? <Link className="font-semibold underline" to="/login">Giriş yap</Link>
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}
