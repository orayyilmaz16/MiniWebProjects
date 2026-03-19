import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from scipy.stats import gaussian_kde


#Parametreler
N = 2000                 # veri sayısı
BINS = 40                # histogram kutu sayısı
COLOR = "#1f77b4"        # histogram rengi
SHOW_KDE = True          # KDE eğrisi çizilsin mi
SHOW_PERCENTILES = True  # %25-%50-%75 çizgileri
SAVE_FIG = False         # grafiği kaydetmek istersen True yap
FILENAME = "histogram.png"


# Veri Oluşturma
np.random.seed(42)
data = np.random.randn(N) * 1.2 + 0.5   # daha ilginç bir dağılım


# Değerler Hesabı ve Yazdırma
mean = np.mean(data)
std = np.std(data)
p25, p50, p75 = np.percentile(data, [25, 50, 75])

print("=== İstatistiksel Özet ===")
print(f"Ortalama: {mean:.3f}")
print(f"Std Sapma: {std:.3f}")
print(f"%25: {p25:.3f}, %50 (Medyan): {p50:.3f}, %75: {p75:.3f}")

# GRAFİK
plt.style.use("seaborn-v0_8-darkgrid")
plt.figure(figsize=(12, 7))

# Histogram
sns.histplot(
    data,
    bins=BINS,
    kde=False,
    color=COLOR,
    edgecolor="black",
    alpha=0.7
)

# KDE eğrisi
if SHOW_KDE:
    kde = gaussian_kde(data)
    x_vals = np.linspace(min(data), max(data), 500)
    plt.plot(x_vals, kde(x_vals) * len(data) * (max(data)-min(data))/BINS,
             color="red", linewidth=2.2, label="KDE Yoğunluk Eğrisi")

# Percentil çizgileri
if SHOW_PERCENTILES:
    for val, label in [(p25, "%25"), (p50, "Medyan"), (p75, "%75")]:
        plt.axvline(val, color="orange", linestyle="--", linewidth=2)
        plt.text(val, plt.ylim()[1]*0.9, label, color="orange", fontsize=12)

# Başlık ve etiketler
plt.title("Gelişmiş Histogram Analizi", fontsize=18, fontweight="bold")
plt.xlabel("Değer", fontsize=14)
plt.ylabel("Frekans", fontsize=14)
plt.legend()

# Kaydetme
if SAVE_FIG:
    plt.savefig(FILENAME, dpi=300, bbox_inches="tight")

plt.show()