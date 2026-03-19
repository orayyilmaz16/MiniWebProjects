import numpy as np
import pandas as pd
import matplotlib as mpl
import matplotlib.pyplot as plt

# -----------------------
# 0) Modern plot ayarları
# -----------------------
mpl.rcParams.update({
    "figure.figsize": (14, 8),
    "axes.grid": True,
    "grid.alpha": 0.25,
    "axes.spines.top": False,
    "axes.spines.right": False,
    "font.size": 11,
})

# -----------------------
# 1) Saniyelik veri üretimi
# -----------------------
def generate_per_second_data(
    start="2026-02-05 00:00:00",
    seconds=24 * 60 * 60,
    seed=42
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    idx = pd.date_range(start=start, periods=seconds, freq="s")

    t = np.arange(seconds)

    # Trend + günlük döngü + hızlı dalga + gürültü
    trend = 0.00002 * t
    daily = 2.5 * np.sin(2 * np.pi * t / (24 * 60 * 60))
    fast = 0.6 * np.sin(2 * np.pi * t / 120)  # 2 dakikalık dalga
    noise = rng.normal(0, 0.35, size=seconds)

    y = 50 + trend + daily + fast + noise

    # Kontrollü anomaliler (spike / drop)
    spike_positions = rng.choice(seconds, size=18, replace=False)
    y[spike_positions] += rng.normal(6, 1.5, size=spike_positions.size)

    drop_positions = rng.choice(seconds, size=8, replace=False)
    y[drop_positions] -= rng.normal(6, 1.2, size=drop_positions.size)

    df = pd.DataFrame({"value": y}, index=idx)
    df.index.name = "ts"
    return df


# -----------------------
# 2) Temizleme + feature engineering (her saniye işlenir)
# -----------------------
def enrich_features(df: pd.DataFrame, window=60) -> pd.DataFrame:
    out = df.copy()

    # Saniyelik fark (türev benzeri)
    out["delta_1s"] = out["value"].diff()

    # Rolling metrikler (son 60 saniye)
    out["roll_mean"] = out["value"].rolling(window=window, min_periods=window).mean()
    out["roll_std"] = out["value"].rolling(window=window, min_periods=window).std()

    # Z-score: (x - mean) / std
    out["z"] = (out["value"] - out["roll_mean"]) / out["roll_std"]

    # Anomali: |z| > 3
    out["is_anomaly"] = out["z"].abs() > 3

    # İşlenemeyen ilk window kadar satırı temizle
    out = out.dropna()
    return out


# -----------------------
# 3) Tablolar (özet + top anomaliler)
# -----------------------
def build_tables(df: pd.DataFrame) -> dict:
    summary = df[["value", "delta_1s", "z"]].describe().T
    summary["missing"] = df[["value", "delta_1s", "z"]].isna().sum().values

    top_anomalies = (
        df[df["is_anomaly"]]
        .assign(abs_z=lambda x: x["z"].abs())
        .sort_values("abs_z", ascending=False)
        .head(15)[["value", "delta_1s", "z", "abs_z"]]
    )

    per_min = df["value"].resample("1min").agg(["mean", "min", "max", "std", "count"])
    per_hour = df["value"].resample("1h").agg(["mean", "min", "max", "std", "count"])

    return {
        "summary": summary,
        "top_anomalies": top_anomalies,
        "per_min": per_min,
        "per_hour": per_hour,
    }


# -----------------------
# 4) Grafikler (tam seri + band + anomali + agregasyon)
# -----------------------
def plot_all(df: pd.DataFrame, out_prefix="report"):
    # (A) Full resolution plot: her saniye çizgi
    fig = plt.figure(constrained_layout=True, figsize=(16, 10))
    gs = fig.add_gridspec(3, 1, height_ratios=[2.2, 1.3, 1.2])

    ax1 = fig.add_subplot(gs[0, 0])
    ax2 = fig.add_subplot(gs[1, 0], sharex=ax1)
    ax3 = fig.add_subplot(gs[2, 0], sharex=ax1)

    # 1) Ana seri + rolling band
    ax1.plot(df.index, df["value"], lw=0.8, color="#2563eb", label="value", rasterized=True)

    band_low = df["roll_mean"] - 2 * df["roll_std"]
    band_high = df["roll_mean"] + 2 * df["roll_std"]
    ax1.fill_between(df.index, band_low, band_high, color="#93c5fd", alpha=0.25, label="mean ± 2std")

    # Anomalileri işaretle (nokta nokta)
    an = df[df["is_anomaly"]]
    ax1.scatter(an.index, an["value"], s=22, color="#dc2626", label="anomaly", zorder=5)

    ax1.set_title("Saniyelik zaman serisi (tüm noktalar) + rolling band + anomaliler")
    ax1.set_ylabel("value")
    ax1.legend(loc="upper left")

    # 2) Z-score grafiği
    ax2.plot(df.index, df["z"], lw=0.8, color="#111827", label="z-score", rasterized=True)
    ax2.axhline(3, color="#dc2626", lw=1, ls="--")
    ax2.axhline(-3, color="#dc2626", lw=1, ls="--")
    ax2.set_ylabel("z")
    ax2.set_title("Z-score (anomali eşiği: ±3)")
    ax2.legend(loc="upper left")

    # 3) Dakikalık agregasyon (okunabilir “modern dashboard” hissi)
    per_min = df["value"].resample("1min").mean()
    ax3.plot(per_min.index, per_min.values, lw=1.4, color="#16a34a", label="per-minute mean")
    ax3.set_title("1 dakikalık ortalama (okunabilir özet)")
    ax3.set_ylabel("value")
    ax3.set_xlabel("time")
    ax3.legend(loc="upper left")

    plt.savefig(f"{out_prefix}_full.png", dpi=160)
    plt.show()

    # (B) Zoom panel: anomalilerin yoğun olduğu ilk 30 dakika (örnek)
    zoom_start = df.index.min()
    zoom_end = zoom_start + pd.Timedelta(minutes=30)
    dz = df.loc[zoom_start:zoom_end]

    fig2, ax = plt.subplots(figsize=(16, 5))
    ax.plot(dz.index, dz["value"], lw=1.0, color="#2563eb", label="value")
    ax.scatter(dz[dz["is_anomaly"]].index, dz[dz["is_anomaly"]]["value"], s=35, color="#dc2626", label="anomaly")

    # Nokta nokta etiket (çok anomali varsa kalabalık olur; burada sadece zoom içinde anomali etiketliyoruz)
    for ts, row in dz[dz["is_anomaly"]].head(12).iterrows():
        ax.annotate(
            f"z={row['z']:.2f}",
            xy=(ts, row["value"]),
            xytext=(8, 10),
            textcoords="offset points",
            fontsize=9,
            color="#dc2626",
            arrowprops=dict(arrowstyle="-", color="#dc2626", alpha=0.6),
        )

    ax.set_title("Zoom: 30 dakikalık pencere (anomali etiketleri)")
    ax.set_ylabel("value")
    ax.set_xlabel("time")
    ax.legend(loc="upper left")

    plt.savefig(f"{out_prefix}_zoom.png", dpi=160)
    plt.show()


def main():
    raw = generate_per_second_data()
    df = enrich_features(raw, window=60)

    tables = build_tables(df)

    print("\n=== SUMMARY TABLE ===")
    print(tables["summary"].round(4))

    print("\n=== TOP ANOMALIES (by |z|) ===")
    print(tables["top_anomalies"].round(4))

    # Dosyaya kayıt (analiz çıktıları)
    df.to_csv("per_second_enriched.csv", index=True)
    tables["per_min"].to_csv("per_minute_summary.csv", index=True)
    tables["per_hour"].to_csv("per_hour_summary.csv", index=True)

    plot_all(df, out_prefix="report")


if __name__ == "__main__":
    main()
