import { useMemo, useState,useEffect } from "react";
import { getPosts } from "../lib/db";
import { AnimatedSection } from "../components/AnimatedSection";
import { PostCard } from "../components/PostCard";
import { motion, AnimatePresence } from "framer-motion";

export default function Home() {
  const [q, setQ] = useState("");
  const [topic, setTopic] = useState("Tümü");
  const [pageSize, setPageSize] = useState(9);
  const [page, setPage] = useState(1);



  const posts = useMemo(() => getPosts(), []);
  const topics = useMemo(() => ["Tümü", ...Array.from(new Set(posts.map((p) => p.topic)))], [posts]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return posts.filter((p) => {
      const okTopic = topic === "Tümü" ? true : p.topic === topic;
      const okQuery =
        !query ||
        p.title.toLowerCase().includes(query) ||
        p.content.toLowerCase().includes(query) ||
        p.topic.toLowerCase().includes(query);
      return okTopic && okQuery;
    });
  }, [posts, q, topic]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    setPage(1);
  }, [q, topic, pageSize]);

  const paged = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, safePage, pageSize]);


   const windowPages = useMemo(() => {
    // küçük, “tight” pagination: current çevresinde 5 sayfa
    const w = 2;
    const start = Math.max(1, safePage - w);
    const end = Math.min(totalPages, safePage + w);
    const arr: number[] = [];
    for (let i = start; i <= end; i++) arr.push(i);
    return arr;
  }, [safePage, totalPages]);


return (
    <AnimatedSection>
      <div className="flex flex-col gap-6">
        <section className="rounded-xl2 border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold tracking-tight">AuthenT Blog</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Filtre + arama + sayfalama. Kart grid + motion animasyonları.
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ara: başlık, içerik, konu..."
              className="md:col-span-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
            />
            <select
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
            >
              {topics.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>

            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
            >
              <option value={6}>Sayfa başı 6</option>
              <option value={9}>Sayfa başı 9</option>
              <option value={12}>Sayfa başı 12</option>
            </select>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-zinc-600 dark:text-zinc-300">
            <span>
              Sonuç: <span className="font-semibold">{filtered.length}</span>
            </span>
            <span>
              Sayfa: <span className="font-semibold">{safePage}</span> / {totalPages}
            </span>
          </div>
        </section>

        <AnimatePresence mode="wait">
          <motion.section
            key={`${safePage}_${pageSize}_${q}_${topic}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.25 }}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
          >
            {paged.map((p, i) => (
              <PostCard key={p.id} post={p} index={i} />
            ))}
          </motion.section>
        </AnimatePresence>

        {/* Pagination bar */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <button
            onClick={() => setPage((x) => Math.max(1, x - 1))}
            disabled={safePage <= 1}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
          >
            Önceki
          </button>

          {safePage > 3 && (
            <>
              <button
                onClick={() => setPage(1)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                1
              </button>
              <span className="px-2 text-zinc-500">…</span>
            </>
          )}

          {windowPages.map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={[
                "rounded-full px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5",
                n === safePage
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
              ].join(" ")}
            >
              {n}
            </button>
          ))}

          {safePage < totalPages - 2 && (
            <>
              <span className="px-2 text-zinc-500">…</span>
              <button
                onClick={() => setPage(totalPages)}
                className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {totalPages}
              </button>
            </>
          )}

          <button
            onClick={() => setPage((x) => Math.min(totalPages, x + 1))}
            disabled={safePage >= totalPages}
            className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60 dark:border-zinc-800 dark:bg-zinc-900"
          >
            Sonraki
          </button>
        </div>
      </div>
    </AnimatedSection>
  );
}