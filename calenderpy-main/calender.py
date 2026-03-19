import json
import os
import re
import calendar as pycal
from dataclasses import dataclass, asdict
from datetime import date, datetime
import tkinter as tk
from tkinter import ttk, messagebox


# ----------------------------
# Data model
# ----------------------------

@dataclass
class Event:
    id: str
    title: str
    time: str = ""         # "HH:MM" veya boş
    category: str = "Genel"
    note: str = ""


class Storage:
    def __init__(self, path: str):
        self.path = path

    def load(self) -> dict:
        if not os.path.exists(self.path):
            return {"events": {}, "categories": default_categories()}
        try:
            with open(self.path, "r", encoding="utf-8") as f:
                data = json.load(f)
            if "events" not in data:
                data["events"] = {}
            if "categories" not in data:
                data["categories"] = default_categories()
            return data
        except Exception:
            return {"events": {}, "categories": default_categories()}

    def save(self, data: dict) -> None:
        tmp = self.path + ".tmp"
        with open(tmp, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp, self.path)


def default_categories():
    # Modern, sakin renk paleti
    return {
        "Genel": {"color": "#6B7280"},
        "İş": {"color": "#2563EB"},
        "Kişisel": {"color": "#7C3AED"},
        "Sağlık": {"color": "#059669"},
        "Acil": {"color": "#DC2626"},
    }


def iso(d: date) -> str:
    return d.isoformat()


def new_id(prefix="evt") -> str:
    return f"{prefix}_{int(datetime.now().timestamp() * 1000)}"


def clamp_month(year: int, month: int):
    if month < 1:
        return year - 1, 12
    if month > 12:
        return year + 1, 1
    return year, month


def is_valid_time(s: str) -> bool:
    if not s.strip():
        return True
    return bool(re.match(r"^(?:[01]\d|2[0-3]):[0-5]\d$", s.strip()))


# ----------------------------
# UI
# ----------------------------

class CalendarApp(ttk.Frame):
    def __init__(self, master: tk.Tk, storage: Storage):
        super().__init__(master)
        self.master = master
        self.storage = storage
        self.data = self.storage.load()

        today = date.today()
        self.view_year = today.year
        self.view_month = today.month
        self.selected_date = today

        self.search_query = tk.StringVar(value="")
        self.status_text = tk.StringVar(value="Hazır")

        self._build_styles()
        self._build_layout()
        self._bind_shortcuts()

        self._render_month()
        self._render_day_panel()

    # ---------- Styling ----------

    def _build_styles(self):
        style = ttk.Style()
        try:
            style.theme_use("clam")
        except Exception:
            pass

        self.colors = {
            "bg": "#0B1220",
            "panel": "#0F1A2B",
            "card": "#121F33",
            "muted": "#94A3B8",
            "text": "#E5E7EB",
            "accent": "#22C55E",
            "line": "#1F2A40",
            "warning": "#F59E0B",
        }

        self.master.configure(bg=self.colors["bg"])

        style.configure(".", font=("Segoe UI", 10), foreground=self.colors["text"])
        style.configure("TFrame", background=self.colors["bg"])
        style.configure("Panel.TFrame", background=self.colors["panel"])
        style.configure("Card.TFrame", background=self.colors["card"])

        style.configure("Topbar.TFrame", background=self.colors["panel"])
        style.configure("Title.TLabel", background=self.colors["panel"], foreground=self.colors["text"], font=("Segoe UI Semibold", 14))
        style.configure("Muted.TLabel", background=self.colors["panel"], foreground=self.colors["muted"])

        style.configure("TButton", padding=8)
        style.configure("Primary.TButton", background=self.colors["accent"], foreground="#06210F")
        style.map("Primary.TButton",
                  background=[("active", "#16A34A")],
                  foreground=[("active", "#03150A")])

        style.configure("Tool.TButton", background=self.colors["card"])
        style.map("Tool.TButton", background=[("active", "#172A46")])

        style.configure("TEntry", fieldbackground="#0B1629", background="#0B1629", foreground=self.colors["text"])
        style.configure("TCombobox", fieldbackground="#0B1629", background="#0B1629", foreground=self.colors["text"])
        style.map("TCombobox", fieldbackground=[("readonly", "#0B1629")])

        style.configure("Treeview",
                        background="#0B1629",
                        fieldbackground="#0B1629",
                        foreground=self.colors["text"],
                        rowheight=28,
                        borderwidth=0)
        style.configure("Treeview.Heading",
                        background=self.colors["panel"],
                        foreground=self.colors["muted"],
                        relief="flat")
        style.map("Treeview", background=[("selected", "#1B2E52")])

    # ---------- Layout ----------

    def _build_layout(self):
        self.master.title("Takvim Pro (Tkinter)")
        self.master.geometry("1200x720")
        self.master.minsize(1000, 640)

        self.grid(row=0, column=0, sticky="nsew")
        self.master.grid_rowconfigure(0, weight=1)
        self.master.grid_columnconfigure(0, weight=1)

        # Topbar
        self.topbar = ttk.Frame(self, style="Topbar.TFrame")
        self.topbar.grid(row=0, column=0, columnspan=2, sticky="ew")
        self.topbar.grid_columnconfigure(0, weight=1)
        self.topbar.grid_columnconfigure(1, weight=0)

        left = ttk.Frame(self.topbar, style="Topbar.TFrame")
        left.grid(row=0, column=0, sticky="ew", padx=16, pady=12)
        left.grid_columnconfigure(0, weight=0)
        left.grid_columnconfigure(1, weight=1)

        ttk.Label(left, text="Takvim Pro", style="Title.TLabel").grid(row=0, column=0, sticky="w")
        ttk.Label(left, text="Ay görünümü + etkinlik yönetimi", style="Muted.TLabel").grid(row=1, column=0, sticky="w", pady=(2, 0))

        right = ttk.Frame(self.topbar, style="Topbar.TFrame")
        right.grid(row=0, column=1, sticky="e", padx=16, pady=12)

        ttk.Label(right, textvariable=self.status_text, style="Muted.TLabel").grid(row=0, column=0, sticky="e")

        # Main area: left month view, right day panel
        self.main = ttk.Frame(self)
        self.main.grid(row=1, column=0, sticky="nsew", padx=12, pady=12)
        self.grid_rowconfigure(1, weight=1)
        self.grid_columnconfigure(0, weight=1)

        self.main.grid_columnconfigure(0, weight=3)
        self.main.grid_columnconfigure(1, weight=2)
        self.main.grid_rowconfigure(0, weight=1)

        # Month panel
        self.month_panel = ttk.Frame(self.main, style="Panel.TFrame")
        self.month_panel.grid(row=0, column=0, sticky="nsew", padx=(0, 10))
        self.month_panel.grid_rowconfigure(2, weight=1)
        self.month_panel.grid_columnconfigure(0, weight=1)

        # Month header controls
        header = ttk.Frame(self.month_panel, style="Panel.TFrame")
        header.grid(row=0, column=0, sticky="ew", padx=14, pady=(14, 8))
        header.grid_columnconfigure(2, weight=1)

        ttk.Button(header, text="◀", style="Tool.TButton", width=3, command=self.prev_month).grid(row=0, column=0, sticky="w")
        ttk.Button(header, text="▶", style="Tool.TButton", width=3, command=self.next_month).grid(row=0, column=1, sticky="w", padx=(8, 0))

        self.month_title = ttk.Label(header, text="", style="Title.TLabel")
        self.month_title.grid(row=0, column=2, sticky="w", padx=(12, 0))

        ttk.Button(header, text="Bugün", style="Primary.TButton", command=self.go_today).grid(row=0, column=3, sticky="e")

        # Search row
        search_row = ttk.Frame(self.month_panel, style="Panel.TFrame")
        search_row.grid(row=1, column=0, sticky="ew", padx=14, pady=(0, 10))
        search_row.grid_columnconfigure(1, weight=1)

        ttk.Label(search_row, text="Arama", style="Muted.TLabel").grid(row=0, column=0, sticky="w")
        self.search_entry = ttk.Entry(search_row, textvariable=self.search_query)
        self.search_entry.grid(row=0, column=1, sticky="ew", padx=(10, 10))
        ttk.Button(search_row, text="Temizle", style="Tool.TButton", command=self.clear_search).grid(row=0, column=2, sticky="e")

        self.search_query.trace_add("write", lambda *_: self._render_day_panel())

        # Month grid container
        self.grid_container = ttk.Frame(self.month_panel, style="Card.TFrame")
        self.grid_container.grid(row=2, column=0, sticky="nsew", padx=14, pady=(0, 14))
        self.grid_container.grid_columnconfigure(0, weight=1)
        self.grid_container.grid_rowconfigure(1, weight=1)

        # Weekday header
        self.week_header = ttk.Frame(self.grid_container, style="Card.TFrame")
        self.week_header.grid(row=0, column=0, sticky="ew", padx=10, pady=(10, 4))
        for i, wd in enumerate(["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"]):
            lbl = ttk.Label(self.week_header, text=wd, foreground=self.colors["muted"], background=self.colors["card"])
            lbl.grid(row=0, column=i, sticky="ew", padx=6)
            self.week_header.grid_columnconfigure(i, weight=1)

        self.days_grid = ttk.Frame(self.grid_container, style="Card.TFrame")
        self.days_grid.grid(row=1, column=0, sticky="nsew", padx=10, pady=(0, 10))
        for c in range(7):
            self.days_grid.grid_columnconfigure(c, weight=1, uniform="daycol")
        for r in range(6):
            self.days_grid.grid_rowconfigure(r, weight=1, uniform="dayrow")

        # Day details panel
        self.day_panel = ttk.Frame(self.main, style="Panel.TFrame")
        self.day_panel.grid(row=0, column=1, sticky="nsew")
        self.day_panel.grid_rowconfigure(3, weight=1)
        self.day_panel.grid_columnconfigure(0, weight=1)

        day_header = ttk.Frame(self.day_panel, style="Panel.TFrame")
        day_header.grid(row=0, column=0, sticky="ew", padx=14, pady=(14, 8))
        day_header.grid_columnconfigure(0, weight=1)

        self.day_title = ttk.Label(day_header, text="", style="Title.TLabel")
        self.day_title.grid(row=0, column=0, sticky="w")

        btns = ttk.Frame(day_header, style="Panel.TFrame")
        btns.grid(row=0, column=1, sticky="e")

        ttk.Button(btns, text="Etkinlik ekle", style="Primary.TButton", command=self.add_event_dialog).grid(row=0, column=0, padx=(0, 8))
        ttk.Button(btns, text="Düzenle", style="Tool.TButton", command=self.edit_selected_event).grid(row=0, column=1, padx=(0, 8))
        ttk.Button(btns, text="Sil", style="Tool.TButton", command=self.delete_selected_event).grid(row=0, column=2)

        # Selected day quick info
        self.day_meta = ttk.Label(self.day_panel, text="", style="Muted.TLabel")
        self.day_meta.grid(row=1, column=0, sticky="ew", padx=14, pady=(0, 10))

        # Event list
        table_wrap = ttk.Frame(self.day_panel, style="Card.TFrame")
        table_wrap.grid(row=3, column=0, sticky="nsew", padx=14, pady=(0, 14))
        table_wrap.grid_rowconfigure(0, weight=1)
        table_wrap.grid_columnconfigure(0, weight=1)

        self.tree = ttk.Treeview(table_wrap, columns=("time", "title", "category"), show="headings", selectmode="browse")
        self.tree.heading("time", text="Saat")
        self.tree.heading("title", text="Başlık")
        self.tree.heading("category", text="Kategori")
        self.tree.column("time", width=80, anchor="center")
        self.tree.column("title", width=260, anchor="w")
        self.tree.column("category", width=120, anchor="center")
        self.tree.grid(row=0, column=0, sticky="nsew", padx=10, pady=10)

        self.tree.bind("<Double-1>", lambda e: self.edit_selected_event())

        # Footer
        self.footer = ttk.Frame(self, style="Panel.TFrame")
        self.footer.grid(row=2, column=0, columnspan=2, sticky="ew")
        self.footer.grid_columnconfigure(0, weight=1)

        ttk.Label(self.footer, text="Kısayollar: Ctrl+N (ekle), Ctrl+F (arama), ←/→ (ay), T (bugün)", style="Muted.TLabel") \
            .grid(row=0, column=0, sticky="w", padx=16, pady=10)

    def _bind_shortcuts(self):
        self.master.bind("<Control-n>", lambda e: self.add_event_dialog())
        self.master.bind("<Control-f>", lambda e: self.search_entry.focus_set())
        self.master.bind("<Left>", lambda e: self.prev_month())
        self.master.bind("<Right>", lambda e: self.next_month())
        self.master.bind("<KeyPress-t>", lambda e: self.go_today())

    # ---------- Month rendering ----------

    def _render_month(self):
        for child in self.days_grid.winfo_children():
            child.destroy()

        month_name = datetime(self.view_year, self.view_month, 1).strftime("%B %Y")
        # Türkçe ay adı için sistem locale'ine bağlı kalmamak adına basit çözüm:
        tr_months = {
            "January": "Ocak", "February": "Şubat", "March": "Mart", "April": "Nisan",
            "May": "Mayıs", "June": "Haziran", "July": "Temmuz", "August": "Ağustos",
            "September": "Eylül", "October": "Ekim", "November": "Kasım", "December": "Aralık"
        }
        for en, tr in tr_months.items():
            month_name = month_name.replace(en, tr)
        self.month_title.config(text=month_name)

        cal = pycal.Calendar(firstweekday=0)  # Monday
        weeks = cal.monthdatescalendar(self.view_year, self.view_month)

        for r, week in enumerate(weeks[:6]):
            for c, d in enumerate(week):
                self._make_day_cell(r, c, d)

        self.status_text.set(f"{self.view_year}-{self.view_month:02d} görüntüleniyor")

    def _make_day_cell(self, r: int, c: int, d: date):
        is_current_month = (d.month == self.view_month)
        is_selected = (d == self.selected_date)
        is_today = (d == date.today())

        cell = tk.Frame(self.days_grid, bg=self.colors["card"], highlightthickness=1)
        cell.grid(row=r, column=c, sticky="nsew", padx=6, pady=6)

        border = self.colors["line"]
        if is_selected:
            border = "#3B82F6"
        elif is_today:
            border = self.colors["accent"]
        cell.configure(highlightbackground=border, highlightcolor=border)

        num_fg = self.colors["text"] if is_current_month else self.colors["muted"]
        num = tk.Label(cell, text=str(d.day), bg=self.colors["card"], fg=num_fg, font=("Segoe UI Semibold", 11))
        num.place(x=10, y=8)

        # Mini event hints (max 2)
        events = self._events_for_date(d)
        hints = events[:2]
        y = 34
        for ev in hints:
            cat_color = self._category_color(ev.category)
            pill = tk.Label(cell, text=f"{ev.time} {ev.title}".strip(),
                            bg="#0B1629", fg=self.colors["text"],
                            font=("Segoe UI", 9), anchor="w")
            pill.place(x=10, y=y, width=150)
            # left color strip
            strip = tk.Frame(cell, bg=cat_color)
            strip.place(x=10, y=y, width=4, height=18)
            y += 22

        if len(events) > 2:
            more = tk.Label(cell, text=f"+{len(events)-2} daha", bg=self.colors["card"], fg=self.colors["muted"], font=("Segoe UI", 9))
            more.place(x=10, y=y)

        def on_click(_=None):
            self.selected_date = d
            self._render_month()
            self._render_day_panel()

        cell.bind("<Button-1>", on_click)
        num.bind("<Button-1>", on_click)

    # ---------- Day panel rendering ----------

    def _render_day_panel(self):
        d = self.selected_date
        self.day_title.config(text=d.strftime("%d.%m.%Y"))
        weekday_tr = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"][d.weekday()]
        self.day_meta.config(text=f"{weekday_tr} • {len(self._events_for_date(d))} etkinlik")

        # Treeview fill
        for item in self.tree.get_children():
            self.tree.delete(item)

        q = self.search_query.get().strip().lower()
        events = self._events_for_date(d)
        if q:
            events = [e for e in events if q in (e.title + " " + e.note).lower()]

        # Sort by time (empty last)
        def sort_key(e: Event):
            return (e.time == "", e.time)

        for ev in sorted(events, key=sort_key):
            self.tree.insert("", "end", iid=ev.id, values=(ev.time or "—", ev.title, ev.category))

    # ---------- Data helpers ----------

    def _events_for_date(self, d: date):
        key = iso(d)
        raw = self.data.get("events", {}).get(key, [])
        events = []
        for obj in raw:
            try:
                events.append(Event(**obj))
            except Exception:
                continue
        return events

    def _set_events_for_date(self, d: date, events: list[Event]):
        key = iso(d)
        self.data.setdefault("events", {})
        self.data["events"][key] = [asdict(e) for e in events]
        self._persist()

    def _persist(self):
        self.storage.save(self.data)

    def _category_color(self, category: str) -> str:
        cats = self.data.get("categories", default_categories())
        if category in cats:
            return cats[category].get("color", "#6B7280")
        return "#6B7280"

    # ---------- Actions ----------

    def prev_month(self):
        self.view_year, self.view_month = clamp_month(self.view_year, self.view_month - 1)
        self._render_month()

    def next_month(self):
        self.view_year, self.view_month = clamp_month(self.view_year, self.view_month + 1)
        self._render_month()

    def go_today(self):
        t = date.today()
        self.selected_date = t
        self.view_year, self.view_month = t.year, t.month
        self._render_month()
        self._render_day_panel()

    def clear_search(self):
        self.search_query.set("")

    def add_event_dialog(self):
        self._event_dialog(mode="add")

    def edit_selected_event(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Bilgi", "Düzenlemek için bir etkinlik seçin.")
            return
        self._event_dialog(mode="edit", event_id=sel[0])

    def delete_selected_event(self):
        sel = self.tree.selection()
        if not sel:
            messagebox.showinfo("Bilgi", "Silmek için bir etkinlik seçin.")
            return
        event_id = sel[0]
        events = self._events_for_date(self.selected_date)
        events = [e for e in events if e.id != event_id]
        self._set_events_for_date(self.selected_date, events)
        self._render_month()
        self._render_day_panel()
        self.status_text.set("Etkinlik silindi")

    # ---------- Dialog ----------

    def _event_dialog(self, mode: str, event_id: str | None = None):
        existing = None
        if mode == "edit":
            events = self._events_for_date(self.selected_date)
            for e in events:
                if e.id == event_id:
                    existing = e
                    break
            if not existing:
                messagebox.showerror("Hata", "Etkinlik bulunamadı.")
                return

        win = tk.Toplevel(self.master)
        win.title("Etkinlik" if mode == "add" else "Etkinlik düzenle")
        win.configure(bg=self.colors["bg"])
        win.geometry("520x360")
        win.resizable(False, False)
        win.transient(self.master)
        win.grab_set()

        wrap = ttk.Frame(win, style="Panel.TFrame")
        wrap.pack(fill="both", expand=True, padx=14, pady=14)

        ttk.Label(wrap, text="Etkinlik detayları", style="Title.TLabel").grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 8))
        ttk.Label(wrap, text=f"Tarih: {self.selected_date.strftime('%d.%m.%Y')}", style="Muted.TLabel").grid(row=1, column=0, columnspan=2, sticky="w", pady=(0, 14))

        title_var = tk.StringVar(value=(existing.title if existing else ""))
        time_var = tk.StringVar(value=(existing.time if existing else ""))
        cat_var = tk.StringVar(value=(existing.category if existing else "Genel"))
        note_var = tk.StringVar(value=(existing.note if existing else ""))

        ttk.Label(wrap, text="Başlık", style="Muted.TLabel").grid(row=2, column=0, sticky="w")
        title_entry = ttk.Entry(wrap, textvariable=title_var)
        title_entry.grid(row=2, column=1, sticky="ew", padx=(10, 0))

        ttk.Label(wrap, text="Saat (HH:MM)", style="Muted.TLabel").grid(row=3, column=0, sticky="w", pady=(10, 0))
        time_entry = ttk.Entry(wrap, textvariable=time_var)
        time_entry.grid(row=3, column=1, sticky="ew", padx=(10, 0), pady=(10, 0))

        ttk.Label(wrap, text="Kategori", style="Muted.TLabel").grid(row=4, column=0, sticky="w", pady=(10, 0))
        cats = list(self.data.get("categories", default_categories()).keys())
        cat_combo = ttk.Combobox(wrap, textvariable=cat_var, values=cats, state="readonly")
        cat_combo.grid(row=4, column=1, sticky="ew", padx=(10, 0), pady=(10, 0))

        ttk.Label(wrap, text="Not", style="Muted.TLabel").grid(row=5, column=0, sticky="nw", pady=(10, 0))
        note = tk.Text(wrap, height=6, bg="#0B1629", fg=self.colors["text"], insertbackground=self.colors["text"],
                       relief="flat", highlightthickness=1, highlightbackground=self.colors["line"])
        note.grid(row=5, column=1, sticky="ew", padx=(10, 0), pady=(10, 0))
        note.insert("1.0", note_var.get())

        wrap.grid_columnconfigure(1, weight=1)

        btn_row = ttk.Frame(wrap, style="Panel.TFrame")
        btn_row.grid(row=6, column=0, columnspan=2, sticky="e", pady=(16, 0))

        def on_save():
            title = title_var.get().strip()
            t = time_var.get().strip()
            category = cat_var.get().strip() or "Genel"
            n = note.get("1.0", "end").strip()

            if not title:
                messagebox.showwarning("Uyarı", "Başlık boş olamaz.")
                return
            if not is_valid_time(t):
                messagebox.showwarning("Uyarı", "Saat formatı geçersiz. Örn: 09:30")
                return

            events = self._events_for_date(self.selected_date)
            if mode == "add":
                ev = Event(id=new_id(), title=title, time=t, category=category, note=n)
                events.append(ev)
                self.status_text.set("Etkinlik eklendi")
            else:
                for i, ev in enumerate(events):
                    if ev.id == existing.id:
                        events[i] = Event(id=existing.id, title=title, time=t, category=category, note=n)
                        break
                self.status_text.set("Etkinlik güncellendi")

            self._set_events_for_date(self.selected_date, events)
            self._render_month()
            self._render_day_panel()
            win.destroy()

        ttk.Button(btn_row, text="İptal", style="Tool.TButton", command=win.destroy).grid(row=0, column=0, padx=(0, 10))
        ttk.Button(btn_row, text="Kaydet", style="Primary.TButton", command=on_save).grid(row=0, column=1)

        title_entry.focus_set()

# ----------------------------
# Boot
# ----------------------------

def main():
    root = tk.Tk()
    app = CalendarApp(root, Storage("calendar_data.json"))
    app.pack(fill="both", expand=True)
    root.mainloop()

if __name__ == "__main__":
    main()
