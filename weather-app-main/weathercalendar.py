import json
import os
import math
import calendar
import threading
import datetime as dt
from dataclasses import dataclass
from urllib.parse import urlencode
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

import tkinter as tk
from tkinter import ttk, messagebox

APP_NAME = "Hava Durumu Takvimi"
CACHE_DIR = os.path.join(os.path.expanduser("~"), ".weather_calendar_cache")
CACHE_FILE = os.path.join(CACHE_DIR, "cache.json")

# -----------------------------
# Veri modelleri
# -----------------------------
@dataclass(frozen=True)
class Location:
    name: str
    country: str
    latitude: float
    longitude: float
    timezone: str

@dataclass
class DayWeather:
    date: dt.date
    t_min: float | None = None
    t_max: float | None = None
    precip_sum: float | None = None
    wind_max: float | None = None
    sunrise: str | None = None
    sunset: str | None = None
    weather_code: int | None = None


# -----------------------------
# Yardımcılar
# -----------------------------
def ensure_cache_dir():
    if not os.path.isdir(CACHE_DIR):
        os.makedirs(CACHE_DIR, exist_ok=True)

def load_cache() -> dict:
    ensure_cache_dir()
    if not os.path.isfile(CACHE_FILE):
        return {}
    try:
        with open(CACHE_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_cache(cache: dict) -> None:
    ensure_cache_dir()
    try:
        with open(CACHE_FILE, "w", encoding="utf-8") as f:
            json.dump(cache, f, ensure_ascii=False, indent=2)
    except Exception:
        pass

def http_get_json(base_url: str, params: dict, timeout: int = 12) -> dict:
    qs = urlencode(params)
    url = f"{base_url}?{qs}"
    req = Request(url, headers={"User-Agent": f"{APP_NAME}/1.0"})
    with urlopen(req, timeout=timeout) as resp:
        data = resp.read().decode("utf-8", errors="replace")
    return json.loads(data)

def clamp(v, lo, hi):
    return max(lo, min(hi, v))

def safe_float(x):
    try:
        if x is None:
            return None
        return float(x)
    except Exception:
        return None

def weather_code_label(code: int | None) -> str:
    # Open-Meteo WMO Weather interpretation codes (özet)
    mapping = {
        0: "Açık",
        1: "Çoğunlukla açık",
        2: "Parçalı bulutlu",
        3: "Kapalı",
        45: "Sis",
        48: "Kırağılı sis",
        51: "Çisenti (hafif)",
        53: "Çisenti",
        55: "Çisenti (yoğun)",
        61: "Yağmur (hafif)",
        63: "Yağmur",
        65: "Yağmur (yoğun)",
        66: "Dondurucu yağmur (hafif)",
        67: "Dondurucu yağmur",
        71: "Kar (hafif)",
        73: "Kar",
        75: "Kar (yoğun)",
        77: "Kar taneleri",
        80: "Sağanak (hafif)",
        81: "Sağanak",
        82: "Sağanak (şiddetli)",
        85: "Kar sağanağı (hafif)",
        86: "Kar sağanağı",
        95: "Gök gürültülü fırtına",
        96: "Fırtına + dolu",
        99: "Şiddetli dolu",
    }
    return mapping.get(code, "Bilinmiyor")

def short_label(code: int | None) -> str:
    if code is None:
        return ""
    s = weather_code_label(code)
    # kutu içinde kısa görünsün
    if len(s) > 10:
        return s[:10] + "…"
    return s

def today_local():
    return dt.date.today()


# -----------------------------
# Open-Meteo istemcisi
# -----------------------------
class OpenMeteoClient:
    GEO_URL = "https://geocoding-api.open-meteo.com/v1/search"
    FORECAST_URL = "https://api.open-meteo.com/v1/forecast"

    def geocode(self, query: str, count: int = 8, language: str = "tr") -> list[Location]:
        params = {
            "name": query.strip(),
            "count": count,
            "language": language,
            "format": "json",
        }
        data = http_get_json(self.GEO_URL, params)
        results = data.get("results") or []
        locations: list[Location] = []
        for r in results:
            try:
                name = r.get("name") or "Unknown"
                country = r.get("country") or ""
                lat = float(r.get("latitude"))
                lon = float(r.get("longitude"))
                tz = r.get("timezone") or "auto"
                locations.append(Location(name=name, country=country, latitude=lat, longitude=lon, timezone=tz))
            except Exception:
                continue
        return locations

    def daily_forecast(self, loc: Location, start_date: dt.date, end_date: dt.date) -> dict:
        params = {
            "latitude": loc.latitude,
            "longitude": loc.longitude,
            "timezone": loc.timezone if loc.timezone != "auto" else "auto",
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat(),
            "daily": ",".join([
                "weathercode",
                "temperature_2m_max",
                "temperature_2m_min",
                "precipitation_sum",
                "windspeed_10m_max",
                "sunrise",
                "sunset",
            ]),
        }
        return http_get_json(self.FORECAST_URL, params)


# -----------------------------
# UI
# -----------------------------
class WeatherCalendarApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title(APP_NAME)
        self.geometry("1100x720")
        self.minsize(980, 640)

        self.client = OpenMeteoClient()
        self.cache = load_cache()

        self.current_year = today_local().year
        self.current_month = today_local().month

        self.selected_location: Location | None = None
        self.day_data: dict[str, DayWeather] = {}  # "YYYY-MM-DD" -> DayWeather
        self.selected_date: dt.date | None = None

        self._build_style()
        
        self._bind_shortcuts()

        # vars
        self.var_city = tk.StringVar(value="Bursa")
        self.var_status = tk.StringVar(value="Hazır")
        self.var_month_title = tk.StringVar()
        self.var_day_title = tk.StringVar(value="Gün detayı")
        self.var_day_sub = tk.StringVar(value="Bir gün seç.")
        self.var_day_metrics = tk.StringVar(value="")

        self._build_layout()

        self._update_month_title()
        self._set_status("Şehir arayıp seçebilirsin veya Varsayılan: Bursa")
        self._start_geocode_and_load(self.var_city.get().strip())

    # -------- style --------
    def _build_style(self):
        self.configure(bg="#0B1220")
        style = ttk.Style(self)
        try:
            style.theme_use("clam")
        except Exception:
            pass

        style.configure(".", font=("Segoe UI", 10))
        style.configure("TFrame", background="#0B1220")
        style.configure("Card.TFrame", background="#0F1B2D", relief="flat")
        style.configure("TLabel", background="#0B1220", foreground="#D7E1F2")
        style.configure("Muted.TLabel", foreground="#8FA3C2")
        style.configure("Title.TLabel", font=("Segoe UI", 16, "bold"), foreground="#EAF2FF")
        style.configure("H2.TLabel", font=("Segoe UI", 12, "bold"), foreground="#EAF2FF")
        style.configure("Card.TLabel", background="#0F1B2D", foreground="#D7E1F2")
        style.configure("CardMuted.TLabel", background="#0F1B2D", foreground="#8FA3C2")
        style.configure("TEntry", fieldbackground="#0F1B2D", background="#0F1B2D", foreground="#EAF2FF")
        style.configure("TButton", padding=10)
        style.configure("Primary.TButton", background="#2D6BFF", foreground="#FFFFFF")
        style.map("Primary.TButton", background=[("active", "#1F56DB")])
        style.configure("Ghost.TButton", background="#0F1B2D", foreground="#D7E1F2")
        style.map("Ghost.TButton", background=[("active", "#142743")])
        style.configure("TCombobox", fieldbackground="#0F1B2D", background="#0F1B2D", foreground="#EAF2FF")
        style.map("TCombobox", fieldbackground=[("readonly", "#0F1B2D")])
        style.configure("Day.TButton", padding=(10, 10), anchor="nw")
        style.map("Day.TButton",
                  background=[("active", "#142743")],
                  foreground=[("disabled", "#5E708D")])

    # -------- layout --------
    def _build_layout(self):
        self.grid_columnconfigure(0, weight=1)
        self.grid_columnconfigure(1, weight=2)
        self.grid_rowconfigure(0, weight=1)

        # left: sidebar
        self.sidebar = ttk.Frame(self, padding=18)
        self.sidebar.grid(row=0, column=0, sticky="nsew")
        self.sidebar.grid_rowconfigure(3, weight=1)

        ttk.Label(self.sidebar, text=APP_NAME, style="Title.TLabel").grid(row=0, column=0, sticky="w")

        search_card = ttk.Frame(self.sidebar, style="Card.TFrame", padding=14)
        search_card.grid(row=1, column=0, sticky="ew", pady=(14, 10))
        search_card.grid_columnconfigure(0, weight=1)

        ttk.Label(search_card, text="Şehir ara", style="Card.TLabel").grid(row=0, column=0, sticky="w")
        self.entry_city = ttk.Entry(search_card, textvariable=self.var_city)
        self.entry_city.grid(row=1, column=0, sticky="ew", pady=(10, 10))

        btns = ttk.Frame(search_card, style="Card.TFrame")
        btns.grid(row=2, column=0, sticky="ew")
        btns.grid_columnconfigure(0, weight=1)
        btns.grid_columnconfigure(1, weight=1)

        self.btn_search = ttk.Button(btns, text="Ara", style="Primary.TButton", command=self.on_search)
        self.btn_search.grid(row=0, column=0, sticky="ew", padx=(0, 8))
        self.btn_reload = ttk.Button(btns, text="Yenile", style="Ghost.TButton", command=self.on_reload)
        self.btn_reload.grid(row=0, column=1, sticky="ew")

        loc_card = ttk.Frame(self.sidebar, style="Card.TFrame", padding=14)
        loc_card.grid(row=2, column=0, sticky="ew", pady=(0, 10))
        loc_card.grid_columnconfigure(0, weight=1)

        ttk.Label(loc_card, text="Konum seçimi", style="Card.TLabel").grid(row=0, column=0, sticky="w")
        self.combo_locations = ttk.Combobox(loc_card, state="readonly", values=[])
        self.combo_locations.grid(row=1, column=0, sticky="ew", pady=(10, 0))
        self.combo_locations.bind("<<ComboboxSelected>>", self.on_location_selected)

        detail_card = ttk.Frame(self.sidebar, style="Card.TFrame", padding=16)
        detail_card.grid(row=3, column=0, sticky="nsew")
        detail_card.grid_columnconfigure(0, weight=1)

        ttk.Label(detail_card, textvariable=self.var_day_title, style="Card.TLabel",
                  font=("Segoe UI", 13, "bold")).grid(row=0, column=0, sticky="w")
        ttk.Label(detail_card, textvariable=self.var_day_sub, style="CardMuted.TLabel").grid(
            row=1, column=0, sticky="w", pady=(6, 10)
        )
        self.lbl_metrics = ttk.Label(detail_card, textvariable=self.var_day_metrics, style="Card.TLabel", justify="left")
        self.lbl_metrics.grid(row=2, column=0, sticky="nw")

        # right: calendar area
        self.main = ttk.Frame(self, padding=(0, 18, 18, 18))
        self.main.grid(row=0, column=1, sticky="nsew")
        self.main.grid_rowconfigure(2, weight=1)
        self.main.grid_columnconfigure(0, weight=1)

        topbar = ttk.Frame(self.main)
        topbar.grid(row=0, column=0, sticky="ew")
        topbar.grid_columnconfigure(1, weight=1)

        self.btn_prev = ttk.Button(topbar, text="◀", style="Ghost.TButton", width=4, command=self.on_prev_month)
        self.btn_prev.grid(row=0, column=0, sticky="w")

        ttk.Label(topbar, textvariable=self.var_month_title, style="Title.TLabel").grid(row=0, column=1, sticky="w", padx=12)

        self.btn_next = ttk.Button(topbar, text="▶", style="Ghost.TButton", width=4, command=self.on_next_month)
        self.btn_next.grid(row=0, column=2, sticky="e")

        sub = ttk.Frame(self.main)
        sub.grid(row=1, column=0, sticky="ew", pady=(10, 14))
        ttk.Label(sub, text="Takvimde sadece tahmin aralığı dolu görünür.", style="Muted.TLabel").grid(row=0, column=0, sticky="w")

        cal_card = ttk.Frame(self.main, style="Card.TFrame", padding=14)
        cal_card.grid(row=2, column=0, sticky="nsew")
        cal_card.grid_rowconfigure(1, weight=1)
        cal_card.grid_columnconfigure(0, weight=1)

        # weekday header
        weekdays = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]
        header = ttk.Frame(cal_card, style="Card.TFrame")
        header.grid(row=0, column=0, sticky="ew", pady=(0, 10))
        for i, w in enumerate(weekdays):
            header.grid_columnconfigure(i, weight=1)
            ttk.Label(header, text=w, style="CardMuted.TLabel", anchor="center").grid(row=0, column=i, sticky="ew")

        self.cal_grid = ttk.Frame(cal_card, style="Card.TFrame")
        self.cal_grid.grid(row=1, column=0, sticky="nsew")
        for r in range(6):
            self.cal_grid.grid_rowconfigure(r, weight=1)
        for c in range(7):
            self.cal_grid.grid_columnconfigure(c, weight=1)

        # status bar
        status = ttk.Frame(self, padding=(18, 0, 18, 14))
        status.grid(row=1, column=0, columnspan=2, sticky="ew")
        status.grid_columnconfigure(0, weight=1)
        ttk.Label(status, textvariable=self.var_status, style="Muted.TLabel").grid(row=0, column=0, sticky="w")

        self.day_buttons: list[ttk.Button] = []
        self._render_calendar()

    def _bind_shortcuts(self):
        self.bind("<Return>", lambda e: self.on_search())
        self.bind("<Control-r>", lambda e: self.on_reload())
        self.bind("<Escape>", lambda e: self.destroy())

    # -------- status --------
    def _set_status(self, text: str):
        self.var_status.set(text)

    # -------- month navigation --------
    def _update_month_title(self):
        d = dt.date(self.current_year, self.current_month, 1)
        # Türkçe ay adı için basit çözüm (locale bağımlılığını azaltmak için)
        months_tr = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]
        self.var_month_title.set(f"{months_tr[d.month-1]} {d.year}")

    def on_prev_month(self):
        m = self.current_month - 1
        y = self.current_year
        if m < 1:
            m = 12
            y -= 1
        self.current_year, self.current_month = y, m
        self._update_month_title()
        self._render_calendar()

    def on_next_month(self):
        m = self.current_month + 1
        y = self.current_year
        if m > 12:
            m = 1
            y += 1
        self.current_year, self.current_month = y, m
        self._update_month_title()
        self._render_calendar()

    # -------- search & load --------
    def on_search(self):
        q = self.var_city.get().strip()
        if not q:
            messagebox.showwarning(APP_NAME, "Lütfen bir şehir adı gir.")
            return
        self._start_geocode_and_load(q)

    def on_reload(self):
        if not self.selected_location:
            self.on_search()
            return
        loc = self.selected_location
        self._start_load_forecast(loc, force_refresh=True)

    def on_location_selected(self, _evt=None):
        idx = self.combo_locations.current()
        if idx < 0:
            return
        locs = getattr(self, "_last_geocoded", [])
        if 0 <= idx < len(locs):
            self.selected_location = locs[idx]
            self._set_status(f"Seçildi: {self.selected_location.name}, {self.selected_location.country}")
            self._start_load_forecast(self.selected_location, force_refresh=False)

    def _start_geocode_and_load(self, query: str):
        self._set_status("Şehir aranıyor…")
        self.btn_search.config(state="disabled")
        self.btn_reload.config(state="disabled")

        def worker():
            try:
                locs = self.client.geocode(query)
                self.after(0, lambda: self._on_geocoded(query, locs))
            except (HTTPError, URLError, TimeoutError) as e:
                self.after(0, lambda: self._on_error(f"Ağ hatası: {e}"))
            except Exception as e:
                self.after(0, lambda: self._on_error(f"Beklenmeyen hata: {e}"))

        threading.Thread(target=worker, daemon=True).start()

    def _on_geocoded(self, query: str, locs: list[Location]):
        self.btn_search.config(state="normal")
        self.btn_reload.config(state="normal")

        if not locs:
            self._set_status("Konum bulunamadı.")
            messagebox.showinfo(APP_NAME, f"'{query}' için sonuç bulunamadı. Farklı yazmayı dene.")
            return

        self._last_geocoded = locs
        values = [f"{l.name}, {l.country}  ({l.latitude:.3f}, {l.longitude:.3f})" for l in locs]
        self.combo_locations["values"] = values
        self.combo_locations.current(0)
        self.selected_location = locs[0]
        self._set_status(f"Konum bulundu: {values[0]}")
        self._start_load_forecast(self.selected_location, force_refresh=False)

    def _start_load_forecast(self, loc: Location, force_refresh: bool):
        self._set_status("Tahmin yükleniyor…")
        self.btn_reload.config(state="disabled")

        # Open-Meteo günlük tahmin ufku sınırlı. Takvim için: bugünden başlayıp ~16 gün.
        start = today_local()
        end = start + dt.timedelta(days=15)

        cache_key = f"{loc.latitude:.4f},{loc.longitude:.4f}|{loc.timezone}|{start.isoformat()}|{end.isoformat()}"
        if not force_refresh and cache_key in self.cache:
            try:
                payload = self.cache[cache_key]
                self._apply_forecast_payload(payload, loc)
                self._set_status("Cache üzerinden yüklendi.")
                self.btn_reload.config(state="normal")
                return
            except Exception:
                pass

        def worker():
            try:
                payload = self.client.daily_forecast(loc, start, end)
                self.cache[cache_key] = payload
                save_cache(self.cache)
                self.after(0, lambda: self._on_forecast_loaded(payload, loc))
            except (HTTPError, URLError, TimeoutError) as e:
                self.after(0, lambda: self._on_error(f"Ağ hatası: {e}"))
            except Exception as e:
                self.after(0, lambda: self._on_error(f"Beklenmeyen hata: {e}"))

        threading.Thread(target=worker, daemon=True).start()

    def _on_forecast_loaded(self, payload: dict, loc: Location):
        self.btn_reload.config(state="normal")
        self._apply_forecast_payload(payload, loc)
        self._set_status(f"Tahmin yüklendi: {loc.name}, {loc.country}")

    def _on_error(self, msg: str):
        self.btn_search.config(state="normal")
        self.btn_reload.config(state="normal")
        self._set_status(msg)
        messagebox.showerror(APP_NAME, msg)

    def _apply_forecast_payload(self, payload: dict, loc: Location):
        daily = (payload.get("daily") or {})
        dates = daily.get("time") or []
        tmax = daily.get("temperature_2m_max") or []
        tmin = daily.get("temperature_2m_min") or []
        precip = daily.get("precipitation_sum") or []
        wind = daily.get("windspeed_10m_max") or []
        sunrise = daily.get("sunrise") or []
        sunset = daily.get("sunset") or []
        wcode = daily.get("weathercode") or []

        self.day_data = {}
        n = len(dates)
        for i in range(n):
            try:
                d = dt.date.fromisoformat(dates[i])
            except Exception:
                continue
            dw = DayWeather(
                date=d,
                t_min=safe_float(tmin[i]) if i < len(tmin) else None,
                t_max=safe_float(tmax[i]) if i < len(tmax) else None,
                precip_sum=safe_float(precip[i]) if i < len(precip) else None,
                wind_max=safe_float(wind[i]) if i < len(wind) else None,
                sunrise=str(sunrise[i]) if i < len(sunrise) else None,
                sunset=str(sunset[i]) if i < len(sunset) else None,
                weather_code=int(wcode[i]) if i < len(wcode) and wcode[i] is not None else None,
            )
            self.day_data[d.isoformat()] = dw

        # varsayılan seçili gün: bugün (varsa)
        td = today_local()
        if td.isoformat() in self.day_data:
            self.selected_date = td
            self._render_day_detail(td)
        else:
            self.selected_date = None
            self.var_day_title.set("Gün detayı")
            self.var_day_sub.set("Tahmin aralığında bir gün seç.")
            self.var_day_metrics.set("")

        self._render_calendar()

    # -------- calendar render --------
    def _clear_calendar(self):
        for child in self.cal_grid.winfo_children():
            child.destroy()
        self.day_buttons = []

    def _render_calendar(self):
        self._clear_calendar()
        year, month = self.current_year, self.current_month
        cal = calendar.Calendar(firstweekday=0)  # 0: Monday

        month_days = list(cal.itermonthdates(year, month))
        # itermonthdates çoğu zaman 5-6 hafta verir; biz 6 satır garantileyelim
        while len(month_days) < 42:
            month_days.append(month_days[-1] + dt.timedelta(days=1))
        month_days = month_days[:42]

        for idx, d in enumerate(month_days):
            r = idx // 7
            c = idx % 7

            in_month = (d.month == month)
            iso = d.isoformat()
            dw = self.day_data.get(iso)

            title = f"{d.day}"
            sub1 = ""
            sub2 = ""

            if dw and dw.t_min is not None and dw.t_max is not None:
                sub1 = f"{dw.t_min:.0f}° / {dw.t_max:.0f}°"
                sub2 = short_label(dw.weather_code)
            elif in_month:
                sub1 = "—"
                sub2 = ""

            text = f"{title}\n{sub1}\n{sub2}"

            state = "normal" if (in_month and dw is not None) else "disabled"

            btn = ttk.Button(
                self.cal_grid,
                text=text,
                style="Day.TButton",
                state=state,
                command=lambda dd=d: self.on_day_click(dd)
            )
            btn.grid(row=r, column=c, sticky="nsew", padx=6, pady=6)

            # görsel vurgu: bugün ve seçili gün
            if in_month:
                if d == today_local():
                    btn.configure(text=text + "\nBugün")
                if self.selected_date and d == self.selected_date and state == "normal":
                    # ttk buton background değiştirmek tema bazlı sınırlı; kenar simülasyonu için container ekleyebilirdik.
                    btn.configure(text=text + "\nSeçili")

            self.day_buttons.append(btn)

    def on_day_click(self, d: dt.date):
        iso = d.isoformat()
        if iso not in self.day_data:
            return
        self.selected_date = d
        self._render_day_detail(d)
        self._render_calendar()

    def _render_day_detail(self, d: dt.date):
        dw = self.day_data.get(d.isoformat())
        if not dw:
            return

        months_tr = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"]
        self.var_day_title.set(f"{d.day} {months_tr[d.month-1]} {d.year}")
        self.var_day_sub.set(weather_code_label(dw.weather_code))

        lines = []

        if dw.t_min is not None and dw.t_max is not None:
            lines.append(f"Sıcaklık: {dw.t_min:.1f}° – {dw.t_max:.1f}°")
        else:
            lines.append("Sıcaklık: —")

        if dw.precip_sum is not None:
            lines.append(f"Yağış: {dw.precip_sum:.1f} mm")
        else:
            lines.append("Yağış: —")

        if dw.wind_max is not None:
            lines.append(f"Rüzgar (maks): {dw.wind_max:.1f} km/sa")
        else:
            lines.append("Rüzgar (maks): —")

        if dw.sunrise and dw.sunset:
            # ISO datetime gelebilir; sadece saat kısmını ayıkla
            sr = dw.sunrise.split("T")[-1][:5]
            ss = dw.sunset.split("T")[-1][:5]
            lines.append(f"Gün doğumu/batımı: {sr} / {ss}")
        else:
            lines.append("Gün doğumu/batımı: —")

        self.var_day_metrics.set("\n".join(lines))


if __name__ == "__main__":
    try:
        app = WeatherCalendarApp()
        app.mainloop()
    except Exception as e:
        # GUI açılmazsa terminale düşsün
        print(f"Uygulama başlatılamadı: {e}")
