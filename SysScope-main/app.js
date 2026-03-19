// app.js

const cardsEl = document.getElementById('cards');
const refreshBtn = document.getElementById('refresh');
const exportBtn = document.getElementById('exportJson');
const searchInput = document.getElementById('search');
const toggleThemeBtn = document.getElementById('toggleTheme');

let snapshot = {}; // Tüm verilerin tek yerde toplanmış hâli

// Tema
toggleThemeBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
});

// Arama/filtre
searchInput.addEventListener('input', () => {
  const q = searchInput.value.trim().toLowerCase();
  for (const card of cardsEl.querySelectorAll('.card')) {
    const text = card.innerText.toLowerCase();
    card.style.display = text.includes(q) ? '' : 'none';
  }
});

// Yenile
refreshBtn.addEventListener('click', () => collectAndRender());

// JSON dışa aktar
exportBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `sys-snapshot-${new Date().toISOString()}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

async function collectAndRender() {
  const data = await collectAll();
  snapshot = data;
  render(data);
}

function render(data) {
  cardsEl.innerHTML = '';

  const sections = [
    {
      title: 'Tarayıcı ve platform',
      badge: 'Navigator',
      kv: {
        'User agent': data.browser.userAgent,
        'Platform': data.browser.platform,
        'Diller': data.browser.languages.join(', '),
        'Çevrimdışı mı?': String(data.browser.offline),
        'Cookies etkin mi?': String(data.browser.cookieEnabled),
      }
    },
    {
      title: 'CPU ve bellek',
      badge: 'Performance',
      kv: {
        'Mantıksal çekirdek': String(data.hardware.cores ?? 'Bilinmiyor'),
        'Tahmini RAM (GB)': String(data.hardware.memoryGB ?? 'Bilinmiyor'),
        'Device memory raw': String(data.hardware.memoryRaw ?? 'Bilinmiyor'),
      }
    },
    {
      title: 'GPU ve grafik',
      badge: 'WebGL + Screen',
      kv: {
        'Renderer': data.graphics.renderer,
        'Vendor': data.graphics.vendor,
        'Ekran çözünürlüğü': `${data.graphics.width}x${data.graphics.height}`,
        'Renk derinliği': `${data.graphics.colorDepth} bit`,
        'Pixel ratio': String(data.graphics.pixelRatio),
      }
    },
    {
      title: 'Ağ durumu',
      badge: 'Network',
      kv: {
        'Bağlantı türü': data.network.effectiveType,
        'Downlink (Mbps)': String(data.network.downlink),
        'RTT (ms)': String(data.network.rtt),
        'Save data': String(data.network.saveData),
      }
    },
    {
      title: 'Depolama tahmini',
      badge: 'Storage',
      kv: {
        'Kullanılabilir (MB)': String(data.storage.availableMB),
        'Toplam (MB)': String(data.storage.quotaMB),
        'Persisted?': String(data.storage.persisted),
      }
    },
    {
      title: 'Pil durumu',
      badge: 'Battery',
      kv: {
        'Seviye (%)': String(data.battery.levelPct ?? 'Destek yok'),
        'Şarj oluyor mu?': String(data.battery.charging ?? 'Destek yok'),
        'Tahmini dolum (dk)': String(data.battery.chargingTimeMin ?? 'Destek yok'),
        'Tahmini boşalma (dk)': String(data.battery.dischargingTimeMin ?? 'Destek yok'),
      }
    },
    {
      title: 'Medya aygıtları',
      badge: 'MediaDevices',
      kv: {
        'Kamera sayısı': String(data.media.cameras),
        'Mikrofon sayısı': String(data.media.microphones),
        'Hoparlör sayısı': String(data.media.speakers),
      }
    },
    {
      title: 'İzinler ve gizlilik',
      badge: 'Permissions',
      kv: {
        'Bildirim izni': data.permissions.notifications,
        'Konum izni': data.permissions.geolocation,
        'Kamera izni': data.permissions.camera,
        'Mikrofon izni': data.permissions.microphone,
      }
    },
    {
      title: 'Yerel ayarlar',
      badge: 'Locale',
      kv: {
        'Saat dilimi': data.locale.timezone,
        'Tarih örneği': data.locale.sampleDate,
        'Saat örneği': data.locale.sampleTime,
      }
    }
  ];

  for (const s of sections) cardsEl.appendChild(cardEl(s.title, s.badge, s.kv));
}

function cardEl(title, badge, kv) {
  const el = document.createElement('article');
  el.className = 'card';
  const header = document.createElement('div');
  header.className = 'card-header';

  const h = document.createElement('div');
  h.className = 'card-title';
  h.textContent = title;

  const b = document.createElement('span');
  b.className = 'badge';
  b.textContent = badge;

  header.appendChild(h);
  header.appendChild(b);
  el.appendChild(header);

  const grid = document.createElement('div');
  grid.className = 'kv';

  Object.entries(kv).forEach(([key, val]) => {
    const k = document.createElement('div');
    k.className = 'key';
    k.textContent = key;

    const v = document.createElement('div');
    v.className = 'val';
    v.textContent = val ?? '—';

    grid.appendChild(k);
    grid.appendChild(v);
  });

  el.appendChild(grid);
  return el;
}

// Toplayıcılar
async function collectAll() {
  const [browser, hardware, graphics, network, storage, battery, media, permissions, locale] =
    await Promise.all([
      collectBrowser(),
      collectHardware(),
      collectGraphics(),
      collectNetwork(),
      collectStorage(),
      collectBattery(),
      collectMedia(),
      collectPermissions(),
      collectLocale(),
    ]);

  return { browser, hardware, graphics, network, storage, battery, media, permissions, locale };
}

function collectBrowser() {
  const n = navigator;
  return {
    userAgent: n.userAgent,
    platform: n.platform,
    languages: n.languages || [n.language].filter(Boolean),
    cookieEnabled: n.cookieEnabled,
    offline: !navigator.onLine,
  };
}

function collectHardware() {
  const n = navigator;
  const mem = n.deviceMemory; // GB cinsinden tahmini
  return {
    cores: n.hardwareConcurrency,
    memoryGB: typeof mem === 'number' ? mem : null,
    memoryRaw: mem ?? null,
  };
}

function collectGraphics() {
  const canvas = document.createElement('canvas');
  const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
  let renderer = 'Bilinmiyor', vendor = 'Bilinmiyor';
  if (gl) {
    const dbg = gl.getExtension('WEBGL_debug_renderer_info');
    if (dbg) {
      renderer = gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL);
      vendor = gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL);
    } else {
      renderer = 'Renderer gizli (debug ext yok)';
      vendor = 'Vendor gizli (debug ext yok)';
    }
  }
  return {
    renderer,
    vendor,
    width: window.screen.width,
    height: window.screen.height,
    colorDepth: window.screen.colorDepth,
    pixelRatio: window.devicePixelRatio,
  };
}

function collectNetwork() {
  const c = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  return {
    effectiveType: c?.effectiveType ?? 'Bilinmiyor',
    downlink: c?.downlink ?? 'Bilinmiyor',
    rtt: c?.rtt ?? 'Bilinmiyor',
    saveData: c?.saveData ?? false,
  };
}

async function collectStorage() {
  const st = navigator.storage;
  let quotaMB = null, availableMB = null, persisted = null;
  if (st && st.estimate) {
    try {
      const { quota, usage } = await st.estimate();
      quotaMB = quota ? (quota / (1024 * 1024)).toFixed(2) : null;
      availableMB = quota && usage ? ((quota - usage) / (1024 * 1024)).toFixed(2) : null;
      persisted = st.persisted ? await st.persisted() : null;
    } catch {
      // yok say
    }
  }
  return { quotaMB, availableMB, persisted };
}

async function collectBattery() {
  let levelPct = null, charging = null, chargingTimeMin = null, dischargingTimeMin = null;
  if (navigator.getBattery) {
    try {
      const b = await navigator.getBattery();
      levelPct = Math.round(b.level * 100);
      charging = b.charging;
      chargingTimeMin = b.chargingTime && b.chargingTime !== Infinity
        ? Math.round(b.chargingTime / 60)
        : null;
      dischargingTimeMin = b.dischargingTime && b.dischargingTime !== Infinity
        ? Math.round(b.dischargingTime / 60)
        : null;
    } catch { /* izin verilmedi veya destek yok */ }
  }
  return { levelPct, charging, chargingTimeMin, dischargingTimeMin };
}

async function collectMedia() {
  const md = navigator.mediaDevices;
  let cameras = 0, microphones = 0, speakers = 0;
  if (md && md.enumerateDevices) {
    try {
      const devices = await md.enumerateDevices();
      cameras = devices.filter(d => d.kind === 'videoinput').length;
      microphones = devices.filter(d => d.kind === 'audioinput').length;
      speakers = devices.filter(d => d.kind === 'audiooutput').length;
    } catch { /* izin gerekebilir */ }
  }
  return { cameras, microphones, speakers };
}

async function collectPermissions() {
  const status = async name => {
    try {
      const r = await navigator.permissions.query({ name });
      return r.state; // 'granted' | 'denied' | 'prompt'
    } catch { return 'destek yok'; }
  };
  return {
    notifications: await status('notifications'),
    geolocation: await status('geolocation'),
    camera: await status('camera'),
    microphone: await status('microphone'),
  };
}

function collectLocale() {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const now = new Date();
  return {
    timezone: tz,
    sampleDate: now.toLocaleDateString(),
    sampleTime: now.toLocaleTimeString(),
  };
}

// İlk yüklemede topla
collectAndRender();
