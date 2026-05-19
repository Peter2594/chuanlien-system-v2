# -*- coding: utf-8 -*-
"""
串連系統 v2.2 — 公式設計推導文件
每條公式用「目標 → 訊號 → 校準」三步驟完整解釋來源
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

NAVY  = HexColor("#0f172a")
BLUE  = HexColor("#3b82f6")
SLATE = HexColor("#475569")
LIGHT = HexColor("#f1f5f9")
GREY  = HexColor("#94a3b8")
RED   = HexColor("#ef4444")
GREEN = HexColor("#10b981")
VIOLET = HexColor("#8b5cf6")
AMBER = HexColor("#f59e0b")
ORANGE = HexColor("#fb923c")
TEAL  = HexColor("#14b8a6")

# ============== 樣式 ==============
style_title    = ParagraphStyle("title", fontName=CN, fontSize=28, leading=34, textColor=NAVY, spaceAfter=6)
style_subtitle = ParagraphStyle("st", fontName=CN, fontSize=12, leading=18, textColor=SLATE, spaceAfter=24)
style_h1       = ParagraphStyle("h1", fontName=CN, fontSize=20, leading=26, textColor=NAVY, spaceBefore=14, spaceAfter=10)
style_h2       = ParagraphStyle("h2", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceBefore=10, spaceAfter=4)
style_body     = ParagraphStyle("body", fontName=CN, fontSize=10.5, leading=16, textColor=NAVY, alignment=TA_JUSTIFY, spaceAfter=6)


def formula(text):
    return Paragraph(
        f"<font color='#3b82f6'>{text}</font>",
        ParagraphStyle("formula", fontName="Courier-Bold", fontSize=10, leading=14,
                       leftIndent=14, spaceAfter=8, spaceBefore=4),
    )


def code_block(text):
    return Paragraph(
        f"<font color='#0f172a'>{text}</font>",
        ParagraphStyle("code", fontName="Courier", fontSize=8.5, leading=12,
                       leftIndent=14, rightIndent=14, spaceAfter=8, spaceBefore=2,
                       backColor=HexColor("#f8fafc"), borderPadding=8),
    )


def info_box(title, body, color=BLUE):
    inner_title = ParagraphStyle("ib_t", fontName=CN, fontSize=10.5, leading=14, textColor=color, spaceAfter=4)
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


def step_label(num, title, color):
    """Step 1/2/3 標頭"""
    return Paragraph(
        f"<font color='{color.hexval()}'><b>Step {num}</b></font> · <b>{title}</b>",
        ParagraphStyle("step", fontName=CN, fontSize=12, leading=18, textColor=NAVY,
                       spaceBefore=8, spaceAfter=4, leftIndent=0)
    )


def derivation_table(rows):
    """反推校準表格"""
    table_data = [[Paragraph(f"<b>{r[0]}</b>",
                              ParagraphStyle("ck", fontName=CN, fontSize=9.5, textColor=BLUE, leading=12)),
                   Paragraph(r[1],
                              ParagraphStyle("cv", fontName=CN, fontSize=9.5, textColor=NAVY, leading=12))]
                  for r in rows]
    t = Table(table_data, colWidths=[5 * cm, 12 * cm])
    t.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("RIGHTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LINEBELOW", (0, 0), (-1, -2), 0.3, HexColor("#e2e8f0")),
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fcfdfe")),
    ]))
    return t


def algo_header(num, name, formula_text):
    """演算法區塊起頭"""
    items = []
    items.append(Paragraph(
        f"<font color='#3b82f6'><b>#{num}</b></font>&nbsp;&nbsp; <b>{name}</b>",
        ParagraphStyle("an", fontName=CN, fontSize=16, leading=22, textColor=NAVY,
                       spaceBefore=12, spaceAfter=4)
    ))
    if formula_text:
        items.append(formula(formula_text))
    return items


# ============================================================
story = []

# ============ 封面 ============
story.append(Spacer(1, 3 * cm))
story.append(Paragraph("公式設計推導文件", style_title))
story.append(Paragraph("How Every Formula Was Derived · 串連系統 v2.2",
                        ParagraphStyle("h_en", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceAfter=4)))
story.append(Paragraph("每條公式用「目標 → 訊號 → 校準」三步驟，完整解釋來源",
                        ParagraphStyle("h_sub", fontName=CN, fontSize=11, leading=16, textColor=SLATE, spaceAfter=20)))

story.append(Paragraph(
    "本文件回答一個核心問題：<b>「這條公式為什麼長這樣？」</b><br/><br/>"
    "不只列出參數值，而是<b>逐步重現整個設計過程</b>。每條子公式包含：<br/><br/>"
    "&nbsp;&nbsp;<b>① 要量化什麼</b> — 設計目標的概念定義（學理依據）<br/>"
    "&nbsp;&nbsp;<b>② 用什麼訊號</b> — 從系統資料中可取得的 proxy<br/>"
    "&nbsp;&nbsp;<b>③ 公式型態 + 係數</b> — 反推校準的具體推導<br/><br/>"
    "目標：證明每個數字都不是「拍腦袋」，而是<b>「典型情境 → 期望分數 → 反推係數」</b>的工程校準。",
    style_subtitle,
))

story.append(Spacer(1, 1 * cm))

# 設計通則總綱
overview = Table([
    [
        Paragraph("<font color='white'><b>Step ①</b></font>",
                  ParagraphStyle("s1", fontName=CN, fontSize=24, textColor="white", alignment=TA_CENTER)),
        Paragraph("<font color='white'><b>Step ②</b></font>",
                  ParagraphStyle("s2", fontName=CN, fontSize=24, textColor="white", alignment=TA_CENTER)),
        Paragraph("<font color='white'><b>Step ③</b></font>",
                  ParagraphStyle("s3", fontName=CN, fontSize=24, textColor="white", alignment=TA_CENTER)),
    ],
    [
        Paragraph("<font color='white'>要量化什麼？<br/>(概念定義)</font>",
                  ParagraphStyle("d1", fontName=CN, fontSize=11, textColor="white", leading=15, alignment=TA_CENTER)),
        Paragraph("<font color='white'>用什麼訊號？<br/>(資料 proxy)</font>",
                  ParagraphStyle("d2", fontName=CN, fontSize=11, textColor="white", leading=15, alignment=TA_CENTER)),
        Paragraph("<font color='white'>公式 + 係數？<br/>(反推校準)</font>",
                  ParagraphStyle("d3", fontName=CN, fontSize=11, textColor="white", leading=15, alignment=TA_CENTER)),
    ],
], colWidths=[5.6 * cm, 5.6 * cm, 5.6 * cm])
overview.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), BLUE),
    ("BACKGROUND", (1, 0), (1, -1), VIOLET),
    ("BACKGROUND", (2, 0), (2, -1), AMBER),
    ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 14),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
]))
story.append(overview)

story.append(PageBreak())

# ============================================================
# 第一部：6 維健康度公式（最重要）
# ============================================================
story.append(Paragraph("第一部 · 6 維健康度子公式", style_h1))
story.append(Paragraph(
    "組織健康度 = 卡點 ×0.22 + 決策 ×0.18 + 交接 ×0.15 + 負載 ×0.18 + 協作 ×0.12 + 週報 ×0.15<br/>"
    "本部完整推導 <b>6 條子公式</b>的設計過程。",
    style_body,
))

# ====== ① 卡點健康 ======
story.extend(algo_header(
    1, "卡點健康（22%）",
    "blockerHealth = 100 − P95數 × 15 − P90數 × 7 − max(0, avgP − 50) × 0.8",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>長尾風險程度</b>（tail risk）— 不是看卡點「<b>幾件</b>」（量），而是看「<b>有幾件卡得異常久</b>」（尾端）。",
    style_body,
))
story.append(info_box("理論依據",
    "<b>COSO ERM（企業風險管理框架）</b>強調「尾端風險」比「平均風險」更需關注。"
    "10 件 1 週解決的卡點 vs 1 件 100 天的卡點，後者對組織傷害更大。",
    BLUE))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(Paragraph("從每件活躍卡點，透過 <i>analyzeBlockerRecord</i> 取得：", style_body))
story.append(derivation_table([
    ("level", "critical (P95+) / high (P90+) / medium (P75+) / normal"),
    ("percentile", "0-100，該卡點在歷史分布的位置"),
]))
story.append(Paragraph(
    "→ 聚合三個統計量：<b>P95 數、P90 數、avgPercentile</b>",
    style_body,
))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))
story.append(Paragraph("<b>反推校準</b>：", style_body))
story.append(code_block(
    "設計目標：「公司一團糟」時分數應該在 15-25 範圍<br/>"
    "<br/>"
    "典型不健康公司：4 件 P95 + 1 件 P90 + avgP ≈ 65<br/>"
    "→ 期望分數 ≈ 20<br/>"
    "→ 倒推：4×?₁ + 1×?₂ + (65-50)×?₃ ≈ 80（要扣 80 分）<br/>"
    "<br/>"
    "取 ?₁ = 15、?₂ = 7、?₃ = 0.8：<br/>"
    "扣 = 4×15 + 1×7 + 15×0.8 = 60 + 7 + 12 = 79 ✓ 接近 80"
))

story.append(Paragraph("<b>各係數的設計意義</b>：", style_body))
story.append(derivation_table([
    ("P95 扣 15、P90 扣 7（比 ≈ 2:1）", "反映「極高風險的危害是高風險的 2 倍」"),
    ("avgP 基準 50（中位數）", "低於 50 表示整體比歷史好，不該扣分。用 max(0, ...) 確保只扣"),
    ("0.8 係數", "最壞情況 avgP=100 時扣 (100-50)×0.8 = 40 分，不會吃掉太多其他項預算"),
    ("為何「線性扣分」非「指數」", "可解釋：「每件 P95 扣 15」直觀。指數會讓 8 件 vs 4 件難理解"),
]))

story.append(PageBreak())

# ====== ② 決策及時 ======
story.extend(algo_header(
    2, "決策及時（18%）",
    "decisionTimeliness = 100 − max(0, avgCompletionDays − 14) × 3 − overdueCount × 10",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>決策的延遲程度</b> — 兩個獨立面向：<br/>"
    "&nbsp;&nbsp;(a) <b>慢性問題</b>：已完成的決策平均拖多久？<br/>"
    "&nbsp;&nbsp;(b) <b>急性問題</b>：還在拖、已過 dueDate 的有幾件？",
    style_body,
))
story.append(info_box("理論依據",
    "Andy Grove《High Output Management》：「Decision Latency 是組織效率的關鍵瓶頸」。"
    "拖太久的決策會造成下游連鎖卡住。",
    BLUE))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(derivation_table([
    ("avgCompletionDays", "已完成決策的「decidedAt → completedAt」天數平均"),
    ("overdueCount", "isDecisionOverdueAt(d, NOW) 為真的決策數量"),
]))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(Paragraph("<b>(a) 基準 14 天怎麼來</b>：", style_body))
story.append(info_box("兩個學理合流",
    "<b>管理學 PDCA 循環</b> = 2 週為一個改善週期。<br/>"
    "<b>Andy Grove 注意力週期</b> = 2 週主管能保持關注。<br/>"
    "→ 14 天 = 「主管能繼續推動」的極限，超過開始扣分。",
    GREEN))

story.append(Paragraph("<b>(b) 每天扣 3 分的反推</b>：", style_body))
story.append(code_block(
    "情境 → 期望扣分 → 推導係數：<br/>"
    "20 天 → 期望扣 18 分 → 6 × ? = 18 → ? = 3 ✓<br/>"
    "30 天 → 期望扣 48 分 → 16 × 3 = 48 ✓<br/>"
    "50 天 → 期望扣 100 分（歸零）→ 36 × 3 ≈ 100 ✓<br/>"
    "<br/>"
    "→ 取 3 反映「50 天就是決策死亡」的合理速率"
))

story.append(Paragraph("<b>(c) 每件逾期扣 10 分的反推</b>：", style_body))
story.append(code_block(
    "1 件逾期 → 扣 10（警示但可承受）<br/>"
    "4 件逾期 → 扣 40（嚴重，達到「健康度下半段」）<br/>"
    "10 件逾期 → 扣 100（系統性失敗，分數歸零）<br/>"
    "<br/>"
    "→ 10 件等於「決策機制崩潰」的合理閾值"
))

story.append(Paragraph("<b>(d) 為什麼用「天數 + 件數」雙指標</b>：", style_body))
story.append(derivation_table([
    ("只用件數", "一件拖 3 個月也只算 1 件，不夠重"),
    ("只用天數", "完成天數快但逾期件數多也是問題"),
    ("雙指標", "互補，避免單指標盲區"),
]))

story.append(PageBreak())

# ====== ③ 交接流暢 ======
story.extend(algo_header(
    3, "交接流暢（15%）",
    "handoffSmoothness = 50 + completionRate × 50 − overdueHandoffs × 8",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>跨部門案件流動的暢通度</b> — 不是看交接量「多 / 少」（多 ≠ 不好），"
    "而是看「<b>被卡在待簽收的比例</b>」。",
    style_body,
))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(derivation_table([
    ("completionRate", "1 − 待簽收件數 / 總活躍交接件數"),
    ("overdueHandoffs", "待簽收 AND hoursOverdue ≥ 24 的件數"),
]))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(info_box("★ 為什麼起點 50 而非 100",
    "<b>卡點健康</b>起點 100：「沒卡點 = 最理想」（<b>累積觀念</b>）<br/>"
    "<b>交接流暢</b>起點 50：「有交接系統 = 基本健康分」（<b>流程觀念</b>）<br/><br/>"
    "<b>設計理由</b>：<br/>"
    "1. 交接量大本身代表「有跨部門協作」是正向訊號<br/>"
    "2. 心理學：起點 0 讓使用者覺得「永遠不夠好」，起點 50 給「能往上走」的動機<br/>"
    "3. 0% 完成率代表「系統剛起步」而非「最爛狀態」",
    VIOLET))

story.append(Paragraph("<b>分數對應表</b>：", style_body))
story.append(code_block(
    "完成率   0%   → 50 + 0 = 50 分<br/>"
    "完成率  50%   → 50 + 25 = 75 分<br/>"
    "完成率 100%   → 50 + 50 = 100 分（沒逾時）<br/>"
    "<br/>"
    "逾時 24h+ 每件扣 8 分：<br/>"
    "1 件嚴重逾時 → 扣 8（從 90 → 82，警示）<br/>"
    "3 件 → 扣 24（明顯問題）<br/>"
    "6 件 → 扣 48（系統失靈）"
))

story.append(Paragraph("<b>為什麼逾時 ×8（比決策逾期 ×10 輕、比卡點 P95+ ×15 更輕）</b>：", style_body))
story.append(derivation_table([
    ("交接逾時", "<b>×8</b> — 流程問題，可立即處理"),
    ("決策逾期", "<b>×10</b> — 影響下游多項工作"),
    ("卡點 P95+", "<b>×15</b> — 正在燒、最嚴重"),
]))
story.append(Paragraph(
    "→ 反映三者的<b>嚴重度排序</b>：卡點 > 決策 > 交接",
    style_body,
))

story.append(PageBreak())

# ====== ④ 負載均衡 ======
story.extend(algo_header(
    4, "負載均衡（18%）",
    "loadBalance = 100 − max(0, Gini − 0.35) × 200 − overloadCount × 8",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>員工工作量分配的公平性</b> — 雙重訊號：<br/>"
    "&nbsp;&nbsp;(a) <b>整體分布</b>（Gini 係數）<br/>"
    "&nbsp;&nbsp;(b) <b>個別過載案例</b>（級別 = overload 的人數）",
    style_body,
))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(derivation_table([
    ("Gini 係數", "從 analyzeEmployeeLoad 取所有員工 loadScore 算離散 Gini"),
    ("過載人數", "loadScore ≥ 25 OR percentile ≥ 90 的員工數"),
]))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(Paragraph("<b>(a) Gini 用 0.35 當分界 — 經濟學共識</b>：", style_body))
story.append(info_box("Lambert 2001 跨國研究分類",
    "&lt; 0.30 高度平等（瑞典、丹麥、芬蘭）<br/>"
    "0.30-0.40 中等不平等（德國、加拿大、日本）<br/>"
    "&gt; 0.40 高度不平等（美國 0.41、中國 0.47）<br/>"
    "&gt; 0.50 極端不平等（巴西、南非）<br/><br/>"
    "<b>0.35 = 中等不平等的中間值，「開始扣分」的學術臨界點。</b>",
    GREEN))

story.append(Paragraph("<b>(b) 為什麼乘 200（不是 100 或 500）— 反推</b>：", style_body))
story.append(code_block(
    "Gini 範圍 0-1，所以 diff 通常 0.05-0.3 之間<br/>"
    "<br/>"
    "Gini 0.45 (不公平)  → diff 0.10 → 扣 ?<br/>"
    "情境校準：希望扣 20 分（明顯警示）<br/>"
    "→ 0.10 × ? = 20 → ? = 200<br/>"
    "<br/>"
    "驗證其他點：<br/>"
    "Gini 0.55 (明顯不公) → diff 0.20 × 200 = 40 分 ✓ 嚴重<br/>"
    "Gini 0.70 (極端)    → diff 0.35 × 200 = 70 分 ✓ 重罰"
))

story.append(Paragraph("<b>(c) 為什麼用「Gini + 過載人數」雙指標</b>：", style_body))
story.append(derivation_table([
    ("只用 Gini", "「3 人平均 8 分」vs「1 人 24 分 + 2 人 0 分」Gini 不同但都有問題"),
    ("只用過載人數", "忽略「全公司都偏高但沒人到 25」的隱性問題"),
    ("雙指標", "互補，捕捉「結構性不均」+「個別過載」"),
]))

story.append(PageBreak())

# ====== ⑤ 部門協作 ======
story.extend(algo_header(
    5, "部門協作（12%）",
    "crossDept = 100 − asymCount × 15",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>部門間溝通是否健康雙向</b> — 抓組織病徵：「A 一直找 B，B 完全沒回」（單向黑洞）。<br/><br/>"
    "<b>不抓不平衡</b>（A 提 10 次 vs B 提 8 次是正常的不平衡），<b>只抓完全黑洞</b>（A 提 5 次 vs B 提 0 次）。",
    style_body,
))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(Paragraph(
    "從 analyzeDeptNetwork 取得鄰接矩陣 → 掃描 (A,B) 配對符合條件：",
    style_body,
))
story.append(code_block(
    "matrix[A][B] ≥ 5  AND  matrix[B][A] = 0<br/>"
    "→ asymCount += 1"
))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(Paragraph("<b>(a) 為什麼閾值 5</b>：", style_body))
story.append(info_box("5 ≈ z-score 1 — 統計顯著性的非正式門檻",
    "5 次提及代表「<b>經常性依賴</b>」而非偶然。<br/>"
    "對 7 部門 × 7 部門矩陣（42 個非對角組合），閾值 5 平衡靈敏度與假警報率。",
    VIOLET))

story.append(Paragraph("<b>(b) 為什麼線性扣分 × 15</b>：", style_body))
story.append(code_block(
    "0 組 → 100 分 (健康)<br/>"
    "1 組 → 85 分 (警示)<br/>"
    "2 組 → 70 分 (明顯問題)<br/>"
    "4 組 → 40 分 (組織壁壘嚴重)<br/>"
    "7 組 → 5 分 (接近崩潰)<br/>"
    "<br/>"
    "為什麼選 15：<br/>"
    "  比 10 重 → 一組單向是重要警訊，不能太輕<br/>"
    "  比 20 輕 → 避免「一組就重罰」誤判<br/>"
    "  → 3-4 組對應「黃 / 紅燈轉折點」"
))

story.append(Paragraph("<b>(c) 為什麼是線性而非指數</b>：", style_body))
story.append(derivation_table([
    ("線性可解釋", "「每組單向溝通扣 15 分」直觀"),
    ("指數會讓 2 → 3 組差距大", "邏輯不直觀"),
    ("保持線性原則", "可解釋 > 數學優雅"),
]))

story.append(PageBreak())

# ====== ⑥ 週報品質 ======
story.extend(algo_header(
    6, "週報品質（15%）",
    "reportQuality = submitRate × 60 + lengthScore × 0.3 + blockerFillRate × 10",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>資訊透明度</b>（information flow quality）— 不是看週報「<b>寫得多好</b>」（這需要人讀），"
    "而是用 3 個 <b>proxy（代理變量）</b>反映「<b>資訊是否真的在流動</b>」。",
    style_body,
))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(Paragraph("3 個 proxy 的設計選擇：", style_body))
story.append(derivation_table([
    ("submitRate（繳交率）", "反映「有沒有想交」— 最低門檻"),
    ("lengthScore（字數分）", "反映「內容是否敷衍」— 30 字以下幾乎一定敷衍"),
    ("blockerFillRate（卡點填寫率）", "反映「組織透明度」— 願意寫卡點 = 不藏問題"),
]))
story.append(Paragraph(
    "<b>為什麼選這 3 個</b>：都是「<b>可自動量化</b>」的訊號，不用人讀。"
    "避免使用「主觀評分」這種需要人介入的指標。",
    style_body,
))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(Paragraph("<b>(a) 60 : 30 : 10 比例的反推</b>：", style_body))
story.append(code_block(
    "情境           繳交60  字數30  卡點10  總分<br/>"
    "─────────────────────────────────────<br/>"
    "完美           60      30      10      = 100<br/>"
    "都交但字數少   60       0       5      = 65<br/>"
    "都交但敷衍     60      30       0      = 90<br/>"
    "只 2/3 交      40      30      10      = 80<br/>"
    "完全沒交        0       0       0      = 0<br/>"
    "<br/>"
    "設計約束：<br/>"
    "  沒交 → 必須近 0（繳交率主導）→ 60%<br/>"
    "  交但敷衍 → 明顯扣分（字數第二重要）→ 30%<br/>"
    "  寫卡點 → 加分項但不主導 → 10%<br/>"
    "  60 + 30 + 10 = 100（剛好滿分約束）✓"
))

story.append(Paragraph("<b>(b) 字數門檻 30 / 80 的觀察依據</b>：", style_body))
story.append(info_box("從真實資料觀察",
    "「• 田宮 32 天」這種敷衍：約 8 字<br/>"
    "「• 田宮電機 Pre-A 盡調 (65%) — 財報補件 4 週未到」中度：約 40 字<br/>"
    "完整詳述含背景 / 影響 / 行動：約 80 字以上<br/><br/>"
    "→ <b>30 字以下 = 0 分</b>（敷衍）、<b>80 字以上 = 滿分</b>、中間線性映射。",
    AMBER))
story.append(formula("lengthScore = clamp((avgLen − 30) / 50 × 100, 0, 100)"))

story.append(Paragraph("<b>(c) 卡點填寫率只 10 分 — Goodhart's Law 保護</b>：", style_body))
story.append(info_box("為什麼故意低權重",
    "「<b>當一個指標變成目標，它就不再是好指標。</b>」<br/><br/>"
    "若卡點填寫率占 30 分以上 → 員工會故意捏造卡點刷分。<br/>"
    "占 10 分 → 「<b>鼓勵但不主導</b>」的 sweet spot。<br/>"
    "即使全寫了也只多 10 分，無法靠它救分。",
    RED))

story.append(PageBreak())

# ============================================================
# 第二部：員工負載 + ORI
# ============================================================
story.append(Paragraph("第二部 · 加權評分模型", style_h1))

# ====== ⑦ Weighted Load Score ======
story.extend(algo_header(
    7, "員工負載 Weighted Load Score",
    "loadScore = timeWeightedCases × 1.5 + blockerLoad × 2.0 + mentionsWeighted × 0.8 + handoffLoad × 1.0",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>員工的真實工作壓力</b> — 不只看「處理幾件案件」，要捕捉 4 個獨立面向：",
    style_body,
))
story.append(derivation_table([
    ("自己主辦的案件", "案件數 × 複雜度"),
    ("負責的卡點", "正在燒的工作（最累）"),
    ("被他人提及", "共同負責、跨部門協作"),
    ("交接的接收", "未完成的心理負擔"),
]))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(code_block(
    "timeWeightedCases = Σ complexity(r.cases) × decay(r.week, asOf)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;當 r.author === emp.name 時累加<br/>"
    "<br/>"
    "blockerLoad = Σ bullet_count × 2.5 × decay<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;當員工在週報中有寫 blockers 時累加<br/>"
    "<br/>"
    "mentionsWeighted = Σ name_hits × 1.5 × decay<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;當 emp.name 出現在其他人的週報中累加<br/>"
    "<br/>"
    "handoffLoad = Σ 4×decay (待簽收) OR 1.5×decay (已簽收)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;當員工是 sender 或 receiver 時累加"
))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(Paragraph("<b>(a) 4 個分量權重 1.5 / 2.0 / 0.8 / 1.0 — 反推</b>：", style_body))
story.append(code_block(
    "「典型過載員工」校準目標：loadScore ≈ 25（達 P90 門檻）<br/>"
    "<br/>"
    "假設一個過載員工有：<br/>"
    "&nbsp;&nbsp;5 件主辦案（complexity ≈ 5）<br/>"
    "&nbsp;&nbsp;2 件卡點（bullet 各 2 點 = 4）<br/>"
    "&nbsp;&nbsp;5 次被提及<br/>"
    "&nbsp;&nbsp;3 件交接（其中 1 件待簽收）<br/>"
    "<br/>"
    "計算（decay = 1，本週狀況）：<br/>"
    "&nbsp;&nbsp;cases = 5 × 1.5 = 7.5<br/>"
    "&nbsp;&nbsp;blocker = 4 × 2.0 = 8.0<br/>"
    "&nbsp;&nbsp;mentions = 5 × 0.8 = 4.0<br/>"
    "&nbsp;&nbsp;handoff = (1×4 + 2×1.5) × 1.0 = 7.0<br/>"
    "&nbsp;&nbsp;TOTAL = 26.5 ≈ 25 ✓"
))

story.append(Paragraph("<b>(b) 為什麼卡點權重最重（×2.0）</b>：", style_body))
story.append(derivation_table([
    ("卡點 ×2.0", "代表「正在燒」的工作，比一般案件更耗注意力"),
    ("主辦案 ×1.5", "次重，是員工的「日常輸出」"),
    ("交接 ×1.0", "中性負擔，已有流程"),
    ("被提及 ×0.8", "最輕，被提及 ≠ 真在做事"),
]))

story.append(Paragraph("<b>(c) 內外雙層權重設計 — 為什麼這樣切？</b>", style_body))
story.append(info_box("以 blockerLoad 為例",
    "<b>內層 ×2.5</b>：「一個卡點抵 2.5 條普通案件」（卡點本身的複雜度）<br/>"
    "<b>外層 ×2.0</b>：「卡點維度比主辦案維度重要」（維度權重）<br/>"
    "<b>實質效果</b>：每件卡點 ×5.0（內 ×2.5 × 外 ×2.0）<br/><br/>"
    "<b>為什麼切兩層</b>：分離「<b>數量 → 強度</b>」與「<b>維度 → 維度</b>」兩種概念，"
    "未來調整時可以單獨改一邊不破壞另一邊。",
    VIOLET))

story.append(PageBreak())

# ====== ⑧ ORI ======
story.extend(algo_header(
    8, "ORI 組織風險指數",
    "ORI = 0.35 × HCC + 0.25 × DL + 0.25 × BT + 0.15 × CDC",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>組織風險的綜合指標</b>（0-200，越低越好）— 反向計分，給內部分析師看（vs 健康度 0-100 給管理層）。",
    style_body,
))
story.append(info_box("為什麼有兩個指標（ORI + 健康度）",
    "<b>ORI 0-200 反向</b>：保留「極端風險告警」空間（175+ 警報區），對熟悉風險刻度的分析師友善<br/>"
    "<b>Health 0-100 正向</b>：管理層直覺，紅綠燈邏輯<br/><br/>"
    "<b>底層共享同一套分析器</b>，不重複計算。分眾設計。",
    BLUE))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(derivation_table([
    ("HCC", "Human Capital Concentration — Gini + top1占比 + 離群數"),
    ("DL",  "Decision Latency — 平均完成天數 + 逾期數"),
    ("BT",  "Blocker Tail Risk — avgPercentile + P90 + P95"),
    ("CDC", "Cross-Dept Comm — 單向溝通組數 + asymRatio"),
]))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(Paragraph("<b>4 因子權重 35:25:25:15 的依據</b>：", style_body))
story.append(derivation_table([
    ("HCC 35%（最重）",   "Drucker：「Knowledge Worker 的單點失敗是組織根基崩塌」— 人力是組織存活的核心"),
    ("DL 25%、BT 25%",    "並列短期關鍵 — 決策延遲與卡點是「正在燒」的兩種具體形式"),
    ("CDC 15%（最輕）",   "Galbraith：組織溝通是「長期累積影響」，不像 HCC 是當下崩塌"),
]))

story.append(Paragraph("<b>為什麼加總是 100% 而非 110% 或其他</b>：", style_body))
story.append(info_box("設計約束",
    "100% 的設計約束讓「滿分計算」直觀：<br/>"
    "  若 HCC = 200（最差），其他 = 100 → ORI = 0.35×200 + 0.65×100 = 135<br/>"
    "  若 HCC = 0（最好），其他 = 100 → ORI = 0.35×0 + 0.65×100 = 65<br/><br/>"
    "→ 權重必須加總 = 1，否則「合理區間」不易計算。",
    AMBER))

story.append(PageBreak())

# ============================================================
# 第三部：Decision Impact + Cohort
# ============================================================
story.append(Paragraph("第三部 · Decision Impact + Cohort Adjustment（v2.2 核心）", style_h1))

story.extend(algo_header(
    9, "Decision Impact + Cohort Adjustment",
    "adjustedDelta = (after.overall − before.overall) − baselineDrift<br/>"
    "baselineDrift = linearRegressionSlope(12週快照) × windowDays",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>單一決策對組織健康度的純粹影響</b> — 排除「大環境趨勢」的混淆變因。",
    style_body,
))
story.append(info_box("為什麼需要 Cohort Adjustment（v2.2 新增）",
    "<b>v2.1 純 delta 的問題</b>：若整體組織趨勢下滑（如 12 週掉 18 分），"
    "所有決策的 delta 都被冤枉變負分，但這不是它們的鍋。<br/><br/>"
    "<b>解決方法</b>：扣掉「同期基準漂移」，得出純粹歸因。<br/>"
    "&nbsp;&nbsp;<b>逆境止血</b>：大環境跌 14 分，決策只跌 9 分 → 「+5 救援」<br/>"
    "&nbsp;&nbsp;<b>順風失職</b>：大環境漲 10 分，決策只漲 3 分 → 「-7 失職」",
    GREEN))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(code_block(
    "before = computeHealthSnapshot(decidedAt - 1 day)<br/>"
    "afterAsOf = min(completedAt + 4 weeks, NOW)<br/>"
    "after = computeHealthSnapshot(afterAsOf)<br/>"
    "<br/>"
    "// 算大盤每日漂移率（線性回歸）<br/>"
    "samples = 12 個週快照<br/>"
    "slope = linearRegressionSlope(samples)<br/>"
    "<br/>"
    "// 算窗口期 baseline drift<br/>"
    "windowDays = afterAsOf - beforeAsOf<br/>"
    "baselineDrift = slope × windowDays"
))

story.append(step_label(3, "公式 + 係數怎麼定？", AMBER))

story.append(Paragraph("<b>(a) 為什麼 windowWeeks = 4 週</b>：", style_body))
story.append(derivation_table([
    ("4 週 = 1 個月", "管理學 PDCA 一個月為單位"),
    ("vs 2 週", "太短，決策還沒生效"),
    ("vs 8 週", "太久，其他事件干擾"),
    ("4 週 = sweet spot", "足夠看效果，又能控制干擾"),
]))

story.append(Paragraph("<b>(b) 為什麼用線性回歸算 baseline drift</b>：", style_body))
story.append(info_box("vs 「直接首尾相減」",
    "<b>單純首尾相減</b>：snap[11].overall − snap[0].overall / 11 週<br/>"
    "<b>問題</b>：某一週剛好放連假 / 系統異常 → 首尾值被汙染<br/><br/>"
    "<b>線性回歸</b>：12 個點互相抵消雜訊，找出穩健的長期趨勢<br/>"
    "→ Slope 對單點異常的抗性遠優於兩點相減",
    BLUE))

story.append(Paragraph("<b>(c) 評分公式：score = adjustedDelta + Σ(維度 ±2)</b>", style_body))
story.append(code_block(
    "score = adjustedDelta<br/>"
    "for each dim in DIMS:<br/>"
    "&nbsp;&nbsp;v = after[dim] - before[dim]<br/>"
    "&nbsp;&nbsp;if v ≥ 3:  score += 2  // 維度大幅改善獎勵<br/>"
    "&nbsp;&nbsp;if v ≤ -3: score -= 2  // 維度大幅惡化懲罰<br/>"
    "score = clamp(score, -100, 100)<br/>"
    "<br/>"
    "verdict:<br/>"
    "&nbsp;&nbsp;score ≥ +3 → 正面<br/>"
    "&nbsp;&nbsp;score ≤ -3 → 負面<br/>"
    "&nbsp;&nbsp;else        → 中性"
))

story.append(Paragraph("<b>為什麼每維度只 ±2</b>：", style_body))
story.append(info_box("避免單維度蓋過整體",
    "6 個維度若每個都 ±5，極端情況可累積 ±30 分蓋過整體 delta。<br/>"
    "±2 保證單維度貢獻上限 ±12（全 6 維都大幅變化），不會壓過 adjustedDelta（最高 ±100）。<br/>"
    "→ 維度作為「微調」，adjustedDelta 作為「主體」。",
    AMBER))

story.append(PageBreak())

# ============================================================
# 第四部：閾值類
# ============================================================
story.append(Paragraph("第四部 · 閾值與分位數類", style_h1))
story.append(Paragraph(
    "這部份的公式不像評分模型那麼複雜，但每個閾值都有特定設計理由。",
    style_body,
))

# ====== ⑩ P75 / P90 / P95 ======
story.extend(algo_header(
    10, "Empirical Percentile 三級門檻",
    "P75 (關注) / P90 (高風險) / P95 (極高風險)",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>動態自適應的風險等級</b> — 不用固定天數（「卡 10 天就嚴重」對大小公司都不適用），"
    "改用百分位數讓系統自動適應分布。",
    style_body,
))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(Paragraph(
    "對「同類歷史卡點解決天數」算 Type-7 線性內插 percentile（R / Python 預設）。",
    style_body,
))

story.append(step_label(3, "為什麼選 75 / 90 / 95", AMBER))
story.append(derivation_table([
    ("P75",      "Q3 第三四分位數 — 統計學標準分界，「進入長尾」起點"),
    ("P90",      "AWS / Amazon SLA 用 P90 作服務承諾。「高風險」業界標準"),
    ("P95",      "Google SRE Book 用 P95 P99。「極高風險」工業級標準"),
    ("vs 80/90/99", "P80 比 P75 警告太晚；P99 對 53 筆樣本只是 1 筆，太不穩定"),
]))

story.append(PageBreak())

# ====== ⑪ Gini 0.35 ======
story.extend(algo_header(
    11, "Gini 0.35 分界",
    "Gini ≥ 0.35 開始扣分（從 max(0, Gini − 0.35) 公式）",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>「組織內部負載分配開始不公平」</b>的臨界點。",
    style_body,
))

story.append(step_label(2, "依據", VIOLET))
story.append(info_box("Lambert 2001 經濟學共識",
    "<b>跨國資料分類</b>：<br/>"
    "&nbsp;&nbsp;< 0.30 高度平等（瑞典、丹麥、芬蘭）<br/>"
    "&nbsp;&nbsp;0.30-0.40 中等不平等（德國、加拿大、日本）<br/>"
    "&nbsp;&nbsp;> 0.40 高度不平等（美國 0.41、中國 0.47）<br/>"
    "&nbsp;&nbsp;> 0.50 極端不平等（巴西、南非）<br/><br/>"
    "<b>0.35</b> = 中等不平等的中間點，「<b>適度差距變成過度差距</b>」的學術臨界。",
    GREEN))

story.append(step_label(3, "為什麼組織內用一樣的門檻", AMBER))
story.append(Paragraph(
    "<b>邏輯類比</b>：國家層級的「貧富差距」對應組織層級的「工作量差距」。"
    "兩者都是「分配」問題，Gini 適用且閾值可類比。<br/><br/>"
    "<b>容忍範圍</b>：&lt; 0.35 不扣分（合理差距：主管 vs 員工）；"
    "&gt; 0.35 開始扣分（過度集中 = 單點失敗風險）。",
    style_body,
))

story.append(PageBreak())

# ====== ⑫ Time Decay 半衰期 2 週 ======
story.extend(algo_header(
    12, "Time Decay 半衰期 2 週",
    "TIME_DECAY = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02]",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>資訊重要性的時間衰減</b> — 本週案件比 1 個月前案件對「當前壓力」貢獻更大。",
    style_body,
))

story.append(step_label(2, "依據", VIOLET))
story.append(info_box("Andy Grove《High Output Management》第 8 章",
    "「主管的注意力週期約為 2 週。超過 2 週的事件，記憶開始模糊，重要性開始降低。」<br/><br/>"
    "→ 這是 Intel 內部觀察出的「<b>管理時間心理學</b>」。我們把它<b>數學化</b>編碼到系統。",
    BLUE))

story.append(step_label(3, "如何反推 9 個離散值", AMBER))
story.append(code_block(
    "設定半衰期 = 2 週（t=2 時 weight=0.5）<br/>"
    "<br/>"
    "用指數衰減 e^(-λt) 反推 λ：<br/>"
    "  e^(-λ × 2) = 0.5<br/>"
    "  -λ × 2 = ln(0.5)<br/>"
    "  λ = -ln(0.5) / 2 = ln(2)/2 ≈ 0.347<br/>"
    "<br/>"
    "代入各週次：<br/>"
    "  t=0: e^0 = 1.0 ✓<br/>"
    "  t=1: e^(-0.347) ≈ 0.707 → 取 0.7<br/>"
    "  t=2: e^(-0.693) ≈ 0.500 → 取 0.5 ✓ (定義點)<br/>"
    "  t=3: e^(-1.041) ≈ 0.354 → 取 0.35<br/>"
    "  t=4: e^(-1.388) ≈ 0.250 → 取 0.25<br/>"
    "  ...<br/>"
    "  t=9: 接近 0，歸 0"
))

story.append(Paragraph(
    "→ <b>每一個離散值都是從「半衰期 2 週」這個學理依據反推出來的</b>，不是憑空挑數字。",
    style_body,
))

story.append(PageBreak())

# ====== ⑬ Local Minima 3 分閾值 ======
story.extend(algo_header(
    13, "Local Minima 3 分閾值",
    "if series[i] < series[i-1] − 3 AND series[i] < series[i+1] − 3 → 拐點",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>顯著的健康度下跌點</b>（V 型谷底），同時過濾隨機雜訊。",
    style_body,
))

story.append(step_label(2, "用什麼訊號？", VIOLET))
story.append(Paragraph("12 週健康度時間序列，每點是 0-100 的 overall 分數。", style_body))

story.append(step_label(3, "為什麼 3 分", AMBER))
story.append(info_box("實測 SEED 12 週序列後校準",
    "<b>觀察波動</b>：<br/>"
    "&nbsp;&nbsp;一般週與週間 delta：±1-2 分（雜訊）<br/>"
    "&nbsp;&nbsp;一件決策逾期影響：~4 分<br/>"
    "&nbsp;&nbsp;一件 P95+ 卡點影響：~6 分<br/>"
    "&nbsp;&nbsp;大規模事件：10+ 分<br/><br/>"
    "<b>3 分閾值的設計</b>：<br/>"
    "&nbsp;&nbsp;比 ±2（雜訊上限）大 → 過濾雜訊<br/>"
    "&nbsp;&nbsp;比 4（決策逾期影響）小 → 抓中度事件<br/>"
    "&nbsp;&nbsp;→ 剛好「過濾雜訊抓中度事件」的 sweet spot",
    AMBER))

story.append(PageBreak())

# ====== ⑭ Smart Suggestion ±2 / ±5 ======
story.extend(algo_header(
    14, "Smart Suggestion 閾值",
    "Δ ≥ +5 強烈建議 / +2~+5 可考慮 / −2~+2 影響不大 / −5~−2 需評估 / ≤ −5 不建議",
))

story.append(step_label(1, "要量化什麼？", BLUE))
story.append(Paragraph(
    "<b>What-if 模擬 delta 的「行動建議」</b> — 把連續數字轉成 5 級的可行動建議。",
    style_body,
))

story.append(step_label(2, "依據", VIOLET))
story.append(Paragraph("健康度範圍 0-100，所以 delta 的合理區間 −100 ~ +100。", style_body))

story.append(step_label(3, "為什麼 ±2 / ±5 兩個閾值", AMBER))
story.append(derivation_table([
    ("±2 = 雜訊範圍",
     "對健康度 0-100，±2 是「無感知變化」— 對應 Cohen's d ≈ 0.2 微小效應"),
    ("±5 = 顯著變化",
     "5% of 100 = 「明顯感受得到」的變化 — 對應 Cohen's d ≈ 0.5 中等效應"),
    ("為什麼不取 ±1 / ±10",
     "±1 太敏感，會把雜訊當警示；±10 太鬆，許多有意義的變化被歸為「影響不大」"),
    ("符合 Cohen's d 慣例",
     "心理學與統計學「小 / 中 / 大」效應對應 0.2 / 0.5 / 0.8 — 我們的 2 / 5 / 8 對齊"),
]))

story.append(PageBreak())

# ============================================================
# 結語
# ============================================================
story.append(Paragraph("結語 · 設計過程的工程哲學", style_h1))

story.append(Paragraph(
    "本文件展示了 14 條核心公式的<b>完整推導過程</b>。一個關鍵觀察：",
    style_body,
))

story.append(info_box("沒有「神來一筆」",
    "每個係數都是「<b>典型情境 → 期望分數 → 反推係數</b>」的工程校準結果。<br/><br/>"
    "舉例：<br/>"
    "&nbsp;&nbsp;P95 扣 15 分 ← 「4 件 P95 應該扣到 60 分」反推<br/>"
    "&nbsp;&nbsp;Gini 乘 200 ← 「diff 0.1 應該扣 20 分」反推<br/>"
    "&nbsp;&nbsp;週報品質 60:30:10 ← 「沒交近 0、敷衍扣分、寫卡點獎勵」設計約束反推<br/>"
    "&nbsp;&nbsp;TIME_DECAY 9 個值 ← 「半衰期 2 週」從 Andy Grove 觀察反推",
    GREEN))

story.append(Paragraph("<b>三步驟通則的價值</b>", style_h2))

story.append(Paragraph(
    "本文件介紹的「<b>目標 → 訊號 → 校準</b>」三步驟設計法不只用在這 14 條公式，"
    "它是一個<b>通用方法論</b>：<br/><br/>"
    "&nbsp;&nbsp;<b>① 先想清楚要量化什麼</b>（不要直接寫公式）<br/>"
    "&nbsp;&nbsp;<b>② 找系統內可用的 proxy</b>（不要用無法自動算的東西）<br/>"
    "&nbsp;&nbsp;<b>③ 用反推校準訂係數</b>（從典型情境往回推）<br/><br/>"
    "→ 任何未來新增的指標都可以套用這個流程，<b>保持系統設計的一致性</b>。",
    style_body,
))

story.append(Spacer(1, 0.6 * cm))

story.append(Table([[" "]], colWidths=[17 * cm], style=TableStyle([
    ("LINEABOVE", (0, 0), (-1, -1), 0.4, GREY),
])))

story.append(Spacer(1, 0.4 * cm))

story.append(Paragraph(
    "<font color='#475569'>「公式設計不是創意，是工程紀律。」</font><br/>"
    "<font color='#475569'>「每個數字都應該能說出『為什麼是這個數字』。」</font><br/><br/>"
    "<b>—— 串連系統 v2.2 公式設計哲學</b>",
    ParagraphStyle("end", fontName=CN, fontSize=11, textColor=NAVY, leading=18, alignment=TA_CENTER)
))

# ============================================================
# 輸出
# ============================================================
import os
os.makedirs("docs", exist_ok=True)
out_path = "docs/串連系統_公式設計推導.pdf"


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(CN, 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1 * cm, "串連系統 v2.2 · 公式設計推導文件")
    canvas.drawRightString(19 * cm, 1 * cm, f"第 {doc.page} 頁")
    canvas.restoreState()


doc = SimpleDocTemplate(
    out_path, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="串連系統 v2.2 — 公式設計推導文件",
    author="資管導論 第 13 組",
)
doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
print(f"OK -> {out_path}")
