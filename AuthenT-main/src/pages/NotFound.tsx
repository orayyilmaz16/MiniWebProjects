import { Link } from "react-router-dom";
import { AnimatedSection } from "../components/AnimatedSection";

export default function NotFound() {
  return (
    <AnimatedSection>
      <div className="rounded-xl2 border border-zinc-200 bg-white p-6 shadow-soft dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-semibold">404</h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Sayfa bulunamadı.</p>
        <Link className="mt-4 inline-block underline" to="/">Ana sayfa</Link>
      </div>
    </AnimatedSection>
  );
}
