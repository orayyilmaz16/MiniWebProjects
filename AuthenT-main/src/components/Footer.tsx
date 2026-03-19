export function Footer() {
  return (
    <footer className="border-t border-zinc-200 py-10 dark:border-zinc-900">
      <div className="mx-auto max-w-6xl px-4 text-sm text-zinc-500 dark:text-zinc-400">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} AuthenT. Demo Blog Auth Platform.</p>
          <p className="text-zinc-400">Admin: admin@authent.dev / Admin123! — User: user@authent.dev / User123!</p>
        </div>
      </div>
    </footer>
  );
}
