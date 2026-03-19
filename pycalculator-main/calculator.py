import tkinter as tk
from tkinter import messagebox
import math
import re

class BilimselHesapMakinesi:
    def __init__(self, root):
        self.root = root
        self.root.title("Bilimsel Hesap Makinesi")
        self.root.geometry("420x650")
        self.root.config(bg="#121212")
        self.root.resizable(False, False)

        # ===== BAŞLIK =====
        header = tk.Frame(root, bg="#1f1f1f", height=50)
        header.pack(fill="x")

        title = tk.Label(
            header, text="BİLİMSEL HESAP MAKİNESİ",
            font=("Segoe UI", 14, "bold"),
            fg="#4CAF50", bg="#1f1f1f"
        )
        title.pack(pady=10)

        # ===== EKRAN =====
        self.ekran = tk.Entry(
            root,
            font=("Segoe UI", 26),
            bg="#2b2b2b",
            fg="white",
            bd=0,
            justify="right",
            insertbackground="white"
        )
        self.ekran.pack(fill="x", padx=15, pady=15, ipady=15)

        # ===== BUTON ALANI =====
        self.frame = tk.Frame(root, bg="#121212")
        self.frame.pack(expand=True, fill="both", padx=10, pady=10)

        butonlar = [
            ["sin", "cos", "tan", "√"],
            ["log", "ln", "^", "C"],
            ["7", "8", "9", "/"],
            ["4", "5", "6", "*"],
            ["1", "2", "3", "-"],
            ["0", ".", "π", "+"],
        ]

        for r, satir in enumerate(butonlar):
            for c, b in enumerate(satir):
                self.buton_olustur(b, r, c)

        # "=" butonu
        esittir = tk.Button(
            self.frame,
            text="=",
            font=("Segoe UI", 22, "bold"),
            bg="#4CAF50",
            fg="white",
            bd=0,
            command=self.hesapla
        )
        esittir.grid(row=6, column=0, columnspan=4, sticky="nsew", padx=5, pady=10)

        for i in range(7):
            self.frame.rowconfigure(i, weight=1)
        for i in range(4):
            self.frame.columnconfigure(i, weight=1)

    def buton_olustur(self, text, row, col):
        renk = "#2e2e2e"
        if text in ["sin", "cos", "tan", "log", "ln", "√", "^", "π"]:
            renk = "#37474F"
        if text == "C":
            renk = "#B71C1C"

        btn = tk.Button(
            self.frame,
            text=text,
            font=("Segoe UI", 16),
            bg=renk,
            fg="white",
            bd=0,
            command=lambda x=text: self.tikla(x)
        )
        btn.grid(row=row, column=col, sticky="nsew", padx=5, pady=5)

        btn.bind("<Enter>", lambda e: btn.config(bg="#455A64"))
        btn.bind("<Leave>", lambda e: btn.config(bg=renk))

    def tikla(self, tus):
        if tus == "C":
            self.ekran.delete(0, tk.END)
            return

        if tus == "√":
            self.ekran.insert(tk.END, "math.sqrt(")
        elif tus == "^":
            self.ekran.insert(tk.END, "**")
        elif tus == "π":
            self.ekran.insert(tk.END, "math.pi")
        elif tus in ["sin", "cos", "tan"]:
            self.ekran.insert(tk.END, f"math.{tus}(")
        elif tus == "log":
            self.ekran.insert(tk.END, "math.log10(")
        elif tus == "ln":
            self.ekran.insert(tk.END, "math.log(")
        else:
            self.ekran.insert(tk.END, tus)

    def hesapla(self):
        ifade = self.ekran.get()

        if not ifade:
            messagebox.showerror("Hata", "İşlem girilmedi.")
            return

        try:
            sonuc = eval(ifade, {"__builtins__": None, "math": math})
            self.ekran.delete(0, tk.END)
            self.ekran.insert(tk.END, str(sonuc))
        except ZeroDivisionError:
            messagebox.showerror("Hata", "Sıfıra bölme hatası.")
        except:
            messagebox.showerror("Hata", "Geçersiz işlem.")

if __name__ == "__main__":
    root = tk.Tk()
    BilimselHesapMakinesi(root)
    root.mainloop()
