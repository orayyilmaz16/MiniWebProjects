/* =========================================================
   Automation Dashboard (Local JSON → Autonomous UI)
   - Auto refresh + countdown
   - Retry/backoff + timeout
   - Skeleton loading + minimum loading duration (UX)
   - Search + filter + sort
   - Theme toggle + persisted prefs
   - Reduce motion toggle
   - Toast notifications
   - Export filtered data
========================================================= */

/**
 * @typedef {"running"|"paused"|"failed"} AutomationStatus
 * @typedef {{
 *  id: string;
 *  name: string;
 *  owner: string;
 *  tags: string[];
 *  status: AutomationStatus;
 *  health: number;
 *  lastRun: string;
 *  nextRun: string;
 *  latencyMsP50: number;
 *  latencyMsP95: number;
 *  successRate7d: number;
 *  events24h: number;
 *  trend: number[];
 *  notes?: string;
 * }} Automation
 *
 * @typedef {{
 *  generatedAt: string;
 *  refreshHintSeconds: number;
 *  automations: Automation[];
 * }} DataPayload
 */

const CONFIG = {
  dataUrl: "./data.json",
  timeoutMs: 4000, // fetch timeout
  minLoadingMs: 650, // UX: skeleton en az bu kadar görünür
  retry: {
    attempts: 3,
    baseDelayMs: 450,
    jitterMs: 180
  },
  defaultAutoRefreshSec: 15,
  toastTtlMs: 3800
};

const dom = {
  cards: document.getElementById("cards"),
  emptyState: document.getElementById("emptyState"),
  resetFiltersBtn: document.getElementById("resetFiltersBtn"),

  statusPill: document.getElementById("statusPill"),
  statusLed: document.getElementById("statusLed"),
  statusText: document.getElementById("statusText"),
  statusMeta: document.getElementById("statusMeta"),

  themeToggle: document.getElementById("themeToggle"),
  refreshBtn: document.getElementById("refreshBtn"),

  searchInput: document.getElementById("searchInput"),
  clearSearch: document.getElementById("clearSearch"),
  filterButtons: Array.from(document.querySelectorAll(".seg-btn")),
  sortSelect: document.getElementById("sortSelect"),

  autoRefreshToggle: document.getElementById("autoRefreshToggle"),
  reduceMotionToggle: document.getElementById("reduceMotionToggle"),
  autoRefreshLabel: document.getElementById("autoRefreshLabel"),
  lastFetchLabel: document.getElementById("lastFetchLabel"),

  sumTotal: document.getElementById("sumTotal"),
  sumRunning: document.getElementById("sumRunning"),
  sumFailed: document.getElementById("sumFailed"),
  sumHealth: document.getElementById("sumHealth"),

  simulateBtn: document.getElementById("simulateBtn"),
  exportBtn: document.getElementById("exportBtn"),

  toasts: document.getElementById("toasts")
};

const state = {
  payload: /** @type {DataPayload|null} */ (null),
  view: /** @type {Automation[]} */ ([]),
  filter: /** @type {"all"|AutomationStatus} */ ("all"),
  query: "",
  sort: "health_desc",
  loading: false,
  lastFetchAt: null,

  autoRefreshSec: CONFIG.defaultAutoRefreshSec,
  autoRefreshEnabled: true,
  countdownSec: CONFIG.defaultAutoRefreshSec,
  countdownTimer: /** @type {number|null} */ (null),

  reduceMotion: false,
  simulateChaos: false
};

/* =========================
   Utilities
========================= */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatTime(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return "—";
  }
}

function formatRelativeFromNow(ts) {
  const d = new Date(ts);
  const diff = d.getTime() - Date.now(); // future positive
  const abs = Math.abs(diff);

  const s = Math.round(abs / 1000);
  const m = Math.round(s / 60);
  const h = Math.round(m / 60);

  const label =
    s < 60 ? `${s}s` : m < 60 ? `${m}m` : h < 48 ? `${h}h` : `${Math.round(h / 24)}d`;

  return diff >= 0 ? `in ${label}` : `${label} önce`;
}

function setReducedMotion(enabled) {
  state.reduceMotion = enabled;
  document.documentElement.style.setProperty("--t-fast", enabled ? "0ms" : "");
  document.documentElement.style.setProperty("--t-med", enabled ? "0ms" : "");
  document.documentElement.style.setProperty("--t-slow", enabled ? "0ms" : "");
}

function loadPrefs() {
  const theme = localStorage.getItem("theme");
  if (theme === "light" || theme === "dark") {
    document.documentElement.setAttribute("data-theme", theme);
  }

  const auto = localStorage.getItem("autoRefreshEnabled");
  if (auto != null) state.autoRefreshEnabled = auto === "true";
  dom.autoRefreshToggle.checked = state.autoRefreshEnabled;

  const rm = localStorage.getItem("reduceMotion");
  if (rm != null) state.reduceMotion = rm === "true";
  dom.reduceMotionToggle.checked = state.reduceMotion;
  setReducedMotion(state.reduceMotion);

  const sort = localStorage.getItem("sort");
  if (sort) state.sort = sort;
  dom.sortSelect.value = state.sort;

  const filter = localStorage.getItem("filter");
  if (filter === "all" || filter === "running" || filter === "paused" || filter === "failed") {
    state.filter = filter;
    setFilterUi(filter);
  }
}

/* =========================
   Toasts
========================= */
function toast(type, title, body) {
  const el = document.createElement("div");
  el.className = `toast ${type} fade-in`;
  el.innerHTML = `
    <div class="t-title">
      <span>${escapeHtml(title)}</span>
      <button class="t-close" type="button" aria-label="Kapat">Kapat</button>
    </div>
    <div class="t-body">${escapeHtml(body)}</div>
  `;

  const close = () => {
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    setTimeout(() => el.remove(), 160);
  };

  el.querySelector(".t-close").addEventListener("click", close);

  dom.toasts.appendChild(el);
  setTimeout(close, CONFIG.toastTtlMs);
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/* =========================
   Status pill
========================= */
function setStatus(kind, text, meta) {
  dom.statusText.textContent = text;
  dom.statusMeta.textContent = meta ?? "—";

  if (kind === "ok") {
    dom.statusLed.style.background = "var(--accent-2)";
    dom.statusLed.style.boxShadow = "0 0 0 8px rgba(34,197,94,.14)";
  } else if (kind === "warn") {
    dom.statusLed.style.background = "var(--warn)";
    dom.statusLed.style.boxShadow = "0 0 0 8px rgba(245,158,11,.14)";
  } else {
    dom.statusLed.style.background = "var(--danger)";
    dom.statusLed.style.boxShadow = "0 0 0 8px rgba(239,68,68,.14)";
  }
}

/* =========================
   Fetch with retry/backoff/timeout
========================= */
async function fetchWithTimeout(url, timeoutMs) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(t);
  }
}

async function loadData() {
  const started = performance.now();
  state.loading = true;
  renderSkeletons();

  setStatus("warn", "Yükleniyor", "Local veri çekiliyor…");

  // Simülasyon: bazen ekstra gecikme ve bozulma
  if (state.simulateChaos) {
    await sleep(420 + Math.random() * 520);
  }

  let lastErr = null;

  for (let i = 0; i < CONFIG.retry.attempts; i++) {
    try {
      const res = await fetchWithTimeout(CONFIG.dataUrl, CONFIG.timeoutMs);

      // Simülasyon: bazen bozuk JSON
      if (state.simulateChaos && Math.random() < 0.15) {
        throw new Error("Simülasyon: bozuk payload");
      }

      /** @type {DataPayload} */
      const json = await res.json();

      // UX: minimum loading duration
      const elapsed = performance.now() - started;
      const remain = CONFIG.minLoadingMs - elapsed;
      if (remain > 0) await sleep(remain);

      state.payload = json;
      state.lastFetchAt = new Date();
      state.autoRefreshSec = clamp(Number(json.refreshHintSeconds || CONFIG.defaultAutoRefreshSec), 5, 300);

      dom.autoRefreshLabel.textContent = `${state.autoRefreshSec}s`;
      dom.lastFetchLabel.textContent = formatTime(state.lastFetchAt);

      setStatus("ok", "Güncel", `Son çekim: ${formatTime(state.lastFetchAt)}`);
      toast("ok", "Veri güncellendi", `Local kaynak okundu (${json.automations.length} kayıt).`);

      state.loading = false;
      computeView();
      startCountdown(true);
      return;
    } catch (err) {
      lastErr = err;
      const delay = CONFIG.retry.baseDelayMs * Math.pow(2, i) + Math.random() * CONFIG.retry.jitterMs;

      setStatus("warn", "Tekrar deneniyor", `Deneme ${i + 1}/${CONFIG.retry.attempts} • ${Math.round(delay)}ms bekle`);
      await sleep(delay);
    }
  }

  state.loading = false;
  setStatus("danger", "Hata", "Veri okunamadı (retry bitti).");
  toast("danger", "Yükleme başarısız", `${String(lastErr?.message || lastErr)}`);

  // Eski data varsa onu ekranda tut
  if (state.payload) {
    computeView();
  } else {
    dom.cards.innerHTML = "";
    dom.emptyState.hidden = false;
  }
}

/* =========================
   View compute: filter + search + sort + derived metrics
========================= */
function computeView() {
  const payload = state.payload;
  if (!payload) return;

  const q = state.query.trim().toLowerCase();
  let arr = [...payload.automations];

  // Derived: sanitize
  arr = arr.map((a) => ({
    ...a,
    health: clamp(Number(a.health || 0), 0, 100),
    tags: Array.isArray(a.tags) ? a.tags : []
  }));

  // Filter
  if (state.filter !== "all") {
    arr = arr.filter((a) => a.status === state.filter);
  }

  // Search
  if (q) {
    arr = arr.filter((a) => {
      const hay = `${a.name} ${a.owner} ${a.id} ${a.tags.join(" ")} ${a.notes || ""}`.toLowerCase();
      return hay.includes(q);
    });
  }

  // Sort
  arr.sort(makeSorter(state.sort));

  state.view = arr;

  renderSummary(payload.automations);
  renderCards(arr);

  dom.emptyState.hidden = arr.length !== 0;
}

function makeSorter(key) {
  return (a, b) => {
    if (key === "health_desc") return b.health - a.health;
    if (key === "health_asc") return a.health - b.health;
    if (key === "nextRun_asc") return new Date(a.nextRun).getTime() - new Date(b.nextRun).getTime();
    if (key === "lastRun_desc") return new Date(b.lastRun).getTime() - new Date(a.lastRun).getTime();
    if (key === "name_asc") return a.name.localeCompare(b.name, "tr");
    return 0;
  };
}

/* =========================
   Render
========================= */
function renderSummary(all) {
  const total = all.length;
  const running = all.filter((x) => x.status === "running").length;
  const failed = all.filter((x) => x.status === "failed").length;
  const avgHealth = total ? Math.round(all.reduce((s, x) => s + clamp(x.health, 0, 100), 0) / total) : 0;

  dom.sumTotal.textContent = String(total);
  dom.sumRunning.textContent = String(running);
  dom.sumFailed.textContent = String(failed);
  dom.sumHealth.textContent = String(avgHealth);
}

function statusBadge(status) {
  if (status === "running") return `<span class="badge ok">RUNNING</span>`;
  if (status === "paused") return `<span class="badge warn">PAUSED</span>`;
  return `<span class="badge danger">FAILED</span>`;
}

function healthBadge(health) {
  if (health >= 85) return `<span class="badge ok">HEALTH ${health}</span>`;
  if (health >= 60) return `<span class="badge warn">HEALTH ${health}</span>`;
  return `<span class="badge danger">HEALTH ${health}</span>`;
}

function makeSparkline(values) {
  const w = 120, h = 28, pad = 2;
  const min = Math.min(...values), max = Math.max(...values);
  const span = Math.max(1, max - min);

  const pts = values.map((v, i) => {
    const x = pad + (i * (w - pad * 2)) / (values.length - 1);
    const y = h - pad - ((v - min) * (h - pad * 2)) / span;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return `
    <svg class="spark" viewBox="0 0 ${w} ${h}" aria-hidden="true">
      <polyline fill="none" stroke="currentColor" stroke-opacity="0.9" stroke-width="2" points="${pts.join(" ")}" />
    </svg>
  `;
}

function renderSkeletons() {
  const count = 6;
  dom.cards.innerHTML = Array.from({ length: count })
    .map(
      () => `
      <article class="card skeleton">
        <div class="card-header">
          <div class="card-title" style="width: 70%;">
            <div class="skel-line" style="width: 80%; height: 14px;"></div>
            <div class="skel-line" style="width: 60%;"></div>
          </div>
          <div style="width: 30%;">
            <div class="skel-line" style="width: 100%;"></div>
          </div>
        </div>
        <div class="card-body">
          <div class="skel-line" style="width: 95%;"></div>
          <div class="skel-line" style="width: 88%;"></div>
          <div class="skel-line" style="width: 70%;"></div>
          <div class="skel-line" style="width: 100%; height: 10px; border-radius: 999px;"></div>
        </div>
        <div class="card-footer">
          <div class="skel-line" style="width: 55%; margin:0;"></div>
          <div class="skel-line" style="width: 35%; margin:0;"></div>
        </div>
      </article>
    `
    )
    .join("");
}

function renderCards(items) {
  dom.cards.innerHTML = items
    .map((a) => {
      const health = clamp(a.health, 0, 100);
      const progress = `${health}%`;

      const kpiLatency = `${a.latencyMsP50}ms p50 / ${a.latencyMsP95}ms p95`;
      const kpiSuccess = `${a.successRate7d.toFixed(1)}% (7d)`;
      const nextRel = formatRelativeFromNow(a.nextRun);
      const last = formatTime(a.lastRun);

      const tags = a.tags.slice(0, 3).map((t) => `<span class="badge">#${escapeHtml(t)}</span>`).join("");

      // health bar width will animate
      return `
        <article class="card fade-in" data-id="${escapeHtml(a.id)}">
          <div class="card-header">
            <div class="card-title">
              <div class="name">${escapeHtml(a.name)}</div>
              <div class="meta">${escapeHtml(a.id)} • ${escapeHtml(a.owner)}</div>
            </div>
            <div class="badges">
              ${statusBadge(a.status)}
              ${healthBadge(health)}
            </div>
          </div>

          <div class="card-body">
            <div class="kv">
              <span>Last Run</span><strong>${escapeHtml(last)}</strong>
              <span>Next Run</span><strong>${escapeHtml(nextRel)}</strong>
              <span>Latency</span><strong>${escapeHtml(kpiLatency)}</strong>
              <span>Success</span><strong>${escapeHtml(kpiSuccess)}</strong>
              <span>Events (24h)</span><strong>${escapeHtml(String(a.events24h))}</strong>
              <span>Trend</span><strong>${makeSparkline(Array.isArray(a.trend) ? a.trend : [health])}</strong>
            </div>

            <div class="progress" aria-label="Health progress">
              <span style="width:${progress}"></span>
            </div>

            <div class="badges" style="justify-content:flex-start;">
              ${tags}
              ${a.notes ? `<span class="badge">${escapeHtml(a.notes)}</span>` : ""}
            </div>
          </div>

          <div class="card-footer">
            <div class="pill" title="Otomasyon durumu ve kısa aksiyon">
              ${actionHint(a.status, health)}
            </div>

            <div class="card-actions">
              <button class="ghost-btn" type="button" data-action="details" data-id="${escapeHtml(a.id)}">Detay</button>
              <button class="ghost-btn" type="button" data-action="run" data-id="${escapeHtml(a.id)}">Run</button>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  // Delegated actions
  dom.cards.querySelectorAll("button[data-action]").forEach((btn) => {
    btn.addEventListener("click", onCardAction);
  });
}

function actionHint(status, health) {
  if (status === "failed") return `Müdahale: log/credential kontrol`;
  if (status === "paused") return `Beklemede: planlama/limit kontrol`;
  if (health < 60) return `Risk: latency/success degrade`;
  return `Stabil: otomasyon sağlıklı`;
}

/* =========================
   UI interactions
========================= */
function setFilterUi(filter) {
  dom.filterButtons.forEach((b) => {
    const active = b.dataset.filter === filter;
    b.classList.toggle("is-active", active);
    b.setAttribute("aria-selected", String(active));
  });
}

function onCardAction(e) {
  const btn = e.currentTarget;
  const id = btn.getAttribute("data-id");
  const action = btn.getAttribute("data-action");

  const a = state.view.find((x) => x.id === id) || state.payload?.automations.find((x) => x.id === id);
  if (!a) return;

  if (action === "details") {
    toast("ok", a.name, `Owner: ${a.owner} • Status: ${a.status.toUpperCase()} • Health: ${a.health}`);
    return;
  }

  if (action === "run") {
    // “Otomasyon” simülasyonu: UI üstünde kısa işlem + health küçük varyans
    toast("warn", "Çalıştırılıyor", `${a.id} tetiklendi. Kuyruklanıyor…`);

    setStatus("warn", "Run tetiklendi", `${a.id} • simulated`);

    const jitter = (Math.random() - 0.5) * 8;
    const next = new Date(Date.now() + 35_000 + Math.random() * 25_000).toISOString();

    // State payload'ı güncelle (client-side)
    if (state.payload) {
      state.payload.automations = state.payload.automations.map((x) => {
        if (x.id !== a.id) return x;
        return {
          ...x,
          status: "running",
          health: clamp(Math.round(x.health + jitter), 0, 100),
          lastRun: new Date().toISOString(),
          nextRun: next
        };
      });
      computeView();
    }

    setTimeout(() => {
      setStatus("ok", "Güncel", `Son aksiyon: ${a.id}`);
      toast("ok", "Tamamlandı", `${a.id} run tamamlandı (simülasyon).`);
    }, 800);
  }
}

/* =========================
   Countdown / auto refresh
========================= */
function startCountdown(reset = false) {
  if (state.countdownTimer) window.clearInterval(state.countdownTimer);

  if (reset) state.countdownSec = state.autoRefreshSec;

  state.countdownTimer = window.setInterval(() => {
    if (!state.autoRefreshEnabled) return;

    state.countdownSec = Math.max(0, state.countdownSec - 1);
    dom.autoRefreshLabel.textContent = `${state.countdownSec}s`;

    if (state.countdownSec <= 0) {
      state.countdownSec = state.autoRefreshSec;
      loadData();
    }
  }, 1000);
}

/* =========================
   Export filtered view
========================= */
function exportViewJson() {
  const data = {
    exportedAt: new Date().toISOString(),
    filter: state.filter,
    query: state.query,
    sort: state.sort,
    results: state.view
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "automation-export.json";
  document.body.appendChild(a);
  a.click();
  a.remove();

  setTimeout(() => URL.revokeObjectURL(url), 800);
  toast("ok", "Export hazır", "Filtrelenmiş veri JSON olarak indirildi.");
}

/* =========================
   Keyboard shortcuts
========================= */
function bindShortcuts() {
  window.addEventListener("keydown", (e) => {
    // "/" focus search
    if (e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault();
      dom.searchInput.focus();
      return;
    }

    // R refresh
    if ((e.key === "r" || e.key === "R") && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // input/textarea içinde yazarken engelle
      const t = e.target;
      const tag = t && t.tagName ? t.tagName.toLowerCase() : "";
      if (tag === "input" || tag === "textarea" || tag === "select") return;

      loadData();
    }
  });
}

/* =========================
   Events
========================= */
function wireEvents() {
  dom.refreshBtn.addEventListener("click", () => loadData());

  dom.themeToggle.addEventListener("click", () => {
    const current = document.documentElement.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
    toast("ok", "Tema değişti", `Tema: ${next}`);
  });

  dom.searchInput.addEventListener("input", () => {
    state.query = dom.searchInput.value;
    computeView();
  });

  dom.clearSearch.addEventListener("click", () => {
    dom.searchInput.value = "";
    state.query = "";
    computeView();
    dom.searchInput.focus();
  });

  dom.filterButtons.forEach((b) => {
    b.addEventListener("click", () => {
      const f = b.dataset.filter;
      if (!f) return;
      state.filter = /** @type any */ (f);
      localStorage.setItem("filter", state.filter);
      setFilterUi(state.filter);
      computeView();
    });
  });

  dom.sortSelect.addEventListener("change", () => {
    state.sort = dom.sortSelect.value;
    localStorage.setItem("sort", state.sort);
    computeView();
  });

  dom.autoRefreshToggle.addEventListener("change", () => {
    state.autoRefreshEnabled = dom.autoRefreshToggle.checked;
    localStorage.setItem("autoRefreshEnabled", String(state.autoRefreshEnabled));
    toast("ok", "Auto-refresh", state.autoRefreshEnabled ? "Açık" : "Kapalı");

    if (state.autoRefreshEnabled) {
      startCountdown(true);
    }
  });

  dom.reduceMotionToggle.addEventListener("change", () => {
    const enabled = dom.reduceMotionToggle.checked;
    localStorage.setItem("reduceMotion", String(enabled));
    setReducedMotion(enabled);
    toast("ok", "Motion", enabled ? "Azaltıldı" : "Normal");
  });

  dom.simulateBtn.addEventListener("click", () => {
    state.simulateChaos = !state.simulateChaos;
    toast("warn", "Simülasyon", state.simulateChaos ? "Açık (gecikme/bozulma olabilir)" : "Kapalı");
  });

  dom.exportBtn.addEventListener("click", exportViewJson);

  dom.resetFiltersBtn?.addEventListener("click", () => {
    state.filter = "all";
    state.query = "";
    state.sort = "health_desc";
    dom.searchInput.value = "";
    dom.sortSelect.value = state.sort;
    setFilterUi(state.filter);
    computeView();
  });
}

/* =========================
   Init
========================= */
(function init() {
  loadPrefs();
  bindShortcuts();
  wireEvents();

  // initial skeleton + load
  renderSkeletons();
  loadData();

  // start countdown loop
  startCountdown(true);
})();
