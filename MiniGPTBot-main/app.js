/* Mini GPT Chat UI
 * - Demo (offline) replies
 * - Optional: OpenAI Chat Completions API skeleton
 * - LocalStorage chat history
 * - Typing indicator
 * - Copy message button
 * - Minimal markdown-ish parsing for ```code``` and `inline`
 */

const chatEl = document.getElementById("chat");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");
const clearBtn = document.getElementById("clearBtn");
const modeToggle = document.getElementById("modeToggle");
const statusText = document.getElementById("statusText");
const clockPill = document.getElementById("clockPill");
const tokenPill = document.getElementById("tokenPill");

const STORAGE_KEY = "mini_gpt_chat_history_v1";

let useApi = false; // toggle
let history = loadHistory();

// ---- Utilities
function nowTime() {
  const d = new Date();
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function dayStamp() {
  const d = new Date();
  return d.toLocaleDateString("tr-TR", { year: "numeric", month: "long", day: "numeric" });
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

/**
 * Very small renderer:
 * - triple backticks -> <pre><code>
 * - single backticks -> <code class="inline">
 * - everything else -> escaped + \n -> <br>
 */
function renderContent(text) {
  const raw = text ?? "";
  // Split by triple backticks blocks
  const parts = raw.split("```");
  if (parts.length === 1) {
    // inline code only
    return renderInlineCode(raw);
  }

  let html = "";
  for (let i = 0; i < parts.length; i++) {
    const chunk = parts[i];
    if (i % 2 === 1) {
      // code block
      // allow optional language first line (ignored)
      const lines = chunk.replace(/\r/g, "").split("\n");
      if (lines.length > 1 && /^[a-zA-Z0-9_-]{1,15}$/.test(lines[0].trim())) {
        lines.shift();
      }
      const code = escapeHtml(lines.join("\n"));
      html += `<pre><code>${code}</code></pre>`;
    } else {
      html += renderInlineCode(chunk);
    }
  }
  return html;
}

function renderInlineCode(text) {
  // Replace `inline` with code span. We escape non-code segments.
  const segs = text.split("`");
  if (segs.length === 1) return escapeHtml(text).replaceAll("\n", "<br>");

  let html = "";
  for (let i = 0; i < segs.length; i++) {
    if (i % 2 === 1) {
      html += `<code class="inline">${escapeHtml(segs[i])}</code>`;
    } else {
      html += escapeHtml(segs[i]).replaceAll("\n", "<br>");
    }
  }
  return html;
}

function scrollToBottom() {
  chatEl.scrollTop = chatEl.scrollHeight;
}

function autosize() {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 180) + "px";
}

function updateCharCount() {
  tokenPill.textContent = `~${inputEl.value.length} chars`;
}

function saveHistory() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
}

function loadHistory() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : [];
  } catch {
    return [];
  }
}

// ---- UI Builders
function addDayDividerIfNeeded() {
  const last = history[history.length - 1];
  const lastDay = last?.day;
  const today = dayStamp();

  if (lastDay !== today) {
    history.push({ role: "system", type: "day", day: today, time: nowTime(), content: today });
    saveHistory();
    renderHistory(); // re-render to include divider
  }
}

function createMessageNode({ role, content, time }) {
  const wrap = document.createElement("div");
  wrap.className = `msg ${role === "user" ? "user" : "bot"}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const contentEl = document.createElement("div");
  contentEl.className = "content";
  contentEl.innerHTML = renderContent(content);

  const metaRow = document.createElement("div");
  metaRow.className = "metaRow";

  const timeEl = document.createElement("span");
  timeEl.textContent = time;

  const copyBtn = document.createElement("button");
  copyBtn.className = "copyBtn";
  copyBtn.type = "button";
  copyBtn.textContent = "Kopyala";
  copyBtn.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(content);
      copyBtn.textContent = "Kopyalandı";
      setTimeout(() => (copyBtn.textContent = "Kopyala"), 900);
    } catch {
      copyBtn.textContent = "Hata";
      setTimeout(() => (copyBtn.textContent = "Kopyala"), 900);
    }
  });

  metaRow.appendChild(timeEl);
  metaRow.appendChild(copyBtn);

  bubble.appendChild(contentEl);
  bubble.appendChild(metaRow);
  wrap.appendChild(bubble);
  return wrap;
}

function createTypingNode() {
  const wrap = document.createElement("div");
  wrap.className = "msg bot";
  wrap.id = "typingNode";

  const bubble = document.createElement("div");
  bubble.className = "typing";
  bubble.innerHTML = `<span class="dot"></span><span class="dot"></span><span class="dot"></span>`;

  wrap.appendChild(bubble);
  return wrap;
}

function renderHistory() {
  chatEl.innerHTML = "";

  let lastDivider = null;
  for (const item of history) {
    if (item.type === "day") {
      const div = document.createElement("div");
      div.className = "day-divider";
      div.textContent = item.content;
      chatEl.appendChild(div);
      lastDivider = item.content;
      continue;
    }
    // skip unknown system entries
    if (item.role !== "user" && item.role !== "assistant") continue;

    chatEl.appendChild(
      createMessageNode({
        role: item.role === "assistant" ? "bot" : "user",
        content: item.content,
        time: item.time,
      })
    );
  }

  if (!lastDivider && history.length === 0) {
    // initial divider
    const div = document.createElement("div");
    div.className = "day-divider";
    div.textContent = dayStamp();
    chatEl.appendChild(div);
  }

  scrollToBottom();
}

// ---- Bot Logic (Demo)
function demoReply(userText) {
  const t = userText.toLowerCase().trim();

  if (t.includes("merhaba") || t.includes("selam")) {
    return "Merhaba. Bugün ne üzerinde çalışıyoruz? İstersen `UI/UX`, `fetch`, `animasyon` ya da `component` tarafında yardımcı olayım.";
  }

  if (t.includes("kod") || t.includes("örnek")) {
    return [
      "Elbette. Aşağıda küçük bir örnek:",
      "```js",
      "const sum = (a, b) => a + b;",
      "console.log(sum(2, 3));",
      "```",
      "Ne tür bir kod istiyorsun (frontend, backend, CSS, animasyon)?",
    ].join("\n");
  }

  if (t.includes("responsive")) {
    return "Responsive için: `max-width`, akışkan grid, `clamp()` font-size ve mobilde `padding`/`gap` optimizasyonu öneririm. İstersen bu projede breakpoint planı çıkarayım.";
  }

  // generic “GPT-ish” response:
  return [
    "Anladım. Bunu netleştirmek için kısa bir çerçeve:",
    "- Hedef: Bu sohbet akışında neyi elde etmek istiyoruz?",
    "- Kısıt: Performans, güvenlik (API key), tasarım standardı?",
    "- Çıktı: UI mı, API entegrasyonu mu, yoksa ikisi birden mi?",
    "",
    "İstersen bir sonraki mesajında istediğin senaryoyu 1-2 cümleyle yaz; ben de doğrudan uygulayalım.",
  ].join("\n");
}

// ---- Optional API Call (Client-side skeleton)
// WARNING: Do NOT ship your API key in client-side code in production.
// WARNING: Do NOT ship your API key in client-side code in production.
// In production, call YOUR backend/proxy instead.
async function openAiReply(userText) {
  const endpoint = "https://api.openai.com/v1/chat/completions";

  // TEST İÇİN: anahtarı direkt burada tut (üretimde yapma)
  const apiKey = "YOUR-API-KEY-HERE"; // sk-... ile değiştir
  if (!apiKey || apiKey === "YOUR_OPENAI_API_KEY_HERE") {
    return "API key tanımlı değil. `apiKey` değişkenine kendi anahtarını yaz.";
  }

  const ctx = history
    .filter(m => m.role === "user" || m.role === "assistant")
    .slice(-10)
    .map(m => ({ role: m.role, content: m.content }));

  // (Opsiyonel) user mesajı zaten history’ye eklendiyse tekrar ekleme
  const last = ctx[ctx.length - 1];
  const shouldAppend = !(last && last.role === "user" && last.content === userText);

  const body = {
    model: "gpt-4.1-mini", // önce bunu kullan; model erişimi doğrulanınca değiştir
    messages: [
      { role: "system", content: "You are a helpful assistant. Reply in Turkish." },
      ...ctx,
      ...(shouldAppend ? [{ role: "user", content: userText }] : []),
    ],
    temperature: 0.7,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey.trim()}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
  const err = await res.json().catch(async () => ({ raw: await res.text() }));

  const code = err?.error?.code;
  const type = err?.error?.type;

  if (code === "insufficient_quota" || type === "insufficient_quota") {
    return "API kotası/limitin bitmiş görünüyor. OpenAI Platform > Billing/Limits ekranından ödeme yöntemi ekleyip limit/bütçe tanımlamalısın. (Üretimde anahtar tarayıcıda tutulmamalı.)";
  }

  return `API hata verdi (HTTP ${res.status}).\n\`\`\`\n${JSON.stringify(err, null, 2)}\n\`\`\``;
  }

  const data = await res.json();
  return (data?.choices?.[0]?.message?.content ?? "API yanıtı boş geldi.").trim();
}

// ---- Send flow
async function handleSend(text) {
  const content = text.trim();
  if (!content) return;

  addDayDividerIfNeeded();

  // push user message
  const userMsg = { role: "user", content, time: nowTime(), day: dayStamp() };
  history.push(userMsg);
  saveHistory();

  // render user message only (fast)
  chatEl.appendChild(createMessageNode({ role: "user", content, time: userMsg.time }));
  scrollToBottom();

  // typing
  const typing = createTypingNode();
  chatEl.appendChild(typing);
  scrollToBottom();

  // artificial “thinking” delay
  const delayMs = Math.min(900 + content.length * 6, 2200);
  await new Promise(r => setTimeout(r, delayMs));

  let reply;
  try {
    reply = useApi ? await openAiReply(content) : demoReply(content);
  } catch (e) {
    reply = `Bir hata oluştu:\n\`\`\`\n${String(e)}\n\`\`\``;
  }

  // remove typing
  const tnode = document.getElementById("typingNode");
  if (tnode) tnode.remove();

  const botMsg = { role: "assistant", content: reply, time: nowTime(), day: dayStamp() };
  history.push(botMsg);
  saveHistory();

  chatEl.appendChild(createMessageNode({ role: "bot", content: reply, time: botMsg.time }));
  scrollToBottom();
}

// ---- Events
formEl.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = inputEl.value;
  inputEl.value = "";
  autosize();
  updateCharCount();
  handleSend(text);
});

inputEl.addEventListener("input", () => {
  autosize();
  updateCharCount();
});

inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    formEl.requestSubmit();
  }
});

clearBtn.addEventListener("click", () => {
  history = [];
  saveHistory();
  renderHistory();
});

modeToggle.addEventListener("change", () => {
  useApi = modeToggle.checked;
  statusText.textContent = useApi ? "API mod • Online (anahtar gerekli)" : "Demo mod • Offline";
});

// ---- Clock
setInterval(() => {
  clockPill.textContent = nowTime();
}, 250);

// ---- Initial boot
function boot() {
  statusText.textContent = "Demo mod • Offline";
  clockPill.textContent = nowTime();
  updateCharCount();
  renderHistory();

  if (history.length === 0) {
    // Seed assistant welcome
    history.push({ role: "system", type: "day", day: dayStamp(), time: nowTime(), content: dayStamp() });
    history.push({
      role: "assistant",
      content:
        "Merhaba. Ben mini bir GPT tarzı arayüzüm.\n\n- Demo modda offline cevap üretiyorum.\n- API modda gerçek modele bağlanacak şekilde hazır iskelet var.\n\nBir şey yaz ve başlayalım.",
      time: nowTime(),
      day: dayStamp()
    });
    saveHistory();
    renderHistory();
  }
}
boot();
