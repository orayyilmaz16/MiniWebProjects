// ==========================================================
// 1. DOM ÖĞELERİNİ SEÇME
// ==========================================================
const textInput = document.getElementById('text-input');
const livePreview = document.getElementById('live-preview');
const body = document.body;
const container = document.querySelector('.container'); // Animasyon için gerekli

// Kontrol Öğeleri (Ayarlar)
const colorPicker = document.getElementById('color-picker');
const fontSizeSelect = document.getElementById('font-size');
const fontFamilySelect = document.getElementById('font-family');
const lineHeightSelect = document.getElementById('line-height');
const alignButtons = document.querySelectorAll('.align-btn');

// Koyu Mod Öğeleri
const darkModeSwitch = document.getElementById('dark-mode-switch');

// ==========================================================
// A. KOYU MOD OTOMASYONU VE ANİMASYON GEÇİŞİ
// ==========================================================

darkModeSwitch.addEventListener('change', animateThemeChange);

/**
 * Temayı değiştirirken CSS geçişlerini daha belirgin hale getirmek için
 * container'ı kısa bir süreliğine gizleyip gösterir.
 */
function animateThemeChange() {
    // 1. CONTAINER'ı geçici olarak gizle (Opaklık 0)
    container.style.opacity = '0'; 
    
    // 2. 300ms gecikme sonrası tema değişimini yap
    setTimeout(() => {
        if (darkModeSwitch.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark'); 
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
        
        // 3. CONTAINER'ı tekrar görünür yap (Opaklık 1)
        container.style.opacity = '1';
        
    }, 300); 
}

/**
 * Sayfa yüklendiğinde kaydedilmiş veya sistem temasını yükler.
 */
function loadUserPreference() {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        darkModeSwitch.checked = true;
        body.classList.add('dark-mode');
    }
    
    // Başlangıçta metni ve stilleri uygula
    updatePreview();
    applyStyles();
    
    // Sayfa yüklendikten sonra container'ı görünür yap (başlangıç animasyonu)
    container.style.opacity = '1';
}

// ==========================================================
// B. METİN İÇERİĞİ VE MARKDOWN OTOMASYONU
// ==========================================================

textInput.addEventListener('input', updatePreview);

/**
 * Metin kutusu içeriğini okur, Markdown'ı HTML'e çevirir ve önizlemeyi günceller.
 */
function updatePreview() {
    let rawText = textInput.value;

    if (rawText.trim() === '') {
        livePreview.innerHTML = '<p class="placeholder-text">Yazmaya başladığınızda önizleme burada görünecektir.</p>';
    } else {
        // **KALIN** ve *İTALİK* Markdown Biçimlendirme
        let formattedText = rawText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formattedText = formattedText.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Yeni satırları <br> etiketine çevirme
        formattedText = formattedText.replace(/\n/g, '<br>');

        livePreview.innerHTML = formattedText;
    }
}

// ==========================================================
// C. STİL KONTROL OTOMASYONU
// ==========================================================

/**
 * Kontrol panelindeki ayarları alır ve Canlı Önizleme alanına CSS olarak uygular.
 */
function applyStyles() {
    // CSS Style özelliği atamaları
    livePreview.style.color = colorPicker.value;
    livePreview.style.fontSize = fontSizeSelect.value;
    livePreview.style.fontFamily = fontFamilySelect.value;
    livePreview.style.lineHeight = lineHeightSelect.value;
    
    // Hizalama Kontrolü
    const activeAlignBtn = document.querySelector('.align-btn.active');
    if (activeAlignBtn) {
        livePreview.style.textAlign = activeAlignBtn.dataset.align; 
    }
}

// ==========================================================
// D. OLAY DİNLEYİCİLERİ
// ==========================================================

// Giriş ve Seçim kontrolleri
colorPicker.addEventListener('input', applyStyles);
fontSizeSelect.addEventListener('change', applyStyles);
fontFamilySelect.addEventListener('change', applyStyles);
lineHeightSelect.addEventListener('change', applyStyles);

// Hizalama Butonları Olay Dinleyicisi
alignButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Aktiflik geçişi (diğerlerini pasifleştir, tıklananı aktifleştir)
        alignButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        applyStyles();
    });
});

// Sayfa Yüklendiğinde Başlat
loadUserPreference();