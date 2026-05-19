# -*- coding: utf-8 -*-
"""
串連系統 v2.1 — 演算法總覽 (Algorithm Catalog)
完整列出 22 種演算法 / 模型，每個附公式、用途、實作位置。
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT, TA_JUSTIFY
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
TEAL  = HexColor("#14b8a6")

# 樣式
style_title    = ParagraphStyle("title", fontName=CN, fontSize=26, leading=32, textColor=NAVY, spaceAfter=6)
style_subtitle = ParagraphStyle("st", fontName=CN, fontSize=12, leading=18, textColor=SLATE, spaceAfter=24)
style_h1       = ParagraphStyle("h1", fontName=CN, fontSize=18, leading=24, textColor=NAVY, spaceBefore=14, spaceAfter=8)
style_h2       = ParagraphStyle("h2", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceBefore=12, spaceAfter=4)
style_algo     = ParagraphStyle("algo", fontName=CN, fontSize=12.5, leading=18, textColor=NAVY, spaceBefore=10, spaceAfter=4)
style_body     = ParagraphStyle("body", fontName=CN, fontSize=10, leading=15.5, textColor=NAVY, alignment=TA_JUSTIFY, spaceAfter=4)
style_label    = ParagraphStyle("lbl", fontName=CN, fontSize=9, leading=12, textColor=BLUE, spaceAfter=2)


def formula(text, color="#3b82f6"):
    return Paragraph(
        f"<font color='{color}'>{text}</font>",
        ParagraphStyle("formula", fontName="Courier-Bold", fontSize=9.5, leading=13.5,
                       leftIndent=14, spaceAfter=6, spaceBefore=2),
    )


def code_inline(text):
    return f"<font name='Courier' color='#3b82f6'>{text}</font>"


def algo_card(idx, title, category, formula_text, where, why, badge_color=BLUE):
    """單一演算法卡片"""
    title_p = Paragraph(
        f"<font color='#3b82f6'><b>#{idx}</b></font> &nbsp; <b>{title}</b>",
        ParagraphStyle("algo_t", fontName=CN, fontSize=12, leading=16, textColor=NAVY, spaceAfter=2),
    )
    cat_p = Paragraph(
        f"<font color='{badge_color.hexval()}'>{category}</font>",
        ParagraphStyle("algo_c", fontName=CN, fontSize=9, leading=12, textColor=badge_color),
    )

    rows = [[title_p, cat_p]]
    inner_tbl_top = Table(rows, colWidths=[12.5 * cm, 4.5 * cm])
    inner_tbl_top.setStyle(TableStyle([
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("ALIGN", (1, 0), (1, 0), "RIGHT"),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ]))

    body_lines = []
    body_lines.append(inner_tbl_top)
    if formula_text:
        body_lines.append(Paragraph("公式 / 邏輯", ParagraphStyle("lbl_f", fontName=CN, fontSize=8.5, leading=11, textColor=GREY, spaceBefore=2, spaceAfter=2)))
        body_lines.append(formula(formula_text))
    if where:
        body_lines.append(Paragraph(f"<font color='#94a3b8' size='8.5'>實作位置</font>", ParagraphStyle("lbl_w", fontName=CN, fontSize=8.5, leading=11, textColor=GREY, spaceBefore=2, spaceAfter=2)))
        body_lines.append(Paragraph(where, ParagraphStyle("where", fontName=CN, fontSize=9, leading=13, textColor=NAVY, spaceAfter=4)))
    if why:
        body_lines.append(Paragraph(f"<font color='#94a3b8' size='8.5'>說明</font>", ParagraphStyle("lbl_y", fontName=CN, fontSize=8.5, leading=11, textColor=GREY, spaceBefore=2, spaceAfter=2)))
        body_lines.append(Paragraph(why, ParagraphStyle("why", fontName=CN, fontSize=9.5, leading=14, textColor=NAVY, alignment=TA_JUSTIFY)))

    container = Table([[body_lines]], colWidths=[17 * cm])
    container.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fcfdfe")),
        ("BOX", (0, 0), (-1, -1), 0.4, HexColor("#e2e8f0")),
        ("LINEBEFORE", (0, 0), (0, -1), 3, badge_color),
        ("LEFTPADDING", (0, 0), (-1, -1), 14),
        ("RIGHTPADDING", (0, 0), (-1, -1), 14),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    return KeepTogether([container, Spacer(1, 6)])


# ============= 內容 =============
story = []

# ---------- 封面 ----------
story.append(Spacer(1, 3.5 * cm))
story.append(Paragraph("演算法總覽", style_title))
story.append(Paragraph("Algorithm Catalog · 串連系統 v2.1",
                        ParagraphStyle("h_en", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceAfter=20)))
story.append(Paragraph(
    "本文件完整列出串連系統使用的 <b>22 種演算法 / 模型</b>，每筆含核心公式、實作檔案位置、"
    "與選用理由。涵蓋資訊檢索、統計分析、時間序列、加權評分、圖論、狀態判定、預測模擬等領域。",
    style_subtitle,
))

story.append(Spacer(1, 1 * cm))

# 7 大類介紹
cat_data = [
    ("①  資訊檢索", "BM25F、RSJ IDF、多 n-gram、同義詞、Substring Boost", "6"),
    ("②  統計分析", "Empirical Percentile、Gini Coefficient、敘述統計", "3"),
    ("③  時間序列", "Exponential Decay、Local Minima、asOf Snapshot、Weekly Series", "4"),
    ("④  加權評分", "Weighted Load、ORI、Org Health、Decision Impact、Leader Score", "5"),
    ("⑤  圖論網絡", "Adjacency Matrix、Force-directed、Asymmetric Detection", "3"),
    ("⑥  狀態判定", "Decision Helpers、Risk/Load/Health Level", "2"),
    ("⑦  預測模擬", "What-if Simulation、Impact Prediction", "2"),
]
cat_tbl = Table([
    [Paragraph(f"<b>{c[0]}</b>", ParagraphStyle("ct", fontName=CN, fontSize=11, leading=15, textColor=NAVY)),
     Paragraph(c[1], ParagraphStyle("cd", fontName=CN, fontSize=9.5, leading=13, textColor=SLATE)),
     Paragraph(f"<b>{c[2]}</b>", ParagraphStyle("cn", fontName=CN, fontSize=11, leading=15, textColor=BLUE))]
    for c in cat_data
], colWidths=[3.5 * cm, 11.5 * cm, 1.5 * cm])
cat_tbl.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("ALIGN", (2, 0), (2, -1), "RIGHT"),
    ("LEFTPADDING", (0, 0), (-1, -1), 10),
    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ("LINEBELOW", (0, 0), (-1, -2), 0.3, HexColor("#e2e8f0")),
    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fcfdfe")),
]))
story.append(cat_tbl)

story.append(PageBreak())

# ============================================================
# ① 資訊檢索
# ============================================================
story.append(Paragraph("① 資訊檢索演算法（Information Retrieval）", style_h1))

story.append(algo_card(
    1, "BM25F — Okapi BM25 with Field Weighting", "資訊檢索 · 核心",
    "score(q,d) = Σ idf(t) × Σ field_weight(f) × tf_norm(t,d,f)<br/>"
    "&nbsp;&nbsp;tf_norm = tf×(k1+1) / (tf + k1×(1−b + b×len/avgLen))<br/>"
    "&nbsp;&nbsp;k1 = 1.5, b = 0.75",
    "src/lib/historySearch.ts ─ buildIndex(), searchHistory()",
    "Elasticsearch / Lucene 同款。比 TF-IDF cosine 更接近人類認知（TF 飽和）；"
    "比 LLM Embedding 可解釋、零成本、保護機密。中小企業 50-200 筆歷史案的最佳選擇。",
    BLUE,
))

story.append(algo_card(
    2, "Robertson-Sparck-Jones IDF", "資訊檢索 · 輔助",
    "idf(t) = log(1 + (N − df(t) + 0.5) / (df(t) + 0.5))",
    "src/lib/historySearch.ts ─ buildIndex()",
    "BM25 標準的 IDF 變體，+0.5 是 Lidstone smoothing，避免極端值。"
    "對 stop word（的、了、是）給 0 分，對罕見詞給高分。",
    BLUE,
))

story.append(algo_card(
    3, "多 n-gram 中文 Tokenization", "資訊檢索 · 前處理",
    "「東京中央銀行」 → 東/京/中/央/銀/行 (1-gram)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; → 東京/京中/中央/央銀/銀行 (2-gram)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; → 東京中/京中央/中央銀/央銀行 (3-gram)",
    "src/lib/historySearch.ts ─ tokenize()",
    "中文無詞界。1+2+3-gram 混合切詞，可同時抓單字、雙字詞、3 字專有名詞。"
    "投資領域多為 3-4 字術語（投委會、董事會、伊勢島飯店），3-gram 特別重要。",
    BLUE,
))

story.append(algo_card(
    4, "Substring Boost", "資訊檢索 · 增強",
    "if document.lower().includes(query) → score × 1.8<br/>"
    "if title.lower().includes(query)    → score × 1.4",
    "src/lib/historySearch.ts ─ searchHistory()",
    "解決 n-gram 把專有名詞拆碎後被稀釋的問題。例如搜「東京中央銀行」，"
    "光靠 n-gram 命中分數會被「銀行」這種 high-DF 字拉低；substring boost 確保完整匹配優先。",
    BLUE,
))

story.append(algo_card(
    5, "Synonym Normalization（同義詞表）", "資訊檢索 · 前處理",
    "14 組金融領域同義詞，tokenize 前統一轉 canonical：<br/>"
    "募資 ≈ 融資 ≈ fundraising；盡調 ≈ 盡職調查 ≈ DD<br/>"
    "NDA ≈ 保密協議；投委會 ≈ IC；退場 ≈ exit ...",
    "src/lib/historySearch.ts ─ SYNONYM_MAP, normalizeSynonyms()",
    "金融術語經常有中英文 / 縮寫多種寫法，正規化提升命中率。"
    "從長到短替換，避免子字串覆蓋（先替「盡職調查」再替「盡調」）。",
    BLUE,
))

story.append(algo_card(
    6, "Cosine Similarity（已退役，保留說明）", "資訊檢索 · 歷史",
    "sim(q,d) = (q · d) / (||q|| × ||d||)",
    "v1 用 TF-IDF + Cosine（已被 BM25F 取代）",
    "v1 採用過。線性 TF 計分讓「出現 5 次」與「出現 50 次」差距過大，"
    "且無 field weighting。v2 升級到 BM25F 後，cosine 不再用於主流程。",
    GREY,
))

story.append(PageBreak())

# ============================================================
# ② 統計分析
# ============================================================
story.append(Paragraph("② 統計分析（Statistics）", style_h1))

story.append(algo_card(
    7, "Empirical Percentile（經驗分位數）", "統計 · 核心",
    "percentile(arr, p):<br/>"
    "&nbsp;&nbsp;sorted = sort(arr)<br/>"
    "&nbsp;&nbsp;idx = (n-1) × p/100<br/>"
    "&nbsp;&nbsp;return linear_interp(sorted[floor(idx)], sorted[ceil(idx)])",
    "src/lib/algorithms.ts ─ stats.percentile()",
    "用「同類歷史解決天數分布」評估當前卡點風險，比絕對天數門檻更精準。"
    "不同類別合理時長差異極大（法遵 7-8 天、跨部門 4-5 天），percentile 自動適應。",
    GREEN,
))

story.append(algo_card(
    8, "Gini Coefficient（不平均度，經濟學標準）", "統計 · 核心",
    "Gini = Σᵢ (2i − n − 1) × score[i]  /  (n × Σ score[i])<br/>"
    "0 = 完全公平，1 = 極端不平均，0.35 為學術分界",
    "src/lib/algorithms.ts (computeORI), src/lib/orgHealth.ts (loadBalance)",
    "經濟學量化「分配不均」的標準。組織內若 Gini > 0.35 表示工作量分布不公平，"
    "扣分；< 0.35 時不扣（公平範圍內）。比「標準差」更直觀。",
    GREEN,
))

story.append(algo_card(
    9, "敘述統計（Mean / Std / Min / Max / Median）", "統計 · 基礎",
    "stats.mean(arr)  = Σ arr[i] / n<br/>"
    "stats.std(arr)   = √(Σ(arr[i] − mean)² / (n−1))",
    "src/lib/algorithms.ts ─ stats 物件",
    "基礎統計工具，被各分析模組大量使用。例如員工負載 outlier 偵測用 mean + std。",
    GREEN,
))

# ============================================================
# ③ 時間序列
# ============================================================
story.append(Paragraph("③ 時間序列（Time Series）", style_h1))

story.append(algo_card(
    10, "Exponential Time Decay（指數時間衰減）", "時間 · 核心",
    "TIME_DECAY = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02]<br/>"
    "weeksAgo = round((asOf − reportWeek) / 7days)<br/>"
    "weight = TIME_DECAY[weeksAgo]  (9 週以上歸 0)",
    "src/lib/algorithms.ts ─ analyzeEmployeeLoad.getDecayWeight()",
    "員工負載分數依案件離當前時點多遠加權。本週案件權重 1.0，"
    "1 週前 0.7，2 週前 0.5… 讓近期高強度工作被正確放大。",
    AMBER,
))

story.append(algo_card(
    11, "asOf Snapshot Computation（時點切片）", "時間 · v2.1 新增",
    "所有跨時間分析器接受 asOf: Date 參數：<br/>"
    "&nbsp;&nbsp;analyzeEmployeeLoad(reports, handoffs, emps, asOf)<br/>"
    "&nbsp;&nbsp;analyzeBlockerRecord(blocker, history, asOf)<br/>"
    "&nbsp;&nbsp;computeHealthSnapshot(asOf, ...)",
    "src/lib/algorithms.ts, src/lib/orgHealth.ts",
    "v2.1 修正：原本所有分析器內部用 new Date() → 12 週趨勢線每週數字相同。"
    "新增 asOf 參數讓「歷史快照」反映該週時點的真實狀態，"
    "未來資料（asOf 之後的）自動排除。",
    AMBER,
))

story.append(algo_card(
    12, "Local Minima Detection（拐點偵測）", "時間 · 信號處理",
    "for i = 1 .. n-2:<br/>"
    "&nbsp;&nbsp;if series[i] &lt; series[i−1] − 3<br/>"
    "&nbsp;&nbsp;AND series[i] &lt; series[i+1] − 3:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;mark as inflection point",
    "src/lib/orgHealth.ts ─ detectInflectionPoints()",
    "在 12 週健康度趨勢線上自動標出「V 型谷底」。閾值 3 分避免雜訊，"
    "只標真正顯著的低谷。用紅點視覺化，點擊可看當週事件。",
    AMBER,
))

story.append(algo_card(
    13, "Weekly Series Computation（12 週快照序列）", "時間 · 衍生",
    "for i = weeks-1 .. 0:<br/>"
    "&nbsp;&nbsp;asOf_i = NOW − i × 7days<br/>"
    "&nbsp;&nbsp;snapshot[i] = computeHealthSnapshot(asOf_i, ...)",
    "src/lib/orgHealth.ts ─ computeWeeklySeries()",
    "對過去 12 週分別跑健康度快照，產生時間序列。"
    "搭配 Local Minima Detection 提供「整體健康度趨勢線 + 拐點」視覺。",
    AMBER,
))

story.append(PageBreak())

# ============================================================
# ④ 加權評分
# ============================================================
story.append(Paragraph("④ 加權評分模型（Weighted Scoring）", style_h1))

story.append(algo_card(
    14, "Weighted Load Score（員工負載）", "加權 · 核心",
    "loadScore = timeWeightedCases × 1.5<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + blockerLoad      × 2.0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + mentionsWeighted × 0.8<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + handoffLoad      × 1.0<br/><br/>"
    "level: overload (≥25 或 P90+) | high (≥15 或 P75+) | normal (≥6) | low (≥1) | idle",
    "src/lib/algorithms.ts ─ analyzeEmployeeLoad()",
    "融合 4 種訊號量化「員工真實負荷」。卡點權重最高（×2.0）因為它代表正在燒的工作。"
    "用 percentile 而非固定門檻判等級，自動適應公司規模。",
    VIOLET,
))

story.append(algo_card(
    15, "ORI — Organizational Risk Index", "加權 · 風險",
    "ORI = 0.35 × HCC + 0.25 × DL + 0.25 × BT + 0.15 × CDC<br/><br/>"
    "HCC = 人力集中度（Gini + top1 + outliers）<br/>"
    "DL  = 決策延遲（avg天數 + 逾期數）<br/>"
    "BT  = 卡點尾端風險（avgP + P90/P95 數）<br/>"
    "CDC = 跨部門溝通（單向組數）",
    "src/lib/algorithms.ts ─ computeORI()",
    "0-200 反向計分（越低越好）。HCC 權重最高（35%）因為人力集中是組織單點失敗的主因。"
    "分 5 級告警：≥175 急、150 注意、125 關注、100 還可以、<100 順利。",
    VIOLET,
))

story.append(algo_card(
    16, "Organization Health Score（6 維雷達）", "加權 · v2.1 主指標",
    "overall = blockerHealth × 0.22 + decisionTimeliness × 0.18<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + handoffSmoothness × 0.15 + loadBalance × 0.18<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + crossDept × 0.12 + reportQuality × 0.15<br/><br/>"
    "0-100 正向計分（越高越好），與 ORI 互為補充",
    "src/lib/orgHealth.ts ─ computeHealthSnapshot()",
    "v2.1 新模型。為「面向管理層 / 教授 / 簡報觀眾」設計。各維度有獨立子公式："
    "卡點健康看 P95+ 數、決策及時看逾期數、負載均衡看 Gini、部門協作看單向溝通..."
    "Plan→Decide→Track→Learn 閉環的核心指標。",
    VIOLET,
))

story.append(algo_card(
    17, "Decision Impact Score（決策成效）", "加權 · v2.1 新模型",
    "before = computeHealthSnapshot(decidedAt − 1day)<br/>"
    "afterAsOf = min(completedAt + 4週, NOW)  ← clamp 避免未來<br/>"
    "after = computeHealthSnapshot(afterAsOf)<br/>"
    "deltaOverall = after.overall − before.overall<br/>"
    "score = deltaOverall + Σ(各維度大幅改善 ±2)<br/>"
    "verdict = score ≥ 3 ? 正面 : score ≤ −3 ? 負面 : 中性",
    "src/lib/decisionImpact.ts ─ analyzeDecisionImpact()",
    "對每筆已完成決策，比較前後 4 週的組織健康度差異。"
    "若 completedAt + 4週 > NOW，自動 clamp 並標記「⏳ 追蹤中（暫評）」。"
    "回答「我做的決策真的有改善公司嗎」這個管理層核心問題。",
    VIOLET,
))

story.append(algo_card(
    18, "Leader Scorecard（主管成效排行）", "加權 · v2.1 衍生",
    "for each decidedBy in decisions:<br/>"
    "&nbsp;&nbsp;impacts = completed.map(analyzeDecisionImpact)<br/>"
    "&nbsp;&nbsp;avgImpact = mean(impacts.map(i => i.score))<br/>"
    "&nbsp;&nbsp;rank by avgImpact desc",
    "src/lib/decisionImpact.ts ─ computeLeaderScores()",
    "依 decidedBy（董事會 / 投委會 / 營運會議）分組，計算各主管平均決策成效。"
    "排行展示在「決策追蹤」頁頂部，第一名加 🏆 標籤。問責 + 學習機制。",
    VIOLET,
))

story.append(PageBreak())

# ============================================================
# ⑤ 圖論
# ============================================================
story.append(Paragraph("⑤ 圖論 / 網絡分析（Graph Theory）", style_h1))

story.append(algo_card(
    19, "Directed Weighted Adjacency Matrix（有向加權鄰接矩陣）", "圖論 · 核心",
    "for each report r:<br/>"
    "&nbsp;&nbsp;matrix[r.dept][target] += count_mentions(r.text, target)<br/>"
    "for each handoff h:<br/>"
    "&nbsp;&nbsp;matrix[h.from][h.to] += 1",
    "src/lib/algorithms.ts ─ analyzeDeptNetwork()",
    "從週報文字 + 交接紀錄萃取「誰提到誰」訊號，建構部門互動圖。"
    "邊權重 = mention 次數 + 交接量。可分析時間範圍（4 週、8 週、3 月...）。",
    TEAL,
))

story.append(algo_card(
    20, "Force-directed Graph Layout（力導向佈局）", "圖論 · 視覺化",
    "節點間斥力 ∝ 1/distance²<br/>"
    "邊吸引力 ∝ weight × distance<br/>"
    "迭代到平衡狀態",
    "src/pages/OrgAnalytics.tsx（SVG 實作）",
    "經典的 force-directed layout 演算法（類似 D3.js force simulation）。"
    "節點大小依「對外溝通總量」，邊粗細依協作密度。讓組織結構視覺化。",
    TEAL,
))

story.append(algo_card(
    21, "Asymmetric Communication Detection（單向溝通偵測）", "圖論 · 異常偵測",
    "for each pair (A, B) where A ≠ B:<br/>"
    "&nbsp;&nbsp;if weight(A, B) ≥ 5 AND weight(B, A) = 0:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;mark as one-way communication",
    "src/lib/algorithms.ts (computeORI.CDC), src/lib/orgHealth.ts (crossDept)",
    "識別「A 部門一直找 B，B 完全沒回應 A」這種組織病徵。"
    "計入 ORI 的 CDC 維度與健康度的部門協作維度，每組扣 15-18 分。",
    TEAL,
))

# ============================================================
# ⑥ 狀態判定
# ============================================================
story.append(Paragraph("⑥ 狀態判定（State Logic）", style_h1))

story.append(algo_card(
    22, "Decision Status Helpers（決策狀態動態判定）", "狀態 · v2.1 新增",
    "isDecisionOverdueAt(d, asOf):<br/>"
    "&nbsp;&nbsp;decidedAt ≤ asOf AND dueDate &lt; asOf<br/>"
    "&nbsp;&nbsp;AND (!completedAt OR completedAt &gt; asOf)<br/><br/>"
    "isDecisionInProgressAt(d, asOf):<br/>"
    "&nbsp;&nbsp;decidedAt ≤ asOf AND NOT overdue AND NOT completed<br/><br/>"
    "isDecisionCompletedAt(d, asOf):  completedAt ≤ asOf<br/>"
    "daysOverdue(d, asOf):  max(0, (asOf − dueDate) / 86400000)",
    "src/lib/algorithms.ts",
    "v2.1 修正：原本各頁用 d.status === '逾期' 字串判斷，但 orgHealth 用日期判斷 → 兩套標準。"
    "新增 4 個 helper 統一邏輯，全系統（Dashboard / Decisions / Notifications / "
    "MeetingPrep / WhatIf / orgHealth / ORI）共用。"
    "自動偵測「dueDate 已過但 status 仍是執行中」的決策。",
    RED,
))

story.append(algo_card(
    23, "Risk / Load / Health Level（多層級閾值判定）", "狀態 · 分類",
    "Blocker Level:  critical (P95+) | high (P90+) | medium (P75+) | normal<br/><br/>"
    "Load Level:     overload (≥25 或 P90+) | high | normal | low | idle<br/><br/>"
    "Health Level:   優異(85+) | 良好(70+) | 可關注(55+) | 需注意(40+) | 亟需介入",
    "src/lib/algorithms.ts, src/lib/orgHealth.ts (healthLevel)",
    "將連續分數映射到離散層級，方便 UI 配色與排序。"
    "每層級對應建議行動文案：critical → 立刻召開協調會議、high → 本週升級處理...",
    RED,
))

story.append(PageBreak())

# ============================================================
# ⑦ 預測模擬
# ============================================================
story.append(Paragraph("⑦ 預測 / 模擬（Prediction & Simulation）", style_h1))

story.append(algo_card(
    24, "What-if Scenario Simulation（情境模擬）", "模擬 · v2.1 主功能",
    "scenario = {<br/>"
    "&nbsp;&nbsp;resolvedBlockerIds:    Set&lt;string&gt;<br/>"
    "&nbsp;&nbsp;expeditedDecisionIds:  Set&lt;string&gt;<br/>"
    "&nbsp;&nbsp;signedHandoffIds:      Set&lt;string&gt;<br/>"
    "&nbsp;&nbsp;extraHeadcount:        { [dept]: 0..5 }<br/>"
    "}<br/><br/>"
    "shadowData = applyScenario(originalData, scenario)<br/>"
    "projected = computeHealthSnapshot(NOW, shadowData)<br/>"
    "delta = projected.overall − baseline.overall",
    "src/pages/WhatIf.tsx",
    "互動式 sandbox。對原始資料 fork 一份 shadow data，套用 scenario 修改後，"
    "重跑健康度快照，與 baseline 雙圖層比對。回答「假如我這樣做，會怎樣？」"
    "demo 神器：教授拉開關就能感受演算法價值。",
    AMBER,
))

story.append(algo_card(
    25, "Smart Suggestion（智能建議文案）", "模擬 · 輔助",
    "delta ≥  +5  → 顯著改善 ✨ 強烈建議執行<br/>"
    "delta +2..+5 → 有改善，可考慮執行<br/>"
    "delta −2..+2 → 影響不大，可保留資源<br/>"
    "delta −5..−2 → 略為惡化，需評估<br/>"
    "delta ≤  −5  → 顯著惡化 ⚠️ 不建議執行",
    "src/pages/WhatIf.tsx",
    "把 delta 數字轉成人類可讀的決策建議，降低管理層的解讀成本。",
    AMBER,
))

# ============================================================
# ⑧ 附錄：工具與保護機制
# ============================================================
story.append(Paragraph("⑧ 附錄：資料保護與工具函式", style_h1))

story.append(algo_card(
    "*", "Optimistic UI Sync（樂觀同步）", "工具 · 資料層",
    "user action → setState(UI 即時更新)<br/>"
    "useEffect 監聽 → saveDocumentCollection() → Firestore<br/>"
    "syncStatus: idle / syncing / error",
    "src/hooks/useAppData.ts ─ syncCollection()",
    "使用者操作立即反映在畫面，背景非同步寫 Firestore。"
    "Sidebar 即時顯示同步狀態指示燈。",
    SLATE,
))

story.append(algo_card(
    "*", "SEED Protection Thresholds（種子資料保護）", "工具 · 資料層",
    "reports / handoffs:  &lt; 10 筆 → 用 SEED<br/>"
    "blockers / history / meetings / decisions / employees:  空時 → SEED<br/>"
    "departments / users (v2.1):  空時 → SEED（避免崩潰）<br/>"
    "舊「第 N 週」格式偵測 → reset 為新 SEED",
    "src/hooks/useAppData.ts",
    "防止 Firestore 集合誤刪 / 首次登入時資料為空導致 app 崩潰。"
    "v2.1 補強 departments / users 兩個關鍵集合的 fallback。",
    SLATE,
))

story.append(algo_card(
    "*", "NaN Guards / Clamp（數值安全保護）", "工具 · 通用",
    "clamp(v, lo, hi) = max(lo, min(hi, v))<br/>"
    "if isNaN(+new Date(str)) → 跳過 / 顯示 fallback 文字<br/>"
    "if denominator > 0 → 才除，否則回傳 0 / '尚無資料'<br/>"
    "submissionRate = Math.min(1, submitted/expected)",
    "全系統",
    "所有評分函式末段 clamp 進有效區間；所有日期 parse 含 isNaN 檢查；"
    "所有除法前驗證分母 > 0。避免 NaN / Infinity 滲透到 UI。",
    SLATE,
))

# ============================================================
# 總結
# ============================================================
story.append(PageBreak())
story.append(Paragraph("演算法盤點總表", style_h1))

summary = [
    ("#",  "演算法",                              "類別",         "檔案"),
    ("1",  "BM25F",                               "資訊檢索",     "historySearch.ts"),
    ("2",  "Robertson-Sparck-Jones IDF",          "資訊檢索",     "historySearch.ts"),
    ("3",  "多 n-gram Tokenization",              "資訊檢索",     "historySearch.ts"),
    ("4",  "Substring Boost",                     "資訊檢索",     "historySearch.ts"),
    ("5",  "Synonym Normalization",               "資訊檢索",     "historySearch.ts"),
    ("6",  "Cosine Similarity（已退役）",         "資訊檢索",     "v1 歷史"),
    ("7",  "Empirical Percentile",                "統計",         "algorithms.ts"),
    ("8",  "Gini Coefficient",                    "統計",         "algorithms.ts, orgHealth.ts"),
    ("9",  "Mean / Std / Median",                 "統計",         "algorithms.ts (stats)"),
    ("10", "Exponential Time Decay",              "時間序列",     "algorithms.ts"),
    ("11", "asOf Snapshot",                       "時間序列",     "algorithms.ts, orgHealth.ts"),
    ("12", "Local Minima Detection",              "時間序列",     "orgHealth.ts"),
    ("13", "Weekly Series",                       "時間序列",     "orgHealth.ts"),
    ("14", "Weighted Load Score",                 "加權評分",     "algorithms.ts"),
    ("15", "ORI Index",                           "加權評分",     "algorithms.ts"),
    ("16", "Org Health 6D Score",                 "加權評分",     "orgHealth.ts"),
    ("17", "Decision Impact Score",               "加權評分",     "decisionImpact.ts"),
    ("18", "Leader Scorecard",                    "加權評分",     "decisionImpact.ts"),
    ("19", "Adjacency Matrix",                    "圖論",         "algorithms.ts"),
    ("20", "Force-directed Layout",               "圖論",         "OrgAnalytics.tsx"),
    ("21", "Asymmetric Detection",                "圖論",         "algorithms.ts, orgHealth.ts"),
    ("22", "Decision Status Helpers",             "狀態判定",     "algorithms.ts"),
    ("23", "Risk / Load / Health Level",          "狀態判定",     "各檔"),
    ("24", "What-if Scenario Simulation",         "預測模擬",     "WhatIf.tsx"),
    ("25", "Smart Suggestion Text",               "預測模擬",     "WhatIf.tsx"),
]

# 表頭
header_style = ParagraphStyle("hd", fontName=CN, fontSize=9.5, leading=12, textColor=BLUE)
cell_style   = ParagraphStyle("cl", fontName=CN, fontSize=9,   leading=11.5, textColor=NAVY)
header = [Paragraph(f"<b>{h}</b>", header_style) for h in summary[0]]
body_rows = [
    [Paragraph(str(r[0]), cell_style),
     Paragraph(r[1], cell_style),
     Paragraph(r[2], cell_style),
     Paragraph(f"<font face='Courier' size='8'>{r[3]}</font>",
               ParagraphStyle("c", fontName="Courier", fontSize=8, leading=11, textColor=SLATE))]
    for r in summary[1:]
]
summary_tbl = Table([header] + body_rows, colWidths=[1 * cm, 5.8 * cm, 3 * cm, 7.2 * cm])
summary_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#eff6ff")),
    ("LINEBELOW",  (0, 0), (-1, 0), 0.6, BLUE),
    ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING",(0, 0), (-1, -1), 8),
    ("RIGHTPADDING",(0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LINEBELOW", (0, 1), (-1, -2), 0.2, HexColor("#e2e8f0")),
]))
story.append(summary_tbl)

story.append(Spacer(1, 0.8 * cm))
story.append(Paragraph(
    "<b>共 25 條目（22 核心演算法 + 3 工具機制）</b>，分散於約 8 個核心檔案：",
    ParagraphStyle("end", fontName=CN, fontSize=10.5, leading=15, textColor=NAVY),
))
story.append(Paragraph(
    "<font face='Courier' size='9'>src/lib/algorithms.ts (核心) · src/lib/historySearch.ts · "
    "src/lib/orgHealth.ts · src/lib/decisionImpact.ts · src/hooks/useAppData.ts · "
    "src/pages/WhatIf.tsx · src/pages/OrgAnalytics.tsx · src/lib/dateUtils.ts</font>",
    ParagraphStyle("paths", fontName=CN, fontSize=9, leading=14, textColor=SLATE, spaceBefore=4),
))

story.append(Spacer(1, 1.2 * cm))
story.append(Paragraph(
    "<i>「資料越少，演算法的選擇越重要。」</i><br/>"
    "<i>「跨頁面的一致性，比單頁的炫技更重要。」</i><br/><br/>"
    "—— 串連系統設計哲學",
    ParagraphStyle("end2", fontName=CN, fontSize=10.5, textColor=GREY, leading=18),
))

# ============= 輸出 =============
import os
os.makedirs("docs", exist_ok=True)
out_path = "docs/串連系統_演算法總覽.pdf"


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(CN, 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1 * cm, "串連系統 v2.1 · 演算法總覽 Algorithm Catalog")
    canvas.drawRightString(19 * cm, 1 * cm, f"第 {doc.page} 頁")
    canvas.restoreState()


doc = SimpleDocTemplate(
    out_path, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="串連系統 v2.1 — 演算法總覽 Algorithm Catalog",
    author="資管導論 第 13 組",
)
doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
print(f"OK -> {out_path}")
