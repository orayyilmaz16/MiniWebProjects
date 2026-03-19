// DOM yüklendiğinde tüm kodumuzu çalıştır
document.addEventListener('DOMContentLoaded', () => {

  // === 1. VERİLER VE TEMEL DEĞİŞKENLER ===

  // Örnek ürün veritabanı (Normalde bir API'den gelir)
  const allProducts = [
    { id: 1, name: 'Premium Kulaklık', price: 1299.99, category: 'Elektronik', image: '/img/headphone.jpg' },
    { id: 2, name: 'Akıllı Saat', price: 3450.00, category: 'Elektronik', image: '/img/watch.jpg' },
    { id: 3, name: 'Deri Cüzdan', price: 499.50, category: 'Aksesuar', image: '/img/wallet.jpg' },
    { id: 4, name: 'Mekanik Klavye', price: 1890.00, category: 'Elektronik', image: '/img/keyboardGaming.webp' },
    { id: 5, name: 'Güneş Gözlüğü', price: 850.00, category: 'Aksesuar', image: '/img/sunglass.jpg' },
    { id: 6, name: 'Bluetooth Hoparlör', price: 799.90, category: 'Elektronik', image: '/img/bluetoothSpeaker.webp' }
  ];

  // Sepet durumu (Başlangıçta boş)
  let cart = [];

  // DOM Elementlerini seçme
  const productsContainer = document.getElementById('products');
  const cartItemsContainer = document.getElementById('cart');
  const cartTotalElement = document.getElementById('total');
  const cartCountElement = document.getElementById('cart-count');
  const clearCartButton = document.getElementById('clear-cart');
  const searchInput = document.getElementById('search');
  const categoryFilter = document.getElementById('category-filter');
  const darkModeToggle = document.getElementById('dark-toggle');

  
  // === 2. ANA FONKSİYONLAR ===

  /**
   * Verilen ürün dizisine göre ürün kartlarını HTML'e render eder.
   * @param {Array} products - Render edilecek ürünler dizisi.
   */
  function renderProducts(products) {
    // Önce mevcut ürünleri temizle
    productsContainer.innerHTML = '';
    
    // Filtrelenecek ürün yoksa mesaj göster
    if (products.length === 0) {
      productsContainer.innerHTML = '<p>Arama kriterlerinize uygun ürün bulunamadı.</p>';
      return;
    }

    // Her ürün için bir kart oluştur ve ekle
    products.forEach(product => {
      const productElement = document.createElement('div');
      productElement.className = 'product';
      productElement.innerHTML = `
        <img src="${product.image}" alt="${product.name}">
        <h3>${product.name}</h3>
        <div class="price">${product.price.toFixed(2)} ₺</div>
        <button data-id="${product.id}">Sepete Ekle</button>
      `;
      productsContainer.appendChild(productElement);
    });
  }

  /**
   * Sepet arayüzünü (liste, toplam tutar, ikon sayısı) günceller.
   */
  function renderCart() {
    // Önce mevcut sepet listesini temizle
    cartItemsContainer.innerHTML = '';
    
    let total = 0;
    let totalItems = 0;

    if (cart.length === 0) {
      cartItemsContainer.innerHTML = '<li>Sepetiniz boş.</li>';
    } else {
      cart.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${item.name} (${item.quantity}x)</span>
          <span>
            ${(item.price * item.quantity).toFixed(2)} ₺
            <button class="remove-from-cart" data-id="${item.id}">X</button>
          </span>
        `;
        cartItemsContainer.appendChild(li);
        
        // Toplamları hesapla
        total += item.price * item.quantity;
        totalItems += item.quantity;
      });
    }

    // Toplam tutarı ve sepet sayısını güncelle
    cartTotalElement.textContent = `${total.toFixed(2)} ₺`;
    cartCountElement.textContent = totalItems;
  }

  /**
   * Filtreleri (arama ve kategori) uygular ve ürünleri yeniden render eder.
   */
  function applyFilters() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    let filteredProducts = allProducts;

    // Kategoriye göre filtrele
    if (category !== 'all') {
      filteredProducts = filteredProducts.filter(product => product.category === category);
    }

    // Arama terimine göre filtrele
    if (searchTerm) {
      filteredProducts = filteredProducts.filter(product => 
        product.name.toLowerCase().includes(searchTerm)
      );
    }

    // Filtrelenmiş ürünleri render et
    renderProducts(filteredProducts);
  }

  /**
   * Sepete ürün ekler veya miktarını artırır.
   * @param {number} productId - Eklenecek ürünün ID'si.
   */
  function addToCart(productId) {
    // Sepette bu ürün zaten var mı?
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
      // Varsa, miktarını artır
      existingItem.quantity++;
    } else {
      // Yoksa, ürünü bul ve sepete 1 adet ekle
      const product = allProducts.find(p => p.id === productId);
      cart.push({ ...product, quantity: 1 });
    }

    // Sepet arayüzünü güncelle
    renderCart();
  }

  /**
   * Sepetten ürünü azaltır veya tamamen çıkarır.
   * @param {number} productId - Çıkarılacak ürünün ID'si.
   */
  function removeFromCart(productId) {
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
      const item = cart[itemIndex];
      item.quantity--; // Miktarı azalt

      if (item.quantity === 0) {
        // Miktar 0'a düşerse sepetten tamamen çıkar
        cart.splice(itemIndex, 1);
      }
    }
    
    // Sepet arayüzünü güncelle
    renderCart();
  }

  /**
   * Sepeti tamamen temizler.
   */
  function clearCart() {
    cart = []; // Sepet dizisini boşalt
    renderCart(); // Arayüzü güncelle
  }

  /**
   * Karanlık modu açar/kapatır ve tercihi kaydeder.
   */
  function toggleDarkMode() {
    document.body.classList.toggle('dark');
    // Tercihi localStorage'a kaydet
    if (document.body.classList.contains('dark')) {
      localStorage.setItem('theme', 'dark');
    } else {
      localStorage.setItem('theme', 'light');
    }
  }

  /**
   * Sayfa yüklendiğinde kayıtlı karanlık mod tercihini kontrol eder.
   */
  function loadTheme() {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.body.classList.add('dark');
    }
  }


  // === 3. OLAY DİNLEYİCİLERİ (EVENT LISTENERS) ===

  // Ürünler konteynerı (Event Delegation)
  // 'Sepete Ekle' butonlarına tıklamayı dinler
  productsContainer.addEventListener('click', (e) => {
    // Tıklanan element bir BUTON mu ve data-id'si var mı?
    if (e.target.tagName === 'BUTTON' && e.target.dataset.id) {
      const productId = parseInt(e.target.dataset.id);
      addToCart(productId);
    }
  });

  // Sepet konteynerı (Event Delegation)
  // 'Sepetten Çıkar' butonlarına tıklamayı dinler
  cartItemsContainer.addEventListener('click', (e) => {
    // Tıklanan element 'remove-from-cart' class'ına sahip mi?
    if (e.target.classList.contains('remove-from-cart')) {
      const productId = parseInt(e.target.dataset.id);
      removeFromCart(productId);
    }
  });

  // 'Sepeti Temizle' butonuna tıklama
  clearCartButton.addEventListener('click', clearCart);

  // Arama kutusuna her harf girildiğinde filtrele
  searchInput.addEventListener('input', applyFilters);

  // Kategori seçimi değiştiğinde filtrele
  categoryFilter.addEventListener('change', applyFilters);

  // Karanlık mod butonuna tıklama
  darkModeToggle.addEventListener('click', toggleDarkMode);


  // === 4. İLK YÜKLEME ===

  loadTheme();       // Kayıtlı temayı yükle
  applyFilters();    // Başlangıçta tüm ürünleri render et
  renderCart();      // Başlangıçta boş sepeti render et

});