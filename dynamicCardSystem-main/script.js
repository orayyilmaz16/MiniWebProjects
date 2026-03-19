// 📌 Mobil Menü Toggle
const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

menuToggle.addEventListener("click", () => {
  nav.classList.toggle("active");
});


  const phrases = [
    "Modern UI/UX ile geliştirdiğim projeleri keşfet, filtrele ve ilham al.",
    "Etkileşimli arayüzler, mikro animasyonlar ve akıcı deneyimler.",
    "Portföyümü incele, aradığını hızlıca bul ve esinlen."
  ];

  const el = document.getElementById("tw");
  const typingSpeed = 50;    // ms, yazma hızı
  const deletingSpeed = 30;  // ms, silme hızı
  const holdTime = 1200;     // ms, yazdıktan sonra bekleme
  let i = 0;  // aktif cümle
  let j = 0;  // aktif karakter
  let deleting = false;

  function loop() {
    const current = phrases[i];

    if (!deleting) {
      // yazma
      el.textContent = current.slice(0, j + 1);
      j++;
      if (j === current.length) {
        deleting = true;
        setTimeout(loop, holdTime);
        return;
      }
      setTimeout(loop, typingSpeed);
    } else {
      // silme
      el.textContent = current.slice(0, j - 1);
      j--;
      if (j === 0) {
        deleting = false;
        i = (i + 1) % phrases.length;
        setTimeout(loop, typingSpeed);
        return;
      }
      setTimeout(loop, deletingSpeed);
    }
  }

  // Başlat
  loop();

// 📌 Kartlar, Arama ve Filtreler
const searchInput = document.getElementById("search");
const filterButtons = document.querySelectorAll(".filters button");
const cards = document.querySelectorAll(".card");

let activeFilter = "all";

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();

  cards.forEach(card => {
    const category = (card.dataset.category || "").toLowerCase();
    const title = card.querySelector("h3").textContent.toLowerCase();
    const desc = card.querySelector("p").textContent.toLowerCase();
    const tags = Array.from(card.querySelectorAll(".tags span")).map(tag =>
      tag.textContent.toLowerCase()
    );

    const matchesSearch =
      query === "" ||
      title.includes(query) ||
      desc.includes(query) ||
      tags.some(tag => tag.includes(query));

    const matchesFilter =
      activeFilter === "all" || category === activeFilter;

    if (matchesSearch && matchesFilter) {
      card.classList.remove("hidden");
    } else {
      card.classList.add("hidden");
    }
  });
}

// Menü linklerine özel smooth scroll (daha yavaş)
document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetEl = document.querySelector(targetId);

    if (targetEl) {
      const targetPosition = targetEl.getBoundingClientRect().top + window.scrollY;
      const startPosition = window.scrollY;
      const distance = targetPosition - startPosition;
      const duration = 1; // ms (ne kadar büyük olursa o kadar yavaş)
      let start = null;

      function step(timestamp) {
        if (!start) start = timestamp;
        const progress = timestamp - start;
        const ease = progress / duration; // lineer hız
        window.scrollTo(0, startPosition + distance * ease);

        if (progress < duration) {
          requestAnimationFrame(step);
        }
      }

      requestAnimationFrame(step);
    }
  });
});

searchInput.addEventListener("input", applyFilters);

filterButtons.forEach(btn => {
  btn.addEventListener("click", () => {
    filterButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    activeFilter = btn.getAttribute("data-filter");
    applyFilters();
  });
});

applyFilters();

// ✨ Scroll Animasyonları
const animatedElements = document.querySelectorAll(
  ".hero-content, .hero-visual, .portfolio-section h2, .section-subtitle, .card, .skills, .about, .contact"
);

function handleScroll() {
  const triggerBottom = window.innerHeight * 0.85;
  animatedElements.forEach(el => {
    const boxTop = el.getBoundingClientRect().top;
    if (boxTop < triggerBottom) {
      el.classList.add("visible");
    }
  });
}



window.addEventListener("scroll", handleScroll);
handleScroll(); // sayfa açıldığında tetikle