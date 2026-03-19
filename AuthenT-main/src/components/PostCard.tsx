import { Link } from "react-router-dom";
import type { DbPost } from "../lib/db";
import { formatDateTime } from "../lib/time";
import { motion } from "framer-motion";

export function PostCard({ post, index }: { post: DbPost; index: number }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index * 0.06, 0.35) }}
      className="group overflow-hidden rounded-xl2 border border-zinc-200 bg-white shadow-soft transition hover:-translate-y-1 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Link to={`/post/${post.id}`} className="block">
        {post.image && (
          <div className="relative h-44 w-full overflow-hidden">
            <img
              src={post.image}
              alt={post.title}
              className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.06]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
          </div>
        )}
        <div className="p-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
              {post.topic}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">{formatDateTime(post.createdAt)}</span>
          </div>
          <h3 className="text-lg font-semibold tracking-tight">{post.title}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-300">
            {post.content}
          </p>
          <div className="mt-4 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400">
            <span>Yazar: {post.authorName}</span>
            <span>♥ {post.likedBy.length} • 💬 {post.comments.length}</span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
