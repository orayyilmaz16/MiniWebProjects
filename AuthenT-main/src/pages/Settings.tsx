import { useState } from "react";
import { AnimatedSection } from "../components/AnimatedSection";
import { useAuth } from "../store/auth";

export default function Settings() {
  const { user, updateDisplayName, changePassword, logout } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  if (!user) return null;

  return (
    <AnimatedSection>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl2 border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold">Ayarlar</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Profil ve güvenlik ayarları.
          </p>

          {(msg || err) && (
            <div className={`mt-4 rounded-xl border p-3 text-sm ${err
              ? "border-red-200 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
              : "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-200"
            }`}>
              {err ?? msg}
            </div>
          )}

          <div className="mt-6 grid gap-4">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-semibold">Profil</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="sm:col-span-2 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="Görünen ad"
                />
                <button
                  onClick={async () => {
                    setMsg(null); setErr(null);
                    try {
                      await updateDisplayName(name.trim());
                      setMsg("Profil güncellendi.");
                    } catch (ex) {
                      setErr(ex instanceof Error ? ex.message : "Güncellenemedi");
                    }
                  }}
                  className="rounded-full bg-zinc-900 px-5 py-3 text-sm text-white shadow-soft transition hover:-translate-y-0.5 dark:bg-white dark:text-zinc-900"
                >
                  Kaydet
                </button>
              </div>
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
              <p className="text-sm font-semibold">Şifre Değiştir</p>
              <div className="mt-3 grid gap-3">
                <input
                  value={oldPass}
                  onChange={(e) => setOldPass(e.target.value)}
                  type="password"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="Mevcut şifre"
                />
                <input
                  value={newPass}
                  onChange={(e) => setNewPass(e.target.value)}
                  type="password"
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="Yeni şifre"
                />
                <button
                  onClick={async () => {
                    setMsg(null); setErr(null);
                    try {
                      await changePassword(oldPass, newPass);
                      setOldPass(""); setNewPass("");
                      setMsg("Şifre güncellendi.");
                    } catch (ex) {
                      setErr(ex instanceof Error ? ex.message : "Şifre değiştirilemedi");
                    }
                  }}
                  className="w-fit rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  Güncelle
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={logout}
                className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                Çıkış Yap
              </button>
            </div>
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
