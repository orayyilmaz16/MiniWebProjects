import tkinter as tk
from tkinter import filedialog, messagebox
import json
import os

FILES_PATH = "files.json"
SETTINGS_PATH = "settings.json"


class FileStore:
    def __init__(self):
        self.files = []

    def load(self):
        if os.path.exists(FILES_PATH):
            with open(FILES_PATH, "r", encoding="utf-8") as f:
                self.files = json.load(f)

    def save(self):
        with open(FILES_PATH, "w", encoding="utf-8") as f:
            json.dump(self.files, f, indent=2)


class SettingsStore:
    def __init__(self):
        self.auto_save_interval = 60

    def load(self):
        if os.path.exists(SETTINGS_PATH):
            with open(SETTINGS_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                self.auto_save_interval = data.get("auto_save_interval", 60)

    def save(self):
        with open(SETTINGS_PATH, "w", encoding="utf-8") as f:
            json.dump(
                {"auto_save_interval": self.auto_save_interval},
                f,
                indent=2
            )


class App(tk.Tk):
    def __init__(self):
        super().__init__()

        self.title("Modern File Manager")
        self.geometry("500x350")

        self.store = FileStore()
        self.settings = SettingsStore()

        self.settings.load()
        self.store.load()

        self.create_widgets()
        self.populate_list()

        self.protocol("WM_DELETE_WINDOW", self.on_close)
        self.schedule_auto_save()

    # ---------- UI ----------
    def create_widgets(self):
        self.listbox = tk.Listbox(self)
        self.listbox.pack(fill=tk.BOTH, expand=True, padx=10, pady=10)

        btn_frame = tk.Frame(self)
        btn_frame.pack(pady=5)

        tk.Button(btn_frame, text="Add", command=self.add_file).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Remove", command=self.remove_file).pack(side=tk.LEFT, padx=5)
        tk.Button(btn_frame, text="Save", command=self.manual_save).pack(side=tk.LEFT, padx=5)

    def populate_list(self):
        self.listbox.delete(0, tk.END)
        for file in self.store.files:
            self.listbox.insert(tk.END, file)

    # ---------- Actions ----------
    def add_file(self):
        path = filedialog.askopenfilename()
        if path and path not in self.store.files:
            self.store.files.append(path)
            self.listbox.insert(tk.END, path)

    def remove_file(self):
        for index in reversed(self.listbox.curselection()):
            self.store.files.pop(index)
            self.listbox.delete(index)

    def manual_save(self):
        self.store.save()
        messagebox.showinfo("Saved", "Files saved successfully.")

    # ---------- Auto Save ----------
    def schedule_auto_save(self):
        self.store.save()
        self.after(self.settings.auto_save_interval * 1000, self.schedule_auto_save)

    # ---------- Close ----------
    def on_close(self):
        self.store.save()
        self.settings.save()
        self.destroy()


if __name__ == "__main__":
    App().mainloop()
