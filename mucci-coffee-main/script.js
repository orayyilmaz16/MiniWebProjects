(() => {
  const $ = (q, el = document) => el.querySelector(q);
  const $$ = (q, el = document) => [...el.querySelectorAll(q)];

  const html = document.documentElement;

  // Elements
  const preloader = $("#preloader");
  const yearEl = $("#year");
  const toTop = $("#toTop");
  const scrollProgress = $("#scrollProgress");

  const themeToggle = $("#themeToggle");
  const themeIcon = $("#themeIcon");

  const hamburger = $("#hamburger");
  const mobileMenu = $("#mobileMenu");
  const mobileOverlay = $("#mobileOverlay");
  const mobileClose = $("#mobileClose");

  const navLinks = $$(".nav__link");
  const sections = $$("main section[id]");

  const gallery = $("#gallery");
  const lightbox = $("#lightbox");
  const lightboxOverlay = $("#lightboxOverlay");
  const lightboxClose = $("#lightboxClose");
  const lightboxImg = $("#lightboxImg");
  const lightboxCap = $("#lightboxCap");

  // Footer year
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Preloader finish
  window.addEventListener("load", () => {
    setTimeout(() => preloader?.classList.add("is-done"), 450);
  });

  // Theme init
  function applyTheme(theme) {
    html.setAttribute("data-theme", theme);
    const isDark = theme === "dark";
    if (themeIcon) themeIcon.className = `fa-solid ${isDark ? "fa-moon" : "fa-sun"}`;
  }

  function initTheme() {
    const saved = localStorage.getItem("mucci-theme");
    if (saved === "dark" || saved === "light") return applyTheme(saved);

    const prefersDark = window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    applyTheme(prefersDark ? "dark" : "light");
  }

  initTheme();

  themeToggle?.addEventListener("click", () => {
    const current = html.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    localStorage.setItem("mucci-theme", next);
    applyTheme(next);
  });

  // Mobile menu
  function openMobile() {
    mobileMenu?.classList.add("is-open");
    hamburger?.classList.add("is-open");
    hamburger?.setAttribute("aria-expanded", "true");
    mobileMenu?.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeMobile() {
    mobileMenu?.classList.remove("is-open");
    hamburger?.classList.remove("is-open");
    hamburger?.setAttribute("aria-expanded", "false");
    mobileMenu?.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }

  hamburger?.addEventListener("click", () => {
    const isOpen = mobileMenu?.classList.contains("is-open");
    isOpen ? closeMobile() : openMobile();
  });

  mobileOverlay?.addEventListener("click", closeMobile);
  mobileClose?.addEventListener("click", closeMobile);

  // Close on mobile link click
  $$(".mobile__link").forEach(a => a.addEventListener("click", closeMobile));

  // Back to top
  toTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Scroll events: progress + toTop visibility
  function onScroll() {
    const y = window.scrollY || document.documentElement.scrollTop;
    const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    const p = h > 0 ? (y / h) * 100 : 0;

    if (scrollProgress) scrollProgress.style.width = `${p}%`;

    if (toTop) {
      if (y > 600) toTop.classList.add("is-show");
      else toTop.classList.remove("is-show");
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // Reveal on view
  const revealEls = $$(".reveal");
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) e.target.classList.add("is-in");
    });
  }, { threshold: 0.15 });

  revealEls.forEach(el => revealObs.observe(el));

  // Section active nav link
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const id = entry.target.getAttribute("id");
      if (!id) return;

      navLinks.forEach(a => a.classList.remove("active"));
      const active = navLinks.find(a => a.getAttribute("href") === `#${id}`);
      active?.classList.add("active");
    });
  }, { rootMargin: "-45% 0px -45% 0px", threshold: 0.01 });

  sections.forEach(s => sectionObs.observe(s));

  // Lightbox
  function openLightbox(src, caption = "Mucci Gallery") {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxCap && (lightboxCap.textContent = caption);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (lightboxImg) lightboxImg.src = "";
  }

  gallery?.addEventListener("click", (e) => {
    const btn = e.target.closest(".gitem");
    if (!btn) return;
    const full = btn.getAttribute("data-full");
    const alt = btn.querySelector("img")?.getAttribute("alt") || "Mucci Gallery";
    if (full) openLightbox(full, alt);
  });

  lightboxOverlay?.addEventListener("click", closeLightbox);
  lightboxClose?.addEventListener("click", closeLightbox);
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeLightbox();
  });

  // Demo form submit
  const contactForm = $("#contactForm");
  contactForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Teşekkürler. Demo front-end: form gönderimi için backend bağlayın.");
    contactForm.reset();
  });

  const newsletter = $("#newsletter");
  newsletter?.addEventListener("submit", (e) => {
    e.preventDefault();
    alert("Bülten kaydı demo. Backend/ESP entegrasyonu ile aktif edilebilir.");
    newsletter.reset();
  });

  // Animate skill bars when skills section enters
  const skillsSection = $("#skills");
  if (skillsSection) {
    const bars = $$(".bar span", skillsSection);
    const skillsObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        bars.forEach(span => {
          // width zaten inline style ile set; transition tetiklemek için reflow
          const w = span.style.width;
          span.style.width = "0%";
          // eslint-disable-next-line no-unused-expressions
          span.offsetHeight;
          span.style.width = w;
        });
        skillsObs.disconnect();
      });
    }, { threshold: 0.25 });

    skillsObs.observe(skillsSection);
  }
})();
