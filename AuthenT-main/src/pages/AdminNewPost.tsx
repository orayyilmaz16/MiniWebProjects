import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPost } from "../lib/db";
import { useAuth } from "../store/auth";
import { AnimatedSection } from "../components/AnimatedSection";

export default function AdminNewPost() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("Genel");
  const [content, setContent] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  

  async function onPickFile(file: File | null) {
    if (!file) return;
    const okTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!okTypes.includes(file.type)) {
      setErr("Lütfen geçerli bir görsel seç (png/jpg/webp/gif).");
      return;
    }
    const dataUrl = await new Promise<string>((res, rej) => {
      const r = new FileReader();
      r.onload = () => res(String(r.result));
      r.onerror = () => rej(new Error("Dosya okunamadı"));
      r.readAsDataURL(file);
    });
    setImage(dataUrl);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!user) return;

    setBusy(true);
    try {
      const post = createPost({
        title: title.trim(),
        topic: topic.trim(),
        content: content.trim(),
        image,
        authorId: user.id,
        authorName: user.displayName,
      },
       { userId: user.id, role: user.role }
    );
      nav(`/post/${post.id}`);
    } catch (ex) {
      setErr(ex instanceof Error ? ex.message : "Post oluşturulamadı");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AnimatedSection>
      <div className="mx-auto max-w-2xl">
        <div className="rounded-xl2 border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-xl font-semibold">Yeni Post</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
            Başlık, konu, içerik, görsel. Tarih-saat otomatik eklenir.
          </p>

          <form onSubmit={submit} className="mt-6 flex flex-col gap-4">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
              placeholder="Başlık"
            />
            <input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
              placeholder="Konu (ör. Duyuru, Teknoloji, Tasarım...)"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
              placeholder="İçerik..."
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-semibold">Görsel (Dosya)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => void onPickFile(e.target.files?.[0] ?? null)}
                  className="mt-2 block w-full text-sm"
                />
              </div>

              <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950">
                <p className="text-sm font-semibold">Görsel (URL)</p>
                <input
                  value={image?.startsWith("data:") ? "" : (image ?? "")}
                  onChange={(e) => setImage(e.target.value || undefined)}
                  className="mt-2 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm outline-none dark:border-zinc-800 dark:bg-zinc-900"
                  placeholder="https://images.unsplash.com/..."
                />
              </div>
            </div>

            {image && (
              <div className="overflow-hidden rounded-xl2 border border-zinc-200 dark:border-zinc-800">
                <img src={image} alt="preview" className="h-56 w-full object-cover" />
              </div>
            )}

            {err && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
                {err}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => nav(-1)}
                className="rounded-full border border-zinc-200 bg-white px-5 py-3 text-sm shadow-soft transition hover:-translate-y-0.5 dark:border-zinc-800 dark:bg-zinc-900"
              >
                Vazgeç
              </button>
              <button
                disabled={busy}
                className="rounded-full bg-zinc-900 px-5 py-3 text-sm text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
              >
                {busy ? "Kaydediliyor..." : "Yayınla"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AnimatedSection>
  );
}
