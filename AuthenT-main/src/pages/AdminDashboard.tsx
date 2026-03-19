import { Link } from "react-router-dom";
import { getPosts, deletePost } from "../lib/db";
import { AnimatedSection } from "../components/AnimatedSection";
import { useAuth } from "../store/auth";
import { Pencil, Trash2, Plus } from "lucide-react";
import { useMemo, useState } from "react";

export default function AdminDashboard() {
  const [tick, setTick] = useState(0);
  const { user } = useAuth();
  const posts = useMemo(() => getPosts(), [tick]);

  return (
    <AnimatedSection>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 rounded-xl2 border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Admin Panel</h1>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
              Blog ekle, yönet, sil. (Edit istersen ekleriz.)
            </p>
          </div>
          <Link
            to="/admin/new"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 px-5 py-3 text-sm text-white shadow-soft transition hover:-translate-y-0.5 dark:bg-white dark:text-zinc-900"
          >
            <Plus size={18} /> Yeni Post
          </Link>
        </div>

        <div className="rounded-xl2 border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-200 px-6 py-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-300">
            Toplam: <span className="font-semibold">{posts.length}</span>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {posts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.title}</p>
                  <p className="truncate text-sm text-zinc-600 dark:text-zinc-300">
                    {p.topic} • ♥ {p.likedBy.length} • 💬 {p.comments.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Link
                    to={`/post/${p.id}`}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    Görüntüle
                  </Link>
                  <button
                    onClick={() => {
                      deletePost(p.id);
                      setTick((x) => x + 1);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-soft transition hover:-translate-y-0.5 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                  >
                    <Trash2 size={16} /> Sil
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="px-6 py-10 text-center text-sm text-zinc-600 dark:text-zinc-300">
                Henüz post yok.
              </div>
            )}

            {posts.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* ... */}
                <div className="flex gap-2">
                  <Link
                    to={`/admin/edit/${p.id}`}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <Pencil size={16} /> Düzenle
                  </Link>

                  <Link
                    to={`/post/${p.id}`}
                    className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    Görüntüle
                  </Link>

                  <button
                    onClick={() => {
                      if (!user) return;
                      deletePost(p.id, { userId: user.id, role: user.role });
                      setTick((x) => x + 1);
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700 shadow-soft transition hover:-translate-y-0.5 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                  >
                    <Trash2 size={16} /> Sil
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AnimatedSection>
  );
}
