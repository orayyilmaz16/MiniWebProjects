/* =========================
   Graddy Coffee — app.js
   Products + Modal + Cart
   3D tilt + ripple + toast
   ========================= */

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

const fmtTRY = new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY", maximumFractionDigits: 0 });

const state = {
  filter: "all",
  q: "",
  products: [],
  cart: new Map(), // id -> qty
  activeProductId: null,
  theme: "dark",
};

const els = {
  year: $("#year"),
  themeToggle: $("#themeToggle"),
  ctaExplore: $("#ctaExplore"),
  ctaOrder: $("#ctaOrder"),
  ctaQuickView: $("#ctaQuickView"),

  progressBar: $(".scrollProgress__bar"),

  productsGrid: $("#productsGrid"),
  productSearch: $("#productSearch"),
  filterBtns: $$(".segmented__btn"),

  modal: $("#productModal"),
  modalPanel: $("#productModal .modal__panel"),
  modalClose: $("#modalClose"),
  modalBackdrop: $("#modalBackdrop"),
  modalTitle: $("#modalTitle"),
  modalCategory: $("#modalCategory"),
  modalDesc: $("#modalDesc"),
  modalImg: $("#modalImg"),
  modalNotes: $("#modalNotes"),
  modalIntensity: $("#modalIntensity"),
  modalAdd: $("#modalAdd"),
  modalWishlist: $("#modalWishlist"),

  cartDrawer: $("#cartDrawer"),
  cartPanel: $("#cartDrawer .drawer__panel"),
  cartOpen: $("#cartOpen"),
  cartClose: $("#cartClose"),
  cartBackdrop: $("#cartBackdrop"),
  cartBadge: $("#cartBadge"),
  cartSubtitle: $("#cartSubtitle"),
  cartList: $("#cartList"),
  cartEmpty: $("#cartEmpty"),
  cartClear: $("#cartClear"),
  cartCheckout: $("#cartCheckout"),
  subtotalText: $("#subtotalText"),
  shippingText: $("#shippingText"),
  totalText: $("#totalText"),

  toaster: $("#toaster"),

  contactForm: $("#contactForm"),
  newsletterEmail: $("#newsletterEmail"),
  newsletterBtn: $("#newsletterBtn"),
};

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function debounce(fn, ms = 200){
  let t;
  return (...args) => {
    window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

/* ---------- Theme ---------- */
function initTheme(){
  const saved = localStorage.getItem("graddy-theme");
  if (saved === "light" || saved === "dark") {
    state.theme = saved;
  } else {
    state.theme = window.matchMedia?.("(prefers-color-scheme: light)")?.matches ? "light" : "dark";
  }
  document.documentElement.dataset.theme = state.theme;

  els.themeToggle?.addEventListener("click", () => {
    state.theme = (state.theme === "dark") ? "light" : "dark";
    document.documentElement.dataset.theme = state.theme;
    localStorage.setItem("graddy-theme", state.theme);
    toast(`Tema: ${state.theme === "dark" ? "Koyu" : "Açık"}`);
  });
}

/* ---------- Progress ---------- */
function initScrollProgress(){
  const onScroll = () => {
    const doc = document.documentElement;
    const sc = doc.scrollTop || document.body.scrollTop;
    const max = (doc.scrollHeight - doc.clientHeight) || 1;
    const p = (sc / max) * 100;
    if (els.progressBar) els.progressBar.style.width = `${p}%`;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------- Ripple ---------- */
function initRipple(){
  document.addEventListener("click", (e) => {
    const btn = e.target.closest?.(".btn");
    if (!btn) return;

    const rect = btn.getBoundingClientRect();
    const x = (e.clientX - rect.left);
    const y = (e.clientY - rect.top);

    const span = document.createElement("span");
    span.className = "ripple";
    span.style.left = `${x}px`;
    span.style.top  = `${y}px`;
    btn.appendChild(span);

    span.addEventListener("animationend", () => span.remove(), { once: true });
  });
}

/* ---------- Fade-in on scroll ---------- */
function initReveal(){
  const items = $$(".anim, .anim--in");
  if (!items.length) return;

  const io = new IntersectionObserver((entries) => {
    for (const ent of entries) {
      if (ent.isIntersecting) {
        ent.target.classList.add("is-in");
        io.unobserve(ent.target);
      }
    }
  }, { threshold: 0.16 });

  items.forEach(el => io.observe(el));
}

/* ---------- Toast ---------- */
function toast(message){
  if (!els.toaster) return;

  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = message;

  els.toaster.appendChild(node);

  const t = window.setTimeout(() => {
    node.classList.add("toastOut");
    node.addEventListener("animationend", () => node.remove(), { once: true });
  }, 2800);

  node.addEventListener("click", () => {
    window.clearTimeout(t);
    node.classList.add("toastOut");
    node.addEventListener("animationend", () => node.remove(), { once: true });
  }, { once: true });
}

/* ---------- Products ---------- */
function loadProducts(){
  // Görseller: Unsplash + Wikimedia (HTML’de de kullanılıyor)
  // (Linkler yukarıdaki kaynaklarda doğrulandı.)
  state.products = [
    {
      id: "ethiopia",
      name: "Ethiopia — Yirgacheffe",
      category: "filter",
      price: 329,
      intensity: 48,
      notes: ["jasmine", "citrus", "bergamot"],
      desc: "Çiçeksi aromalar, temiz bitiş. V60 / Chemex için ideal profil.",
      img: "https://unsplash.com/photos/nEtxl8MPyM0/download?force=true",
      tags: ["Single Origin", "250g"]
    },
    {
      id: "kenya",
      name: "Kenya — AA",
      category: "espresso",
      price: 349,
      intensity: 68,
      notes: ["cacao", "blackcurrant", "brown sugar"],
      desc: "Yoğun gövde, tatlı-kakao bitiş. Espresso ve sütlü içimler.",
      img: "https://unsplash.com/photos/YCSaKhDmTkQ/download?force=true",
      tags: ["Espresso", "Fresh Roast"]
    },
    {
      id: "colombia",
      name: "Colombia — Huila",
      category: "filter",
      price: 319,
      intensity: 55,
      notes: ["caramel", "stone fruit", "honey"],
      desc: "Dengeli ve parlak; gün boyu içimlik tat profili.",
      img: "https://images.unsplash.com/photo-1598198192305-46b0805890d3?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGNvZmZlZSUyMGJhZ3xlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      tags: ["Balanced", "250g"]
    },
    {
      id: "house",
      name: "House Blend",
      category: "espresso",
      price: 299,
      intensity: 62,
      notes: ["hazelnut", "toffee", "chocolate"],
      desc: "Günlük espresso harmanı. Tutarlı, tatlı ve yuvarlak.",
      img: "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fGNvZmZlZSUyMGJhZ3xlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      tags: ["Blend", "Espresso"]
    },
    {
      id: "beansbag",
      name: "Roaster’s Selection",
      category: "filter",
      price: 369,
      intensity: 52,
      notes: ["floral", "tea-like", "clean"],
      desc: "Kavurucunun seçimi: sezonluk çekirdek, şeffaf notlar.",
      img: "https://images.unsplash.com/photo-1544486864-3087e2e20d91?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGNvZmZlZSUyMGJhZ3xlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      tags: ["Seasonal", "Traceable"]
    },
    {
      id: "beansinside",
      name: "Fresh Beans — 1kg",
      category: "espresso",
      price: 799,
      intensity: 70,
      notes: ["dark cocoa", "molasses", "crema"],
      desc: "Kafe / ofis için 1kg seçenek. Kreması güçlü espresso.",
      img: "https://images.unsplash.com/photo-1598198192305-46b0805890d3?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGNvZmZlZSUyMGJhZ3xlbnwwfHwwfHx8MA%3D%3D&ixlib=rb-4.1.0&q=60&w=3000",
      tags: ["1kg", "Cafe"]
    },
    {
      id: "coldbrew",
      name: "Cold Brew Concentrate",
      category: "cold",
      price: 189,
      intensity: 58,
      notes: ["cocoa", "smooth", "low acidity"],
      desc: "Buzla servis; sütle mükemmel. Yumuşak ve düşük asidite.",
      img: "https://images.unsplash.com/photo-1530373239216-42518e6b4063?fm=jpg&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8ZnJhcGlubyUyMG1vY2hhfGVufDB8fDB8fHww&ixlib=rb-4.1.0&q=60&w=3000",
      tags: ["Cold", "Ready"]
    },
    {
      id: "kettle",
      name: "Brew Kit (Demo)",
      category: "filter",
      price: 499,
      intensity: 30,
      notes: ["v60", "scale", "kettle"],
      desc: "Demleme seti demo ürünü: V60 odaklı ekipman paketi.",
      img: "https://unsplash.com/photos/mGlfn5uQH80/download?force=true",
      tags: ["Kit", "V60"]
    },
  ];
}

function productMatches(p){
  const byFilter = (state.filter === "all") || (p.category === state.filter);
  const q = state.q.trim().toLowerCase();
  const bySearch = !q || (
    p.name.toLowerCase().includes(q) ||
    p.desc.toLowerCase().includes(q) ||
    p.notes.join(" ").toLowerCase().includes(q) ||
    p.tags.join(" ").toLowerCase().includes(q)
  );
  return byFilter && bySearch;
}

function renderProducts(){
  if (!els.productsGrid) return;

  const list = state.products.filter(productMatches);
  els.productsGrid.innerHTML = "";

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "panel glass";
    empty.innerHTML = `
      <h3>Sonuç bulunamadı</h3>
      <p>Filtreyi değiştirin veya aramayı sadeleştirin.</p>
    `;
    els.productsGrid.appendChild(empty);
    return;
  }

  for (const p of list) {
    const card = document.createElement("article");
    card.className = "productCard glass anim";
    card.style.setProperty("--d", "0s");
    card.setAttribute("data-id", p.id);
    card.setAttribute("data-tilt", "true");
    card.setAttribute("tabindex", "0");
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `${p.name} detay`);

    card.innerHTML = `
      <div class="productCard__media" aria-hidden="true">
        <img src="${p.img}" alt="" loading="lazy">
      </div>

      <div class="productCard__body">
        <div class="productCard__top">
          <h3 class="productCard__name">${p.name}</h3>
          <div class="productCard__price">${fmtTRY.format(p.price)}</div>
        </div>

        <p class="productCard__desc">${p.desc}</p>

        <div class="productCard__ftr">
          <div class="tagRow">
            ${p.tags.slice(0,2).map(t => `<span class="tag">${t}</span>`).join("")}
          </div>

          <button class="btn btn--primary btn--sm addBtn" type="button" aria-label="${p.name} sepete ekle">
            <span class="btn__label">Ekle</span>
          </button>
        </div>
      </div>
    `;

    // Card click => modal, but "Ekle" button => cart only
    card.addEventListener("click", (e) => {
      const isAdd = e.target.closest?.(".addBtn");
      if (isAdd) {
        addToCart(p.id, 1);
        toast("Sepete eklendi.");
        return;
      }
      openModal(p.id);
    });

    // Enter / Space
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openModal(p.id);
      }
    });

    els.productsGrid.appendChild(card);
  }

  // Re-observe new anim items for reveal
  initReveal();
  initTilt();
}

/* ---------- 3D Tilt ---------- */
function initTilt(){
  const cards = $$("[data-tilt='true']");
  cards.forEach((card) => {
    if (card.__tiltBound) return;
    card.__tiltBound = true;

    const max = 10; // degrees
    const onMove = (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const rx = (-(y - 0.5) * max);
      const ry = ((x - 0.5) * max);
      card.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg) translateY(-2px)`;
    };
    const onLeave = () => {
      card.style.transform = "";
    };

    card.addEventListener("pointermove", onMove);
    card.addEventListener("pointerleave", onLeave);
  });
}

/* ---------- Modal ---------- */
function openModal(productId){
  const p = state.products.find(x => x.id === productId);
  if (!p || !els.modal) return;

  state.activeProductId = productId;

  els.modalCategory.textContent = ({
    espresso: "Espresso",
    filter: "Filtre",
    cold: "Cold Brew",
  }[p.category] || "Ürün");

  els.modalTitle.textContent = p.name;
  els.modalDesc.textContent = p.desc;

  els.modalImg.src = p.img;
  els.modalImg.alt = p.name;

  els.modalNotes.textContent = p.notes.join(" • ");
  els.modalIntensity.style.width = `${clamp(p.intensity, 6, 100)}%`;

  els.modal.hidden = false;
  els.modal.classList.add("is-open");

  // focus
  window.setTimeout(() => els.modalClose?.focus(), 0);
}

function closeModal(){
  if (!els.modal) return;
  els.modal.classList.remove("is-open");
  // wait transition before hiding to avoid flicker
  window.setTimeout(() => {
    els.modal.hidden = true;
    state.activeProductId = null;
  }, 220);
}

function initModal(){
  els.modalClose?.addEventListener("click", closeModal);
  els.modalBackdrop?.addEventListener("click", closeModal);

  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!els.modal?.hidden) closeModal();
      if (!els.cartDrawer?.hidden) closeCart();
    }
  });

  els.modalAdd?.addEventListener("click", () => {
    if (!state.activeProductId) return;
    addToCart(state.activeProductId, 1);
    toast("Sepete eklendi.");
  });

  els.modalWishlist?.addEventListener("click", () => {
    toast("Favori (demo).");
  });

  // Quick view button on hero
  els.ctaQuickView?.addEventListener("click", () => openModal("house"));
}

/* ---------- Cart ---------- */
function loadCart(){
  try {
    const raw = localStorage.getItem("graddy-cart");
    if (!raw) return;
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object") {
      Object.entries(obj).forEach(([id, qty]) => {
        if (Number.isFinite(qty) && qty > 0) state.cart.set(id, qty);
      });
    }
  } catch {}
}

function saveCart(){
  const obj = {};
  state.cart.forEach((qty, id) => obj[id] = qty);
  localStorage.setItem("graddy-cart", JSON.stringify(obj));
}

function cartCount(){
  let n = 0;
  state.cart.forEach(q => n += q);
  return n;
}

function cartSubtotal(){
  let sum = 0;
  state.cart.forEach((qty, id) => {
    const p = state.products.find(x => x.id === id);
    if (p) sum += p.price * qty;
  });
  return sum;
}

function shippingCost(subtotal){
  // Demo kural: 350+ ücretsiz, değilse 49
  return subtotal >= 350 || subtotal === 0 ? 0 : 49;
}

function addToCart(id, qty){
  const cur = state.cart.get(id) || 0;
  const next = cur + qty;
  state.cart.set(id, clamp(next, 1, 99));
  saveCart();
  renderCart();
}

function setQty(id, qty){
  if (qty <= 0) state.cart.delete(id);
  else state.cart.set(id, clamp(qty, 1, 99));
  saveCart();
  renderCart();
}

function clearCart(){
  state.cart.clear();
  saveCart();
  renderCart();
}

function renderCart() {
  const count = cartCount();

  // Navbar badge yok: burada güncelleme yapmıyoruz.

  // Drawer üst başlık altındaki metin
  if (els.cartSubtitle) els.cartSubtitle.textContent = `Sepette ${count} ürün`;

  if (!els.cartList || !els.cartEmpty) return;

  // Listeyi her seferinde sıfırla
  els.cartList.innerHTML = "";

  const items = Array.from(state.cart.entries());

  // Boş sepet görünümü: "Sepetin boş" yerine sayım + boşluk
  if (items.length === 0) {
    els.cartEmpty.hidden = false;
    els.cartEmpty.innerHTML = `
      <div style="padding:18px 12px;">
        <div style="height:12px;"></div>
        <div class="muted">Sepette <strong style="margin:0 6px;">${count}</strong> ürün</div>
        <div style="height:12px;"></div>
      </div>
    `;

    // Totals
    const subtotal = cartSubtotal();
    const shipping = shippingCost(subtotal);
    const total = subtotal + shipping;

    if (els.subtotalText) els.subtotalText.textContent = fmtTRY.format(subtotal);
    if (els.shippingText) els.shippingText.textContent = fmtTRY.format(shipping);
    if (els.totalText) els.totalText.textContent = fmtTRY.format(total);

    return;
  }

  // Sepet doluysa boş state'i kesin gizle + içeriğini temizle (0 yazısı kalmasın)
  els.cartEmpty.hidden = true;
  els.cartEmpty.innerHTML = "";

  // Ürün satırları
  for (const [id, qty] of items) {
    const p = state.products.find(x => x.id === id);
    if (!p) continue;

    const row = document.createElement("div");
    row.className = "cartItem";

    row.innerHTML = `
      <div class="cartItem__img" aria-hidden="true">
        <img src="${p.img}" alt="" loading="lazy">
      </div>

      <div class="cartItem__mid">
        <p class="cartItem__name">${p.name}</p>
        <div class="cartItem__meta">${fmtTRY.format(p.price)} <span class="muted">•</span> ${qty} adet</div>
      </div>

      <div class="qty" aria-label="adet kontrol">
        <button type="button" class="qtyMinus" aria-label="Azalt">−</button>
        <strong aria-label="Adet">${qty}</strong>
        <button type="button" class="qtyPlus" aria-label="Arttır">+</button>
      </div>
    `;

    const minusBtn = row.querySelector(".qtyMinus");
    const plusBtn = row.querySelector(".qtyPlus");

    if (minusBtn) minusBtn.addEventListener("click", () => setQty(id, qty - 1));
    if (plusBtn) plusBtn.addEventListener("click", () => setQty(id, qty + 1));

    els.cartList.appendChild(row);
  }

  // Totals
  const subtotal = cartSubtotal();
  const shipping = shippingCost(subtotal);
  const total = subtotal + shipping;

  if (els.subtotalText) els.subtotalText.textContent = fmtTRY.format(subtotal);
  if (els.shippingText) els.shippingText.textContent = fmtTRY.format(shipping);
  if (els.totalText) els.totalText.textContent = fmtTRY.format(total);
}



function openCart(){
  if (!els.cartDrawer) return;
  document.body.style.overflow = "hidden";   // ek
  els.cartDrawer.hidden = false;
  els.cartDrawer.classList.add("is-open");
  window.setTimeout(() => els.cartClose?.focus(), 0);
}

function closeCart(){
  if (!els.cartDrawer) return;
  els.cartDrawer.classList.remove("is-open");
  window.setTimeout(() => {
    els.cartDrawer.hidden = true;
    document.body.style.overflow = "";       // ek
  }, 240);
}

function initCart(){
  els.cartOpen?.addEventListener("click", openCart);
  els.cartClose?.addEventListener("click", closeCart);
  els.cartBackdrop?.addEventListener("click", closeCart);

  els.cartClear?.addEventListener("click", () => {
    clearCart();
    toast("Sepet temizlendi.");
  });

  els.cartCheckout?.addEventListener("click", () => {
    if (cartCount() === 0) {
      toast("Sepet boş.");
      return;
    }
    toast("Sipariş onaylandı (demo).");
    clearCart();
    closeCart();
  });
}

/* ---------- Filters + Search ---------- */
function initFilters(){
  els.filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      els.filterBtns.forEach(b => {
        b.classList.remove("is-active");
        b.setAttribute("aria-selected", "false");
      });
      btn.classList.add("is-active");
      btn.setAttribute("aria-selected", "true");

      state.filter = btn.dataset.filter || "all";
      renderProducts();
    });
  });

  const onSearch = debounce(() => {
    state.q = (els.productSearch?.value || "");
    renderProducts();
  }, 180);

  els.productSearch?.addEventListener("input", onSearch);
}

/* ---------- CTA / Forms / Demo links ---------- */
function initCTAs(){
  els.ctaExplore?.addEventListener("click", () => {
    $("#products")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  els.ctaOrder?.addEventListener("click", () => {
    openCart();
    toast("Sepet açıldı.");
  });

  // data-toast demo
  $$("[data-toast]").forEach(a => {
    a.addEventListener("click", (e) => {
      e.preventDefault();
      toast(a.dataset.toast || "Demo");
    });
  });

  // Contact form demo
  els.contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    toast("Mesaj gönderildi (demo).");
    els.contactForm.reset();
  });

  // Newsletter demo
  els.newsletterBtn?.addEventListener("click", () => {
    const v = (els.newsletterEmail?.value || "").trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    toast(ok ? "Abonelik alındı (demo)." : "Geçerli bir e-posta girin.");
    if (ok) els.newsletterEmail.value = "";
  });
}

// Footer "Yukarı" kesin çalışsın
  const toTop = document.querySelector("a.toTop");
  toTop?.addEventListener("click", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    history.replaceState(null, "", "#top"); // opsiyonel ama iyi
  });

/* ---------- Boot ---------- */
function boot(){
  els.year && (els.year.textContent = String(new Date().getFullYear()));

  initTheme();
  initScrollProgress();
  initRipple();
  initReveal();

  loadProducts();
  loadCart();

  initFilters();
  initModal();
  initCart();
  initCTAs();

  renderProducts();
  renderCart();
}

boot();
