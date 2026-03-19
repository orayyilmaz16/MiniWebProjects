import { useState } from "react";

export function CommentBox({
  onSubmit,
  disabled,
}: {
  onSubmit: (text: string) => Promise<void> | void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await onSubmit(text.trim());
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-xl2 border border-zinc-200 bg-white p-4 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={disabled ? "Yorum için giriş yapmalısın." : "Yorum yaz..."}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm outline-none focus:ring-2 focus:ring-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:ring-zinc-700"
          disabled={disabled || busy}
        />
        <div className="flex justify-end">
          <button
            onClick={submit}
            disabled={disabled || busy}
            className="rounded-full bg-zinc-900 px-5 py-2 text-sm text-white shadow-soft transition hover:-translate-y-0.5 disabled:opacity-60 dark:bg-white dark:text-zinc-900"
          >
            {busy ? "Gönderiliyor..." : "Gönder"}
          </button>
        </div>
      </div>
    </div>
  );
}
