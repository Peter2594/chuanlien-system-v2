# -*- coding: utf-8 -*-
"""
串連系統 v2.2 — 人工參數調校筆記
用「反推校準」的工程現實視角，重現每個 magic number 的調整過程
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY, TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, KeepTogether,
)
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.cidfonts import UnicodeCIDFont

pdfmetrics.registerFont(UnicodeCIDFont("STSong-Light"))
CN = "STSong-Light"

# ========== 色板：Midnight Executive ==========
NAVY  = HexColor("#1E2761")
ICE   = HexColor("#CADCFC")
WHITE = HexColor("#FFFFFF")
GOLD  = HexColor("#F4A93C")
CORAL = HexColor("#F96167")
GREEN = HexColor("#10B981")
SLATE = HexColor("#475569")
GREY  = HexColor("#94A3B8")
LIGHT = HexColor("#F8FAFC")
CREAM = HexColor("#FAF5E6")
RED   = HexColor("#EF4444")

# 樣式
style_title    = ParagraphStyle("title", fontName=CN, fontSize=30, leading=36, textColor=NAVY, spaceAfter=8)
style_subtitle = ParagraphStyle("st", fontName=CN, fontSize=12, leading=18, textColor=SLATE, spaceAfter=24)
style_h1       = ParagraphStyle("h1", fontName=CN, fontSize=22, leading=28, textColor=NAVY, spaceBefore=14, spaceAfter=10)
style_h2       = ParagraphStyle("h2", fontName=CN, fontSize=15, leading=22, textColor=CORAL, spaceBefore=12, spaceAfter=4)
style_h3       = ParagraphStyle("h3", fontName=CN, fontSize=12, leading=18, textColor=NAVY, spaceBefore=8, spaceAfter=2)
style_body     = ParagraphStyle("body", fontName=CN, fontSize=10.5, leading=16, textColor=NAVY, alignment=TA_JUSTIFY, spaceAfter=6)
style_quote    = ParagraphStyle("quote", fontName=CN, fontSize=11, leading=18, textColor=NAVY, italic=True,
                                 leftIndent=14, rightIndent=10, spaceAfter=8, spaceBefore=4,
                                 backColor=CREAM, borderColor=GOLD, borderWidth=0, borderPadding=10)


def code_block(text, color=NAVY):
    return Paragraph(
        f"<font color='{color.hexval() if hasattr(color, 'hexval') else color}'>{text}</font>",
        ParagraphStyle("code", fontName="Courier", fontSize=9, leading=13,
                       leftIndent=14, rightIndent=14, spaceAfter=8, spaceBefore=2,
                       backColor=HexColor("#F1F5F9"), borderPadding=8),
    )


def quote(text, who=""):
    items = [Paragraph(f"<font color='#1E2761'>「{text}」</font>", style_quote)]
    if who:
        items.append(Paragraph(
            f"<font color='#94A3B8'>— {who}</font>",
            ParagraphStyle("qw", fontName=CN, fontSize=9, textColor=GREY, alignment=TA_LEFT, leftIndent=14)
        ))
    return items


def info_box(title, body, color=NAVY):
    inner_title = ParagraphStyle("ib_t", fontName=CN, fontSize=11, leading=15, textColor=color, spaceAfter=4)
    inner_body  = ParagraphStyle("ib_b", fontName=CN, fontSize=10, leading=15, textColor=NAVY)
    inner = [Paragraph(f"<b>{title}</b>", inner_title), Paragraph(body, inner_body)]
    t = Table([[inner]], colWidths=[16.8 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), LIGHT),
        ("BOX", (0, 0), (-1, -1), 0.6, color),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
    ]))
    return KeepTogether([t, Spacer(1, 6)])


def comparison_table(rows, header_color=NAVY):
    """三欄對照表：項目 / 第一版 / 修正版"""
    data = [[
        Paragraph("<font color='white'><b>項目</b></font>",
                  ParagraphStyle("th", fontName=CN, fontSize=10, textColor="white", alignment=TA_LEFT)),
        Paragraph("<font color='white'><b>第一版</b></font>",
                  ParagraphStyle("th", fontName=CN, fontSize=10, textColor="white", alignment=TA_LEFT)),
        Paragraph("<font color='white'><b>調整後</b></font>",
                  ParagraphStyle("th", fontName=CN, fontSize=10, textColor="white", alignment=TA_LEFT)),
    ]]
    for r in rows:
        data.append([
            Paragraph(r[0], ParagraphStyle("c1", fontName=CN, fontSize=9.5, textColor=NAVY, leading=13)),
            Paragraph(f"<font color='#94A3B8'>{r[1]}</font>",
                      ParagraphStyle("c2", fontName=CN, fontSize=9.5, leading=13)),
            Paragraph(f"<b><font color='#10B981'>{r[2]}</font></b>",
                      ParagraphStyle("c3", fontName=CN, fontSize=9.5, leading=13)),
        ])
    t = Table(data, colWidths=[5 * cm, 6 * cm, 6 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, ICE),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT),
    ]))
    return t


def expectation_table(rows, header_color=NAVY):
    """期望 vs 實際對照表"""
    data = [[
        Paragraph("<font color='white'><b>情境</b></font>", ParagraphStyle("th1", fontName=CN, fontSize=10, textColor="white")),
        Paragraph("<font color='white'><b>期望分數</b></font>", ParagraphStyle("th2", fontName=CN, fontSize=10, textColor="white", alignment=TA_CENTER)),
        Paragraph("<font color='white'><b>第一版實算</b></font>", ParagraphStyle("th3", fontName=CN, fontSize=10, textColor="white", alignment=TA_CENTER)),
        Paragraph("<font color='white'><b>差距</b></font>", ParagraphStyle("th4", fontName=CN, fontSize=10, textColor="white", alignment=TA_CENTER)),
    ]]
    for r in rows:
        diff = r[2] - r[1]
        if abs(diff) >= 8:
            sign_color = "#EF4444"
            sign = "✗"
        elif abs(diff) >= 4:
            sign_color = "#F4A93C"
            sign = "△"
        else:
            sign_color = "#10B981"
            sign = "✓"
        data.append([
            Paragraph(r[0], ParagraphStyle("c1", fontName=CN, fontSize=9.5, textColor=NAVY, leading=13)),
            Paragraph(f"{r[1]}", ParagraphStyle("c2", fontName=CN, fontSize=10, textColor=NAVY, alignment=TA_CENTER)),
            Paragraph(f"{r[2]}", ParagraphStyle("c3", fontName=CN, fontSize=10, textColor=SLATE, alignment=TA_CENTER)),
            Paragraph(f"<font color='{sign_color}'>{sign} {diff:+d}</font>",
                      ParagraphStyle("c4", fontName=CN, fontSize=10, alignment=TA_CENTER)),
        ])
    t = Table(data, colWidths=[6 * cm, 3.5 * cm, 3.5 * cm, 4 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), header_color),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, ICE),
        ("BACKGROUND", (0, 1), (-1, -1), LIGHT),
    ]))
    return t


def step_box(num, title, body, color=CORAL):
    """編號步驟塊"""
    title_para = Paragraph(
        f"<font color='{color.hexval()}'><b>Step {num}</b></font> &nbsp;·&nbsp; <b>{title}</b>",
        ParagraphStyle("sn", fontName=CN, fontSize=12, leading=16, textColor=NAVY, spaceBefore=8, spaceAfter=4)
    )
    body_para = Paragraph(body, ParagraphStyle("sb", fontName=CN, fontSize=10.5, leading=15.5,
                                                textColor=NAVY, leftIndent=10, spaceAfter=6))
    return KeepTogether([title_para, body_para])


def page_header(num, name):
    """每頁／每節的標題塊"""
    items = []
    items.append(Paragraph(
        f"<font color='#F4A93C'>#{num:02d}</font>",
        ParagraphStyle("pn", fontName=CN, fontSize=16, leading=20, textColor=GOLD, spaceBefore=10, spaceAfter=2)
    ))
    items.append(Paragraph(name, style_h1))
    return items


# ============================================================
story = []

# ============ 封面 ============
story.append(Spacer(1, 3 * cm))
story.append(Paragraph("人工參數調校筆記", style_title))
story.append(Paragraph("Parameter Tuning Notebook · 串連系統 v2.2",
                        ParagraphStyle("h_en", fontName=CN, fontSize=14, leading=20, textColor=CORAL, spaceAfter=4)))
story.append(Paragraph("「反推校準」的工程現實",
                        ParagraphStyle("h_sub", fontName=CN, fontSize=13, leading=18, textColor=SLATE,
                                       italic=True, spaceAfter=24)))

story.append(Paragraph(
    "這份文件用<b>「反推校準」的工程現實視角</b>，重現系統中每個 magic number 的調整過程。<br/><br/>"
    "不是「先有理論再算出來」，而是<b>「跑出來看順眼，再回頭找理由」</b>的真實過程。<br/><br/>"
    "每個參數的故事都包含：<br/>"
    "&nbsp;&nbsp;<b>① 痛點</b> — 為什麼需要這個指標<br/>"
    "&nbsp;&nbsp;<b>② 訊號列表</b> — 從哪裡抓資料<br/>"
    "&nbsp;&nbsp;<b>③ 第一版公式</b> — 憑直覺寫的初版<br/>"
    "&nbsp;&nbsp;<b>④ 跑 SEED 對照</b> — 期望 vs 實際的差距<br/>"
    "&nbsp;&nbsp;<b>⑤ 調整迭代</b> — 怎麼改、為什麼改<br/>"
    "&nbsp;&nbsp;<b>⑥ 收斂結果</b> — 最終版本與驗證<br/><br/>"
    "目標：證明「人工參數」≠「隨便挑」。<b>有方法論，有迭代，有驗證。</b>",
    style_subtitle,
))

story.append(Spacer(1, 0.6 * cm))

# 開門見山的引言
story.extend(quote(
    "公式不是先有理論再算出來，是反過來：先想「我希望使用者看到什麼」，再倒推出公式。<br/>"
    "這不是缺陷，是工程現實。重點是有沒有方法論。",
    "串連系統 v2.2 設計哲學",
))

story.append(PageBreak())

# ============================================================
# 序章：反推校準方法論
# ============================================================
story.extend(page_header(0, "序章 · 反推校準方法論"))

story.append(Paragraph(
    "在介紹各個演算法的調校過程前，先說明<b>「反推校準」</b>的整套方法論。"
    "這個 5 步驟適用於系統內所有人工參數。",
    style_body,
))

story.append(step_box(1, "寫初版（憑直覺 + 抄業界）",
    "看別人怎麼做（Elasticsearch 用 k1=1.2、Gini 國家分界 0.35），<b>能抄的先抄</b>。"
    "其他自己編：扣 10、5、3 這種「整數順手」的數字。<br/>"
    "目標：<b>先有可運作的版本，不求完美</b>。"
))

story.append(step_box(2, "跑 SEED 看分數",
    "用 SEED 資料跑公式，看典型情境的實際分數：<br/>"
    "&nbsp;&nbsp;• 全空 SEED → 期望 ~95 分<br/>"
    "&nbsp;&nbsp;• 目前狀況 → 期望 ~55-65 分<br/>"
    "&nbsp;&nbsp;• 全部解決 → 期望 ~85+ 分<br/>"
    "&nbsp;&nbsp;• 一團糟 → 期望 ~30-40 分"
))

story.append(step_box(3, "對照「期望」與「實際」",
    "寫一張對照表，看哪個情境差最遠：<br/><br/>"
))
story.append(expectation_table([
    ("目前狀況",   60, 72),
    ("全部解掉",   85, 78),
    ("一團糟",     30, 42),
    ("全空",       95, 95),
], NAVY))

story.append(Spacer(1, 0.4 * cm))

story.append(step_box(4, "調係數",
    "看哪個情境差最多，調對應公式的係數。例如：<br/>"
    "「目前狀況」太高 → 加大扣分（例如卡點 P95 從 ×10 調到 ×15）<br/>"
    "重跑 → 看新的對照表是否所有情境都靠近期望。"
))

story.append(step_box(5, "迭代直到收斂",
    "通常 3-5 輪就收斂。判斷收斂的標準：<br/>"
    "<b>所有典型情境的差距都 &lt; 5 分</b>（綠燈 ✓）"
))

story.append(Spacer(1, 0.4 * cm))

story.append(info_box("關鍵問題：「期望分數」哪裡來？",
    "<b>這是最主觀的環節，但有原則</b>：<br/><br/>"
    "「期望分數」其實是「<b>我想讓使用者看到什麼</b>」的目標：<br/>"
    "&nbsp;&nbsp;• 想讓「目前 SEED」看起來像「該注意但不致命」 → 設定期望 60<br/>"
    "&nbsp;&nbsp;• 想讓「全部解掉」看起來像「不錯但還有空間」 → 設定期望 85<br/><br/>"
    "→ 公式是<b>為了達到 UX 目標而調出來</b>，不是先有公式再算出分數。<br/>"
    "→ 透明承認這點，比假裝公式是「天降神授」更誠實。",
    GOLD))

story.append(PageBreak())

# ============================================================
# Page 1: 員工負載分析
# ============================================================
story.extend(page_header(1, "員工負載分析"))

story.append(Paragraph(
    "<b>公式</b>：loadScore = cases × 1.5 + blocker × 2.0 + mentions × 0.8 + handoff × 1.0<br/>"
    "<b>等級</b>：overload ≥ 25 OR P90+ &nbsp;/&nbsp; high ≥ 15 OR P75+ &nbsp;/&nbsp; normal ≥ 6 &nbsp;/&nbsp; low ≥ 1 &nbsp;/&nbsp; idle &lt; 1",
    style_body,
))

story.append(Paragraph("🎯 痛點", style_h2))
story.append(Paragraph(
    "主管想知道「<b>誰扛太重？誰閒置？</b>」，但傳統「指派幾件案件」太粗：<br/>"
    "&nbsp;&nbsp;• A 員工分到 5 件「小案」 vs B 員工分到 2 件「卡很久的案」 → 誰更累？<br/>"
    "&nbsp;&nbsp;• C 員工常被同事「@」 vs D 員工自己寫 3 件案 → 誰更忙？<br/><br/>"
    "需要一個<b>綜合分數</b>融合多種訊號。",
    style_body,
))

story.append(Paragraph("📡 訊號列表（憑直覺列）", style_h2))
story.append(code_block(
    "員工的工作壓力 = ?<br/>"
    "<br/>"
    "1. 自己主辦了幾件案？     ← 最基本<br/>"
    "2. 自己負責的卡點？       ← 卡點代表「正在燒」<br/>"
    "3. 別人 @ 我幾次？        ← 跨部門協作<br/>"
    "4. 簽收 / 等簽收幾件交接？← 心理負擔<br/>"
    "<br/>"
    "決定：4 個訊號各自獨立 → 用「加總」處理：<br/>"
    "loadScore = A + B + C + D"
))

story.append(Paragraph("📊 第一版（憑直覺給權重）", style_h2))
story.append(Paragraph("排序：「卡點 > 案件 > 交接 > 被提」，比例試 3:2:1.5:1", style_body))
story.append(code_block(
    "loadScore = cases × 2 + blocker × 3 + handoff × 1.5 + mentions × 1"
))

story.append(Paragraph("跑 SEED 結果（典型員工林聿平）：", style_body))
story.append(code_block(
    "cases=4, blocker=1, mentions=2, handoff=1<br/>"
    "loadScore = 4×2 + 1×3 + 2×1 + 1×1.5 = 8 + 3 + 2 + 1.5 = 14.5"
))

story.append(Paragraph("過載門檻設 20 → <b>沒人過載</b>。但 SEED 真實狀況應該有 2 人過載。", style_body))

story.append(info_box("❌ 第一版的問題",
    "「沒人過載」跟真實感受不符 — 林聿平和梁嘉芫明顯比其他人累。<br/>"
    "需要<b>整體拉低數值範圍</b>，讓門檻定 25 時仍能抓出過載員工。",
    RED))

story.append(Paragraph("📊 第二版（反推調整）", style_h2))
story.append(comparison_table([
    ("cases 權重",      "× 2",     "× 1.5"),
    ("blocker 權重",    "× 3",     "× 2.0（含內層 ×2.5）"),
    ("mentions 權重",   "× 1",     "× 0.8"),
    ("handoff 權重",    "× 1.5",   "× 1.0（待簽收特別 ×4 decay）"),
], NAVY))

story.append(Spacer(1, 0.3 * cm))

story.append(Paragraph("重跑 SEED（林聿平有 2 件卡點）：", style_body))
story.append(code_block(
    "cases = 4 × 1.5 = 6<br/>"
    "blocker = 2 × 2.5 × 2.0 = 10  ← 內外雙層放大<br/>"
    "mentions = 2 × 0.8 = 1.6<br/>"
    "handoff = 1×4 (待簽) + 2×1.5 (已簽) = 7<br/>"
    "TOTAL ≈ 18.6"
))

story.append(Paragraph("✓ 進入「high」級別，符合真實感受", style_body))

story.append(Paragraph("🔑 等級閾值的反推", style_h2))
story.append(Paragraph("先想「<b>典型過載員工</b>應該有什麼樣的工作量」：", style_body))
story.append(code_block(
    "典型過載員工：5 件主辦 + 2 件卡點 + 5 次被提 + 3 件交接<br/>"
    "計算：5×1.5 + 2×5 + 5×0.8 + (4+3) = 7.5 + 10 + 4 + 7 = 28.5<br/>"
    "<br/>"
    "→ 過載門檻定 25（28.5 之下一點，留 buffer）<br/>"
    "<br/>"
    "典型 high：3 件主辦 + 1 件卡 + 3 次提 + 2 件交接 ≈ 15<br/>"
    "→ high 門檻定 15<br/>"
    "<br/>"
    "典型 normal：2 件主辦 + 1 次提 + 1 件交接 ≈ 6<br/>"
    "→ normal 門檻定 6<br/>"
    "<br/>"
    "low：基本沒事做 → 定 1<br/>"
    "idle：完全沒事 → < 1"
))

story.append(Paragraph("⏰ Time Decay：[1.0, 0.7, 0.5, 0.35, ...]", style_h2))
story.append(Paragraph(
    "這 9 個值不是我挑的，是<b>從 Andy Grove「半衰期 2 週」反推</b>：",
    style_body,
))
story.append(code_block(
    "設半衰期 = 2 週 → t=2 時 weight=0.5<br/>"
    "解 λ = ln(2)/2 ≈ 0.347<br/>"
    "<br/>"
    "代入各 t：<br/>"
    "&nbsp;&nbsp;t=0 → 1.0       (本週)<br/>"
    "&nbsp;&nbsp;t=1 → 0.71 → 0.7<br/>"
    "&nbsp;&nbsp;t=2 → 0.50 → 0.5  ← 定義點<br/>"
    "&nbsp;&nbsp;t=3 → 0.35<br/>"
    "&nbsp;&nbsp;...<br/>"
    "&nbsp;&nbsp;t=9 → 接近 0 → 歸 0"
))

story.append(Paragraph("→ <b>9 個值是 1 個學理依據的離散採樣</b>，不是 9 個獨立決定。", style_body))

story.append(PageBreak())

# ============================================================
# Page 2: 卡點分析（Percentile）
# ============================================================
story.extend(page_header(2, "卡點分析（Empirical Percentile）"))

story.append(Paragraph(
    "<b>公式</b>：對每件卡點算 percentile (vs 同類歷史) → 分為 critical (P95+) / high (P90+) / medium (P75+) / normal",
    style_body,
))

story.append(Paragraph("🎯 痛點", style_h2))
story.append(Paragraph(
    "傳統卡點告警用「<b>絕對天數</b>」（卡 10 天 = 警告），但不同類別合理時長差異極大：<br/>"
    "&nbsp;&nbsp;• 法遵類平均 7-8 天合理<br/>"
    "&nbsp;&nbsp;• 跨部門類 4-5 天就該升級<br/>"
    "&nbsp;&nbsp;• 募資類可能 30 天才算長<br/><br/>"
    "<b>「卡 10 天」對不同類別的嚴重度不同</b>，固定門檻不能用。",
    style_body,
))

story.append(Paragraph("💡 設計思路", style_h2))
story.append(Paragraph(
    "用「<b>同類歷史</b>」當基準。每件卡點看「<b>它在歷史分布中排到多少 %</b>」：<br/>"
    "&nbsp;&nbsp;P75：卡得比 75% 同類久 → 進入關注區<br/>"
    "&nbsp;&nbsp;P90：卡得比 90% 同類久 → 高風險<br/>"
    "&nbsp;&nbsp;P95：卡得比 95% 同類久 → 極高風險",
    style_body,
))

story.append(Paragraph("🤔 為什麼選 P75 / P90 / P95？", style_h2))
story.append(Paragraph(
    "<b>對照 4 種閾值組合</b>：",
    style_body,
))
story.append(comparison_table([
    ("P50/P75/P90",  "太敏感，一半卡點都進警示",  "不適合 — 警示太多"),
    ("P75/P90/P95",  "標準業界 SLA",              "✓ 選這個"),
    ("P80/P90/P99",  "P99 對 53 筆只有 1 筆",      "不適合 — 邊界太極端"),
    ("P70/P85/P95",  "下緣比 P75 鬆",              "不適合 — 跟 P75 差距不夠"),
], NAVY))

story.append(Paragraph(
    "<b>業界共識</b>：AWS / Amazon 服務承諾用 P90，Google SRE 用 P95 P99。<br/>"
    "→ <b>直接套業界做法</b>（不用自己想）",
    style_body,
))

story.append(Paragraph("🎯 卡點健康公式的反推", style_h2))
story.append(Paragraph("假設一個「一團糟公司」：4 件 P95 + 1 件 P90 + 平均 percentile = 65", style_body))

story.append(Paragraph("<b>第一版（憑直覺）</b>：", style_body))
story.append(code_block(
    "blockerHealth = 100 - P95 × 10 - P90 × 5<br/>"
    "= 100 - 4×10 - 1×5 = 55"
))

story.append(Paragraph("整體健康度算下來 ~70 分。但「一團糟公司」應該是「可關注」級別（55-65），70 算 「良好」太樂觀。", style_body))

story.append(Paragraph("<b>第二版（拉大扣分）</b>：", style_body))
story.append(code_block(
    "blockerHealth = 100 - P95 × 15 - P90 × 7 - max(0, avgP-50) × 0.8<br/>"
    "= 100 - 60 - 7 - 12 = 21"
))

story.append(Paragraph("整體變 ~60 分。「<b>可關注</b>」級別，符合直覺。✓", style_body))

story.append(info_box("「為什麼是 15:7 不是 20:10？」",
    "反推：4 件 P95 + 1 件 P90 + avgP 65 的「一團糟公司」應該扣 80 分（剩 20）。<br/>"
    "→ 4×?₁ + 1×?₂ + 15×?₃ = 80<br/>"
    "→ 套 ?₁=15、?₂=7、?₃=0.8 → 4×15 + 1×7 + 15×0.8 = 79 ≈ 80 ✓<br/>"
    "<br/>"
    "<b>15:7 ≈ 2:1</b> 對應「極高風險的危害是高風險的 2 倍」的直覺，順手好記。",
    GOLD))

story.append(PageBreak())

# ============================================================
# Page 3: 組織健康度 6 維權重
# ============================================================
story.extend(page_header(3, "組織健康度 6 維權重"))

story.append(Paragraph(
    "<b>公式</b>：overall = 卡點 × 0.22 + 決策 × 0.18 + 交接 × 0.15 + 負載 × 0.18 + 協作 × 0.12 + 週報 × 0.15",
    style_body,
))

story.append(Paragraph("🎯 痛點", style_h2))
story.append(Paragraph(
    "想給管理層「<b>一個數字</b>」代表組織狀態，但組織健康是<b>多維度</b>的：<br/>"
    "&nbsp;&nbsp;週報品質滿分但卡點極差 → 一樣 50 分？不合理<br/>"
    "&nbsp;&nbsp;不能把「行政指標」跟「實質指標」等價看待<br/><br/>"
    "→ <b>需要差異化權重</b>。",
    style_body,
))

story.append(Paragraph("🤔 第一版：平均權重", style_h2))
story.append(code_block(
    "overall = (卡點 + 決策 + 交接 + 負載 + 協作 + 週報) / 6<br/>"
    "= 每維度 1/6 = 16.7%"
))

story.append(Paragraph(
    "<b>問題</b>：跑 SEED 看典型情境：<br/>"
    "&nbsp;&nbsp;• 一團糟（4 件 P95+ + 4 件逾期）→ 算出 ~58 分<br/>"
    "&nbsp;&nbsp;• 期望「<b>需注意</b>」級別（40-55）<br/>"
    "&nbsp;&nbsp;• 但算出 58 是「<b>可關注</b>」太樂觀<br/><br/>"
    "<b>問題出在「週報品質滿分」把整體分數拉高</b>。週報品質權重應該<b>降低</b>，卡點健康應該<b>升高</b>。",
    style_body,
))

story.append(Paragraph("📊 第二版：差異化權重", style_h2))
story.append(Paragraph("依「<b>對組織存活的影響</b>」排序：", style_body))
story.append(comparison_table([
    ("卡點健康",  "16.7%",  "22%  ← 最重"),
    ("負載均衡",  "16.7%",  "18%"),
    ("決策及時",  "16.7%",  "18%"),
    ("交接流暢",  "16.7%",  "15%"),
    ("週報品質",  "16.7%",  "15%"),
    ("部門協作",  "16.7%",  "12%  ← 最輕"),
], NAVY))

story.append(Paragraph("<b>為什麼這個排序</b>：", style_body))
story.append(code_block(
    "卡點 22%：「正在燒」的工作，影響交付（最重）<br/>"
    "負載 18%：員工過載 = 單點失敗風險，組織不可持續<br/>"
    "決策 18%：決策延遲讓多項工作連鎖卡住<br/>"
    "交接 15%：跨部門流動受阻 = 案件死亡<br/>"
    "週報 15%：資訊透明度（proxy）<br/>"
    "協作 12%：長期影響但不影響本週交付（最輕）"
))

story.append(Paragraph("✓ 重跑 SEED 後一團糟公司算到 ~50 分，符合「需注意」級別", style_body))

story.append(Paragraph("🔒 為什麼加總 = 100%？", style_h2))
story.append(Paragraph(
    "<b>設計約束</b>：滿分情境（每維度 100）必須得 100，最差情境（每維度 0）必須得 0。<br/>"
    "→ 權重必須加總 = 1（22+18+15+18+12+15 = 100 ✓）",
    style_body,
))

story.append(PageBreak())

# ============================================================
# Page 4: Decision Impact + Cohort Adjustment
# ============================================================
story.extend(page_header(4, "Decision Impact + Cohort Adjustment（v2.2 學術創舉）"))

story.append(Paragraph("🎯 痛點", style_h2))
story.append(Paragraph(
    "想量化「<b>這個決策做完後組織有沒有變好</b>」。但 v2.1 第一版有問題：<br/><br/>"
    "<b>第一版公式</b>：score = after.overall − before.overall",
    style_body,
))

story.append(Paragraph("跑 SEED 結果：", style_body))
story.append(code_block(
    "投資委員會 −22.4 分<br/>"
    "董事會     −19.8 分<br/>"
    "營運會議   −11.0 分<br/>"
    "<br/>"
    "→ 所有主管「全負分」"
))

story.append(info_box("❌ 為什麼全負分",
    "查 SEED 資料發現：本週組織整體健康度從 12 週前的 88 跌到 60（掉 28 分）。<br/>"
    "<b>所有決策的「after - before」都會被這個大環境趨勢汙染</b>。<br/>"
    "→ 並不是這些主管的決策真的差，而是「同期遇到大環境惡化」。",
    RED))

story.append(Paragraph("💡 v2.2 解法：Cohort Adjustment", style_h2))
story.append(Paragraph(
    "<b>流行病學的標準做法</b>：比較吸菸組 vs 對照組需控制年齡。<br/>"
    "我們也一樣：比較決策成效需<b>控制大環境趨勢</b>。<br/>",
    style_body,
))
story.append(code_block(
    "adjustedDelta = (after − before) − baselineDrift<br/>"
    "<br/>"
    "baselineDrift = slope × 窗口天數<br/>"
    "&nbsp;&nbsp;其中 slope = 12 週快照線性回歸算出的「每日漂移率」<br/>"
    "<br/>"
    "例：<br/>"
    "&nbsp;&nbsp;原始 delta = -23.1<br/>"
    "&nbsp;&nbsp;baselineDrift = -14.0（大環境本來就會掉）<br/>"
    "&nbsp;&nbsp;adjustedDelta = -23.1 - (-14.0) = -9.1"
))

story.append(Paragraph("結果：", style_body))
story.append(code_block(
    "扣掉大環境後：<br/>"
    "&nbsp;&nbsp;某些決策從 -36 變成 +5（「逆境止血」）<br/>"
    "&nbsp;&nbsp;某些決策從 -10 變成 -22（「順風失職」）<br/>"
    "<br/>"
    "→ 區分「真正的負面決策」 vs 「同期環境惡化」"
))

story.append(Paragraph("🤔 為什麼用「線性回歸」算 baseline？", style_h2))
story.append(Paragraph("對照 3 種選項：", style_body))
story.append(comparison_table([
    ("首尾相減",         "snap[11] - snap[0]",              "✗ 對單週雜訊敏感"),
    ("移動平均",          "簡單但對趨勢方向不靈敏",         "✗ 抓不到斜率"),
    ("線性回歸",          "12 點互相抵消雜訊",              "✓ 穩健找趨勢方向"),
], NAVY))

story.append(Paragraph("→ 「12 點線性回歸」對短期雜訊免疫，找到組織<b>真實趨勢方向</b>。", style_body))

story.append(Paragraph("🎯 為什麼 windowWeeks = 4？", style_h2))
story.append(comparison_table([
    ("2 週",  "太短，決策還沒生效",          "✗"),
    ("4 週",  "管理學「PDCA 循環」一個月",    "✓ 選這個"),
    ("8 週",  "太久，其他事件干擾太多",      "✗"),
], NAVY))

story.append(PageBreak())

# ============================================================
# Page 5: BM25F 歷史搜尋
# ============================================================
story.extend(page_header(5, "BM25F 歷史搜尋"))

story.append(Paragraph("🎯 痛點", style_h2))
story.append(Paragraph(
    "想做歷史案件搜尋，需要演算法。對照 3 種選項：<br/>",
    style_body,
))
story.append(comparison_table([
    ("LLM Embedding", "黑盒、機密、要錢、要外部 API",       "✗ 不適合投資公司"),
    ("TF-IDF Cosine", "v1 用過，TF 線性、無欄位權重",      "✗ 效果差"),
    ("BM25F",          "Lucene / Elasticsearch 同款，可解釋", "✓ 選這個"),
], NAVY))

story.append(Paragraph("🔢 k1=1.5、b=0.75 從哪來？", style_h2))
story.append(Paragraph(
    "<b>直接抄業界標準</b>（不重新發明）：<br/>"
    "&nbsp;&nbsp;• Robertson 1994 TREC-3 論文建議 k1 範圍 1.2-2.0<br/>"
    "&nbsp;&nbsp;• Elasticsearch default：k1 = 1.2、b = 0.75<br/>"
    "&nbsp;&nbsp;• Lucene 預設：同上<br/><br/>"
    "我們選 <b>k1 = 1.5</b>（比 1.2 嚴格一點），因為案件描述比網頁短，1.2 太寬容會讓「重複關鍵字」加分太多。",
    style_body,
))

story.append(Paragraph("📐 欄位權重 5:4:2:1.5:1:1 怎麼來？", style_h2))
story.append(Paragraph("依「<b>資訊密度</b>」排序：", style_body))
story.append(code_block(
    "title 5.0    ← 標題每個字都關鍵<br/>"
    "tags 4.0     ← 結構化標籤<br/>"
    "summary 2.0  ← 濃縮的內文<br/>"
    "outcome 1.5  ← 結論欄<br/>"
    "owner 1.0    ← 人名匹配輔助<br/>"
    "detail 1.0   ← 長段內文（有水分）"
))

story.append(Paragraph(
    "<b>為什麼是 5 倍差距（title vs detail）</b>？<br/>"
    "&nbsp;&nbsp;<b>2 倍</b>太接近，「標題命中」優勢不明顯<br/>"
    "&nbsp;&nbsp;<b>10 倍</b>太極端，「內文偶然出現」幾乎沒影響<br/>"
    "&nbsp;&nbsp;<b>5 倍</b>剛好讓「標題命中」蓋過內文，但內文仍有貢獻",
    style_body,
))

story.append(Paragraph("📐 Substring Boost ×1.8 / ×1.4 怎麼來？", style_h2))
story.append(Paragraph(
    "搜「東京中央銀行」時純 BM25F 會被「銀行」這種 high-DF 詞稀釋。<br/>"
    "<b>加 boost</b>：完整匹配時額外乘係數。",
    style_body,
))

story.append(comparison_table([
    ("×1.2",   "太弱，看不出 boost 效果",     "✗"),
    ("×1.5",   "稍嫌不足，BM25 雜訊還是壓過",  "△"),
    ("×1.8",   "完整匹配明顯往前排",          "✓ 選這個"),
    ("×2.0",   "太強，BM25 排序被破壞",       "✗"),
], NAVY))

story.append(Paragraph("→ <b>A/B 跑了 4 個值，1.8 是 sweet spot</b>。", style_body))

story.append(PageBreak())

# ============================================================
# Page 6: What-if 模擬器
# ============================================================
story.extend(page_header(6, "What-if 模擬器"))

story.append(Paragraph("🎯 設計挑戰", style_h2))
story.append(Paragraph(
    "想讓管理層「先看後果」。難題：怎麼確保「模擬的分數」跟「真實執行後的分數」<b>一致</b>？",
    style_body,
))

story.append(Paragraph("💡 設計選擇：Forward Propagation", style_h2))
story.append(comparison_table([
    ("Option A：直接 +delta",  "if 解卡點: delta += 15",          "✗ 跟正式公式不一致"),
    ("Option B：Fork + 重跑",  "改 input → 重跑 computeHealthSnapshot", "✓ 100% 一致"),
], NAVY))

story.append(Paragraph(
    "<b>選 B 的理由</b>：模擬的目的是「預測真實後果」。如果模擬用的公式跟真實計算的公式不同，"
    "模擬結果就不是「真實後果」，是「假裝後果」。",
    style_body,
))

story.append(Paragraph("📐 Smart Suggestion ±2 / ±5 怎麼定？", style_h2))
story.append(Paragraph("想分 5 級（顯著惡化/略惡化/影響不大/可考慮/顯著改善），閾值對稱。", style_body))

story.append(code_block(
    "Δ ≥ +5  顯著改善 ✨ 強烈建議執行<br/>"
    "Δ +2~+5 有改善，可考慮執行<br/>"
    "Δ -2~+2 影響不大，可保留資源<br/>"
    "Δ -5~-2 略為惡化，需評估<br/>"
    "Δ ≤ -5  顯著惡化 ⚠️ 不建議執行"
))

story.append(Paragraph("<b>±2、±5 怎麼定</b>：", style_body))
story.append(comparison_table([
    ("±1 / ±10",  "±1 太敏感、±10 太鬆",             "✗"),
    ("±2 / ±5",   "±2 = 雜訊範圍、±5 = 5% of 100",   "✓ 選這個"),
    ("±3 / ±7",   "可以但 7 不順手",                  "△"),
], NAVY))

story.append(Paragraph(
    "<b>反推驗證</b>：跑 What-if 看典型動作的 Δ：<br/>"
    "&nbsp;&nbsp;• 勾 1 件小卡點 → +0.5 → 「影響不大」✓<br/>"
    "&nbsp;&nbsp;• 勾 1 件 P95 卡點 → +3.3 → 「可考慮」✓<br/>"
    "&nbsp;&nbsp;• 全勾（解所有問題）→ +20 → 「顯著改善」✓<br/><br/>"
    "→ 各種組合都落到合理建議區間，閾值收斂",
    style_body,
))

story.append(Paragraph("⚠️ 已知限制（誠實面對）", style_h2))
story.append(info_box("「加員工」模擬可能反效果",
    "新員工 loadScore = 0 進入計算，<b>可能拉高 Gini</b>（一個 0 拉長分布）。<br/>"
    "→ 「+1 法遵專員」可能讓負載均衡分數反而下降。<br/><br/>"
    "<b>未來改進（v2.3）</b>：改成 Reassignment — 把過載員工的部分分數轉到新員工。"
    "目前先用 Option B（loadScore = 0），承認限制比掩飾它有說服力。",
    GOLD))

story.append(PageBreak())

# ============================================================
# Page 7: 部門互動網絡
# ============================================================
story.extend(page_header(7, "部門互動網絡"))

story.append(Paragraph("🎯 痛點", style_h2))
story.append(Paragraph(
    "想抓「<b>組織病徵</b>」— A 部門一直找 B，但 B 完全沒回 A。<br/>"
    "這在管理學上叫「<b>溝通黑洞</b>」，是組織壁壘的明確訊號。",
    style_body,
))

story.append(Paragraph("📐 公式設計", style_h2))
story.append(code_block(
    "for each pair (A, B) in depts × depts:<br/>"
    "&nbsp;&nbsp;if matrix[A][B] ≥ 5 AND matrix[B][A] = 0:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;asymCount += 1"
))

story.append(Paragraph("🤔 為什麼閾值是 5？（不是 3 或 10）", style_h2))
story.append(comparison_table([
    ("≥3",   "太敏感，偶爾提及就觸發",          "✗ 太多假警報"),
    ("≥5",   "z-score ≈ 1（統計顯著性）",       "✓ 選這個"),
    ("≥10",  "太鬆，要 10 次無回應才算病徵",     "✗ 漏判"),
], NAVY))

story.append(Paragraph("<b>反推驗證</b>：", style_body))
story.append(code_block(
    "SEED 資料：投研 → 業開 = 8 次提及<br/>"
    "&nbsp;&nbsp;業開 → 投研 = 0 次回應<br/>"
    "→ 觸發單向溝通警示 ✓ 合理<br/>"
    "<br/>"
    "如果用 ≥3：許多正常單向情境會被誤報<br/>"
    "如果用 ≥10：SEED 都沒到 10 次，警示永遠不觸發"
))

story.append(Paragraph("🤔 為什麼「=0」而不是「ratio 不對稱」？", style_h2))
story.append(Paragraph(
    "選擇「<b>嚴格 0</b>」而非「比例不平衡」：<br/>"
    "&nbsp;&nbsp;• A→B = 8, B→A = 5（比例不平衡）→ <b>不抓</b>（雙方都有對話）<br/>"
    "&nbsp;&nbsp;• A→B = 5, B→A = 0（單向黑洞）→ <b>抓</b>（嚴重組織病徵）<br/><br/>"
    "<b>設計哲學</b>：不抓「不平衡」（這可能正常），只抓「<b>完全沒回</b>」（這是病徵）。",
    style_body,
))

story.append(Paragraph("📐 扣分係數 × 15 怎麼來？", style_h2))
story.append(Paragraph("反推：1 組單向溝通應該扣幾分？", style_body))
story.append(code_block(
    "0 組 → 100 分 (健康)<br/>"
    "1 組 → 85 分 (警示)<br/>"
    "2 組 → 70 分 (明顯問題)<br/>"
    "4 組 → 40 分 (組織壁壘嚴重)<br/>"
    "<br/>"
    "→ 4 組要扣到 60 分對應「需注意」級別<br/>"
    "→ 4 × ? = 60 → ? = 15 ✓"
))

story.append(PageBreak())

# ============================================================
# Page 8: 通用方法論總結
# ============================================================
story.extend(page_header(8, "通用方法論總結"))

story.append(Paragraph(
    "這份文件介紹了 7 個演算法的調校過程，背後是<b>同一套通用方法論</b>。"
    "未來新增任何指標，都可以套用這個流程。",
    style_body,
))

story.append(Paragraph("✨ 5 步通用流程", style_h2))

steps = [
    ("Step 1", "寫初版", "憑直覺 + 抄業界。先有可運作版本，不求完美。"),
    ("Step 2", "跑 SEED 看分數", "對典型情境算出實際分數。"),
    ("Step 3", "對照「期望」與「實際」", "列出期望分數對照表，標記差距大的情境。"),
    ("Step 4", "調係數", "從差距最大的情境下手，調對應公式的係數。"),
    ("Step 5", "迭代直到收斂", "通常 3-5 輪就收斂。所有情境差距 < 5 分為合格。"),
]

for step_num, title, body in steps:
    story.append(info_box(f"{step_num} · {title}", body, CORAL))

story.append(Spacer(1, 0.3 * cm))

story.append(Paragraph("🎯 反推校準的 3 個原則", style_h2))

principles = [
    ("有依據",
     "每個係數都能說「為什麼是這個值」 — 不是「就感覺差不多」，"
     "而是「典型情境 → 期望分數 → 反推係數」的具體推理。"),
    ("可驗證",
     "可以拿 SEED 重跑、可以看典型情境是否落到合理區間。"
     "不滿意時可以調，調完可以重新驗證。"),
    ("透明",
     "所有 magic number 都列在文件中、包括限制標註。"
     "不是不可動的常數，是可以根據組織需求討論調整的「設定值」。"),
]

for title, body in principles:
    story.append(info_box(title, body, GOLD))

story.append(Spacer(1, 0.5 * cm))

story.append(Paragraph("📌 寫給未來的開發者", style_h2))
story.extend(quote(
    "如果你要在這個系統上加新指標，不要先寫公式 — 先寫「期望分數對照表」。<br/>"
    "想清楚「<b>什麼情境應該得幾分</b>」，公式自然就會反推出來。<br/><br/>"
    "公式是 UX 目標的數學表達，不是反過來。",
    "串連系統 v2.2 設計手冊",
))

story.append(PageBreak())

# ============================================================
# 結語
# ============================================================
story.append(Paragraph("結語 · 工程現實 vs 學術理想", style_h1))

story.append(Paragraph(
    "<b>學術論文寫法</b>：「我們提出公式 X，係數 a/b/c 經由文獻 [1][2] 確定...」<br/><br/>"
    "<b>工程現實寫法</b>：「我們先寫了個初版，跑 SEED 發現太鬆，調了 3 次後收斂。"
    "事後找論文支持，發現大部分跟業界共識對得起來。少部分對不上的，我們承認是經驗值。」<br/><br/>"
    "<b>哪個更誠實？工程現實。哪個更可信？正是工程現實。</b>",
    style_body,
))

story.append(Paragraph(
    "因為「<b>有方法論的經驗值</b>」比「<b>假裝是公式推導</b>」更可信：<br/>"
    "&nbsp;&nbsp;• 有方法論 → 別人可以複製<br/>"
    "&nbsp;&nbsp;• 透明承認 → 別人可以質疑<br/>"
    "&nbsp;&nbsp;• 可調 → 別人可以改進<br/><br/>"
    "這就是「<b>白盒 DSS</b>」的精神 — 數字不重要，重要的是它的依據是否可被檢驗。",
    style_body,
))

story.append(Spacer(1, 1 * cm))

# 結尾語錄
story.extend(quote(
    "公式不是創意，是工程紀律。<br/>"
    "每個數字都應該能說出「為什麼是這個數字」。<br/>"
    "如果說不出來，那就是該回去調的。",
    "串連系統 v2.2 設計哲學",
))

# ============================================================
# 輸出
# ============================================================
import os
os.makedirs("docs", exist_ok=True)
out_path = "docs/串連系統_人工參數調校筆記.pdf"


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(CN, 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1 * cm, "串連系統 v2.2 · 人工參數調校筆記")
    canvas.drawRightString(19 * cm, 1 * cm, f"第 {doc.page} 頁")
    canvas.restoreState()


doc = SimpleDocTemplate(
    out_path, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="串連系統 v2.2 — 人工參數調校筆記",
    author="資管導論 第 13 組",
)
doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
print(f"OK -> {out_path}")
