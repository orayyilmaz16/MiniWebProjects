import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const KEY = "authent_theme_v1";

function applyTheme(isDark: boolean) {
  document.documentElement.classList.toggle("dark", isDark);
  localStorage.setItem(KEY, isDark ? "dark" : "light");
}

export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(KEY);
    const isDark =
      saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;

    setDark(isDark);
    applyTheme(isDark);
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next = !dark;
        setDark(next);
        applyTheme(next);
      }}
      className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 hover:shadow dark:border-zinc-800 dark:bg-zinc-900"
      aria-label="Tema Değiştir"
    >
      {dark ? <Moon size={16} /> : <Sun size={16} />}
      <span className="hidden sm:inline">{dark ? "Gece" : "Gündüz"}</span>
    </button>
  );
}
