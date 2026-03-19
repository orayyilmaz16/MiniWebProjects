// Basit IP doğrulama (IPv4 ve IPv6 için kaba kontrol)
const isValidIP = (ip) => {
  const v4 = /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;
  const v6 =
    /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(([0-9a-fA-F]{1,4}:){1,7}:)|(([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})|(([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2})|(([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3})|(([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4})|(([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5})|([0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6}))|(:((:[0-9a-fA-F]{1,4}){1,7}|:)))(%.+)?$/;
  return v4.test(ip) || v6.test(ip);
};

const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const myIpEl = document.getElementById("myIp");
const btnMyIp = document.getElementById("btnMyIp");
const form = document.getElementById("ipForm");
const ipInput = document.getElementById("ipInput");

// Yardımcı: Key-Value kartı oluştur
const kv = (key, value) => `
  <div class="kv">
    <b>${key}</b>
    <div class="val">${value ?? "-"}</div>
  </div>
`;

const setStatus = (text, type = "") => {
  statusEl.className = `status ${type}`;
  statusEl.textContent = text;
};

const renderResult = (data) => {
  resultEl.innerHTML = `
    ${kv("IP", data.ip)}
    ${kv("Host", data.hostname || data.org || "-")}
    ${kv("Şehir", data.city)}
    ${kv("Bölge", data.region)}
    ${kv("Ülke", `${data.country_name || data.country} ${data.country_code ? "(" + data.country_code + ")" : ""}`)}
    ${kv("Kıta", data.continent_code)}
    ${kv("Posta Kodu", data.postal)}
    ${kv("Saat Dilimi", data.timezone)}
    ${kv("Koordinatlar", data.latitude && data.longitude ? `${data.latitude}, ${data.longitude}` : "-")}
    ${kv("Bağlantı", data.org || data.asn || data.version)}
  `;
};

const fetchMyIp = async () => {
  try {
    setStatus("Kendi IP adresiniz getiriliyor...");
    const res = await fetch("https://api.ipify.org?format=json");
    if (!res.ok) throw new Error("ipify erişim hatası");
    const { ip } = await res.json();

    myIpEl.textContent = ip;
    setStatus("IP alındı.", "ok");

    // Detay için ipapi
    const detailRes = await fetch("https://ipapi.co/json/");
    const details = detailRes.ok ? await detailRes.json() : { ip };
    renderResult({ ip, ...details });
  } catch (err) {
    console.error(err);
    setStatus("IP alınamadı. Daha sonra tekrar deneyin.", "err");
  }
};

const fetchIpDetails = async (ip) => {
  try {
    setStatus("Sorgulanıyor...");
    // ipapi coğrafi detaylar
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (!res.ok) throw new Error("ipapi erişim hatası");
    const data = await res.json();

    // Bazı alan adları ipapi’de farklı isimlerle gelebilir; normalize edelim
    const normalized = {
      ip: data.ip || ip,
      hostname: data.hostname,
      city: data.city,
      region: data.region,
      country_name: data.country_name,
      country_code: data.country,
      continent_code: data.continent_code,
      postal: data.postal,
      timezone: data.timezone,
      latitude: data.latitude,
      longitude: data.longitude,
      org: data.org || data.asn,
      version: data.version,
    };

    renderResult(normalized);
    setStatus("Sorgu başarılı.", "ok");
  } catch (err) {
    console.error(err);
    setStatus("Sorgu sırasında hata oluştu. IP veya ağ hatası olabilir.", "err");
  }
};

// Eventler
btnMyIp.addEventListener("click", fetchMyIp);

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const ip = ipInput.value.trim();

  if (!ip) {
    setStatus("Lütfen bir IP adresi girin.", "err");
    return;
  }
  if (!isValidIP(ip)) {
    setStatus("Geçersiz IP formatı. IPv4 veya IPv6 girin.", "err");
    return;
  }
  fetchIpDetails(ip);
});
