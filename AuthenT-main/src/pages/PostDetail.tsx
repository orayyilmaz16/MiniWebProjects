import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { addComment, deleteComment, getPost, toggleLike } from "../lib/db";
import { formatDateTime } from "../lib/time";
import { AnimatedSection } from "../components/AnimatedSection";
import { LikeButton } from "../components/LikeButton";
import { CommentBox } from "../components/CommentBox";
import { useAuth } from "../store/auth";

export default function PostDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [tick, setTick] = useState(0);

  const post = useMemo(() => (id ? getPost(id) : null), [id, tick]);

  if (!post) {
    return (
      <AnimatedSection>
        <div className="rounded-xl2 border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Post bulunamadı.
          </p>
          <Link className="mt-4 inline-block underline" to="/">
            Geri dön
          </Link>
        </div>
      </AnimatedSection>
    );
  }
  {
    post.comments.map((c) => (
      <div key={c.id} className="px-6 py-4">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-semibold">{c.userDisplayName}</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDateTime(c.createdAt)}
            </p>
          </div>

          {user?.role === "admin" && (
            <button
              onClick={() => {
                deleteComment(post.id, c.id, {
                  userId: user.id,
                  role: user.role,
                });
                setTick((x) => x + 1);
              }}
              className="rounded-full border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 shadow-soft transition hover:-translate-y-0.5 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            >
              Sil
            </button>
          )}
        </div>

        <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
          {c.content}
        </p>
      </div>
    ));
  }

  const liked = !!user && post.likedBy.includes(user.id);

  return (
    <AnimatedSection>
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <article className="overflow-hidden rounded-xl2 border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
          {post.image && (
            <div className="relative h-64 w-full overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
          )}
          <div className="p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                {post.topic}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                {formatDateTime(post.createdAt)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                • Yazar: {post.authorName}
              </span>
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight">
              {post.title}
            </h1>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-zinc-700 dark:text-zinc-200">
              {post.content}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <LikeButton
                liked={liked}
                count={post.likedBy.length}
                disabled={!user}
                onClick={() => {
                  if (!user) return;
                  toggleLike(post.id, user.id);
                  setTick((x) => x + 1);
                }}
              />
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                Yorum:{" "}
                <span className="font-semibold">{post.comments.length}</span>
              </span>
            </div>
          </div>
        </article>

        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">Yorumlar</h2>

          <CommentBox
            disabled={!user}
            onSubmit={async (text) => {
              if (!user) return;
              addComment(post.id, {
                userId: user.id,
                userDisplayName: user.displayName,
                content: text,
              });
              setTick((x) => x + 1);
            }}
          />

          <div className="rounded-xl2 border border-zinc-200 bg-white shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
            <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {post.comments.map((c) => (
                <div key={c.id} className="px-6 py-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{c.userDisplayName}</p>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDateTime(c.createdAt)}
                    </p>
                  </div>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-200">
                    {c.content}
                  </p>
                </div>
              ))}
              {post.comments.length === 0 && (
                <div className="px-6 py-10 text-center text-sm text-zinc-600 dark:text-zinc-300">
                  İlk yorumu sen yaz.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </AnimatedSection>
  );
}
