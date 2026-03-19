import { Link, NavLink } from "react-router-dom";
import { Menu, X, Shield, User } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "../store/auth";
import clsx from "clsx";

const navClass = ({ isActive }: { isActive: boolean }) =>
  clsx(
    "rounded-full px-3 py-2 text-sm transition",
    isActive
      ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
      : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
  );

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/70 backdrop-blur dark:border-zinc-900 dark:bg-zinc-950/60">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-zinc-900 text-white shadow-soft dark:bg-white dark:text-zinc-900">
            A
          </span>
          <span>AuthenT</span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          <NavLink to="/" className={navClass}>Blog</NavLink>
          {user?.role === "admin" && <NavLink to="/admin" className={navClass}>Admin</NavLink>}
          {user && <NavLink to="/settings" className={navClass}>Ayarlar</NavLink>}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          {!user ? (
            <div className="flex items-center gap-2">
              <Link className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900" to="/login">
                Giriş
              </Link>
              <Link className="rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-soft transition hover:-translate-y-0.5 dark:bg-white dark:text-zinc-900" to="/register">
                Kayıt
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                {user.role === "admin" ? <Shield size={16} /> : <User size={16} />}
                <span className="max-w-[160px] truncate">{user.name}</span>
              </span>
              <button
                onClick={logout}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                Çıkış
              </button>
            </div>
          )}
        </div>

        <button
          className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white p-2 shadow-soft md:hidden dark:border-zinc-800 dark:bg-zinc-900"
          onClick={() => setOpen((s) => !s)}
          aria-label="Menü"
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="border-t border-zinc-200 bg-white px-4 py-4 md:hidden dark:border-zinc-900 dark:bg-zinc-950"
          >
            <div className="flex flex-col gap-2">
              <NavLink to="/" onClick={() => setOpen(false)} className={navClass}>Blog</NavLink>
              {user?.role === "admin" && (
                <NavLink to="/admin" onClick={() => setOpen(false)} className={navClass}>Admin</NavLink>
              )}
              {user && (
                <NavLink to="/settings" onClick={() => setOpen(false)} className={navClass}>Ayarlar</NavLink>
              )}
              <div className="pt-2">
                <ThemeToggle />
              </div>
              <div className="pt-2">
                {!user ? (
                  <div className="flex gap-2">
                    <Link onClick={() => setOpen(false)} className="flex-1 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft dark:border-zinc-800 dark:bg-zinc-900" to="/login">
                      Giriş
                    </Link>
                    <Link onClick={() => setOpen(false)} className="flex-1 rounded-full bg-zinc-900 px-4 py-2 text-sm text-white shadow-soft dark:bg-white dark:text-zinc-900" to="/register">
                      Kayıt
                    </Link>
                  </div>
                ) : (
                  <button
                    onClick={() => { logout(); setOpen(false); }}
                    className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    Çıkış
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
