document.addEventListener("DOMContentLoaded", () => {
  const $ = (sel) => document.querySelector(sel);
  const setHTML = (id, html) => {
    const el = document.querySelector(`#${id} .content`);
    if (el) el.innerHTML = html;
  };

  function formatNum(x, digits = 6) {
    if (!Number.isFinite(x)) return "—";
    const v = Number.parseFloat(x).toFixed(digits);
    return v.replace(/\.?0+$/, '');
  }

  function renderKV(items) {
    return `<div class="kv">` + items.map(it =>
      `<div class="key mono">${it.key}</div><div>${it.value}</div>`
    ).join("") + `</div>`;
  }

  function createFn(expr) {
    const normalized = expr
      .replace(/\^/g, "**")
      .replace(/\bln\(/g, "log(");

    const scope = {
      sin: Math.sin, cos: Math.cos, tan: Math.tan,
      asin: Math.asin, acos: Math.acos, atan: Math.atan,
      log: Math.log, exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs,
      pow: Math.pow, min: Math.min, max: Math.max,
      PI: Math.PI, E: Math.E
    };

    const fn = new Function("x", "scope",
      `"use strict";
       const {sin,cos,tan,asin,acos,atan,log,exp,sqrt,abs,pow,min,max,PI,E} = scope;
       return (${normalized});`
    );

    return (x) => fn(x, scope);
  }

  function derivative(f, x, h = 1e-5) {
    return (f(x + h) - f(x - h)) / (2 * h);
  }

  function simpson(f, a, b, n = 200) {
    if (n % 2 !== 0) n++;
    const h = (b - a) / n;
    let s = f(a) + f(b);
    for (let i = 1; i < n; i++) {
      const x = a + i * h;
      s += f(x) * (i % 2 === 0 ? 2 : 4);
    }
    return s * h / 3;
  }

  function sampleValues(f, a, b, n = 12) {
    const arr = [];
    for (let i = 0; i <= n; i++) {
      const x = a + (b - a) * (i / n);
      arr.push({ x, y: f(x) });
    }
    return arr;
  }

  function solve() {
    const exprEl = $("#expr");
    const aEl = $("#rangeMin");
    const bEl = $("#rangeMax");

    if (!exprEl || !aEl || !bEl) return;

    const expr = exprEl.value.trim();
    const a = Number(aEl.value);
    const b = Number(bEl.value);
    if (!expr) return;

    let f;
    try {
      f = createFn(expr);
      f(0); // test
    } catch (e) {
      setHTML("results", `<p class="error">Geçersiz ifade.</p>`);
      return;
    }

    let derivativeAt0, integral, samples;
    try {
      derivativeAt0 = derivative(f, 0);
    } catch {
      derivativeAt0 = NaN;
    }
    try {
      integral = simpson(f, a, b);
    } catch {
      integral = NaN;
    }
    try {
      samples = sampleValues(f, a, b);
    } catch {
      samples = [];
    }

   const resultsHTML = `
  <div class="kv">
    <div class="key">İfade</div>
    <div><code class="mono">${expr}</code></div>

    <div class="key">Türev (x=0)</div>
    <div><code class="mono">${formatNum(derivativeAt0)}</code></div>

    <div class="key">İntegral [${formatNum(a)}, ${formatNum(b)}]</div>
    <div><code class="mono">${formatNum(integral)}</code></div>

    <div class="key">Örnek Değerler</div>
    <div>
      <ul class="samples">
        ${samples.map(pt =>
          `<li><span class="badge">x=${formatNum(pt.x)}</span> → f(x)=${formatNum(pt.y)}</li>`
        ).join("")}
      </ul>
    </div>
  </div>
`;

    setHTML("results", resultsHTML);
  }

  const solveBtn = $("#solveBtn");
  if (solveBtn) {
    solveBtn.addEventListener("click", () => {
      solve();
    });
  }
});
