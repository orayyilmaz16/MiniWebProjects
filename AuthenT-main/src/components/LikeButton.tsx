import { Heart } from "lucide-react";
import clsx from "clsx";

export function LikeButton({
  liked,
  count,
  onClick,
  disabled,
}: {
  liked: boolean;
  count: number;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm shadow-soft transition hover:-translate-y-0.5",
        "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <Heart size={16} className={clsx(liked && "fill-current")} />
      <span>{count}</span>
      <span className="text-zinc-500 dark:text-zinc-400">{liked ? "Beğenildi" : "Beğen"}</span>
    </button>
  );
}
