import tkinter as tk
from tkinter import ttk, messagebox
import json
import datetime
import matplotlib.pyplot as plt
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg

DATA_FILE = "tasks.json"

# -----------------------------
# STORAGE
# -----------------------------
def load_tasks():
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                return data
            return []
    except:
        return []

def save_tasks(tasks):
    try:
        with open(DATA_FILE, "w", encoding="utf-8") as f:
            json.dump(tasks, f, indent=4, ensure_ascii=False)
    except Exception as e:
        messagebox.showerror("Kayıt Hatası", f"Veri kaydedilirken hata oluştu:\n{e}")

# -----------------------------
# THEMES
# -----------------------------
THEMES = {
    "light": {
        "bg": "#f5f5f5",
        "card": "#ffffff",
        "text": "#222222",
        "accent": "#4a90e2"
    },
    "dark": {
        "bg": "#1e1e1e",
        "card": "#2a2a2a",
        "text": "#e0e0e0",
        "accent": "#4a90e2"
    },
    "glass": {
        "bg": "#e6e6e6",
        "card": "#ffffff",
        "text": "#333333",
        "accent": "#4a90e2"
    }
}

# -----------------------------
# MAIN APP
# -----------------------------
class StudyApp(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("Study Manager Pro")
        self.geometry("1100x650")
        self.minsize(900, 550)

        self.tasks = load_tasks()
        self.current_theme = "light"
        self.current_page = "tasks"  # tasks / dashboard / pomodoro

        self.sidebar = None
        self.content = None
        self.drag_index = None

        self.apply_theme()
        self.create_ui()

    # -----------------------------
    # UI
    # -----------------------------
    def create_ui(self):
        # Ana arka plan
        self.configure(bg=self.theme["bg"])

        # Sidebar
        if self.sidebar:
            self.sidebar.destroy()
        self.sidebar = tk.Frame(self, bg=self.theme["card"], width=220)
        self.sidebar.pack(side="left", fill="y")

        tk.Label(
            self.sidebar,
            text="📘 Study Manager Pro",
            bg=self.theme["card"],
            fg=self.theme["text"],
            font=("Segoe UI", 14, "bold")
        ).pack(pady=20)

        ttk.Button(self.sidebar, text="Görevler", command=self.show_tasks).pack(fill="x", padx=10, pady=5)
        ttk.Button(self.sidebar, text="Dashboard", command=self.show_dashboard).pack(fill="x", padx=10, pady=5)
        ttk.Button(self.sidebar, text="Pomodoro", command=self.show_pomodoro).pack(fill="x", padx=10, pady=5)

        ttk.Separator(self.sidebar, orient="horizontal").pack(fill="x", padx=10, pady=15)

        ttk.Button(self.sidebar, text="Tema: Light", command=lambda: self.change_theme("light")).pack(fill="x", padx=10, pady=5)
        ttk.Button(self.sidebar, text="Tema: Dark", command=lambda: self.change_theme("dark")).pack(fill="x", padx=10, pady=5)
        ttk.Button(self.sidebar, text="Tema: Glass", command=lambda: self.change_theme("glass")).pack(fill="x", padx=10, pady=5)

        # Main content
        if self.content:
            self.content.destroy()
        self.content = tk.Frame(self, bg=self.theme["bg"])
        self.content.pack(side="right", expand=True, fill="both")

        # İlk sayfa
        if self.current_page == "dashboard":
            self.show_dashboard()
        elif self.current_page == "pomodoro":
            self.show_pomodoro()
        else:
            self.show_tasks()

    # -----------------------------
    # THEME SYSTEM
    # -----------------------------
    def change_theme(self, theme_name):
        if theme_name not in THEMES:
            return
        self.current_theme = theme_name
        self.apply_theme()
        self.create_ui()

    def apply_theme(self):
        self.theme = THEMES[self.current_theme]
        self.configure(bg=self.theme["bg"])

    # -----------------------------
    # TASKS PAGE
    # -----------------------------
    def show_tasks(self):
        self.current_page = "tasks"
        self.clear_content()

        tk.Label(
            self.content,
            text="Görevler",
            bg=self.theme["bg"],
            fg=self.theme["text"],
            font=("Segoe UI", 18, "bold")
        ).pack(pady=10)

        form = tk.Frame(self.content, bg=self.theme["bg"])
        form.pack(pady=10)

        # Başlık
        tk.Label(form, text="Başlık:", bg=self.theme["bg"], fg=self.theme["text"]).grid(row=0, column=0, sticky="w", pady=2)
        self.task_title = tk.Entry(form, width=30)
        self.task_title.grid(row=0, column=1, padx=5, pady=2)

        # Öncelik
        tk.Label(form, text="Öncelik:", bg=self.theme["bg"], fg=self.theme["text"]).grid(row=1, column=0, sticky="w", pady=2)
        self.task_priority = ttk.Combobox(form, values=["Düşük", "Orta", "Yüksek", "Kritik"], width=27, state="readonly")
        self.task_priority.grid(row=1, column=1, padx=5, pady=2)
        self.task_priority.set("Orta")

        # Başlangıç
        tk.Label(form, text="Başlangıç (YYYY-MM-DD):", bg=self.theme["bg"], fg=self.theme["text"]).grid(row=2, column=0, sticky="w", pady=2)
        self.task_start = tk.Entry(form, width=30)
        self.task_start.grid(row=2, column=1, padx=5, pady=2)

        # Bitiş
        tk.Label(form, text="Bitiş (YYYY-MM-DD):", bg=self.theme["bg"], fg=self.theme["text"]).grid(row=3, column=0, sticky="w", pady=2)
        self.task_end = tk.Entry(form, width=30)
        self.task_end.grid(row=3, column=1, padx=5, pady=2)

        ttk.Button(form, text="Ekle", command=self.add_task).grid(row=4, column=1, pady=10, sticky="e")

        # Drag & Drop Listbox
        list_frame = tk.Frame(self.content, bg=self.theme["bg"])
        list_frame.pack(fill="both", expand=True, padx=20, pady=10)

        self.task_list = tk.Listbox(
            list_frame,
            height=15,
            bg=self.theme["card"],
            fg=self.theme["text"],
            selectbackground=self.theme["accent"],
            activestyle="none"
        )
        self.task_list.pack(fill="both", expand=True)

        self.task_list.bind("<Button-1>", self.drag_start)
        self.task_list.bind("<B1-Motion>", self.drag_motion)

        self.refresh_task_list()

        btn_frame = tk.Frame(self.content, bg=self.theme["bg"])
        btn_frame.pack(pady=5)

        ttk.Button(btn_frame, text="Sil", command=self.delete_task).grid(row=0, column=0, padx=5)
        ttk.Button(btn_frame, text="Tamamlandı", command=self.complete_task).grid(row=0, column=1, padx=5)

    # -----------------------------
    # DRAG & DROP
    # -----------------------------
    def drag_start(self, event):
        if not self.tasks:
            self.drag_index = None
            return
        self.drag_index = self.task_list.nearest(event.y)

    def drag_motion(self, event):
        if self.drag_index is None or not self.tasks:
            return
        new_index = self.task_list.nearest(event.y)
        if new_index != self.drag_index and 0 <= new_index < len(self.tasks):
            self.tasks[self.drag_index], self.tasks[new_index] = self.tasks[new_index], self.tasks[self.drag_index]
            save_tasks(self.tasks)
            self.refresh_task_list()
            self.task_list.selection_set(new_index)
            self.drag_index = new_index

    # -----------------------------
    # TASK OPERATIONS
    # -----------------------------
    def add_task(self):
        title = self.task_title.get().strip()
        if not title:
            messagebox.showwarning("Uyarı", "Başlık boş olamaz")
            return

        start = self.task_start.get().strip()
        end = self.task_end.get().strip()

        # Tarih format kontrolü (opsiyonel ama düzgün olsun)
        if start:
            try:
                datetime.datetime.strptime(start, "%Y-%m-%d")
            except:
                messagebox.showwarning("Uyarı", "Başlangıç tarihi formatı hatalı (YYYY-MM-DD)")
                return

        if end:
            try:
                datetime.datetime.strptime(end, "%Y-%m-%d")
            except:
                messagebox.showwarning("Uyarı", "Bitiş tarihi formatı hatalı (YYYY-MM-DD)")
                return

        task = {
            "title": title,
            "priority": self.task_priority.get() or "Orta",
            "start": start,
            "end": end,
            "completed": False
        }

        self.tasks.append(task)
        save_tasks(self.tasks)
        self.refresh_task_list()

        self.task_title.delete(0, tk.END)
        self.task_start.delete(0, tk.END)
        self.task_end.delete(0, tk.END)
        self.task_priority.set("Orta")

    def delete_task(self):
        try:
            index = self.task_list.curselection()[0]
        except:
            messagebox.showwarning("Uyarı", "Bir görev seçin")
            return

        if 0 <= index < len(self.tasks):
            del self.tasks[index]
            save_tasks(self.tasks)
            self.refresh_task_list()

    def complete_task(self):
        try:
            index = self.task_list.curselection()[0]
        except:
            messagebox.showwarning("Uyarı", "Bir görev seçin")
            return

        if 0 <= index < len(self.tasks):
            self.tasks[index]["completed"] = True
            save_tasks(self.tasks)
            self.refresh_task_list()

    def refresh_task_list(self):
        self.task_list.delete(0, tk.END)
        for t in self.tasks:
            status = "✔️" if t.get("completed") else "⏳"
            priority = t.get("priority", "Orta")
            duration = self.calculate_duration(t)
            self.task_list.insert(tk.END, f"{status} {t['title']} ({priority}) - {duration}")

    def calculate_duration(self, task):
        start = task.get("start", "").strip()
        end = task.get("end", "").strip()
        if not start or not end:
            return "Tarih yok"
        try:
            start_dt = datetime.datetime.strptime(start, "%Y-%m-%d")
            end_dt = datetime.datetime.strptime(end, "%Y-%m-%d")
            diff = (end_dt - start_dt).days
            if diff < 0:
                return f"{abs(diff)} gün gecikmiş"
            return f"{diff} gün"
        except:
            return "Tarih hatalı"

    # -----------------------------
    # DASHBOARD PAGE
    # -----------------------------
    def show_dashboard(self):
        self.current_page = "dashboard"
        self.clear_content()

        tk.Label(
            self.content,
            text="Dashboard",
            bg=self.theme["bg"],
            fg=self.theme["text"],
            font=("Segoe UI", 18, "bold")
        ).pack(pady=10)

        completed = sum(1 for t in self.tasks if t.get("completed"))
        pending = len(self.tasks) - completed

        if completed == 0 and pending == 0:
            tk.Label(
                self.content,
                text="Henüz görev yok.",
                bg=self.theme["bg"],
                fg=self.theme["text"],
                font=("Segoe UI", 12)
            ).pack(pady=20)
            return

        fig, ax = plt.subplots(figsize=(4, 4))
        ax.pie(
            [completed, pending],
            labels=["Tamamlanan", "Bekleyen"],
            autopct="%1.1f%%",
            colors=["#4caf50", "#ff9800"]
        )
        ax.set_title("Görev Durumu")

        canvas = FigureCanvasTkAgg(fig, master=self.content)
        canvas.draw()
        canvas.get_tk_widget().pack()
        plt.close(fig)

    # -----------------------------
    # POMODORO PAGE
    # -----------------------------
    def show_pomodoro(self):
        self.current_page = "pomodoro"
        self.clear_content()

        tk.Label(
            self.content,
            text="Pomodoro",
            bg=self.theme["bg"],
            fg=self.theme["text"],
            font=("Segoe UI", 18, "bold")
        ).pack(pady=20)

        self.pomodoro_time = 25 * 60
        self.timer_running = False

        self.timer_label = tk.Label(
            self.content,
            text="25:00",
            font=("Segoe UI", 40, "bold"),
            bg=self.theme["bg"],
            fg=self.theme["text"]
        )
        self.timer_label.pack(pady=20)

        btn_frame = tk.Frame(self.content, bg=self.theme["bg"])
        btn_frame.pack(pady=10)

        ttk.Button(btn_frame, text="Başlat", command=self.start_timer).grid(row=0, column=0, padx=5)
        ttk.Button(btn_frame, text="Sıfırla", command=self.reset_timer).grid(row=0, column=1, padx=5)

    def start_timer(self):
        if not self.timer_running:
            self.timer_running = True
            self.update_timer()

    def update_timer(self):
        if self.timer_running:
            mins = self.pomodoro_time // 60
            secs = self.pomodoro_time % 60
            self.timer_label.config(text=f"{mins:02d}:{secs:02d}")

            if self.pomodoro_time > 0:
                self.pomodoro_time -= 1
                self.after(1000, self.update_timer)
            else:
                self.timer_running = False
                messagebox.showinfo("Süre Doldu", "Pomodoro tamamlandı!")

    def reset_timer(self):
        self.timer_running = False
        self.pomodoro_time = 25 * 60
        self.timer_label.config(text="25:00")

    # -----------------------------
    # UTILS
    # -----------------------------
    def clear_content(self):
        for widget in self.content.winfo_children():
            widget.destroy()


# -----------------------------
# RUN APP
# -----------------------------
if __name__ == "__main__":
    app = StudyApp()
    app.mainloop()