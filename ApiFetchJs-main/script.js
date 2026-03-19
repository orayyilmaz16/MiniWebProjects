document.getElementById("loadBtn").addEventListener("click", fetchPost);

async function fetchPost() {
  const id = document.getElementById("postId").value.trim();
  const status = document.getElementById("status");
  const card = document.getElementById("card");

  // ✅ ID Validation (1–100)
  if (!id || isNaN(id)) {
    status.textContent = "Lütfen bir sayı gir.";
    card.classList.add("hidden");
    return;
  }

  const num = Number(id);

  if (num < 1 || num > 100) {
    status.textContent = "ID 1 ile 100 arasında olmalıdır.";
    card.classList.add("hidden");
    return;
  }

  status.textContent = "Yükleniyor...";
  card.classList.add("hidden");

  try {
    const response = await fetch(
      `https://jsonplaceholder.typicode.com/posts/${num}`
    );

    if (!response.ok) {
      throw new Error("Sunucu hatası: " + response.status);
    }

    const data = await response.json();

    // ✅ Render fonksiyonunu çağır
    renderPost(data);

    status.textContent = "Veri başarıyla yüklendi!";

  } catch (err) {
    status.textContent = "Bir hata oluştu: " + err.message;
  }
}

// ✅ UI Render Fonksiyonu
function renderPost(data) {
  const card = document.getElementById("card");
  card.innerHTML = ""; // önce temizle

  // Kart container
  const wrapper = document.createElement("div");
  wrapper.className = "post-wrapper";

  // Başlık
  const title = document.createElement("h2");
  title.textContent = data.title;

  // İçerik
  const body = document.createElement("p");
  body.textContent = data.body;

  // Ek bilgiler (dinamik layout)
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `
    <span><strong>ID:</strong> ${data.id}</span>
    <span><strong>User:</strong> ${data.userId}</span>
    <span><strong>Uzunluk:</strong> ${data.body.length} karakter</span>
  `;

  // Elemanları birleştir
  wrapper.appendChild(title);
  wrapper.appendChild(body);
  wrapper.appendChild(meta);

  card.appendChild(wrapper);
  card.classList.remove("hidden");
}
