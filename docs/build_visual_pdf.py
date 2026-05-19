# -*- coding: utf-8 -*-
"""
串連系統 v2.2 — 圖文版演算法手冊
每個演算法配：示意圖 + 為什麼這樣用 + 好處 + 壞處
"""
import os
import math
import numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib.patches import FancyArrow, FancyBboxPatch, Rectangle
import matplotlib.patches as mpatches

# 設定中文字型（Windows / Mac / Linux 都試）
from matplotlib import font_manager
chinese_fonts = ["Microsoft JhengHei", "Microsoft YaHei", "SimHei", "PingFang TC",
                 "PingFang SC", "Heiti TC", "Noto Sans CJK TC", "Noto Sans CJK SC",
                 "WenQuanYi Micro Hei", "DFKai-SB", "MingLiU"]
available = {f.name for f in font_manager.fontManager.ttflist}
for f in chinese_fonts:
    if f in available:
        plt.rcParams["font.sans-serif"] = [f, "DejaVu Sans"]
        plt.rcParams["axes.unicode_minus"] = False
        print(f"使用中文字型：{f}")
        break
else:
    print("警告：找不到中文字型，圖中中文可能變方框")

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Image,
    Table, TableStyle, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
CN = "STSong-Light"

# ============== 顏色 ==============
NAVY  = HexColor("#0f172a")
BLUE  = HexColor("#3b82f6")
SLATE = HexColor("#475569")
LIGHT = HexColor("#f1f5f9")
GREY  = HexColor("#94a3b8")
RED   = HexColor("#ef4444")
GREEN = HexColor("#10b981")
VIOLET = HexColor("#8b5cf6")
AMBER = HexColor("#f59e0b")
TEAL  = HexColor("#14b8a6")
ROSE  = HexColor("#fb7185")

# matplotlib 色板
mC_BLUE   = "#3b82f6"
mC_AMBER  = "#f59e0b"
mC_RED    = "#ef4444"
mC_GREEN  = "#10b981"
mC_VIOLET = "#8b5cf6"
mC_GREY   = "#94a3b8"
mC_SLATE  = "#475569"

# 樣式
style_title    = ParagraphStyle("title", fontName=CN, fontSize=26, leading=32, textColor=NAVY, spaceAfter=6)
style_subtitle = ParagraphStyle("st", fontName=CN, fontSize=12, leading=18, textColor=SLATE, spaceAfter=20)
style_h1       = ParagraphStyle("h1", fontName=CN, fontSize=18, leading=24, textColor=NAVY, spaceBefore=10, spaceAfter=6)
style_h2       = ParagraphStyle("h2", fontName=CN, fontSize=12.5, leading=18, textColor=BLUE, spaceBefore=8, spaceAfter=2)
style_body     = ParagraphStyle("body", fontName=CN, fontSize=10, leading=15, textColor=NAVY, alignment=TA_JUSTIFY, spaceAfter=4)
style_pros     = ParagraphStyle("pros", fontName=CN, fontSize=9.5, leading=14, textColor=GREEN, spaceAfter=2)
style_cons     = ParagraphStyle("cons", fontName=CN, fontSize=9.5, leading=14, textColor=RED, spaceAfter=2)
style_reason   = ParagraphStyle("reason", fontName=CN, fontSize=10, leading=15, textColor=NAVY, alignment=TA_JUSTIFY, spaceAfter=4, leftIndent=8)


def info_box(title, body, color=BLUE):
    inner_title = ParagraphStyle("ib_t", fontName=CN, fontSize=10.5, leading=14, textColor=color, spaceAfter=4)
    inner_body  = ParagraphStyle("ib_b", fontName=CN, fontSize=9.5, leading=14, textColor=NAVY)
    inner = [Paragraph(f"<b>{title}</b>", inner_title), Paragraph(body, inner_body)]
    t = Table([[inner]], colWidths=[16.8 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.6, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
    ]))
    return KeepTogether([t, Spacer(1, 6)])


def algo_section(idx, name, category, image_path, why, pros, cons):
    """每個演算法的標準排版區塊"""
    items = []
    # 標題
    title = Paragraph(
        f"<font color='#3b82f6'><b>#{idx}</b></font>&nbsp; <b>{name}</b>"
        f"&nbsp;<font color='#94a3b8' size='9'>· {category}</font>",
        ParagraphStyle("t", fontName=CN, fontSize=14, leading=20, textColor=NAVY, spaceAfter=4)
    )
    items.append(title)
    # 圖
    if image_path and os.path.exists(image_path):
        items.append(Image(image_path, width=16 * cm, height=8 * cm))
        items.append(Spacer(1, 4))
    # 為什麼這樣用
    items.append(Paragraph("為什麼這樣用",
        ParagraphStyle("lbl", fontName=CN, fontSize=10.5, leading=14, textColor=BLUE, spaceBefore=4, spaceAfter=2)))
    items.append(Paragraph(why, style_reason))
    # 好處 / 壞處
    items.append(Paragraph("好處 ✓",
        ParagraphStyle("lp", fontName=CN, fontSize=10.5, leading=14, textColor=GREEN, spaceBefore=4, spaceAfter=2)))
    for p in pros:
        items.append(Paragraph(f"• {p}", style_pros))
    items.append(Paragraph("壞處 / 限制 ✗",
        ParagraphStyle("lc", fontName=CN, fontSize=10.5, leading=14, textColor=RED, spaceBefore=4, spaceAfter=2)))
    for c in cons:
        items.append(Paragraph(f"• {c}", style_cons))
    items.append(Spacer(1, 8))
    return items


# ===================================================
# 產生 matplotlib 圖（每張獨立函式）
# ===================================================
IMG_DIR = "docs/images"
os.makedirs(IMG_DIR, exist_ok=True)


def setup_axes(ax, title=None, xlabel=None, ylabel=None):
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("#cbd5e1")
    ax.spines["bottom"].set_color("#cbd5e1")
    ax.tick_params(colors="#64748b", labelsize=9)
    if title:  ax.set_title(title, fontsize=11, color="#0f172a", pad=10)
    if xlabel: ax.set_xlabel(xlabel, fontsize=9, color="#475569")
    if ylabel: ax.set_ylabel(ylabel, fontsize=9, color="#475569")


def img1_bm25_tf_saturation():
    path = f"{IMG_DIR}/01_bm25_tf.png"
    fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
    tf = np.arange(0, 30)
    k1 = 1.5
    bm25 = tf * (k1 + 1) / (tf + k1)
    linear = tf  # raw TF
    ax.plot(tf, linear, "--", color=mC_GREY, linewidth=2, label="Raw TF (linear)")
    ax.plot(tf, bm25, "-",   color=mC_BLUE, linewidth=2.5, label="BM25 TF (saturated, k1=1.5)")
    ax.axhline(y=k1 + 1, color=mC_RED, linestyle=":", alpha=0.5, label=f"Asymptote ({k1+1})")
    ax.legend(fontsize=9, loc="upper left")
    setup_axes(ax, title="BM25 TF Saturation — diminishing returns",
                  xlabel="Raw term frequency (tf)", ylabel="Normalized score")
    ax.set_xlim(0, 30)
    ax.set_ylim(0, 8)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img2_ngram_split():
    path = f"{IMG_DIR}/02_ngram.png"
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
    ax.axis("off")
    text = "東京中央銀行"
    # Title
    ax.text(0.5, 0.95, "Multi n-gram Tokenization (Chinese has no word boundary)",
            ha="center", fontsize=11, color="#0f172a", weight="bold", transform=ax.transAxes)
    # Original
    ax.text(0.5, 0.85, text, ha="center", fontsize=20, color="#3b82f6",
            weight="bold", transform=ax.transAxes)
    # 1-gram
    ngrams_1 = list(text)
    ax.text(0.05, 0.65, "1-gram", fontsize=10, color="#94a3b8", transform=ax.transAxes)
    for i, ch in enumerate(ngrams_1):
        rect = FancyBboxPatch((0.16 + i * 0.085, 0.62), 0.07, 0.08,
                              boxstyle="round,pad=0.005", linewidth=1,
                              edgecolor="#cbd5e1", facecolor="#dbeafe", transform=ax.transAxes)
        ax.add_patch(rect)
        ax.text(0.195 + i * 0.085, 0.66, ch, ha="center", fontsize=14, transform=ax.transAxes)
    # 2-gram
    ngrams_2 = [text[i:i+2] for i in range(len(text)-1)]
    ax.text(0.05, 0.43, "2-gram", fontsize=10, color="#94a3b8", transform=ax.transAxes)
    for i, ch in enumerate(ngrams_2):
        rect = FancyBboxPatch((0.16 + i * 0.10, 0.40), 0.09, 0.08,
                              boxstyle="round,pad=0.005", linewidth=1,
                              edgecolor="#cbd5e1", facecolor="#fef3c7", transform=ax.transAxes)
        ax.add_patch(rect)
        ax.text(0.205 + i * 0.10, 0.44, ch, ha="center", fontsize=12, transform=ax.transAxes)
    # 3-gram
    ngrams_3 = [text[i:i+3] for i in range(len(text)-2)]
    ax.text(0.05, 0.21, "3-gram", fontsize=10, color="#94a3b8", transform=ax.transAxes)
    for i, ch in enumerate(ngrams_3):
        rect = FancyBboxPatch((0.16 + i * 0.13, 0.18), 0.12, 0.08,
                              boxstyle="round,pad=0.005", linewidth=1,
                              edgecolor="#cbd5e1", facecolor="#ede9fe", transform=ax.transAxes)
        ax.add_patch(rect)
        ax.text(0.22 + i * 0.13, 0.22, ch, ha="center", fontsize=11, transform=ax.transAxes)
    ax.text(0.5, 0.04, "3-gram catches proper nouns like 'investment-committee'",
            ha="center", fontsize=8.5, color="#94a3b8", style="italic", transform=ax.transAxes)
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img3_idf():
    path = f"{IMG_DIR}/03_idf.png"
    fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
    N = 100
    df = np.arange(1, N + 1)
    classic = np.log(N / df)
    rsj = np.log(1 + (N - df + 0.5) / (df + 0.5))
    ax.plot(df, classic, "--", color=mC_GREY, linewidth=2, label="Classic IDF: log(N/df)")
    ax.plot(df, rsj, "-", color=mC_BLUE, linewidth=2.5, label="RSJ IDF (BM25)")
    ax.axhline(y=0, color="#cbd5e1", linestyle="-", linewidth=0.8)
    ax.fill_between(df, classic, where=(classic < 0), color=mC_RED, alpha=0.15,
                    label="Classic IDF < 0 (problem)")
    ax.legend(fontsize=9, loc="upper right")
    setup_axes(ax, title="Robertson-Sparck-Jones IDF vs Classic",
                  xlabel="Document frequency (df)", ylabel="IDF score")
    ax.set_xlim(0, N)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img4_percentile():
    path = f"{IMG_DIR}/04_percentile.png"
    fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
    np.random.seed(42)
    data = np.concatenate([np.random.gamma(2, 3, 80), np.random.gamma(4, 5, 20)])
    data = np.clip(data, 1, 35)
    n, bins, patches = ax.hist(data, bins=20, color="#dbeafe", edgecolor="#3b82f6", linewidth=0.8)
    for p in [75, 90, 95]:
        v = np.percentile(data, p)
        color = "#3b82f6" if p == 75 else ("#f59e0b" if p == 90 else "#ef4444")
        ax.axvline(v, color=color, linestyle="--", linewidth=2)
        ax.text(v, max(n) * 0.92, f"P{p} = {v:.1f} days",
                color=color, fontsize=9, weight="bold",
                ha="left", bbox=dict(boxstyle="round,pad=0.2", facecolor="white", edgecolor=color, linewidth=0.8))
    setup_axes(ax, title="Empirical Percentile (blocker days distribution)",
                  xlabel="Days to resolve", ylabel="Frequency")
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img5_gini_lorenz():
    path = f"{IMG_DIR}/05_gini.png"
    fig, ax = plt.subplots(figsize=(8, 5), dpi=150)
    # Lorenz curves for different Gini levels
    for gini_val, color, label in [(0.20, mC_GREEN, "Gini = 0.20 (fair)"),
                                     (0.35, mC_BLUE,  "Gini = 0.35 (threshold)"),
                                     (0.55, mC_RED,   "Gini = 0.55 (unfair)")]:
        x = np.linspace(0, 1, 100)
        # generate distribution with target gini
        # rough: y = x^(1 + 2*gini_val*5)
        a = 1 + gini_val * 5
        y = x ** a
        ax.plot(x, y, "-", color=color, linewidth=2.2, label=label)
    # Perfect equality line
    ax.plot([0, 1], [0, 1], "--", color="#cbd5e1", linewidth=1.5, label="Perfect equality")
    ax.fill_between(np.linspace(0, 1, 100),
                    np.linspace(0, 1, 100),
                    np.linspace(0, 1, 100) ** (1 + 0.35 * 5),
                    alpha=0.15, color=mC_BLUE, label="Gini area (0.35)")
    ax.legend(fontsize=9, loc="upper left")
    setup_axes(ax, title="Gini Coefficient — Lorenz Curve",
                  xlabel="Cumulative share of population",
                  ylabel="Cumulative share of workload")
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.set_aspect("equal")
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img6_time_decay():
    path = f"{IMG_DIR}/06_time_decay.png"
    fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
    weights = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02]
    labels = [f"{i}w" if i > 0 else "now" for i in range(len(weights))]
    colors = [mC_BLUE if i == 0 else mC_AMBER if i <= 2 else mC_SLATE for i in range(len(weights))]
    bars = ax.bar(labels, weights, color=colors, edgecolor="white", linewidth=2)
    for bar, w in zip(bars, weights):
        ax.text(bar.get_x() + bar.get_width() / 2, w + 0.03,
                f"{w}", ha="center", fontsize=9, color="#0f172a", weight="bold")
    setup_axes(ax, title="Exponential Time Decay — recent weeks weigh more",
                  xlabel="Weeks ago", ylabel="Weight")
    ax.set_ylim(0, 1.15)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img7_local_minima():
    path = f"{IMG_DIR}/07_local_minima.png"
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=150)
    weeks = list(range(12))
    series = [95, 93, 94, 93, 93, 92, 90, 75, 52, 50, 51, 54]
    ax.plot(weeks, series, "-o", color=mC_BLUE, linewidth=2.5, markersize=6)
    # find local minima
    for i in range(1, len(series) - 1):
        if series[i] < series[i - 1] - 3 and series[i] < series[i + 1] - 3:
            ax.plot(i, series[i], "o", color=mC_RED, markersize=14, markeredgewidth=2, markeredgecolor="white")
            ax.annotate(f"Inflection point\n(V-shaped valley)",
                        xy=(i, series[i]),
                        xytext=(i + 1.2, series[i] - 8),
                        fontsize=9, color=mC_RED, weight="bold",
                        arrowprops=dict(arrowstyle="->", color=mC_RED, lw=1.5))
    ax.set_xticks(weeks)
    ax.set_xticklabels([f"{11-i}w ago" if i < 11 else "now" for i in weeks], fontsize=8, rotation=30)
    setup_axes(ax, title="Local Minima Detection — find V-shaped valleys",
                  ylabel="Health score")
    ax.set_ylim(40, 100)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img8_load_score():
    path = f"{IMG_DIR}/08_load.png"
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
    employees = ["A", "B", "C", "D", "E", "F"]
    cases    = [4.5, 3.2, 2.5, 1.8, 1.2, 0.5]
    blockers = [3.0, 1.5, 0.5, 0.2, 0.0, 0.0]
    mentions = [1.5, 1.0, 0.8, 0.6, 0.4, 0.2]
    handoffs = [1.8, 0.5, 0.3, 0.0, 0.0, 0.0]
    bottom1 = cases
    bottom2 = [a + b for a, b in zip(cases, blockers)]
    bottom3 = [a + b for a, b in zip(bottom2, mentions)]
    ax.bar(employees, cases,    color="#60a5fa", label="Time-weighted cases (x1.5)", edgecolor="white")
    ax.bar(employees, blockers, bottom=bottom1, color="#f87171", label="Blocker load (x2.0)", edgecolor="white")
    ax.bar(employees, mentions, bottom=bottom2, color="#a78bfa", label="Mentions (x0.8)", edgecolor="white")
    ax.bar(employees, handoffs, bottom=bottom3, color="#fbbf24", label="Handoff load (x1.0)", edgecolor="white")
    # P90 line
    totals = [a + b + c + d for a, b, c, d in zip(cases, blockers, mentions, handoffs)]
    p90 = np.percentile(totals, 90)
    ax.axhline(p90, color=mC_RED, linestyle="--", linewidth=1.5, label=f"P90 = {p90:.1f} (overload)")
    ax.legend(fontsize=8.5, loc="upper right")
    setup_axes(ax, title="Weighted Load Score — 4-component decomposition",
                  xlabel="Employee", ylabel="Load score")
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img9_ori_decomposition():
    path = f"{IMG_DIR}/09_ori.png"
    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(10, 4.2), dpi=150)
    # Pie of weights
    labels = ["HCC\n35%", "DL\n25%", "BT\n25%", "CDC\n15%"]
    sizes = [0.35, 0.25, 0.25, 0.15]
    colors = ["#3b82f6", "#f59e0b", "#ef4444", "#10b981"]
    ax1.pie(sizes, labels=labels, colors=colors, autopct=None, startangle=90,
            wedgeprops=dict(edgecolor="white", linewidth=2), textprops=dict(fontsize=10, weight="bold"))
    ax1.set_title("ORI weights", fontsize=11, color="#0f172a", pad=15)
    # Sample composition
    factors = ["HCC", "DL", "BT", "CDC"]
    values  = [140, 120, 165, 105]
    weights = [0.35, 0.25, 0.25, 0.15]
    contrib = [v * w for v, w in zip(values, weights)]
    bars = ax2.bar(factors, values, color=colors, edgecolor="white", linewidth=2)
    for bar, v, c in zip(bars, values, contrib):
        ax2.text(bar.get_x() + bar.get_width() / 2, v + 4,
                 f"{v}\n(×w={c:.0f})", ha="center", fontsize=8.5, color="#0f172a")
    setup_axes(ax2, title="Sample ORI factors", ylabel="Factor score (0-200)")
    ax2.set_ylim(0, 200)
    ax2.axhline(100, color="#cbd5e1", linestyle=":", linewidth=1)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img10_radar():
    path = f"{IMG_DIR}/10_radar.png"
    fig = plt.figure(figsize=(7, 5.5), dpi=150)
    ax = fig.add_subplot(111, polar=True)
    cats = ["Blocker", "Decision", "Handoff", "Load Bal.", "Cross-Dept", "Report"]
    weights_pct = [22, 18, 15, 18, 12, 15]
    values = [33, 50, 80, 64, 100, 90]   # 本週估算值
    avg    = [85, 75, 78, 72, 85, 80]
    angles = [n / float(len(cats)) * 2 * math.pi for n in range(len(cats))]
    angles += angles[:1]
    values += values[:1]
    avg += avg[:1]
    ax.plot(angles, avg, "-", color="#cbd5e1", linewidth=1.5, label="12-week average")
    ax.fill(angles, avg, color="#cbd5e1", alpha=0.3)
    ax.plot(angles, values, "-", color=mC_BLUE, linewidth=2.5, label="This week")
    ax.fill(angles, values, color=mC_BLUE, alpha=0.4)
    ax.set_xticks(angles[:-1])
    ax.set_xticklabels([f"{c}\n({w}%)" for c, w in zip(cats, weights_pct)], fontsize=9)
    ax.set_ylim(0, 100)
    ax.set_yticks([25, 50, 75, 100])
    ax.tick_params(colors="#64748b", labelsize=8)
    ax.set_title("Organization Health 6D Radar", fontsize=12, color="#0f172a", pad=20)
    ax.legend(loc="upper right", bbox_to_anchor=(1.3, 1.1), fontsize=9)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img11_decision_impact_cohort():
    path = f"{IMG_DIR}/11_cohort.png"
    fig, ax = plt.subplots(figsize=(8.5, 4.5), dpi=150)
    weeks = list(range(12))
    trend = [95, 93, 94, 93, 92, 90, 75, 52, 50, 51, 54, 54]
    ax.plot(weeks, trend, "-", color="#cbd5e1", linewidth=2, label="12w org-wide trend")
    # Mark decision time and after window
    decided = 6
    completed = 8
    after = 11
    ax.axvline(decided, color=mC_BLUE, linestyle=":", alpha=0.6)
    ax.axvline(after, color=mC_VIOLET, linestyle=":", alpha=0.6)
    ax.scatter([decided], [trend[decided]], color=mC_BLUE, s=120, zorder=5,
               edgecolor="white", linewidth=2, label=f"Decided (w{decided}): {trend[decided]}")
    ax.scatter([after], [trend[after]], color=mC_VIOLET, s=120, zorder=5,
               edgecolor="white", linewidth=2, label=f"After (w{after}): {trend[after]}")
    # Linear regression fit line
    coef = np.polyfit(weeks, trend, 1)
    fit = np.polyval(coef, weeks)
    ax.plot(weeks, fit, "--", color=mC_AMBER, linewidth=2, label=f"Baseline drift: {coef[0]*7:+.1f}/wk")
    # Annotations
    raw = trend[after] - trend[decided]
    drift_total = coef[0] * 7 * (after - decided)
    adjusted = raw - drift_total
    text = (f"Raw delta = {raw:+.1f}\n"
            f"− Baseline drift = {drift_total:+.1f}\n"
            f"= Adjusted = {adjusted:+.1f}")
    ax.text(0.5, 60, text, fontsize=10, color="#0f172a",
            bbox=dict(boxstyle="round,pad=0.6", facecolor="#fef3c7", edgecolor=mC_AMBER, linewidth=1.5),
            family="monospace")
    ax.set_xticks(weeks)
    ax.set_xticklabels([f"w{i}" for i in weeks], fontsize=8)
    ax.legend(fontsize=8.5, loc="lower left")
    setup_axes(ax, title="Decision Impact + Cohort Adjustment (v2.2)",
                  ylabel="Health score")
    ax.set_ylim(40, 100)
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img12_linear_regression():
    path = f"{IMG_DIR}/12_linreg.png"
    fig, ax = plt.subplots(figsize=(8, 4), dpi=150)
    np.random.seed(7)
    weeks = np.arange(12)
    x = weeks - 11   # negative = past
    trend_true = -0.5
    y = 95 + trend_true * x * 7 / 7 + np.random.normal(0, 3, 12)
    y[6:9] -= 8  # dip
    y[6:9] += np.random.normal(0, 2, 3)
    ax.scatter(x, y, color=mC_BLUE, s=80, zorder=5, edgecolor="white", linewidth=1.5,
               label="12 weekly samples")
    coef = np.polyfit(x, y, 1)
    fit = np.polyval(coef, x)
    ax.plot(x, fit, "-", color=mC_AMBER, linewidth=2.5,
            label=f"Linear fit: slope = {coef[0]:.3f}/day")
    # residual lines
    for xi, yi, fi in zip(x, y, fit):
        ax.plot([xi, xi], [yi, fi], color=mC_GREY, alpha=0.4, linewidth=1)
    ax.legend(fontsize=9)
    setup_axes(ax, title="Linear Regression — Baseline Drift Slope (least squares)",
                  xlabel="Days from now (negative = past)", ylabel="Overall health")
    plt.tight_layout()
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img13_asymmetric():
    path = f"{IMG_DIR}/13_asym.png"
    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=150)
    ax.axis("off")
    # Three departments
    pos = {"投研": (0.2, 0.5), "業開": (0.8, 0.7), "資管": (0.8, 0.3)}
    for name, (x, y) in pos.items():
        circ = plt.Circle((x, y), 0.08, facecolor="#dbeafe", edgecolor=mC_BLUE, linewidth=2, transform=ax.transAxes)
        ax.add_patch(circ)
        ax.text(x, y, name, ha="center", va="center", fontsize=12, weight="bold", transform=ax.transAxes)
    # Edges
    def draw_arrow(p1, p2, weight, color, label_off=(0, 0)):
        x1, y1 = pos[p1]
        x2, y2 = pos[p2]
        dx, dy = x2 - x1, y2 - y1
        L = math.sqrt(dx ** 2 + dy ** 2)
        ux, uy = dx / L, dy / L
        sx, sy = x1 + ux * 0.08, y1 + uy * 0.08
        ex, ey = x2 - ux * 0.08, y2 - uy * 0.08
        ax.annotate("", xy=(ex, ey), xytext=(sx, sy),
                    arrowprops=dict(arrowstyle="->", color=color, lw=2.5),
                    xycoords="axes fraction")
        mx, my = (sx + ex) / 2 + label_off[0], (sy + ey) / 2 + label_off[1]
        ax.text(mx, my, str(weight), fontsize=10, color=color, weight="bold",
                bbox=dict(boxstyle="round,pad=0.2", facecolor="white", edgecolor=color, linewidth=1),
                transform=ax.transAxes)
    draw_arrow("投研", "業開", 8, mC_RED, label_off=(0, 0.04))    # 投研→業開 = 8
    draw_arrow("業開", "投研", 0, mC_RED, label_off=(0, -0.04))   # 業開→投研 = 0  ← ASYM!
    draw_arrow("業開", "資管", 5, mC_GREEN)
    draw_arrow("資管", "業開", 4, mC_GREEN)
    ax.text(0.5, 0.92, "Asymmetric Communication Detection",
            ha="center", fontsize=12, color="#0f172a", weight="bold", transform=ax.transAxes)
    ax.text(0.5, 0.05,
            "★ Red pair: 投研 calls 業開 8 times, but 業開 never calls 投研 → ASYMMETRIC (organizational issue)\n"
            "✓ Green pair: 業開 ↔ 資管 communicate both ways → HEALTHY",
            ha="center", fontsize=8.5, color="#475569", style="italic", transform=ax.transAxes)
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img14_whatif_flow():
    path = f"{IMG_DIR}/14_whatif.png"
    fig, ax = plt.subplots(figsize=(8.5, 5), dpi=150)
    ax.axis("off")
    boxes = [
        ("Original Data", 0.1, 0.7, "#dbeafe", mC_BLUE),
        ("Scenario\n(user toggles)", 0.1, 0.3, "#fef3c7", mC_AMBER),
        ("applyScenario()\n(shadow data)", 0.42, 0.5, "#ede9fe", mC_VIOLET),
        ("computeHealthSnapshot\n(baseline + projected)", 0.72, 0.5, "#d1fae5", mC_GREEN),
    ]
    for label, x, y, fc, ec in boxes:
        rect = FancyBboxPatch((x, y - 0.08), 0.18, 0.16, boxstyle="round,pad=0.01",
                              facecolor=fc, edgecolor=ec, linewidth=2, transform=ax.transAxes)
        ax.add_patch(rect)
        ax.text(x + 0.09, y, label, ha="center", va="center", fontsize=9.5,
                weight="bold", transform=ax.transAxes)
    # Arrows
    def arrow(x1, y1, x2, y2):
        ax.annotate("", xy=(x2, y2), xytext=(x1, y1),
                    arrowprops=dict(arrowstyle="->", color=mC_SLATE, lw=1.8),
                    xycoords="axes fraction")
    arrow(0.28, 0.7, 0.42, 0.55)
    arrow(0.28, 0.3, 0.42, 0.45)
    arrow(0.60, 0.5, 0.72, 0.5)
    # useDeferredValue annotation
    ax.text(0.51, 0.18, "★ v2.2: useDeferredValue wraps Scenario\nso heavy compute doesn't block UI",
            ha="center", fontsize=9, color=mC_VIOLET, style="italic", transform=ax.transAxes,
            bbox=dict(boxstyle="round,pad=0.3", facecolor="#faf5ff", edgecolor=mC_VIOLET, linewidth=1))
    ax.text(0.5, 0.94, "What-if Simulation Flow",
            ha="center", fontsize=12, weight="bold", color="#0f172a", transform=ax.transAxes)
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


def img15_synonym():
    path = f"{IMG_DIR}/15_synonym.png"
    fig, ax = plt.subplots(figsize=(8, 4.2), dpi=150)
    ax.axis("off")
    ax.text(0.5, 0.95, "Synonym Normalization (14 groups)",
            ha="center", fontsize=12, weight="bold", color="#0f172a", transform=ax.transAxes)
    groups = [
        ("募資 / 融資 / 募款 / fundraising", "→ 募資"),
        ("盡調 / 盡職調查 / DD / due diligence", "→ 盡調"),
        ("NDA / 保密協議 / 保密", "→ NDA"),
        ("投委會 / 投資委員會 / IC", "→ 投委會"),
        ("退場 / exit / 出場", "→ 退場"),
        ("Pre-A / PreA / 種子輪後", "→ Pre-A"),
    ]
    for i, (src, dst) in enumerate(groups):
        y = 0.82 - i * 0.13
        ax.text(0.05, y, src, fontsize=10, color=mC_GREY,
                transform=ax.transAxes, va="center")
        ax.text(0.7, y, dst, fontsize=10, color=mC_BLUE, weight="bold",
                transform=ax.transAxes, va="center")
        ax.annotate("", xy=(0.68, y), xytext=(0.52, y),
                    arrowprops=dict(arrowstyle="->", color=mC_GREY, lw=1),
                    xycoords="axes fraction")
    ax.text(0.5, 0.02,
            "Replace longest first to avoid substring overwrite (e.g., '盡職調查' before '盡調')",
            ha="center", fontsize=8.5, color="#94a3b8", style="italic", transform=ax.transAxes)
    plt.savefig(path, bbox_inches="tight", facecolor="white")
    plt.close()
    return path


# ===================================================
# 生成所有圖片
# ===================================================
print("生成圖片中...")
imgs = {
    "bm25":      img1_bm25_tf_saturation(),
    "ngram":     img2_ngram_split(),
    "idf":       img3_idf(),
    "percentile":img4_percentile(),
    "gini":      img5_gini_lorenz(),
    "decay":     img6_time_decay(),
    "minima":    img7_local_minima(),
    "load":      img8_load_score(),
    "ori":       img9_ori_decomposition(),
    "radar":     img10_radar(),
    "cohort":    img11_decision_impact_cohort(),
    "linreg":    img12_linear_regression(),
    "asym":      img13_asymmetric(),
    "whatif":    img14_whatif_flow(),
    "synonym":   img15_synonym(),
}
print("圖片完成。組裝 PDF...")

# ===================================================
# PDF 內容
# ===================================================
story = []

# 封面
story.append(Spacer(1, 3 * cm))
story.append(Paragraph("演算法視覺化手冊", style_title))
story.append(Paragraph("圖解 + 用途說明 + 好處 / 壞處 ‧ Visual Algorithm Handbook",
                        ParagraphStyle("h_en", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceAfter=4)))
story.append(Paragraph("串連系統 v2.2 · 投資公司管理層決策輔助",
                        ParagraphStyle("h_sub", fontName=CN, fontSize=11, leading=16, textColor=SLATE, spaceAfter=20)))
story.append(Paragraph(
    "本手冊以「圖 + 說明」的方式呈現系統 15 個核心演算法。每個演算法包含：<br/>"
    "&nbsp;&nbsp;<b>(1) 示意圖</b> — 視覺化說明演算法本質<br/>"
    "&nbsp;&nbsp;<b>(2) 為什麼這樣用</b> — 設計動機與學理依據<br/>"
    "&nbsp;&nbsp;<b>(3) 好處 ✓</b> — 為什麼選這個演算法<br/>"
    "&nbsp;&nbsp;<b>(4) 壞處 / 限制 ✗</b> — 缺點與權衡<br/><br/>"
    "適合期末口試準備、答辯素材、論文方法章節。",
    style_subtitle,
))

story.append(PageBreak())

# 演算法 1: BM25F
story.extend(algo_section(
    1, "BM25F — Field-weighted BM25", "資訊檢索",
    imgs["bm25"],
    why=(
        "傳統 TF-IDF 採線性 TF 計分，「出現 5 次」與「50 次」差距過大；BM25 用飽和函數 "
        "tf×(k1+1)/(tf+k1×len_norm) 讓 TF 在多次出現後趨於飽和，更接近人類認知。"
        "F (Field) 表示對不同欄位給予不同權重 — 標題出現「東京中央銀行」遠比內文出現重要。"
    ),
    pros=[
        "TF 飽和符合直覺：同詞出現 5 次和 50 次的相關性差距不該是 10 倍",
        "欄位權重讓「短而精準的標題命中」勝過「長文裡偶然出現」",
        "Lucene / Elasticsearch 同款，業界已驗證的成熟演算法",
        "純前端跑、零外部 API、零成本、保護機密",
    ],
    cons=[
        "需要事先設定欄位權重表（標題 5.0、tags 4.0、...）— 是工程經驗值",
        "對極短文件（如只有標題）較不利，因長度正規化會把分數拉低",
        "不理解語意：「投資」與「投入資金」靠詞面相似度，無法理解抽象同義",
        "資料量 >10k 筆會慢，那時要遷移到真正的 Elasticsearch",
    ],
))

# 演算法 2: 多 n-gram
story.extend(algo_section(
    2, "Multi n-gram Chinese Tokenization", "資訊檢索",
    imgs["ngram"],
    why=(
        "中文沒有空格詞界（vs 英文 \"Tokyo Central Bank\" 自然以空格分詞），"
        "Jieba 等斷詞器又對新詞 / 專有名詞容易斷錯。本系統同時切 1-gram / 2-gram / 3-gram，"
        "讓任何字串片段都能被精準召回。"
    ),
    pros=[
        "對新詞 / 專有名詞容忍度高 — 不依賴詞典即可匹配",
        "3-gram 可捕捉 3-4 字術語（投委會、董事會、伊勢島飯店）",
        "簡單可靠、無外部相依、計算成本低",
    ],
    cons=[
        "Token 數量爆增：6 字詞會切出 15 個 token，索引變大",
        "會產生無意義的 token（如「京中央」）— 但 IDF 會把它們的權重降到很低，影響不大",
        "對英文沒有 stemming（investing 與 investment 不互通）— 需另外加 Porter Stemmer",
    ],
))

# 演算法 3: RSJ IDF
story.extend(algo_section(
    3, "Robertson-Sparck-Jones IDF", "資訊檢索",
    imgs["idf"],
    why=(
        "經典 IDF = log(N/df) 在 df > N/2 時會變負數（極常見詞 stop word 被罰太重），"
        "BM25 改用 RSJ 公式 log(1 + (N−df+0.5)/(df+0.5))，加 Lidstone smoothing 確保結果穩定且永遠 > 0。"
    ),
    pros=[
        "永遠非負，可放心乘上 TF 而不會反向扣分",
        "加 +0.5 smoothing 避免邊界除零 / 極端值問題",
        "對 stop word 自然趨近 0 分（達成「自動忽略 stop word」效果）",
    ],
    cons=[
        "公式不如經典 log(N/df) 直觀，初學者要先學會",
        "+0.5 是經驗常數，不同領域可能需要微調",
    ],
))

# 演算法 4: 同義詞
story.extend(algo_section(
    4, "Synonym Normalization", "資訊檢索",
    imgs["synonym"],
    why=(
        "金融 / 投資領域同個概念有多種寫法（盡調 vs DD vs Due Diligence），"
        "若不處理，「DD」搜不到含「盡職調查」的案件。Tokenize 前統一轉成 canonical form 解決此問題。"
    ),
    pros=[
        "立即提升召回率（recall）— 不用使用者背所有縮寫",
        "完全可控、可解釋（明確列出每組對應）",
        "從長到短替換確保不會誤切（先替「盡職調查」再替「盡調」）",
    ],
    cons=[
        "需要人工維護同義詞表，新詞要手動加",
        "可能造成過度匹配（「客戶」與「customer」可能被當完全同義，但有時 customer 指外部）",
        "不能處理多義詞（「銀行」可能指金融機構或河岸）",
    ],
))

# 演算法 5: Empirical Percentile
story.extend(algo_section(
    5, "Empirical Percentile", "統計分析",
    imgs["percentile"],
    why=(
        "不同類別卡點的合理時長差異極大（法遵 7-8 天合理、跨部門 4-5 天就該升級）。"
        "用「同類歷史」的分位數判風險，比「絕對 10 天」這種固定門檻更精準、更自適應。"
    ),
    pros=[
        "自適應公司規模 / 產業淡旺季 — 不需重新調參",
        "對離群值（outlier）魯棒 — 不像 mean+std 易被極端值拉偏",
        "線性內插提供連續數值，避免階梯式跳變",
    ],
    cons=[
        "樣本太少（< 5 筆）會不穩定 — 需 fallback 到全公司歷史",
        "P95+ 在歷史長尾極稀疏 — 邊界估計誤差大",
        "對極新類別（從沒解過的卡點種類）完全無歷史可比",
    ],
))

# 演算法 6: Gini
story.extend(algo_section(
    6, "Gini Coefficient", "統計分析",
    imgs["gini"],
    why=(
        "經濟學量化「分配不均」的標準工具。本系統用來衡量員工負載不均度 — "
        "若 Gini > 0.35 代表工作量集中在少數「超人」身上，組織單點失敗風險高（Key Man Risk）。"
    ),
    pros=[
        "0.35 是經濟學公平 / 不公平的學術分界 — 有理論依據",
        "對總量不敏感 — 公司大小不同都能比較",
        "排序後 O(n) 公式比標準 O(n²) 公式快很多",
    ],
    cons=[
        "純不均度指標，看不出「是高負載者太高還是低負載者太低」",
        "對小團隊（< 5 人）容易跳動 — 一人變化就大幅影響",
        "假設「平均負載 = 健康」，但某些角色本來就該高負載（如 CTO）",
    ],
))

story.append(PageBreak())

# 演算法 7: Exponential Decay
story.extend(algo_section(
    7, "Exponential Time Decay", "時間序列",
    imgs["decay"],
    why=(
        "員工負載分析中，本週的案件壓力遠大於 8 週前的案件。用 [1.0, 0.7, 0.5, 0.35, ...] "
        "指數衰減陣列做時間加權，符合「近期工作影響更大」的人類直覺。"
    ),
    pros=[
        "近期權重高、遠期權重低，貼近實際感受",
        "9 週前後一律 0，自然限定計算範圍",
        "離散查表 O(1) 計算，零開銷",
    ],
    cons=[
        "權重是寫死的經驗值，理想應該依「案件類別」動態調整",
        "8 週前 → 9 週前突然從 0.02 跳到 0 — 階梯邊緣",
        "對「跨年大案」這種一直拖很久的不公平 — 會被低估",
    ],
))

# 演算法 8: Local Minima
story.extend(algo_section(
    8, "Local Minima Detection (拐點偵測)", "時間序列",
    imgs["minima"],
    why=(
        "管理層需要快速找出組織健康度何時開始崩跌 — 「拐點」就是 V 型谷底。"
        "雙邊閾值 −3 分要求左右兩側都明顯較高，過濾隨機雜訊。"
    ),
    pros=[
        "簡單可解釋：每個點看左右兩鄰居即可",
        "雙邊對稱閾值排除單邊偶然下跌（一次性雜訊）",
        "O(n) 一次掃描完成",
    ],
    cons=[
        "閾值 3 分是 magic number — 在分數區間 [0,100] 經驗值",
        "找不到「緩慢長期下滑」這種無明顯谷底的情境",
        "不知道為什麼掉 — 只標位置，原因要去看當週事件",
    ],
))

# 演算法 9: Weighted Load Score
story.extend(algo_section(
    9, "Weighted Load Score", "加權評分",
    imgs["load"],
    why=(
        "員工的負載不只是「處理幾件案件」— 還有卡點數、被提及次數、交接負擔。"
        "用 4 元素加權融合：卡點 ×2.0（最重，代表正在燒）、案件 ×1.5、交接 ×1.0、提及 ×0.8。"
    ),
    pros=[
        "多維度反映真實工作壓力，不只看表面案件數",
        "卡點權重最高 — 因為卡點代表「需要立刻關注」",
        "Percentile rank 判定過載 → 自適應公司規模",
    ],
    cons=[
        "4 個權重（1.5/2.0/0.8/1.0）是經驗值，沒有完美公式",
        "從週報文字偵測「卡」「延」等關鍵字 — 對白話文或英文夾雜不穩",
        "新員工沒歷史資料 → 計算困難",
    ],
))

# 演算法 10: ORI
story.extend(algo_section(
    10, "ORI — Organizational Risk Index", "加權評分",
    imgs["ori"],
    why=(
        "給管理層的「組織體溫計」— 融合人力集中度 (HCC)、決策延遲 (DL)、卡點長尾風險 (BT)、"
        "跨部門協作 (CDC) 四大因子。HCC 權重最高（35%）因為人力集中是組織單點失敗主因。"
    ),
    pros=[
        "0-200 反向計分 — 越高越警示，符合 risk index 慣例",
        "四因子涵蓋組織健康主要面向",
        "五級告警對應具體建議文案，可直接行動",
    ],
    cons=[
        "0-200 對直覺管理層不友善（多數人習慣 0-100）— 故 v2.1 補了 Org Health 6D",
        "權重 (35/25/25/15) 是經驗值，理應依公司階段調整",
        "因子之間可能有相關性（例如過載通常伴隨卡點），未做共線性分析",
    ],
))

# 演算法 11: Org Health 6D
story.extend(algo_section(
    11, "Organization Health 6D Radar", "加權評分",
    imgs["radar"],
    why=(
        "管理層友善的 0-100 正向計分版本。6 維雷達涵蓋卡點、決策、交接、負載、協作、週報。"
        "搭配 12 週趨勢線 + 拐點偵測 + 點擊事件 inline 展開 — Plan→Decide→Track→Learn 閉環的核心儀表板。"
    ),
    pros=[
        "雷達圖直觀展示「強項 / 弱項」，一眼看出該補哪個維度",
        "本週 vs 12 週均值雙圖層比對 — 看出短期偏差",
        "底層共享同一組分析器，跨頁面數字保證一致",
    ],
    cons=[
        "權重 (0.22/0.18/0.15/0.18/0.12/0.15) 是專家會議值，不同產業適配性需驗證",
        "週報品質維度容易被刷分（多寫廢話也能拉長度）",
        "若公司未啟動週報制度，週報品質永遠 0 分 — 拉低整體",
    ],
))

# 演算法 12: Decision Impact + Cohort
story.extend(algo_section(
    12, "Decision Impact + Cohort Adjustment (v2.2)", "加權評分 ★",
    imgs["cohort"],
    why=(
        "原本只看「決策完成後 N 週的健康度變化」，會被大環境趨勢汙染（整體下滑期決策都被冤枉）。"
        "v2.2 引入 Cohort Adjustment：扣掉「同期基準漂移」，得出純粹歸因於該決策的影響。"
    ),
    pros=[
        "解決因果歸因問題 — 區分「決策自身效果」vs「大環境趨勢」",
        "用 12 週線性回歸算 baseline drift，O(1) 攤平多筆決策計算",
        "正面 / 中性 / 負面三級判定，配合排行版直觀化",
    ],
    cons=[
        "Baseline drift 假設組織趨勢是線性 — 實際可能有突變",
        "完成不到 4 週 (windowWeeks) 的決策標記「⏳ 追蹤中」— 給暫評",
        "對「靜默成功」（防止惡化但沒推升）的決策可能低估",
    ],
))

# 演算法 13: Linear Regression
story.extend(algo_section(
    13, "Linear Regression Baseline Drift Slope (v2.2 工具)", "時間序列",
    imgs["linreg"],
    why=(
        "Cohort Adjustment 的核心工具。從 12 週快照採樣 12 個 (x, y) 點，"
        "用最小平方法 (Least Squares) 算出大盤每日漂移率。比「首尾相減 / 天數」對單週雜訊魯棒得多。"
    ),
    pros=[
        "12 點互相抵消雜訊，找出穩健的長期趨勢",
        "純數學，無 hyperparameter — 確定性結果",
        "計算 O(n) 一次性，driftCache 共享給所有決策避免重算",
    ],
    cons=[
        "假設線性趨勢 — 若組織有 S 型成長或週期性，會失真",
        "12 週樣本對「跨季度」事件可能不夠",
        "Slope 對首尾極端點敏感（leverage effect）",
    ],
))

story.append(PageBreak())

# 演算法 14: Asymmetric
story.extend(algo_section(
    14, "Asymmetric Communication Detection", "圖論",
    imgs["asym"],
    why=(
        "識別組織內的「溝通黑洞」— A 一直找 B（≥5 次）但 B 完全沒回應 A。"
        "這是組織壁壘、推託、流程斷層的明確徵兆，計入 ORI 的 CDC 與健康度的部門協作維度。"
    ),
    pros=[
        "明確的組織病徵偵測 — 不只看流量，更看「對稱性」",
        "閾值 5 過濾偶然提及，只標真正單向依賴",
        "圖論基礎，可擴展到更複雜的網絡指標（中心性、社群偵測）",
    ],
    cons=[
        "閾值 5 是 magic number，小團隊可能不適用",
        "未區分「該回但沒回」vs「本來就不該回」的對話",
        "依賴週報文字 mention 抽取，若某部門寫週報少會偵測不到",
    ],
))

# 演算法 15: What-if
story.extend(algo_section(
    15, "What-if Scenario Simulation (v2.2)", "預測模擬",
    imgs["whatif"],
    why=(
        "管理層在做決策前需要「先看後果」。What-if 提供互動式 sandbox — 拉滑桿模擬「解掉這 3 個卡點 + 加 2 名法遵專員」會讓組織健康度變多少。"
        "v2.2 加 useDeferredValue 避免重算卡 UI。"
    ),
    pros=[
        "Demo 神器 — 教授拉開關就感受演算法價值",
        "對原始資料 fork shadow data，不汙染主資料",
        "React 19 useDeferredValue 自動降優先級，UI 流暢",
        "與 baseline 雙圖層雷達比對 + delta 智能建議文案",
    ],
    cons=[
        "假設「解掉卡點 = 立即生效」，現實中可能有延遲",
        "模擬「加員工」目前是新增 loadScore=0 的人，可能拉高 Gini（反效果）— 該改為 reassignment",
        "資料量 10x 時即使 useDeferredValue 也會卡，需 Web Worker",
    ],
))

# 結語
story.append(PageBreak())
story.append(Paragraph("結語：演算法選擇的設計哲學", style_h1))
story.append(Paragraph(
    "本系統 15 個核心演算法（加上 13 個工具機制，共 28+1）共同實現一個目標：<br/>"
    "<b>「用恰當的演算法解決恰當規模的問題」</b>。",
    style_body,
))

story.append(Paragraph("為什麼不用 LLM / Embedding？", style_h2))
story.append(Paragraph(
    "(1) <b>資料量小</b>：53 筆歷史案、240 筆週報，BM25F 比 Embedding 更可靠且零成本。<br/>"
    "(2) <b>可解釋性</b>：管理層需要知道「為什麼推薦這筆」，BM25F 可逐項列出命中詞貢獻。<br/>"
    "(3) <b>機密敏感</b>：投資公司資料不能送 cloud API。<br/>"
    "(4) <b>計算成本</b>：BM25F、Gini、percentile 都是 O(N) 或 O(N log N)，瀏覽器毫秒級。<br/>"
    "(5) <b>確定性</b>：相同輸入永遠回傳相同結果，LLM 有 stochasticity。",
    style_body,
))

story.append(Paragraph("好處 / 壞處的核心權衡", style_h2))
story.append(info_box("用「經驗值權重」而非「機器學習」",
    "整套系統大量使用人工調參的權重（field weights、time decay、ORI weights 等）。"
    "好處：可解釋、可調、無黑盒；壞處：需要領域專家定參數，新公司導入要 1-2 週調參。"
    "這個選擇對「中小型公司、決策層使用」最適合。",
    BLUE))

story.append(info_box("用「Empirical Percentile」而非「絕對門檻」",
    "好處：自適應公司規模、自適應產業；壞處：樣本不足時不穩定。"
    "對於 50 人規模、200 筆歷史的中型企業，這是最佳折衷。",
    GREEN))

story.append(info_box("用「動態判定 helper」而非「status 字串」",
    "v2.1 把所有「逾期」判定改成動態日期計算，不再依賴 status 字串。"
    "好處：自動偵測「dueDate 過期但 status 沒更新」；壞處：每次都要重算，輕微 CPU 開銷。"
    "對使用者體驗有正面影響（不會看到狀態錯亂）。",
    AMBER))

story.append(Spacer(1, 1 * cm))
story.append(Paragraph(
    "<i>「資料越少，演算法的選擇越重要。」</i><br/>"
    "<i>「跨頁面的一致性，比單頁的炫技更重要。」</i><br/>"
    "<i>「能解釋的演算法，比準確 1% 的黑盒更值錢。」</i><br/><br/>"
    "—— 串連系統 v2.2 設計哲學",
    ParagraphStyle("end", fontName=CN, fontSize=10.5, textColor=GREY, leading=18),
))


# ===================================================
# 輸出 PDF
# ===================================================
out_path = "docs/串連系統_演算法視覺化手冊.pdf"


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(CN, 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1 * cm, "串連系統 v2.2 · 演算法視覺化手冊")
    canvas.drawRightString(19 * cm, 1 * cm, f"第 {doc.page} 頁")
    canvas.restoreState()


doc = SimpleDocTemplate(
    out_path, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="串連系統 v2.2 — 演算法視覺化手冊",
    author="資管導論 第 13 組",
)
doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
print(f"OK -> {out_path}")
