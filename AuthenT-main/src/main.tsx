import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles/globals.css";
import { initDb } from "./lib/db";
import { useAuth } from "./store/auth";

function BootstrapGate() {
  const [ready, setReady] = React.useState(false);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await initDb();

        // hydrate async olabilir; varsa await ederek yakalayalım
        const h = (useAuth.getState() as any).hydrate;
        if (typeof h === "function") {
          await h();
        }

        if (!cancelled) setReady(true);
      } catch (e) {
        console.error("Bootstrap failed:", e);
        if (!cancelled) {
          setError(e);
          setReady(true); // app yine de açılsın
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-zinc-600">Yükleniyor…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-6">
        <h1 className="text-lg font-semibold">Başlatma hatası</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Console’da “Bootstrap failed” hatasının detayını görebilirsiniz.
        </p>
      </div>
    );
  }

  return <App />;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <BootstrapGate />
    </BrowserRouter>
  </React.StrictMode>
);
