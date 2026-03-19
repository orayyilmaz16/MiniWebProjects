from __future__ import annotations

import json
from dataclasses import dataclass, asdict
from datetime import date, datetime
from pathlib import Path
from typing import List, Optional



@dataclass
class Gorev:
    baslik: str
    tamamlandi: bool = False
    oncelik: int = 3  
    son_tarih: Optional[date] = None

    @staticmethod
    def from_line(line: str) -> "Gorev":
        """
        Geriye dönük uyumluluk:
        - JSON satiri ise JSON'dan okur
        - Değilse düz metni baslik kabul eder
        """
        line = line.strip()
        if not line:
            return Gorev(baslik="")

    
        try:
            obj = json.loads(line)
            if isinstance(obj, dict) and "baslik" in obj:
                st = obj.get("son_tarih")
                son_tarih = None
                if st:
                    son_tarih = date.fromisoformat(st)
                return Gorev(
                    baslik=str(obj.get("baslik", "")).strip(),
                    tamamlandi=bool(obj.get("tamamlandi", False)),
                    oncelik=int(obj.get("oncelik", 3)),
                    son_tarih=son_tarih,
                )
        except Exception:
            pass

       
        return Gorev(baslik=line)

    def to_line(self) -> str:
        obj = asdict(self)
        obj["son_tarih"] = self.son_tarih.isoformat() if self.son_tarih else None
        return json.dumps(obj, ensure_ascii=False)



def dosya_yolu_al(dosya_adi: str = "gorevler.txt") -> Path:
    """
    Görev dosyasini script ile ayni klasörde tutar.
    """
    try:
        return Path(__file__).resolve().with_name(dosya_adi)
    except NameError:
        return Path(dosya_adi).resolve()


def gorevleri_dosyadan_oku(dosya_yolu: Path) -> List[Gorev]:
    """
    Varsa dosyadan görevleri okur; yoksa boş liste döner.
    Eski düz metin formatini da destekler.
    """
    try:
        if not dosya_yolu.exists():
            return []
        with dosya_yolu.open("r", encoding="utf-8") as f:
            satirlar = [s.rstrip("\n") for s in f]

        gorevler: List[Gorev] = []
        for s in satirlar:
            s = s.strip()
            if not s:
                continue
            g = Gorev.from_line(s)
            if g.baslik.strip():
                
                g.oncelik = max(1, min(5, int(g.oncelik)))
                gorevler.append(g)
        return gorevler
    except (OSError, UnicodeError) as e:
        print(f"[HATA] Dosya okunamadi: {e}")
        return []


def gorevleri_dosyaya_kaydet(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    """
    Görevleri dosyaya JSON satirlari olarak yazar.
    """
    try:
        with dosya_yolu.open("w", encoding="utf-8") as f:
            for g in gorevler:
                f.write(g.to_line() + "\n")
    except OSError as e:
        print(f"[HATA] Dosyaya yazilamadi: {e}")



def ekrani_beklet() -> None:
    input("\nDevam etmek için Enter'a basin...")


def metin_al_bos_olamaz(istek_metni: str) -> str:
    while True:
        metin = input(istek_metni).strip()
        if metin:
            return metin
        print("[HATA] Boş değer girilemez. Lütfen bir metin girin.")


def sayi_al_aralikta(istek_metni: str, minimum: int, maksimum: int) -> int:
    while True:
        ham = input(istek_metni).strip()
        try:
            deger = int(ham)
        except ValueError:
            print("[HATA] Lütfen geçerli bir sayi girin.")
            continue

        if minimum <= deger <= maksimum:
            return deger

        print(f"[HATA] Geçersiz değer. Aralik: {minimum}-{maksimum}")


def tarih_al_opsiyonel(istek_metni: str) -> Optional[date]:
    """
    YYYY-AA-GG formatinda tarih alir.
    Boş birakilirsa None döner (temizlemek için).
    """
    while True:
        ham = input(istek_metni).strip()
        if ham == "":
            return None
        try:
            return date.fromisoformat(ham)
        except ValueError:
            print("[HATA] Tarih formati hatali. Örnek: 2026-01-24 (YYYY-AA-GG)")


def gorevleri_listele(gorevler: List[Gorev]) -> None:
    print("\n--- GÖREV LİSTESİ ---")
    if not gorevler:
        print("Görev listesi boş.")
        return

    bugun = date.today()
    for i, g in enumerate(gorevler, start=1):
        durum = "X" if g.tamamlandi else " "
        due = g.son_tarih.isoformat() if g.son_tarih else "--"
        gecmis = ""
        if g.son_tarih and (not g.tamamlandi) and g.son_tarih < bugun:
            gecmis = " (GEÇMİŞ)"
        print(f"{i}. [{durum}] (P{g.oncelik}) {due}{gecmis} - {g.baslik}")



def yeni_gorev_ekle(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    print("\n--- YENİ GÖREV EKLE ---")
    baslik = metin_al_bos_olamaz("Görev başliği: ")

    oncelik = sayi_al_aralikta("Öncelik (1=Yüksek, 5=Düşük) [varsayilan 3]: ", 1, 5)
    son_tarih = tarih_al_opsiyonel("Son tarih (YYYY-AA-GG) [boş= yok]: ")

    gorevler.append(Gorev(baslik=baslik, oncelik=oncelik, son_tarih=son_tarih))
    gorevleri_dosyaya_kaydet(gorevler, dosya_yolu)
    print("Görev eklendi ve kaydedildi.")


def gorev_duzenle(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    print("\n--- GÖREV DÜZENLE (Başlik) ---")
    if not gorevler:
        print("Düzenlenecek görev yok. Görev listesi boş.")
        return

    gorevleri_listele(gorevler)
    secilen_no = sayi_al_aralikta("Düzenlenecek görev numarasi: ", 1, len(gorevler))
    yeni_baslik = metin_al_bos_olamaz("Yeni görev basligi: ")

    gorevler[secilen_no - 1].baslik = yeni_baslik
    gorevleri_dosyaya_kaydet(gorevler, dosya_yolu)
    print("Görev güncellendi ve kaydedildi.")


def gorev_sil(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    print("\n--- GÖREV SİL ---")
    if not gorevler:
        print("Silinecek görev yok. Görev listesi boş.")
        return

    gorevleri_listele(gorevler)
    secilen_no = sayi_al_aralikta("Silinecek görev numarasi: ", 1, len(gorevler))

    silinen = gorevler.pop(secilen_no - 1)
    gorevleri_dosyaya_kaydet(gorevler, dosya_yolu)
    print(f"Silindi: {silinen.baslik}")
    print("Değişiklikler kaydedildi.")


def gorev_tamamlandi_ata(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    print("\n--- TAMAMLANDI/TAMAMLANMADI AYARLA ---")
    if not gorevler:
        print("İşlem yapilacak görev yok. Görev listesi boş.")
        return

    gorevleri_listele(gorevler)
    secilen_no = sayi_al_aralikta("Görev numarasi: ", 1, len(gorevler))

    g = gorevler[secilen_no - 1]
    print(f"Seçilen: {g.baslik}")
    print("1) Tamamlandi")
    print("2) Tamamlanmadi")
    sec = sayi_al_aralikta("Seçim (1-2): ", 1, 2)

    g.tamamlandi = (sec == 1)
    gorevleri_dosyaya_kaydet(gorevler, dosya_yolu)
    print("Durum güncellendi ve kaydedildi.")


def gorev_oncelik_ata(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    print("\n--- ÖNCELİK ATA ---")
    if not gorevler:
        print("İşlem yapilacak görev yok. Görev listesi boş.")
        return

    gorevleri_listele(gorevler)
    secilen_no = sayi_al_aralikta("Görev numarasi: ", 1, len(gorevler))
    yeni_oncelik = sayi_al_aralikta("Yeni öncelik (1=Yüksek, 5=Düşük): ", 1, 5)

    gorevler[secilen_no - 1].oncelik = yeni_oncelik
    gorevleri_dosyaya_kaydet(gorevler, dosya_yolu)
    print("Öncelik güncellendi ve kaydedildi.")


def gorev_son_tarih_ata(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    print("\n--- SON TARIH ATA ---")
    if not gorevler:
        print("İşlem yapilacak görev yok. Görev listesi boş.")
        return

    gorevleri_listele(gorevler)
    secilen_no = sayi_al_aralikta("Görev numarasi: ", 1, len(gorevler))
    yeni_tarih = tarih_al_opsiyonel("Yeni son tarih (YYYY-AA-GG) [boş= temizle]: ")

    gorevler[secilen_no - 1].son_tarih = yeni_tarih
    gorevleri_dosyaya_kaydet(gorevler, dosya_yolu)
    print("Son tarih güncellendi ve kaydedildi.")


def gorevleri_sirala(gorevler: List[Gorev], dosya_yolu: Path) -> None:
    print("\n--- GÖREVLERİ SIRALA ---")
    if not gorevler:
        print("Siralancak görev yok. Görev listesi boş.")
        return

    print("Kriter seçin:")
    print("1) Durum (tamamlanmayanlar önce)")
    print("2) Öncelik (P1 önce)")
    print("3) Son tarih (erken tarih önce; boşlar en sona)")
    print("4) Baslik (A-Z)")
    sec = sayi_al_aralikta("Secim (1-4): ", 1, 4)

    if sec == 1:
        gorevler.sort(key=lambda g: (g.tamamlandi, g.oncelik, g.son_tarih or date.max, g.baslik.casefold()))
    elif sec == 2:
        gorevler.sort(key=lambda g: (g.oncelik, g.tamamlandi, g.son_tarih or date.max, g.baslik.casefold()))
    elif sec == 3:
        gorevler.sort(key=lambda g: (g.son_tarih or date.max, g.tamamlandi, g.oncelik, g.baslik.casefold()))
    elif sec == 4:
        gorevler.sort(key=lambda g: (g.baslik.casefold(), g.tamamlandi, g.oncelik, g.son_tarih or date.max))

    gorevleri_dosyaya_kaydet(gorevler, dosya_yolu)
    print("Görevler siralandi ve kaydedildi.")



def menu_goster() -> None:
    print("\n========== TO-DO LIST ==========")
    print("1) Görevleri Listele")
    print("2) Yeni Görev Ekle")
    print("3) Görev Düzenle (Baslik)")
    print("4) Görev Sil")
    print("5) Tamamlandi/Tamamlanmadi Ayarla")
    print("6) Öncelik Ata")
    print("7) Son Tarih Ata")
    print("8) Görevleri Sirala")
    print("9) Cikis")
    print("================================")


def main() -> None:
    dosya_yolu = dosya_yolu_al("gorevler.txt")
    gorevler = gorevleri_dosyadan_oku(dosya_yolu)

    while True:
        menu_goster()
        secim = sayi_al_aralikta("Seciminiz (1-9): ", 1, 9)

        if secim == 1:
            gorevleri_listele(gorevler)
            ekrani_beklet()
        elif secim == 2:
            yeni_gorev_ekle(gorevler, dosya_yolu)
            ekrani_beklet()
        elif secim == 3:
            gorev_duzenle(gorevler, dosya_yolu)
            ekrani_beklet()
        elif secim == 4:
            gorev_sil(gorevler, dosya_yolu)
            ekrani_beklet()
        elif secim == 5:
            gorev_tamamlandi_ata(gorevler, dosya_yolu)
            ekrani_beklet()
        elif secim == 6:
            gorev_oncelik_ata(gorevler, dosya_yolu)
            ekrani_beklet()
        elif secim == 7:
            gorev_son_tarih_ata(gorevler, dosya_yolu)
            ekrani_beklet()
        elif secim == 8:
            gorevleri_sirala(gorevler, dosya_yolu)
            ekrani_beklet()
        elif secim == 9:
            print("Cikis yapilyor. Iyi gunler.")
            break


if __name__ == "__main__":
    main()
