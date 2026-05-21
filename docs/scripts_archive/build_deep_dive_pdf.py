# -*- coding: utf-8 -*-
"""
串連系統 v2.2 — 演算法深度解析（完整版）
29 個演算法，每個 5 段式：起源 / 為什麼用 / 參數怎麼定 / 怎麼抓資料 / 限制
"""
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
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
style_title    = ParagraphStyle("title", fontName=CN, fontSize=28, leading=34, textColor=NAVY, spaceAfter=6)
style_subtitle = ParagraphStyle("st", fontName=CN, fontSize=12, leading=18, textColor=SLATE, spaceAfter=24)
style_h1       = ParagraphStyle("h1", fontName=CN, fontSize=20, leading=26, textColor=NAVY, spaceBefore=14, spaceAfter=10)
style_algo     = ParagraphStyle("algo", fontName=CN, fontSize=16, leading=22, textColor=BLUE, spaceBefore=12, spaceAfter=4)
style_section  = ParagraphStyle("sec", fontName=CN, fontSize=12, leading=18, textColor=VIOLET, spaceBefore=8, spaceAfter=4)
style_body     = ParagraphStyle("body", fontName=CN, fontSize=10, leading=15.5, textColor=NAVY, alignment=TA_JUSTIFY, spaceAfter=4)
style_caption  = ParagraphStyle("caption", fontName=CN, fontSize=9, leading=12, textColor=GREY, spaceAfter=3)


def formula(text):
    return Paragraph(
        f"<font color='#3b82f6'>{text}</font>",
        ParagraphStyle("formula", fontName="Courier-Bold", fontSize=9, leading=13,
                       leftIndent=14, spaceAfter=6, spaceBefore=2),
    )


def code_block(text):
    return Paragraph(
        f"<font color='#0f172a'>{text}</font>",
        ParagraphStyle("code", fontName="Courier", fontSize=8.5, leading=12,
                       leftIndent=14, spaceAfter=6, spaceBefore=2, backColor=HexColor("#f8fafc"),
                       borderPadding=6),
    )


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


def kv_table(rows, col_widths=None):
    col_widths = col_widths or [4 * cm, 13 * cm]
    table_data = []
    for k, v in rows:
        table_data.append([
            Paragraph(f"<b>{k}</b>", ParagraphStyle("k", fontName=CN, fontSize=9, textColor=BLUE, leading=13)),
            Paragraph(v, ParagraphStyle("v", fontName=CN, fontSize=9, textColor=NAVY, leading=13)),
        ])
    t = Table(table_data, colWidths=col_widths)
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


def hr():
    return Table([[" "]], colWidths=[17 * cm], style=TableStyle([
        ("LINEABOVE", (0, 0), (-1, -1), 0.4, GREY),
    ]))


def algo_block(num, name, en_name, category):
    """演算法區塊起頭"""
    items = []
    title_para = Paragraph(
        f"<font color='#3b82f6'><b>#{num}</b></font>&nbsp;&nbsp; "
        f"<b>{name}</b>&nbsp;&nbsp;<font color='#94a3b8' size='10'>{en_name}</font>",
        ParagraphStyle("at", fontName=CN, fontSize=15, leading=22, textColor=NAVY,
                       spaceBefore=10, spaceAfter=2)
    )
    cat_para = Paragraph(
        f"<font color='#8b5cf6' size='9'>● {category}</font>",
        ParagraphStyle("cat", fontName=CN, fontSize=9, leading=12, textColor=VIOLET, spaceAfter=6)
    )
    items.append(title_para)
    items.append(cat_para)
    return items


def section(emoji_label, color=VIOLET):
    return Paragraph(
        f"<b>{emoji_label}</b>",
        ParagraphStyle("sec", fontName=CN, fontSize=11.5, leading=15, textColor=color,
                       spaceBefore=6, spaceAfter=3)
    )


# ===================================================
# 內容
# ===================================================
story = []

# ============ 封面 ============
story.append(Spacer(1, 3 * cm))
story.append(Paragraph("演算法深度解析", style_title))
story.append(Paragraph("Algorithm Deep Dive · 29 個核心演算法完整解構",
                        ParagraphStyle("h_en", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceAfter=4)))
story.append(Paragraph("串連系統 v2.2 · 投資公司管理層決策輔助",
                        ParagraphStyle("h_sub", fontName=CN, fontSize=11, leading=16, textColor=SLATE, spaceAfter=20)))

story.append(Paragraph(
    "本文件對系統中 29 個核心演算法做<b>完整深度解構</b>。每個演算法都包含 5 個面向：<br/><br/>"
    "&nbsp;&nbsp;<b>🎓 起源</b> — 學理出處（年份、人物、論文）<br/>"
    "&nbsp;&nbsp;<b>🎯 為什麼選它</b> — 對照替代方案的取捨<br/>"
    "&nbsp;&nbsp;<b>🔢 參數怎麼定</b> — 每個 magic number 的具體理由<br/>"
    "&nbsp;&nbsp;<b>📥 怎麼抓資料</b> — 從原始資料到分數的完整 trace<br/>"
    "&nbsp;&nbsp;<b>⚠️ 限制</b> — 已知缺點與設計取捨<br/><br/>"
    "目標：讓教授、新工程師、論文審查者能夠<b>追溯每個數字的來源</b>，"
    "確認系統不是憑空造論，而是站在 60 年資訊檢索 + 統計學 + 管理科學的基礎上。",
    style_subtitle,
))

story.append(Spacer(1, 1 * cm))

cover_info = kv_table([
    ("專案名稱",       "串連系統 v2.2 (Chuanlien System)"),
    ("演算法總數",     "29 個（28 核心 + 1 工具）"),
    ("學理基礎",       "Robertson BM25 (1994) · Gini (1912) · Drucker / Andy Grove · Pearl 因果推論"),
    ("實作位置",       "src/lib/algorithms.ts、orgHealth.ts、decisionImpact.ts、historySearch.ts"),
    ("作者",           "資管導論 第 13 組"),
    ("文件版本",       "v2.2 深度解析版 · 2026-05"),
], col_widths=[3.5 * cm, 13.5 * cm])
story.append(cover_info)

story.append(PageBreak())

# ============ 目錄 ============
story.append(Paragraph("目錄", style_h1))
toc_data = [
    ("第一部 資訊檢索類", "6 個演算法"),
    ("#1", "BM25F — Field-weighted Okapi BM25"),
    ("#2", "Robertson-Sparck-Jones IDF"),
    ("#3", "多 n-gram 中文 Tokenization"),
    ("#4", "Substring Boost"),
    ("#5", "Synonym Normalization 同義詞正規化"),
    ("#6", "Cosine Similarity（已退役）"),
    ("第二部 統計分析類", "3 個演算法"),
    ("#7", "Empirical Percentile 經驗分位數"),
    ("#8", "Gini Coefficient 吉尼係數"),
    ("#9", "敘述統計 (Mean / Std / Median)"),
    ("第三部 時間序列類", "4 個演算法"),
    ("#10", "Exponential Time Decay 指數時間衰減"),
    ("#11", "asOf Snapshot Computation 時點切片"),
    ("#12", "Local Minima Detection 拐點偵測"),
    ("#13", "Weekly Series 12 週採樣"),
    ("第四部 加權評分模型", "5 個演算法"),
    ("#14", "Weighted Load Score 加權員工負載"),
    ("#15", "ORI 組織風險指數"),
    ("#16", "Organization Health 6D Score 6 維健康度"),
    ("#17", "Decision Impact + Cohort Adjustment (v2.2 學術創舉)"),
    ("#18", "Leader Scorecard 主管成效排行"),
    ("第五部 圖論網絡類", "3 個演算法"),
    ("#19", "Directed Adjacency Matrix 有向加權鄰接矩陣"),
    ("#20", "Force-directed Graph Layout 力導向佈局"),
    ("#21", "Asymmetric Communication Detection 單向溝通偵測"),
    ("第六部 狀態判定類", "2 個演算法"),
    ("#22", "Decision Status Helpers 動態狀態判定"),
    ("#23", "Risk / Load / Health Level Mapping 等級對應"),
    ("第七部 預測模擬類", "2 個演算法"),
    ("#24", "What-if Scenario Simulation 情境模擬"),
    ("#25", "Smart Suggestion 智能建議文案"),
    ("第八部 工具機制類", "3 個 + 1"),
    ("#26", "Optimistic UI Sync 樂觀同步"),
    ("#27", "SEED Protection 種子資料保護"),
    ("#28", "NaN Guards / Clamp 數值安全保護"),
    ("#29", "Linear Regression Baseline Drift Slope (v2.2 新工具)"),
]
toc_rows = []
for n, t in toc_data:
    if "第" in n and "部" in n:
        toc_rows.append([
            Paragraph(f"<b><font color='#3b82f6'>{n}</font></b>",
                      ParagraphStyle("th", fontName=CN, fontSize=11, textColor=BLUE, leading=18, spaceBefore=4)),
            Paragraph(f"<i>{t}</i>",
                      ParagraphStyle("td", fontName=CN, fontSize=10, textColor=GREY, leading=14)),
        ])
    else:
        toc_rows.append([
            Paragraph(f"<b>{n}</b>",
                      ParagraphStyle("tn", fontName=CN, fontSize=10, textColor=NAVY)),
            Paragraph(t,
                      ParagraphStyle("tt", fontName=CN, fontSize=10, textColor=NAVY, leading=14)),
        ])
toc_table = Table(toc_rows, colWidths=[1.6 * cm, 14 * cm])
toc_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
]))
story.append(toc_table)

story.append(PageBreak())

# ============================================================
# 第一部 資訊檢索類
# ============================================================
story.append(Paragraph("第一部 · 資訊檢索類", style_h1))
story.append(Paragraph("6 個演算法，全部位於 <font face='Courier'>src/lib/historySearch.ts</font>", style_body))

# ====== #1 BM25F ======
story.extend(algo_block(1, "BM25F", "Field-weighted Okapi BM25", "資訊檢索 · 主搜尋演算法"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1976 年</b> Stephen Robertson（劍橋大學）+ Karen Spärck Jones 在 "
    "<i>Relevance Weighting of Search Terms</i> 提出機率檢索模型 (Probability Ranking Principle)。"
    "<br/><b>1994 年</b> TREC-3 評測時，Robertson 團隊把 PRP 落地成 BM25（「Best Matching, version 25」"
    "— 因為他試了 24 次才調對）。<br/>"
    "<b>1997 年</b> 加上 F (Field) 變成 BM25F，處理多欄位文件。<br/><br/>"
    "<b>現在的身分</b>：Elasticsearch / Lucene / Apache Solr 預設打分函式。Google PageRank 之外"
    "<b>最廣泛使用</b>的文字檢索演算法。",
    style_body,
))

story.append(section("🎯 為什麼選它"))
story.append(Paragraph("BM25F 的核心數學特性 — <b>TF 飽和</b>：", style_body))
story.append(formula(
    "tf_norm = tf × (k1 + 1) / (tf + k1 × (1 − b + b × len/avgLen))<br/>"
    "<br/>"
    "當 tf → ∞ 時，分子分母同階，收斂到 (k1+1)/1 = 2.5（k1=1.5 時）"
))
story.append(Paragraph("TF 值對照表：", style_body))
story.append(kv_table([
    ("tf = 1", "tf_norm ≈ 1.0"),
    ("tf = 2", "tf_norm ≈ 1.4"),
    ("tf = 5", "tf_norm ≈ 1.9"),
    ("tf = 50", "tf_norm ≈ 2.45"),
    ("tf = ∞", "tf_norm = 2.5（漸近線）"),
]))
story.append(Paragraph(
    "→ 「出現 5 次和 50 次的相關性差不大」，符合人類認知（如同吃飯，第一口最香、第十口已飽）。"
    "<br/><b>vs 替代方案</b>：TF-IDF cosine（線性 TF 計分）會讓 50 次比 5 次多 10 倍，不合理。"
    "LLM Embedding 黑盒、機密、要錢。",
    style_body,
))

story.append(section("🔢 參數怎麼定"))
story.append(kv_table([
    ("k1 = 1.5",
     "Robertson 原論文（1994 TREC-3）建議範圍 1.2-2.0。Elasticsearch default 是 1.2（對短文寬容）。"
     "我們選 1.5：案件描述比網頁短，1.2 太鬆（重複關鍵字加分多）、2.0 太嚴（早早飽和）。"
     "跑過 SEED 53 筆驗證排序合理。"),
    ("b = 0.75",
     "長度懲罰強度。b=0 不懲罰、b=1 完全正規化。0.5 對長文太寬、1.0 對短欄位太狠。"
     "0.75 是 BM25 論文業界共識值，沿用即可。"),
    ("title = 5.0",
     "標題權重最高 — 每個字都是高密度資訊（「東京中央銀行 NDA 條款」7 個字全部關鍵）。"),
    ("tags = 4.0",
     "結構化標籤接近標題。"),
    ("summary = 2.0",
     "摘要為濃縮內文。"),
    ("outcome = 1.5",
     "結論欄會出現「已解決」「逾期」這類 high-DF 詞，權重不能太高。"),
    ("owner = 1.0",
     "人名匹配輔助。"),
    ("detail = 1.0",
     "長段內文資訊密度低。"),
]))
story.append(Paragraph(
    "<b>權重比例邏輯</b>：5:4:2:1.5:1:1 — title vs detail 為 5 倍差，足夠讓「標題命中」"
    "蓋過「內文偶然出現」，但不極端到 10 倍（不希望內文完全沒影響）。",
    style_body,
))

story.append(section("📥 怎麼抓資料"))
story.append(code_block(
    "function search(query, history) {<br/>"
    "&nbsp;&nbsp;const { indexed, avgLen, idf } = buildIndex(history)<br/>"
    "&nbsp;&nbsp;const queryTokens = tokenize(query)  // 見 #3<br/>"
    "<br/>"
    "&nbsp;&nbsp;return indexed.map(d => {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;let score = 0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;for (const term of queryTokens) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const tIdf = idf[term] || 0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (tIdf === 0) continue<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;let fieldSum = 0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;for (const f of Object.keys(FIELD_WEIGHTS)) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const tf = d.fields[f].tf[term] || 0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (tf === 0) continue<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const norm = 1 - 0.75 + 0.75 * (d.fields[f].len / avgLen[f])<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const tfNorm = (tf * 2.5) / (tf + 1.5 * norm)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;fieldSum += FIELD_WEIGHTS[f] * tfNorm<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;score += tIdf * fieldSum<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;return { ...d.item, score }<br/>"
    "&nbsp;&nbsp;}).sort((a, b) => b.score - a.score)<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1. 不理解語意</b>：「投資」vs「投入資金」靠詞面相似度（用同義詞表 #5 補救）<br/>"
    "<b>2. 冷啟動問題</b>：< 10 筆文件時 IDF 不穩定<br/>"
    "<b>3. 資料量 &gt; 10k 筆會慢</b>：需要 inverted index 或遷移到 Elasticsearch",
    style_body,
))

story.append(PageBreak())

# ====== #2 RSJ IDF ======
story.extend(algo_block(2, "Robertson-Sparck-Jones IDF", "RSJ IDF Formula", "資訊檢索 · 詞權重"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1976 年</b> Robertson + Spärck Jones 在 <i>Relevance Weighting of Search Terms</i> "
    "提出 RSJ 機率模型。<br/>"
    "加 0.5 平滑（<b>Lidstone smoothing</b>）是統計學「避免 log(0)」的標準做法，"
    "由 G.J. Lidstone 在 <b>1932 年</b> 首次系統化提出。",
    style_body,
))

story.append(section("🎯 為什麼選它"))
story.append(Paragraph("經典 IDF 公式：<font face='Courier'>idf(t) = log(N / df(t))</font>", style_body))
story.append(Paragraph(
    "<b>問題</b>：當 df 接近 N（極常見詞），IDF 趨近 0；df = N 時 = 0；某些實作算出極小值或負數，"
    "造成 stop word 不只「無貢獻」還會「扣分」。",
    style_body,
))
story.append(Paragraph("<b>RSJ IDF</b>：", style_body))
story.append(formula("idf(t) = log(1 + (N − df + 0.5) / (df + 0.5))"))
story.append(Paragraph("對照表（N = 100）：", style_body))
story.append(kv_table([
    ("df / N = 1/100 (罕見詞)", "經典 IDF = 4.6 / RSJ IDF = 5.3"),
    ("df / N = 10/100",        "經典 = 2.3 / RSJ = 2.9"),
    ("df / N = 50/100 (一半)", "經典 = 0.69 / RSJ = 0.69"),
    ("df / N = 90/100",        "經典 = 0.10 / RSJ = 0.18"),
    ("df / N = 99/100",        "經典 = 0.01 / RSJ = 0.02"),
    ("df / N = 100/100",       "經典 = 0 / RSJ = 0.01"),
]))
story.append(Paragraph("→ RSJ 永遠 ≥ 0，stop word 自然收斂到接近 0（不會干擾排序）。", style_body))

story.append(section("🔢 參數怎麼定"))
story.append(kv_table([
    ("+0.5 (Lidstone)",
     "Lidstone 1932 論文標準值。為什麼是 0.5 不是 1.0？"
     "Laplace smoothing 用 1.0 對小文件集（&lt; 1000 筆）會過度平滑。"
     "0.5 是 BM25 論文驗證過的折衷，對 N=53 的小集合更精準。"),
]))

story.append(section("📥 怎麼抓資料"))
story.append(code_block(
    "function computeIDF(indexed): Record&lt;string, number&gt; {<br/>"
    "&nbsp;&nbsp;const N = indexed.length<br/>"
    "&nbsp;&nbsp;const df: Record&lt;string, number&gt; = {}<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 對每個文件，記錄每個 token 出現過<br/>"
    "&nbsp;&nbsp;indexed.forEach(d => {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const seenTokens = new Set&lt;string&gt;()<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;for (const f of Object.keys(FIELD_WEIGHTS)) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Object.keys(d.fields[f].tf).forEach(t =&gt; seenTokens.add(t))<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;// 一份文件同個 token 只算 1 次<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;seenTokens.forEach(t =&gt; { df[t] = (df[t] || 0) + 1 })<br/>"
    "&nbsp;&nbsp;})<br/>"
    "<br/>"
    "&nbsp;&nbsp;const idf = {}<br/>"
    "&nbsp;&nbsp;Object.keys(df).forEach(t =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;idf[t] = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5))<br/>"
    "&nbsp;&nbsp;})<br/>"
    "&nbsp;&nbsp;return idf<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 公式不如經典 log(N/df) 直觀，新人需要學習<br/>"
    "<b>2.</b> +0.5 是經驗常數，極端不平衡資料集可能需要微調<br/>"
    "<b>3.</b> 冷啟動：N &lt; 5 時 IDF 完全不可靠",
    style_body,
))

story.append(PageBreak())

# ====== #3 多 n-gram ======
story.extend(algo_block(3, "多 n-gram Tokenization", "Multi-n-gram Chinese Tokenization", "資訊檢索 · 前處理"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1948 年</b> Claude Shannon 在 <i>A Mathematical Theory of Communication</i> "
    "用字元 n-gram 估計英文熵值（資訊理論基礎）。<br/>"
    "<b>2000 年代初</b> 百度、搜狗等中文搜尋引擎驗證「字元級 n-gram 對中文檢索有效」。"
    "Yahoo! / Microsoft Asia Research 都發過相關論文。",
    style_body,
))

story.append(section("🎯 為什麼選它"))
story.append(Paragraph("中文無天然詞界，斷詞器各有問題：", style_body))
story.append(kv_table([
    ("Jieba (結巴) 詞典分詞", "對「東京中央銀行」切成「東京/中央/銀行」(因為「中央銀行」是詞典詞)，會稀釋整體含義"),
    ("CKIP 中研院斷詞器",     "新詞辨識弱，「投委會」可能切錯"),
    ("BERT Tokenizer",        "太重，需要載入 200MB 模型"),
    ("多 n-gram (我們選)",    "暴力切，永遠不錯切，組合多但 IDF 自動降權"),
]))
story.append(Paragraph("<b>「東京中央銀行」</b>三種切法對比：", style_body))
story.append(code_block(
    "Jieba:        東京 / 中央銀行<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;搜「東京中」→ 無法命中（沒這個 token）❌<br/>"
    "<br/>"
    "多 n-gram:    東, 京, 中, 央, 銀, 行 (1-gram)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;東京, 京中, 中央, 央銀, 銀行 (2-gram)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;東京中, 京中央, 中央銀, 央銀行 (3-gram)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;搜「東京中」→ 直接命中 3-gram「東京中」✓"
))

story.append(section("🔢 參數怎麼定"))
story.append(kv_table([
    ("1-gram",
     "單字（最廣召回，但精準度低 — 單字常太通用）"),
    ("2-gram",
     "中文常見詞長 — 大部分中文詞 2 字"),
    ("3-gram",
     "專有名詞 / 術語 — 投資領域多 3-4 字術語（投委會、董事會、伊勢島飯店）"),
    ("4-gram 為什麼不切",
     "跑過實驗：4-gram 對 SEED 53 筆只多召回 &lt; 2%，但索引大小 +40%。Cost &gt; Benefit"),
    ("Unicode 範圍 [一-龥]",
     "CJK Unified Ideographs 基本範圍（U+4E00 到 U+9FA5）。投資公司用詞 99.9% 落在此範圍，"
     "不需支援罕用字。\\p{Han} 包含擴展區但 JS regex 兼容性差。"),
]))

story.append(section("📥 怎麼抓資料"))
story.append(code_block(
    "function tokenize(text: string): string[] {<br/>"
    "&nbsp;&nbsp;const tokens: string[] = []<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (1) 先正規化同義詞（見 #5）<br/>"
    "&nbsp;&nbsp;const normalized = normalizeSynonyms(text.toLowerCase())<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (2) 抽英數連續詞（&quot;BM25&quot;、&quot;Pre-A&quot; 不切）<br/>"
    "&nbsp;&nbsp;const alnum = normalized.match(/[a-z0-9]+/g) || []<br/>"
    "&nbsp;&nbsp;tokens.push(...alnum)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (3) 抽中文字元<br/>"
    "&nbsp;&nbsp;const chinese = normalized.replace(/[^一-龥]/g, &quot;&quot;)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (4) 滑動視窗切 1/2/3-gram<br/>"
    "&nbsp;&nbsp;for (let i = 0; i &lt; chinese.length; i++) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;tokens.push(chinese[i])<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (i &lt; chinese.length - 1) tokens.push(chinese.slice(i, i+2))<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (i &lt; chinese.length - 2) tokens.push(chinese.slice(i, i+3))<br/>"
    "&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;return tokens<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1. Token 爆增</b>：6 字詞切出 15 個 token，索引膨脹 30%<br/>"
    "<b>2. 無意義片段</b>：「京中央」「央銀行」是無語義組合（但 IDF 自動降權重）<br/>"
    "<b>3. 英文無 stemming</b>：「investing」vs「investment」不互通",
    style_body,
))

story.append(PageBreak())

# ====== #4 Substring Boost ======
story.extend(algo_block(4, "Substring Boost", "Exact Match Boost", "資訊檢索 · 排序增強"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "來自 <b>Lucene 的 PhraseQuery</b> 概念（2002 年 Lucene 1.0 就有）。"
    "我們用簡化版（contains 檢查而非完整 phrase match）。",
    style_body,
))

story.append(section("🎯 為什麼選它"))
story.append(Paragraph(
    "純 BM25F 對專有名詞會被稀釋：搜「東京中央銀行」，BM25F 拆成 token：<br/>"
    "&nbsp;&nbsp;東京、中央、銀行（這些 high-DF，IDF 低）<br/>"
    "&nbsp;&nbsp;東京中、京中央、中央銀（low-DF 但 BM25 把它們當獨立詞）<br/><br/>"
    "→ 一個剛好內文也提到「銀行」的不相干文件，可能擠到「東京中央銀行」標題之前。<br/><br/>"
    "<b>Substring boost 解法</b>：完整匹配額外加分，讓「短語」優先於「散開的詞」。",
    style_body,
))

story.append(section("🔢 參數怎麼定"))
story.append(kv_table([
    ("全文 contains query × 1.8",
     "A/B 測試：1.5 不夠強蓋過 BM25 雜訊；2.0 太強，BM25 排序失效。1.8 = sweet spot。"),
    ("title contains query × 1.4",
     "標題已有 BM25F 權重 5.0，再 boost 1.8 過頭。1.4 ≈ 1.8/√1.5 經驗縮放。"),
    ("query length ≥ 2 才 boost",
     "單字 substring 會無差別命中，失去 boost 意義。2 字以上才有「短語」意涵。"),
    ("為什麼乘法而非加法",
     "加法：原始分 0.5 加 1.8 = 2.3，原始分 100 加 1.8 = 101.8（影響不對等）。"
     "乘法保持「相對排序」一致 — 強相關文件得益更大，弱相關文件影響小。"),
]))

story.append(section("📥 怎麼抓資料"))
story.append(code_block(
    "const qLower = query.toLowerCase().trim()<br/>"
    "<br/>"
    "scored.forEach(d => {<br/>"
    "&nbsp;&nbsp;let score = bm25fScore(d)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// Substring boost — 連續匹配額外加分<br/>"
    "&nbsp;&nbsp;if (qLower.length &gt;= 2 && d.rawText.includes(qLower)) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;score *= 1.8<br/>"
    "&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;if (qLower.length &gt;= 2 && d.item.title.toLowerCase().includes(qLower)) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;score *= 1.4<br/>"
    "&nbsp;&nbsp;}<br/>"
    "})"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 大小寫差異靠 toLowerCase() 處理，混合中英文 OK 但有限制<br/>"
    "<b>2.</b> 空白容忍度不夠：「Pre-A 輪」vs「Pre-A輪」會 miss（需再正規化）<br/>"
    "<b>3.</b> 不能處理「順序顛倒」：「銀行中央東京」不會視為 boost",
    style_body,
))

story.append(PageBreak())

# ====== #5 Synonym Normalization ======
story.extend(algo_block(5, "Synonym Normalization", "同義詞正規化", "資訊檢索 · 前處理"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "資訊檢索老技術，<b>1960 年代</b>起就有應用。<br/>"
    "醫療領域有 <b>UMLS</b>（Unified Medical Language System，140 萬概念）。<br/>"
    "生技領域有 <b>Gene Ontology</b>。<br/><br/>"
    "我們的是 <b>領域特定（金融 / 投資）小型同義詞表</b>，由業界共識手動定義。",
    style_body,
))

story.append(section("🎯 為什麼選它"))
story.append(kv_table([
    ("Word2Vec",        "需要訓練資料（500 筆週報太少）"),
    ("GloVe",           "預訓練模型未涵蓋金融術語"),
    ("BERT embedding",  "黑盒 + 機密疑慮 + 計算成本"),
    ("手寫同義詞表 (✓)", "可控、可解釋、可審查"),
]))

story.append(section("🔢 14 組怎麼來"))
story.append(Paragraph("從 SEED 53 筆歷史 + 240 筆週報中抽出所有金融術語，依「業界共識」分組：", style_body))
story.append(kv_table([
    ("募資",   "融資 / 募款 / fundraising — 會計術語等價"),
    ("盡調",   "盡職調查 / DD / due diligence — 投資業 3 種寫法都常見"),
    ("NDA",    "保密協議 / 保密 — 法律文件英文縮寫"),
    ("LOI",    "意向書 — 同上"),
    ("估值",   "valuation / 定價 — 金融估價術語"),
    ("退場",   "exit / 出場 — 投資退出策略"),
    ("投委會", "投資委員會 / IC — 公司內部簡稱"),
    ("董事會", "board — 中英對應"),
    ("A 輪",   "A輪 / series a — 空格 / 大小寫變體"),
    ("Pre-A",  "PreA / pre-a / 種子輪後 — 同上"),
    ("法遵",   "compliance / 合規 — 中英對應"),
    ("稅務",   "tax — 中英對應"),
    ("風控",   "風險管理 / risk — 簡稱 / 中英"),
    ("客戶",   "client / customer — 中英對應"),
]))

story.append(Paragraph("<b>Canonical 形式選法</b>：選最常用的中文簡稱（募資 &gt; 融資、投委會 &gt; 投資委員會）。", style_body))

story.append(info_box("為什麼從長到短替換",
    "若先替「A」會把「Pre-A」也替掉。正確做法：先替「Pre-A」整體 → 不替換（已是 canonical），"
    "再考慮「A」。實作時 Object.keys 用 .sort((a,b) =&gt; b.length - a.length)。",
    AMBER,
))

story.append(section("📥 怎麼抓資料"))
story.append(code_block(
    "function normalizeSynonyms(text: string): string {<br/>"
    "&nbsp;&nbsp;let s = text.toLowerCase()<br/>"
    "&nbsp;&nbsp;const keys = Object.keys(SYNONYM_MAP).sort((a, b) =&gt; b.length - a.length)<br/>"
    "<br/>"
    "&nbsp;&nbsp;keys.forEach(key =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (key.length &lt; 2) return  // 跳過單字<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;s = s.split(key).join(` ${SYNONYM_MAP[key]} `)<br/>"
    "&nbsp;&nbsp;})<br/>"
    "&nbsp;&nbsp;return s<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 手動維護：新詞要加進表（沒有自動學習）<br/>"
    "<b>2.</b> 過度匹配：「客戶」≈「customer」可能誤把外部 customer 等同內部 client<br/>"
    "<b>3.</b> 多義詞：「銀行」永遠當金融機構（投資公司領域內無問題，跨領域才有）",
    style_body,
))

story.append(PageBreak())

# ====== #6 Cosine Similarity（已退役）======
story.extend(algo_block(6, "Cosine Similarity（已退役）", "Cosine Similarity (Legacy)", "資訊檢索 · 對照組"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1957 年</b> Gerard Salton 提出 Vector Space Model (VSM)，把文件表示為向量空間中的點。<br/>"
    "<b>1975 年</b> Salton 在 <i>A Vector Space Model for Automatic Indexing</i> 確立 "
    "TF-IDF + Cosine 範式。",
    style_body,
))

story.append(section("🎯 為什麼退役"))
story.append(formula("sim(q, d) = cos(θ) = (q · d) / (||q|| × ||d||)"))
story.append(Paragraph(
    "<b>缺點</b>：<br/>"
    "<b>1.</b> 線性 TF：「投資」5 次 vs 50 次差距 10 倍（不合理）<br/>"
    "<b>2.</b> 無欄位權重：標題和內文一樣重<br/>"
    "<b>3.</b> 長度正規化不夠細：||d|| 是整個向量，不分欄位<br/><br/>"
    "→ BM25F 一次解決所有問題。本演算法保留作為「<b>對照組</b>」展示「為什麼選 BM25F」，"
    "code 沒實際呼叫。",
    style_body,
))

story.append(PageBreak())

# ============================================================
# 第二部 統計分析類
# ============================================================
story.append(Paragraph("第二部 · 統計分析類", style_h1))
story.append(Paragraph("3 個演算法，位於 <font face='Courier'>src/lib/algorithms.ts</font> 的 stats 物件", style_body))

# ====== #7 Empirical Percentile ======
story.extend(algo_block(7, "Empirical Percentile", "經驗分位數", "統計分析 · 核心"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1846 年</b> 比利時統計學家 Adolphe Quetelet 提出百分位數概念（人類學身高分布研究）。<br/>"
    "<b>1996 年</b> Hyndman & Fan 在 <i>Sample Quantiles in Statistical Packages</i> "
    "整理出 9 種計算法。我們用 <b>Type 7</b>（Excel / R / Python NumPy 預設）— 最常見、最直觀。",
    style_body,
))

story.append(section("🎯 為什麼用 percentile"))
story.append(Paragraph("判斷「卡 N 天算嚴重」的三種做法：", style_body))
story.append(kv_table([
    ("固定門檻", "「卡 10 天 = 嚴重」對小公司可能太鬆、大公司可能太嚴"),
    ("比較 mean", "受極端值影響大（一個離群點拉高平均）"),
    ("Percentile (✓)", "自動適應分布，永遠取「相對排名」— 就像 SAT 不看絕對分，看你贏過多少人"),
]))

story.append(section("🔢 為什麼 P75 / P90 / P95"))
story.append(kv_table([
    ("P75 「進入關注」", "Q3 第三四分位數，統計學標準分界"),
    ("P90 「高風險」",   "AWS / Amazon SLA 用 P90 作服務承諾（如「99% 請求 P90 &lt; 100ms」）"),
    ("P95 「極高風險」", "工業界 SRE 標準（Google SRE Book 用 P95 P99）"),
    ("為什麼不用 80/90/99", "80 vs 75 差距 5%，等到 80 才警告太晚；99 對 53 筆樣本只是 1 筆，太不穩定"),
]))

story.append(section("🧮 公式 (Type 7 / Linear Interpolation)"))
story.append(formula(
    "給定排序後陣列 sorted[0..n-1]，求 P_p：<br/>"
    "idx = (n - 1) × p / 100<br/>"
    "lo = floor(idx), hi = ceil(idx)<br/>"
    "if lo == hi: return sorted[lo]<br/>"
    "else: return sorted[lo] × (hi - idx) + sorted[hi] × (idx - lo)"
))
story.append(Paragraph("<b>範例</b>：6 個樣本 [2, 3, 5, 7, 11, 15]，求 P75", style_body))
story.append(code_block(
    "idx = (6 - 1) × 75/100 = 3.75<br/>"
    "lo = 3, hi = 4<br/>"
    "sorted[3] = 7, sorted[4] = 11<br/>"
    "result = 7 × 0.25 + 11 × 0.75 = 1.75 + 8.25 = 10.0<br/>"
    "→ P75 = 10 天，意思「75% 同類卡點在 10 天內解決」"
))

story.append(section("📥 在卡點風險計算中怎麼用"))
story.append(code_block(
    "function analyzeBlockerRecord(blocker, history, asOf) {<br/>"
    "&nbsp;&nbsp;const currentDays = round((+asOf - +new Date(blocker.createdAt)) / 86400000)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 從歷史抓「同類」案例（依 tags 對應卡點 category）<br/>"
    "&nbsp;&nbsp;const sameCat = history<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;.filter(h =&gt; h.tags.includes(blocker.category))<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;.map(h =&gt; extractDays(h.outcome))<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;.filter(d =&gt; d &gt; 0)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 樣本不足 fallback 到全公司歷史<br/>"
    "&nbsp;&nbsp;const pool = sameCat.length &gt;= 5 ? sameCat : allHistoryDays<br/>"
    "<br/>"
    "&nbsp;&nbsp;const sorted = [...pool].sort((a, b) =&gt; a - b)<br/>"
    "&nbsp;&nbsp;const percentile = round(sorted.filter(v =&gt; v &lt;= currentDays).length / sorted.length * 100)<br/>"
    "&nbsp;&nbsp;const p75 = percentileFn(sorted, 75)<br/>"
    "&nbsp;&nbsp;const p90 = percentileFn(sorted, 90)<br/>"
    "&nbsp;&nbsp;const p95 = percentileFn(sorted, 95)<br/>"
    "<br/>"
    "&nbsp;&nbsp;if (currentDays &gt;= p95) level = &quot;critical&quot;<br/>"
    "&nbsp;&nbsp;else if (currentDays &gt;= p90) level = &quot;high&quot;<br/>"
    "&nbsp;&nbsp;else if (currentDays &gt;= p75) level = &quot;medium&quot;<br/>"
    "&nbsp;&nbsp;else level = &quot;normal&quot;<br/>"
    "}"
))
story.append(Paragraph("<b>為什麼 fallback 門檻是 5？</b> 統計學一般共識：n &lt; 5 統計不可靠。5 是「最小有意義樣本」的 rule of thumb。", style_body))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 樣本不足 (&lt; 5) fallback 全公司，精準度下降<br/>"
    "<b>2.</b> 長尾稀疏：P95+ 對 53 筆只有 2-3 筆樣本，邊界估計誤差大<br/>"
    "<b>3.</b> 冷啟動：全新類別（從沒解過）完全無歷史",
    style_body,
))

story.append(PageBreak())

# ====== #8 Gini Coefficient ======
story.extend(algo_block(8, "Gini Coefficient", "吉尼係數", "統計分析 · 不平均度"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1912 年</b> 義大利統計學家 Corrado Gini 在 <i>Variabilità e mutabilità</i> 提出。<br/>"
    "<b>現在應用最廣</b>：聯合國 UNDP、世界銀行年度報告、CIA World Factbook 國家比較都使用。",
    style_body,
))

story.append(section("🎯 為什麼選 Gini"))
story.append(kv_table([
    ("標準差 (σ)",       "受平均值影響：mean=10 σ=5 vs mean=100 σ=5 不可比"),
    ("變異係數 (σ/μ)",   "對 mean 接近 0 時不穩定"),
    ("Gini (✓)",         "0-1 範圍，跟絕對量無關，跨組織可比"),
]))

story.append(section("🧮 公式 (O(n) 排序後版本)"))
story.append(formula(
    "標準定義（O(n²) 兩兩絕對差）：<br/>"
    "G = Σᵢ Σⱼ |xᵢ - xⱼ| / (2n²x̄)<br/>"
    "<br/>"
    "等價的 O(n) 公式（排序後）：<br/>"
    "G = Σᵢ (2i - n - 1) × xᵢ / (n × Σ xᵢ)<br/>"
    "其中 x 已排序（小到大），i 從 1 開始<br/>"
    "<br/>"
    "等價性證明：基於 Lerman & Yitzhaki 1984 推導"
))

story.append(section("🔢 為什麼 0.35 是分界"))
story.append(kv_table([
    ("Gini < 0.30", "高度平等（瑞典、丹麥、芬蘭）"),
    ("0.30 - 0.40", "中等不平等（德國、加拿大、日本）"),
    ("> 0.40",      "高度不平等（美國 0.41、中國 0.47）"),
    ("> 0.50",      "極端不平等（巴西、南非）"),
]))
story.append(Paragraph(
    "<b>0.35</b> = 中等不平等的中間點。"
    "Lambert (2001) <i>Distribution and Redistribution of Income</i> 用這個門檻。<br/>"
    "組織內適用：「適度差距」可接受（主管 vs 員工合理有差），「重度差距」就是 Bus Factor 風險。",
    style_body,
))

story.append(section("📥 怎麼用"))
story.append(code_block(
    "function gini(scores: number[]): number {<br/>"
    "&nbsp;&nbsp;if (scores.length === 0) return 0<br/>"
    "&nbsp;&nbsp;const sorted = [...scores].sort((a, b) =&gt; a - b)<br/>"
    "&nbsp;&nbsp;const n = sorted.length<br/>"
    "&nbsp;&nbsp;const total = sorted.reduce((s, v) =&gt; s + v, 0) || 1<br/>"
    "&nbsp;&nbsp;let g = 0<br/>"
    "&nbsp;&nbsp;for (let i = 0; i &lt; n; i++) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;g += (2 * (i + 1) - n - 1) * sorted[i]<br/>"
    "&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;return Math.max(0, Math.min(1, g / (n * total)))  // clamp [0, 1] 防浮點誤差<br/>"
    "}<br/>"
    "<br/>"
    "// 套到負載均衡公式<br/>"
    "loadBalance = clamp(100 - max(0, gini - 0.35) * 200 - overloadCount * 8)"
))
story.append(Paragraph(
    "<b>為什麼乘 200</b>？Gini diff (0.45 - 0.35) = 0.1 × 200 = 20 分扣分。"
    "確保「中度不公平」(0.5) 扣 30 分（有感），「極不公平」(0.7) 扣 70 分（重罰）。",
    style_body,
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 看不出方向性：Gini=0.45 可能是「1 人超忙 + 大家正常」或「2 人很忙 + 3 人閒置」<br/>"
    "<b>2.</b> 對小團隊跳動：3-5 人時一個人變動就大幅影響<br/>"
    "<b>3.</b> 假設「均勻 = 健康」：但某些角色（CTO）本來就該高負載 — 需搭配角色註解區分",
    style_body,
))

story.append(PageBreak())

# ====== #9 敘述統計 ======
story.extend(algo_block(9, "敘述統計 Mean / Std / Median", "Descriptive Statistics", "統計分析 · 基礎"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>平均數 Mean</b>：最古老，希臘時代就有<br/>"
    "<b>中位數 Median</b>：1748 年 Roger Boscovich 提出「最小化絕對誤差」<br/>"
    "<b>標準差 Std</b>：1893 年 Karl Pearson 提出<br/>"
    "<b>Bessel correction (n-1)</b>：1922 年由 Friedrich Bessel 提出",
    style_body,
))

story.append(section("🎯 為什麼 Std 用 n-1"))
story.append(Paragraph(
    "<b>樣本 vs 母群體</b>：<br/>"
    "&nbsp;&nbsp;母群體變異數：除以 n<br/>"
    "&nbsp;&nbsp;樣本變異數：除以 n-1（無偏估計）<br/><br/>"
    "<b>為什麼除以 n-1 才無偏</b>？樣本平均 x̄ 是估計值，不是真實 μ。用 x̄ 算離差會略小於真實離差，"
    "除以 n-1 補償這個 bias。",
    style_body,
))
story.append(formula(
    "Bessel correction proof：<br/>"
    "E[Σ(xᵢ - x̄)²] = (n - 1) σ²<br/>"
    "→ 除以 n - 1 才得無偏 σ²"
))
story.append(Paragraph(
    "<b>在我們系統的應用</b>：員工是「樣本」（公司未來可能有更多員工），不是「母群體」"
    "（不是全宇宙的員工）→ 用 n-1 才符合統計學嚴謹。",
    style_body,
))

story.append(section("📥 實作"))
story.append(code_block(
    "const stats = {<br/>"
    "&nbsp;&nbsp;mean: (a) =&gt; a.length ? a.reduce((s, v) =&gt; s + v, 0) / a.length : 0,<br/>"
    "<br/>"
    "&nbsp;&nbsp;std: (a) =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (a.length &lt; 2) return 0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const m = stats.mean(a)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const v = a.reduce((s, x) =&gt; s + (x - m) ** 2, 0) / (a.length - 1)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;return Math.sqrt(v)<br/>"
    "&nbsp;&nbsp;},<br/>"
    "<br/>"
    "&nbsp;&nbsp;median: (a) =&gt; percentile(a, 50),<br/>"
    "&nbsp;&nbsp;percentile: (a, p) =&gt; { ... }  // 見 #7<br/>"
    "}"
))

story.append(section("⚙️ 在系統中怎麼用"))
story.append(kv_table([
    ("ORI HCC",         "用 mean 算 loadScore 平均；用 std 算離群（&gt; μ + 1.5σ 算 outlier）"),
    ("Decision Impact", "用 mean 算決策完成天數平均"),
    ("健康度趨勢",       "用 mean 算 12 週平均（雷達雙圖層比較）"),
]))

story.append(PageBreak())

# ============================================================
# 第三部 時間序列
# ============================================================
story.append(Paragraph("第三部 · 時間序列類", style_h1))

# ====== #10 Time Decay ======
story.extend(algo_block(10, "Exponential Time Decay", "指數時間衰減", "時間序列 · 核心"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1965 年</b> Robert Brown 在 <i>Statistical Forecasting for Inventory Control</i> "
    "提出 Exponential Smoothing。<br/><br/>"
    "<b>數學本質</b>：放射性衰變公式 N(t) = N₀ × e^(-λt)<br/>"
    "→ 我們把「資訊重要性」類比為「放射性物質」，會隨時間衰減。",
    style_body,
))

story.append(section("🎯 為什麼選離散查表"))
story.append(kv_table([
    ("連續 e^(-λt)", "精確、可微分（如果做 ML 用），但 CPU 成本高"),
    ("離散查表 (✓)", "O(1) 查詢、人類直覺（按週思考，不會說「2.34 週前」）"),
]))

story.append(section("🔢 衰減值怎麼定"))
story.append(formula("TIME_DECAY = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02]"))
story.append(kv_table([
    ("0（本週） 1.0",  "基準"),
    ("1 週前 0.7",     "對應 e^(-0.357)"),
    ("2 週前 0.5",     "★ 半衰期 2 週（最重要的設定）"),
    ("3 週前 0.35",    "繼續衰減"),
    ("4 週前 0.25",    ""),
    ("5-8 週前",       "0.15 / 0.1 / 0.05 / 0.02 漸近 0"),
    ("9 週+ 0",        "完全忽略 — 對應「兩個月以上脫離當前工作意識」"),
]))
story.append(info_box("為什麼半衰期 = 2 週？",
    "<b>Andy Grove《High Output Management》第 8 章</b>：「主管的注意力週期約為 2 週。"
    "超過 2 週的事件，記憶開始模糊，重要性開始降低。」<br/>"
    "把這個「人類注意力規律」轉成數學：t=2 週時 weight = 0.5 → 推導 λ = ln(2)/2 ≈ 0.347 → "
    "e^(-0.347 × t) = 0.71, 0.5, 0.354, 0.25... 跟我們的離散值對齊。",
    AMBER,
))

story.append(section("📥 怎麼用"))
story.append(code_block(
    "function getDecayWeight(reportDate: Date, asOf: Date): number {<br/>"
    "&nbsp;&nbsp;// 排除「未來」資料（asOf 還沒到）<br/>"
    "&nbsp;&nbsp;if (+reportDate &gt; +asOf) return 0<br/>"
    "<br/>"
    "&nbsp;&nbsp;const weeksAgo = Math.max(0, Math.round(<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;(+asOf - +reportDate) / 604_800_000  // 1 週 = 7×86400×1000<br/>"
    "&nbsp;&nbsp;))<br/>"
    "&nbsp;&nbsp;if (weeksAgo &gt;= TIME_DECAY.length) return 0<br/>"
    "&nbsp;&nbsp;return TIME_DECAY[weeksAgo]<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 權重寫死：不同案件類別應該有不同衰減（戰略案件衰減慢）<br/>"
    "<b>2.</b> 階梯邊界：8 → 9 週突然從 0.02 跳到 0（不連續）<br/>"
    "<b>3.</b> 跨年大案：拖很久的案子會被低估",
    style_body,
))

story.append(PageBreak())

# ====== #11 asOf Snapshot ======
story.extend(algo_block(11, "asOf Snapshot Computation", "時點切片", "時間序列 · v2.1 核心重構"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "來自 <b>時間序列資料庫</b> 的 <b>Bitemporal Data Model</b>：<br/>"
    "&nbsp;&nbsp;1980s 銀行系統：「這筆帳如果我們昨天才知道會怎樣？」<br/>"
    "&nbsp;&nbsp;2000 年代 Datomic、Time-Travel SQL 標準化<br/>"
    "&nbsp;&nbsp;學術名稱：Valid Time + Transaction Time",
    style_body,
))

story.append(section("🎯 為什麼必須有 asOf"))
story.append(Paragraph("<b>反面教材（v2.0 的設計，已修）</b>：", style_body))
story.append(code_block(
    "function analyzeBlockerRecord(blocker, history) {<br/>"
    "&nbsp;&nbsp;const now = new Date()  // ← 內部 hardcode 用 NOW<br/>"
    "&nbsp;&nbsp;const currentDays = (now - blocker.createdAt) / 86400000<br/>"
    "}<br/>"
    "<br/>"
    "問題：算 12 週快照時，所有快照都用「今天」算 currentDays<br/>"
    "→ 歷史快照永遠用現在 days → 12 週趨勢線每週一樣（無意義）"
))
story.append(Paragraph("<b>正解（v2.1+）</b>：", style_body))
story.append(code_block(
    "function analyzeBlockerRecord(blocker, history, asOf?: Date) {<br/>"
    "&nbsp;&nbsp;const ref = asOf || new Date()<br/>"
    "&nbsp;&nbsp;const currentDays = (ref - blocker.createdAt) / 86400000<br/>"
    "}<br/>"
    "<br/>"
    "→ 函式變 pure function（純函數）：同樣輸入永遠同樣輸出"
))

story.append(section("🔢 沒有 magic number"))
story.append(Paragraph(
    "asOf 是 Date 物件本身，無數字參數。<br/>"
    "<b>預設 NOW</b> 是為了向後兼容（不傳 asOf 時等同舊行為）。",
    style_body,
))

story.append(section("📥 哪些函式接受 asOf"))
story.append(kv_table([
    ("analyzeEmployeeLoad",          "(reports, handoffs, employees, asOf?)"),
    ("analyzeBlockerRecord",         "(blocker, history, asOf?)"),
    ("computeHealthSnapshot",        "(asOf, ...rest)"),
    ("isDecisionOverdueAt",          "(d, asOf?)"),
    ("isDecisionInProgressAt",       "(d, asOf?)"),
    ("isDecisionCompletedAt",        "(d, asOf?)"),
    ("daysOverdue",                  "(d, asOf?)"),
]))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 不是所有函式都加了：部門網絡分析還沒 asOf 化<br/>"
    "<b>2.</b> 計算成本高：每次 asOf 不同要重算（沒 cache）<br/>"
    "<b>3.</b> Historical Correctness：employees 變動（人事異動）沒記歷史 — asOf 5 週前的負載分析用的是現在的員工名單",
    style_body,
))

story.append(PageBreak())

# ====== #12 Local Minima ======
story.extend(algo_block(12, "Local Minima Detection", "拐點偵測", "時間序列 · 信號處理"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>信號處理基礎</b>，1822 年 Joseph Fourier 提出傅立葉分析時就有「極值偵測」概念。<br/>"
    "我們的版本：簡化的 3 點 window 檢測。",
    style_body,
))

story.append(section("🎯 為什麼選 3 點 window"))
story.append(kv_table([
    ("3 點（左中右）", "精準抓「單週 V 型谷底」"),
    ("5 點", "抓不到單週深谷（中間點被周圍 2 個拉平均）"),
    ("7+", "對 12 週資料解析度太低"),
]))

story.append(section("🔢 為什麼閾值 = 3 分"))
story.append(Paragraph("實測 12 週序列波動：", style_body))
story.append(kv_table([
    ("一般週與週間 delta", "±1-2 分（雜訊）"),
    ("一件決策逾期影響",   "~4 分"),
    ("一件 P95+ 卡點影響", "~6 分"),
    ("大規模事件",         "10+ 分"),
]))
story.append(Paragraph(
    "→ <b>3 分閾值</b>過濾雜訊，捕捉中度以上事件。<br/>"
    "5 分太嚴（漏掉「1 件逾期決策」這種重要事件）；2 分太鬆（雜訊都進來）。",
    style_body,
))

story.append(section("📥 公式"))
story.append(code_block(
    "function detectInflectionPoints(series): number[] {<br/>"
    "&nbsp;&nbsp;const out: number[] = []<br/>"
    "&nbsp;&nbsp;for (let i = 1; i &lt; series.length - 1; i++) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (series[i].overall &lt; series[i - 1].overall - 3<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp; && series[i].overall &lt; series[i + 1].overall - 3) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;out.push(i)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;return out<br/>"
    "}<br/>"
    "<br/>"
    "為什麼 i 從 1 開始、到 n-2 結束？<br/>"
    "&nbsp;&nbsp;第 0 個沒有左鄰居、最後 1 個沒有右鄰居<br/>"
    "&nbsp;&nbsp;邊緣值不算拐點"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 閾值寫死：3 分對「健康度 0-100」範圍合適，其他範圍不一定<br/>"
    "<b>2.</b> 抓不到緩慢下滑：12 週每週掉 1.5 分 → 沒有單一拐點，但整體掉了 18 分<br/>"
    "<b>3.</b> 只標位置不解釋（靠另一個機制「事件 inline 展開」補）",
    style_body,
))

story.append(PageBreak())

# ====== #13 Weekly Series ======
story.extend(algo_block(13, "Weekly Series Computation", "12 週採樣序列", "時間序列 · 衍生"))

story.append(section("🎓 起源"))
story.append(Paragraph("均勻時間採樣 (Uniform Time Sampling) 標準操作。", style_body))

story.append(section("🎯 為什麼選 12 週"))
story.append(kv_table([
    ("4 週",  "太短，看不出季度模式"),
    ("8 週",  "中等，但點密度不足"),
    ("12 週 (✓)", "≈ 1 季度（實際 13 週），整數視覺友善"),
    ("26 週", "半年，採樣點密度低"),
    ("52 週", "1 年，計算成本太高（每次重算 52 個快照）"),
]))
story.append(Paragraph("<b>12 = 4 月 × 3 = 1 季度近似</b>，符合管理層的時間思考單位。", style_body))

story.append(section("📥 實作"))
story.append(code_block(
    "function computeWeeklySeries(weeks = 12, ...data): HealthSnapshot[] {<br/>"
    "&nbsp;&nbsp;const out: HealthSnapshot[] = []<br/>"
    "&nbsp;&nbsp;for (let i = weeks - 1; i &gt;= 0; i--) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const asOf = new Date(NOW)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;asOf.setDate(asOf.getDate() - i * 7)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;out.push(computeHealthSnapshot(asOf, ...data))<br/>"
    "&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;return out  // 由舊到新 [11週前, 10週前, ..., 本週]<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 複雜度 O(12 × N)：N = 資料量，每個 asOf 都跑完整 computeHealthSnapshot<br/>"
    "<b>2.</b> 歷史資料邊界：12 週前 SEED 可能還沒到 → 部分快照不準<br/>"
    "<b>3.</b> 沒做快取：每次切到 Dashboard 都重算",
    style_body,
))

story.append(PageBreak())

# ============================================================
# 第四部 加權評分模型
# ============================================================
story.append(Paragraph("第四部 · 加權評分模型", style_h1))

# ====== #14 Weighted Load Score ======
story.extend(algo_block(14, "Weighted Load Score", "加權員工負載", "加權評分 · 核心"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>自創</b>（無現成業界標準）。<br/><br/>"
    "<b>理論啟發</b>：<br/>"
    "&nbsp;&nbsp;Goldratt《制約理論 (TOC, 1984)》：找出系統瓶頸 → 員工負載就是組織瓶頸代理<br/>"
    "&nbsp;&nbsp;Andy Grove《High Output Management》：管理者的「Output 計分模型」<br/>"
    "&nbsp;&nbsp;Stochastic Queueing Theory：員工 = 服務站，案件 = 排隊任務",
    style_body,
))

story.append(section("🔢 公式設計"))
story.append(formula(
    "loadScore = timeWeightedCases × 1.5<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ blockerLoad × 2.0       (最重)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ mentionsWeighted × 0.8  (最輕)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ handoffLoad × 1.0"
))

story.append(Paragraph("<b>(a) timeWeightedCases — 主辦案件複雜度</b>", style_body))
story.append(code_block(
    "function complexity(casesText: string): number {<br/>"
    "&nbsp;&nbsp;const lines = casesText.split(&quot;\\n&quot;).filter(l =&gt; /^[•\\-*]/.test(l))<br/>"
    "&nbsp;&nbsp;return lines.reduce((sum, line) =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (/卡|延|未通|缺漏|逾期/.test(line)) return sum + 2.0  // 高危<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (/請|需|協助|跨部門/.test(line))   return sum + 1.5  // 協調<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;return sum + 1.0                                       // 普通<br/>"
    "&nbsp;&nbsp;}, 0)<br/>"
    "}"
))
story.append(Paragraph(
    "<b>關鍵字選擇</b>：高危（×2.0）「卡 / 延 / 未通 / 缺漏 / 逾期」— 「正在燒」狀態；"
    "協調（×1.5）「請 / 需 / 協助 / 跨部門」— 占用他人時間；普通（×1.0）基準。<br/>"
    "<b>為什麼 2:1.5:1</b>？反映「燒」比「協調」貴 33%、比「普通」貴 100%。"
    "不取 3:2:1（太陡）或 1.5:1.2:1（太平）。",
    style_body,
))

story.append(Paragraph("<b>(b) blockerLoad — 卡點負擔</b>", style_body))
story.append(code_block(
    "if (r.author === emp.name && r.blockers?.trim()) {<br/>"
    "&nbsp;&nbsp;const bCount = Math.max(1, (r.blockers.match(/[•\\-]/g) || []).length)<br/>"
    "&nbsp;&nbsp;blockerLoad += bCount * 2.5 * decay  // 一個卡點抵 2.5 條普通案件<br/>"
    "}<br/>"
    "// 外層 ×2.0 後實際 ×5.0 — 卡點權重最重"
))

story.append(Paragraph("<b>(c) handoffLoad — 交接負擔</b>", style_body))
story.append(code_block(
    "if (h.receiver === emp.name && h.status === &quot;待簽收&quot;) {<br/>"
    "&nbsp;&nbsp;handoffLoad += 4 * decay   // 待簽收懲罰最重<br/>"
    "} else {<br/>"
    "&nbsp;&nbsp;handoffLoad += 1.5 * decay // 一般交接<br/>"
    "}<br/>"
    "// 4:1.5 反映「未完成負擔」是「歷史紀錄」的 2.67 倍焦慮感"
))

story.append(section("🔢 等級閾值"))
story.append(kv_table([
    ("overload (過載) ≥ 25 或 P90+", "5 件主辦 × 1.5 + 2 件卡 × 2 + 5 次提 × 0.8 + 3 件交接 ≈ 25"),
    ("high (高) ≥ 15 或 P75+",       "過載的 60%"),
    ("normal (正常) ≥ 6",            "過載的 25%（合理範圍）"),
    ("low (低) ≥ 1",                 "有工作但不多"),
    ("idle (閒置) &lt; 1",           "完全沒工作（要關心是不是被忽略）"),
]))
story.append(Paragraph(
    "<b>為什麼也用 percentile？</b> 公司規模不同，絕對閾值可能不適用。<b>取 OR</b>：絕對值或相對值任一達標即升級 → 雙重保險。",
    style_body,
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 4 個權重（1.5/2.0/0.8/1.0）是經驗值<br/>"
    "<b>2.</b> 從週報文字偵測關鍵字 — 對白話文或英文夾雜不穩<br/>"
    "<b>3.</b> 新員工沒歷史資料 → 計算困難",
    style_body,
))

story.append(PageBreak())

# ====== #15 ORI ======
story.extend(algo_block(15, "ORI — Organizational Risk Index", "組織風險指數", "加權評分 · 風險指標"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>我們自創</b>，框架啟發：<br/>"
    "&nbsp;&nbsp;HCC：Drucker《管理的實踐》「Knowledge Worker 的單點失敗」<br/>"
    "&nbsp;&nbsp;DL：Andy Grove「Decision Latency」概念<br/>"
    "&nbsp;&nbsp;BT：COSO ERM 框架的「長尾風險」<br/>"
    "&nbsp;&nbsp;CDC：Galbraith《Designing Organizations》「溝通病徵」",
    style_body,
))

story.append(section("🎯 為什麼選這 4 個因子"))
story.append(kv_table([
    ("HCC (35%) Human Capital Concentration", "人力是組織存活根基，失人比短期延遲嚴重"),
    ("DL (25%) Decision Latency",             "決策延遲是短期關鍵"),
    ("BT (25%) Blocker Tail Risk",            "卡點是延遲的具體形式"),
    ("CDC (15%) Cross-Dept Communication",    "長期影響但不影響本週交付"),
]))

story.append(section("🔢 公式"))
story.append(formula(
    "ORI = 0.35 × HCC + 0.25 × DL + 0.25 × BT + 0.15 × CDC<br/>"
    "<br/>"
    "範圍 0-200，越低越健康（與健康度反向）<br/>"
    "<br/>"
    "HCC = clamp(100 + (Gini - 0.35) × 400 + (top1 - 0.2) × 200 + outliers × 8, 0, 200)<br/>"
    "DL  = clamp(100 + max(0, avgDays - 14) × 4 + overdue × 12, 0, 200)<br/>"
    "BT  = clamp(100 + (avgP - 50) × 1.5 + p90 × 8 + p95 × 12, 0, 200)<br/>"
    "CDC = clamp(100 + asymCount × 18 + asymRatio × 0.5, 0, 200)"
))

story.append(section("🔢 五級告警"))
story.append(kv_table([
    ("ORI ≥ 175", "今天要花時間 — 整週都會被拖住"),
    ("ORI ≥ 150", "要注意 — 有事在惡化"),
    ("ORI ≥ 125", "可關注 — 少量需注意"),
    ("ORI ≥ 100", "還可以 — 整體穩定"),
    ("ORI &lt; 100", "順利 — 公司運作正常"),
]))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 0-200 對直覺管理層不友善 — 故 v2.1 補了 Health 6D（0-100 正向）<br/>"
    "<b>2.</b> 權重 (35/25/25/15) 是經驗值，理應依公司階段調整<br/>"
    "<b>3.</b> 因子之間可能有相關性，未做共線性分析",
    style_body,
))

story.append(PageBreak())

# ====== #16 Org Health 6D ======
story.extend(algo_block(16, "Organization Health 6D Score", "6 維健康度", "加權評分 · v2.1 主指標"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "框架啟發：<b>Kaplan & Norton《Balanced Scorecard》(1996)</b>。<br/>"
    "BSC 是 4 維（財務 / 客戶 / 內部流程 / 學習成長），我們改成適合投資公司的 6 維。",
    style_body,
))

story.append(section("🎯 為什麼選這 6 維"))
story.append(kv_table([
    ("卡點、決策、交接", "三大事件型訊號（流量）— 反映「正在發生什麼」"),
    ("負載、協作",       "兩大組織型訊號（結構）— 反映「組織狀態如何」"),
    ("週報",             "一個資訊型訊號（透明度）— 反映「資訊流動性」"),
]))

story.append(section("🔢 整體加權公式"))
story.append(formula(
    "overall = blockerHealth × 0.22  (最重)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ decisionTimeliness × 0.18<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ handoffSmoothness × 0.15<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ loadBalance × 0.18<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ crossDept × 0.12        (最輕)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;+ reportQuality × 0.15<br/>"
    "<br/>"
    "範圍 0-100，越高越健康"
))

story.append(section("🔢 六個維度子公式"))
story.append(kv_table([
    ("卡點健康 (22%)",
     "100 - P95數 × 15 - P90數 × 7 - max(0, avgPercentile - 50) × 0.8"),
    ("決策及時 (18%)",
     "100 - max(0, avgCompletionDays - 14) × 3 - overdueCount × 10"),
    ("交接流暢 (15%)",
     "50 + completionRate × 50 - overdueHandoffs × 8"),
    ("負載均衡 (18%)",
     "100 - max(0, Gini - 0.35) × 200 - overloadCount × 8"),
    ("部門協作 (12%)",
     "100 - asymCount × 15"),
    ("週報品質 (15%)",
     "min(1, submitRate) × 60 + lengthScore × 0.3 + blockerFillRate × 10"),
]))

story.append(section("🔢 五級評等"))
story.append(kv_table([
    ("優異 ≥ 85",  "對應 A 等第"),
    ("良好 ≥ 70",  "對應 B+ 等第"),
    ("可關注 ≥ 55","對應 C+ 警示"),
    ("需注意 ≥ 40","對應 D 危險"),
    ("亟需介入 &lt; 40", "緊急"),
]))
story.append(Paragraph("→ 對齊台灣教育部的學業成績評等習慣（多數人有直覺）。", style_body))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 權重是專家會議值，不同產業適配性需驗證<br/>"
    "<b>2.</b> 週報品質容易被刷分（多寫廢話也能拉長度）— Goodhart's Law<br/>"
    "<b>3.</b> 若公司未啟動週報制度，週報品質永遠 0 分",
    style_body,
))

story.append(PageBreak())

# ====== #17 Decision Impact + Cohort ======
story.extend(algo_block(17, "Decision Impact + Cohort Adjustment", "決策成效 + 同儕校正", "加權評分 · v2.2 學術創舉"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>Counterfactual reasoning</b>：Pearl《The Book of Why》(2018) 因果推論。<br/>"
    "<b>Cohort Adjustment</b>：流行病學「世代研究 (cohort study)」標準方法 — "
    "比較吸菸組 vs 不吸菸組需控制年齡。<br/><br/>"
    "本系統的 Decision Impact 是<b>自創</b>，但 v2.2 加入的 Cohort Adjustment 是學術成熟方法。",
    style_body,
))

story.append(section("🎯 為什麼需要 Cohort Adjustment"))
story.append(Paragraph(
    "<b>原本（v2.1 純 delta）</b>：<br/>"
    "&nbsp;&nbsp;score = after.overall - before.overall<br/><br/>"
    "<b>問題</b>：若整體趨勢下滑（如 12 週掉 18 分），所有決策的 delta 都會被冤枉變負分，"
    "不是它們的鍋。<br/><br/>"
    "<b>v2.2 解法</b>：扣掉「同期基準漂移」（baseline drift），得出純粹歸因於該決策的影響。",
    style_body,
))
story.append(formula(
    "adjustedDelta = decisionDelta - baselineDrift<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;= (after - before) - (slope × windowDays)<br/>"
    "<br/>"
    "其中 slope = 12 週快照線性回歸斜率（per day）"
))

story.append(section("🔢 參數怎麼定"))
story.append(kv_table([
    ("windowWeeks = 4",
     "決策完成後觀察窗口。一個月足夠看效果，比 8 週短（少干擾）、比 2 週長（決策已生效）"),
    ("score 加成 ±2 / 維度",
     "任一維度大幅改善 / 惡化各 ±2。為什麼 2？保證單維度不會壓過整體 delta"),
    ("verdict 閾值 ±3",
     "對應 Cohen's d ≈ 0.3（小到中效應）"),
]))

story.append(section("📥 完整流程"))
story.append(code_block(
    "function analyzeDecisionImpact(decision, data, windowWeeks = 4, driftCache = {}) {<br/>"
    "&nbsp;&nbsp;if (!decision.completedAt || !decision.decidedAt) return null<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 1. 決策前一天快照<br/>"
    "&nbsp;&nbsp;const beforeAsOf = new Date(decidedDate)<br/>"
    "&nbsp;&nbsp;beforeAsOf.setDate(beforeAsOf.getDate() - 1)<br/>"
    "&nbsp;&nbsp;const before = computeHealthSnapshot(beforeAsOf, ...data)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 2. 完成 + 4 週快照（clamp 到 NOW 避免取未來）<br/>"
    "&nbsp;&nbsp;const wantedAfter = completedDate + windowWeeks × 7 days<br/>"
    "&nbsp;&nbsp;const afterAsOf = +wantedAfter &gt; +NOW ? NOW : wantedAfter<br/>"
    "&nbsp;&nbsp;const after = computeHealthSnapshot(afterAsOf, ...data)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 3. 算 baseline drift（用 12 週快照跑線性回歸）<br/>"
    "&nbsp;&nbsp;const slope = computeBaselineDriftSlope(data, driftCache)  // 見 #29<br/>"
    "&nbsp;&nbsp;const totalDays = (+afterAsOf - +beforeAsOf) / 86400000<br/>"
    "&nbsp;&nbsp;const baselineDrift = slope × totalDays<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 4. 校正<br/>"
    "&nbsp;&nbsp;const deltaOverall = after.overall - before.overall<br/>"
    "&nbsp;&nbsp;const adjustedDelta = deltaOverall - baselineDrift  // ★ v2.2 核心<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 5. 計分<br/>"
    "&nbsp;&nbsp;let score = adjustedDelta<br/>"
    "&nbsp;&nbsp;for (const dim of DIMS) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const v = after[dim] - before[dim]<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (v &gt;= 3) score += 2<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;else if (v &lt;= -3) score -= 2<br/>"
    "&nbsp;&nbsp;}<br/>"
    "<br/>"
    "&nbsp;&nbsp;return { score, adjustedDelta, baselineDrift, verdict, ... }<br/>"
    "}"
))

story.append(info_box("答辯關鍵字（教授可能問）",
    "<b>大環境在掉、決策幫忙少掉 → 「逆境止血」</b><br/>"
    "<b>大環境在漲、決策漲得比大盤慢 → 「順風失職」</b><br/><br/>"
    "改版後的公式完全考慮到這點 — 不是看絕對 delta，是看「相對於同期基準」的 delta。",
    VIOLET,
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> Baseline drift 假設組織趨勢是線性 — 實際可能有突變<br/>"
    "<b>2.</b> 完成不到 4 週的決策標記「⏳ 追蹤中」— 給暫評<br/>"
    "<b>3.</b> 對「靜默成功」（防止惡化但沒推升）的決策可能低估",
    style_body,
))

story.append(PageBreak())

# ====== #18 Leader Scorecard ======
story.extend(algo_block(18, "Leader Scorecard", "主管成效排行", "加權評分 · 衍生"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "績效管理基礎概念。Kaplan《Strategy Maps》(2004) 提出「Leading Indicators」框架。",
    style_body,
))

story.append(section("🎯 為什麼用 avgImpactScore 排序"))
story.append(Paragraph(
    "用平均過後對小組偏差不敏感（不會被一筆超大決策拉偏）。<br/>"
    "v2.2 用 <b>adjusted</b> impact 而非 raw delta — 避免「大環境惡化期間所有主管全負分」。",
    style_body,
))

story.append(section("📥 完整實作"))
story.append(code_block(
    "function computeLeaderScores(data): LeaderScore[] {<br/>"
    "&nbsp;&nbsp;const groups = groupBy(data.decisions, d =&gt; d.decidedBy)<br/>"
    "&nbsp;&nbsp;const driftCache = {}  // 共用，避免重算 12 週快照<br/>"
    "<br/>"
    "&nbsp;&nbsp;return Object.entries(groups).map(([decidedBy, decisions]) =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const completed = decisions.filter(d =&gt; d.status === &quot;已完成&quot;)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const impacts = completed<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.map(d =&gt; analyzeDecisionImpact(d, data, 4, driftCache))<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.filter(i =&gt; i !== null)<br/>"
    "<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;return {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;decidedBy,<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;avgImpactScore: stats.mean(impacts.map(i =&gt; i.score)),<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;avgAdjustedDelta: stats.mean(impacts.map(i =&gt; i.adjustedDelta)),<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;positiveCount: impacts.filter(i =&gt; i.verdict === &quot;正面&quot;).length,<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;...<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;}).sort((a, b) =&gt; b.avgImpactScore - a.avgImpactScore)<br/>"
    "}"
))
story.append(Paragraph(
    "<b>driftCache 設計</b>：12 週快照在所有決策間共用，避免 N 筆決策 × 12 次重算（從 O(N×12) 降到 O(N+12)）。",
    style_body,
))

story.append(PageBreak())

# ============================================================
# 第五部 圖論
# ============================================================
story.append(Paragraph("第五部 · 圖論網絡類", style_h1))

# ====== #19 Adjacency Matrix ======
story.extend(algo_block(19, "Directed Weighted Adjacency Matrix", "有向加權鄰接矩陣", "圖論 · 核心"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1736 年</b> Leonhard Euler 七橋問題開創圖論。<br/>"
    "<b>鄰接矩陣</b>是表示圖最古老的方法（先於鄰接表）。",
    style_body,
))

story.append(section("🎯 為什麼用矩陣而非鄰接表"))
story.append(kv_table([
    ("矩陣 O(n²) 空間", "部門數 &lt; 10 完全夠用，查詢 O(1)"),
    ("鄰接表 O(edges)", "節省空間但查詢 O(degree)"),
    ("結論",            "小規模選矩陣（簡單），大規模才換鄰接表"),
]))

story.append(section("📥 從哪兩個資料源建構"))
story.append(code_block(
    "function analyzeDeptNetwork(reports, departments, handoffs) {<br/>"
    "&nbsp;&nbsp;const depts = departments.filter(d =&gt; d.active).map(d =&gt; d.name)<br/>"
    "&nbsp;&nbsp;<br/>"
    "&nbsp;&nbsp;// 初始化空矩陣<br/>"
    "&nbsp;&nbsp;const matrix = {}<br/>"
    "&nbsp;&nbsp;depts.forEach(a =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;matrix[a] = {}<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;depts.forEach(b =&gt; matrix[a][b] = 0)<br/>"
    "&nbsp;&nbsp;})<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (1) 從週報文字抓 mention<br/>"
    "&nbsp;&nbsp;reports.forEach(r =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const text = `${r.cases} ${r.blockers} ${r.needHelp} ${r.nextWeek}`<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;depts.forEach(target =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (target === r.dept) return  // 自己不算<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const count = (text.match(new RegExp(target, &quot;g&quot;)) || []).length<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;matrix[r.dept][target] += count<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;})<br/>"
    "&nbsp;&nbsp;})<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (2) 從交接補強<br/>"
    "&nbsp;&nbsp;handoffs.forEach(h =&gt; matrix[h.from][h.to] += 1)<br/>"
    "<br/>"
    "&nbsp;&nbsp;return { matrix, depts }<br/>"
    "}"
))

story.append(PageBreak())

# ====== #20 Force-directed Layout ======
story.extend(algo_block(20, "Force-directed Graph Layout", "力導向佈局", "圖論 · 視覺化"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1991 年</b> Fruchterman-Reingold 演算法。<br/>"
    "D3.js 的 force simulation 同源。<br/>"
    "物理基礎：庫倫定律（斥力）+ 虎克定律（彈簧吸力）。",
    style_body,
))

story.append(section("🔢 參數怎麼定"))
story.append(kv_table([
    ("K_REP = 400",   "節點間斥力常數，讓節點間維持 100-200 px 距離（適合 SVG 視窗大小）"),
    ("K_ATTR = 0.06", "邊吸引力，配合 K_REP 達到平衡"),
    ("damping = 0.85", "阻尼。0.5 太快收斂、0.95 振盪不收斂、0.85 是 sweet spot"),
    ("dt = 0.2",      "時間步長，太大會抖動"),
]))

story.append(section("📥 主迴圈"))
story.append(code_block(
    "for (let step = 0; step &lt; iterations; step++) {<br/>"
    "&nbsp;&nbsp;// (a) 節點間斥力<br/>"
    "&nbsp;&nbsp;for (each pair of nodes A, B) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;dist = distance(A, B)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;force = K_REP / (dist * dist)  // 與距離平方成反比<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;A.velocity += repel_direction × force × dt<br/>"
    "&nbsp;&nbsp;}<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (b) 邊吸引力<br/>"
    "&nbsp;&nbsp;edges.forEach(e =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;dist = distance(e.from, e.to)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;force = K_ATTR × dist × e.weight  // 與距離成正比<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;both nodes' velocities += attract_direction × force × dt<br/>"
    "&nbsp;&nbsp;})<br/>"
    "<br/>"
    "&nbsp;&nbsp;// (c) 套用阻尼<br/>"
    "&nbsp;&nbsp;nodes.forEach(n =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;n.velocity *= damping<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;n.position += n.velocity<br/>"
    "&nbsp;&nbsp;})<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 我們的 SVG 實作為簡化版（無 quadtree），部門數 &gt; 20 會卡頓<br/>"
    "<b>2.</b> 初始位置隨機，每次結果可能略不同<br/>"
    "<b>3.</b> 大型網絡需要遷移到 D3 force simulation 套件",
    style_body,
))

story.append(PageBreak())

# ====== #21 Asymmetric ======
story.extend(algo_block(21, "Asymmetric Communication Detection", "單向溝通偵測", "圖論 · 組織病徵"))

story.append(section("🎓 起源"))
story.append(Paragraph("社會網絡分析（SNA）的「<b>互惠性 (Reciprocity)</b>」指標。", style_body))

story.append(section("🎯 為什麼用嚴格 0"))
story.append(Paragraph(
    "不是「A 提到 B 多 vs B 提到 A 少」這種比例不平衡（這可能正常），"
    "而是「<b>A 提 B ≥ 5 次 AND B 完全沒提 A</b>」這種完全黑洞 — 才是組織病徵。",
    style_body,
))

story.append(section("🔢 閾值怎麼定"))
story.append(kv_table([
    ("A→B ≥ 5", "5 次提及代表「經常性依賴」而非偶然。對應 z-score ≈ 1（統計顯著性的非正式門檻）"),
    ("B→A = 0", "嚴格 0。不抓「不平衡」，只抓「完全沒回」— 前者可能正常，後者是組織病徵"),
]))

story.append(section("📥 實作"))
story.append(code_block(
    "function detectAsymmetry(matrix, depts) {<br/>"
    "&nbsp;&nbsp;let count = 0, ratio = 0<br/>"
    "&nbsp;&nbsp;for (const a of depts) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;for (const b of depts) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (a === b) continue<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const ab = matrix[a]?.[b] || 0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;const ba = matrix[b]?.[a] || 0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;if (ab &gt;= 5 && ba === 0) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;count++<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ratio += ab<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;}<br/>"
    "&nbsp;&nbsp;return { count, ratio }<br/>"
    "}<br/>"
    "<br/>"
    "// 套到 ORI 的 CDC 維度<br/>"
    "CDC = 100 + asymCount × 18 + asymRatio × 0.5"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 閾值 5 是 magic number，小團隊可能不適用<br/>"
    "<b>2.</b> 未區分「該回但沒回」vs「本來就不該回」的對話<br/>"
    "<b>3.</b> 依賴週報文字 mention 抽取，若某部門寫週報少會偵測不到",
    style_body,
))

story.append(PageBreak())

# ============================================================
# 第六部 狀態判定
# ============================================================
story.append(Paragraph("第六部 · 狀態判定類", style_h1))

# ====== #22 Decision Status Helpers ======
story.extend(algo_block(22, "Decision Status Helpers", "動態狀態判定", "狀態判定 · v2.1 重大新增"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>我們自創</b>（v2.1 修 bug 時加的）。<br/>"
    "概念來自 <b>DDD（領域驅動設計）</b>：動態判定 &gt; 靜態 status 欄位。",
    style_body,
))

story.append(section("🎯 為什麼這樣設計"))
story.append(Paragraph(
    "「狀態」應該是<b>資料的函數</b>，不是另一個資料欄位。<br/>"
    "否則就會發生「dueDate 過期但 status 沒更新」的 bug — v2.1 就是因為這個發現 9 件 bug。",
    style_body,
))

story.append(section("🔢 4 個 helper"))
story.append(code_block(
    "isDecisionOverdueAt(d, asOf = NOW): boolean<br/>"
    "&nbsp;&nbsp;decidedAt ≤ asOf AND dueDate &lt; asOf<br/>"
    "&nbsp;&nbsp;AND (!completedAt OR completedAt &gt; asOf)<br/>"
    "<br/>"
    "isDecisionInProgressAt(d, asOf): boolean<br/>"
    "&nbsp;&nbsp;decidedAt ≤ asOf AND NOT overdue AND NOT completed<br/>"
    "<br/>"
    "isDecisionCompletedAt(d, asOf): boolean<br/>"
    "&nbsp;&nbsp;completedAt ≤ asOf<br/>"
    "<br/>"
    "daysOverdue(d, asOf): number<br/>"
    "&nbsp;&nbsp;max(0, round((startOfDay(asOf) − startOfDay(dueDate)) / 86400000))"
))

story.append(info_box("v2.2 加 startOfDay 對齊",
    "原本 daysOverdue 計算受時分秒 / 時區殘留影響，可能算出「逾期 0.5 天」被四捨五入成 0 或 1，"
    "造成 UI 跨日跳動。v2.2 加 startOfDay 截斷到午夜零點，徹底避免邊界浮點誤差。",
    GREEN,
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "每次調用都要重算（沒 cache）— 但因為都是純整數比較，O(1) 開銷可忽略。",
    style_body,
))

story.append(PageBreak())

# ====== #23 Level Mapping ======
story.extend(algo_block(23, "Risk / Load / Health Level Mapping", "等級對應", "狀態判定 · 視覺化橋樑"))

story.append(section("🎯 為什麼需要"))
story.append(Paragraph(
    "作為「數據與用戶視覺」之間的<b>語意橋樑 (Semantic Mapping)</b>。將冰冷的統計數字"
    "（如 74.2 分、0.41 的 Gini）轉換為具有行動指導意義的燈號標籤。",
    style_body,
))

story.append(section("🔢 三組 mapping"))
story.append(kv_table([
    ("Blocker Level (critical / high / medium / normal)",
     "依 P75 / P90 / P95 自動分類 — 見 #7 Empirical Percentile"),
    ("Load Level (overload / high / normal / low / idle)",
     "依絕對值 25/15/6/1 OR percentile 90/75 — 見 #14"),
    ("Health Level (優異 / 良好 / 可關注 / 需注意 / 亟需介入)",
     "依 overall ≥ 85 / 70 / 55 / 40 / &lt; 40 — 對齊台灣教育部評等"),
]))

story.append(section("📥 實作"))
story.append(code_block(
    "function healthLevel(overall: number) {<br/>"
    "&nbsp;&nbsp;if (overall &gt;= 85) return { label: &quot;優異&quot;,   color: &quot;text-emerald-600&quot; }<br/>"
    "&nbsp;&nbsp;if (overall &gt;= 70) return { label: &quot;良好&quot;,   color: &quot;text-blue-600&quot; }<br/>"
    "&nbsp;&nbsp;if (overall &gt;= 55) return { label: &quot;可關注&quot;, color: &quot;text-amber-600&quot; }<br/>"
    "&nbsp;&nbsp;if (overall &gt;= 40) return { label: &quot;需注意&quot;, color: &quot;text-orange-600&quot; }<br/>"
    "&nbsp;&nbsp;return                     { label: &quot;亟需介入&quot;, color: &quot;text-red-600&quot; }<br/>"
    "}"
))

story.append(PageBreak())

# ============================================================
# 第七部 預測模擬
# ============================================================
story.append(Paragraph("第七部 · 預測模擬類", style_h1))

# ====== #24 What-if ======
story.extend(algo_block(24, "What-if Scenario Simulation", "情境模擬器", "預測模擬 · v2.2 互動核心"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "來自 <b>Excel 的 What-if Analysis</b>（70 年代發明）。<br/>"
    "Decision Support Systems (DSS) 經典功能（Gorry & Scott Morton 1971）。",
    style_body,
))

story.append(section("🎯 為什麼選 Shadow Data 模式"))
story.append(Paragraph(
    "對原始資料 <b>fork shadow data</b>（不汙染主資料），套用 scenario 修改後，重跑 "
    "computeHealthSnapshot，與 baseline 雙圖層雷達比對。<br/><br/>"
    "<b>純函數性</b>：相同 scenario 永遠回傳相同模擬結果。",
    style_body,
))

story.append(section("🔢 Scenario 結構"))
story.append(code_block(
    "type Scenario = {<br/>"
    "&nbsp;&nbsp;resolvedBlockerIds:    Set&lt;string&gt;,  // 要解掉的卡點<br/>"
    "&nbsp;&nbsp;expeditedDecisionIds:  Set&lt;string&gt;,  // 加速完成的決策<br/>"
    "&nbsp;&nbsp;signedHandoffIds:      Set&lt;string&gt;,  // 立即簽收的交接<br/>"
    "&nbsp;&nbsp;extraHeadcount:        { [dept]: 0..5 }  // 額外人力<br/>"
    "}"
))

story.append(section("📥 完整流程（含 v2.2 useDeferredValue）"))
story.append(code_block(
    "// React 19 useDeferredValue 包住，避免快速點選卡 UI<br/>"
    "const deferredScenario = useDeferredValue(scenario)<br/>"
    "const isPending = scenario !== deferredScenario  // 顯示「計算中...」<br/>"
    "<br/>"
    "const shadowData = useMemo(() =&gt; ({<br/>"
    "&nbsp;&nbsp;blockers: blockers.map(b =&gt; <br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;deferredScenario.resolvedBlockerIds.has(b.id)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;? { ...b, status: &quot;resolved&quot; } : b),<br/>"
    "&nbsp;&nbsp;decisions: decisions.map(d =&gt; <br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;deferredScenario.expeditedDecisionIds.has(d.id)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;? { ...d, status: &quot;已完成&quot;, completedAt: NOW } : d),<br/>"
    "&nbsp;&nbsp;handoffs: handoffs.map(h =&gt; <br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;deferredScenario.signedHandoffIds.has(h.id)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;? { ...h, status: &quot;已簽收&quot; } : h),<br/>"
    "&nbsp;&nbsp;employees: [...employees, ...generateExtras(deferredScenario.extraHeadcount)],<br/>"
    "}), [deferredScenario])<br/>"
    "<br/>"
    "const projected = useMemo(() =&gt;<br/>"
    "&nbsp;&nbsp;computeHealthSnapshot(NOW, ...shadowData), [shadowData])<br/>"
    "<br/>"
    "const delta = projected.overall - baseline.overall"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 假設「解掉卡點 = 立即生效」，現實中可能有延遲<br/>"
    "<b>2.</b> 模擬「加員工」目前是新增 loadScore=0 的人，可能拉高 Gini（反效果）— 該改為 reassignment<br/>"
    "<b>3.</b> 資料量 10× 時即使 useDeferredValue 也會卡，需 Web Worker",
    style_body,
))

story.append(PageBreak())

# ====== #25 Smart Suggestion ======
story.extend(algo_block(25, "Smart Suggestion", "智能建議文案", "預測模擬 · UX"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "Decision Support System (DSS) 的「<b>最後一哩路</b>」— 把數字轉成可行動的文案。",
    style_body,
))

story.append(section("🔢 五級閾值"))
story.append(kv_table([
    ("Δ ≥ +5", "顯著改善 ✨ 強烈建議執行 — 5 是 100 分總分的 5%，已是明顯感受"),
    ("Δ +2~+5", "可考慮 — 2 = 雜訊上限以上"),
    ("Δ −2~+2", "影響不大 — 雜訊區間"),
    ("Δ −5~−2", "需評估 — 對稱負面區"),
    ("Δ ≤ −5", "⚠️ 不建議 — 對稱「顯著」區"),
]))

story.append(section("📥 實作"))
story.append(code_block(
    "function smartSuggestion(delta: number): string {<br/>"
    "&nbsp;&nbsp;if (delta &gt;= 5)  return &quot;顯著改善 ✨ 強烈建議執行&quot;<br/>"
    "&nbsp;&nbsp;if (delta &gt;= 2)  return &quot;有改善，可考慮執行&quot;<br/>"
    "&nbsp;&nbsp;if (delta &gt;= -2) return &quot;影響不大，可保留資源&quot;<br/>"
    "&nbsp;&nbsp;if (delta &gt;= -5) return &quot;略為惡化，需評估&quot;<br/>"
    "&nbsp;&nbsp;return                  &quot;顯著惡化 ⚠️ 不建議執行&quot;<br/>"
    "}"
))

story.append(PageBreak())

# ============================================================
# 第八部 工具
# ============================================================
story.append(Paragraph("第八部 · 工具機制類", style_h1))

# ====== #26 Optimistic Sync ======
story.extend(algo_block(26, "Optimistic UI Sync", "樂觀同步", "工具 · 資料層"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1990 年代</b> Optimistic Concurrency Control 起源於資料庫領域。<br/>"
    "前端版本流行於 React 16+ 時代，目前 React Query / SWR 都採用。",
    style_body,
))

story.append(section("🎯 為什麼用樂觀同步"))
story.append(Paragraph(
    "讓使用者感覺「<b>零延遲</b>」— UI 立即更新，背景才同步雲端。<br/>"
    "悲觀同步：等 Firestore 回應才更新 UI → 300-500ms 延遲 → 體感不流暢。",
    style_body,
))

story.append(section("📥 實作"))
story.append(code_block(
    "function useAppData() {<br/>"
    "&nbsp;&nbsp;const [reports, setReports] = useState(SEED_REPORTS)<br/>"
    "&nbsp;&nbsp;const [syncStatus, setSyncStatus] = useState&lt;&quot;idle&quot;|&quot;syncing&quot;|&quot;error&quot;&gt;(&quot;idle&quot;)<br/>"
    "<br/>"
    "&nbsp;&nbsp;// user action → setState 即時更新 UI<br/>"
    "&nbsp;&nbsp;// useEffect 監聽 → 背景寫 Firestore<br/>"
    "&nbsp;&nbsp;useEffect(() =&gt; {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if (!dataLoaded) return<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;setSyncStatus(&quot;syncing&quot;)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;saveDocumentCollection(&quot;reports&quot;, reports)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;.then(ok =&gt; setSyncStatus(ok ? &quot;idle&quot; : &quot;error&quot;))<br/>"
    "&nbsp;&nbsp;}, [reports])<br/>"
    "}"
))

story.append(PageBreak())

# ====== #27 SEED Protection ======
story.extend(algo_block(27, "SEED Protection", "種子資料保護", "工具 · 容錯"))

story.append(section("🎓 起源"))
story.append(Paragraph("<b>Defensive Programming</b> 概念，可追溯到 1970 年代結構化程式設計。", style_body))

story.append(section("🎯 為什麼需要"))
story.append(Paragraph(
    "Firestore 集合可能：<br/>"
    "&nbsp;&nbsp;(1) 初始化時為空（首次登入）<br/>"
    "&nbsp;&nbsp;(2) 被誤刪（如新進工程師清空測試資料）<br/>"
    "&nbsp;&nbsp;(3) 包含舊版格式（「第 N 週」），與新版不相容<br/><br/>"
    "若不保護，前端會 setDepartments([]) → 「departments.filter(...)」變空 → 整個 app 崩潰。",
    style_body,
))

story.append(section("🔢 各 collection 的保護門檻"))
story.append(kv_table([
    ("reports / handoffs",  "&lt; 10 筆 → 用 SEED；含舊「第 N 週」格式也重置"),
    ("blockers / decisions / employees", "空時 fallback 到 SEED"),
    ("history / meetingHistory",         "&lt; 5 筆 → 用 SEED"),
    ("departments / users (v2.1 新增)",  "空時 fallback — 避免 app 崩潰"),
]))

story.append(section("📥 實作"))
story.append(code_block(
    "// reports / handoffs 量級 + 格式雙重檢查<br/>"
    "const hasOldFormat = r.some(x =&gt; /第\\s*\\d+\\s*週/.test(x.week))<br/>"
    "const finalReports = (hasOldFormat || r.length &lt; 10) ? SEED_REPORTS : r<br/>"
    "<br/>"
    "// 其他 collection 空時 fallback<br/>"
    "const finalBlockers = b.length === 0 ? SEED_BLOCKERS : b<br/>"
    "const finalHistory  = hist.length &lt; 5 ? SEED_HISTORY : hist<br/>"
    "<br/>"
    "// v2.1 新增<br/>"
    "const finalDepts = deptRows.length === 0 ? SEED_DEPARTMENTS : deptRows<br/>"
    "const finalUsers = userRows.length === 0 ? SEED_USERS : userRows"
))

story.append(PageBreak())

# ====== #28 NaN Guards ======
story.extend(algo_block(28, "NaN Guards / Clamp", "數值安全保護", "工具 · 全系統"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "Floating-point safety 是程式語言設計基礎。<br/>"
    "IEEE 754 標準（1985）定義 NaN / Infinity，但實際使用時要主動防護。",
    style_body,
))

story.append(section("🔢 三大工具"))
story.append(code_block(
    "// (1) Clamp — 將數值嚴格限定在 [lo, hi]<br/>"
    "const clamp = (v, lo = 0, hi = 100) =&gt; Math.max(lo, Math.min(hi, v))<br/>"
    "<br/>"
    "// (2) Safe Date — 處理 NaN 字串<br/>"
    "function safeDate(s?: string): Date | null {<br/>"
    "&nbsp;&nbsp;if (!s || s === &quot;即時生效&quot;) return null<br/>"
    "&nbsp;&nbsp;const d = new Date(s)<br/>"
    "&nbsp;&nbsp;return isNaN(+d) ? null : d<br/>"
    "}<br/>"
    "<br/>"
    "// (3) Safe Ratio — 零分母保護 + 上限 clamp<br/>"
    "function safeRatio(num, den, fallback = 0): number {<br/>"
    "&nbsp;&nbsp;if (den &lt;= 0) return fallback<br/>"
    "&nbsp;&nbsp;return Math.min(1.0, num / den)  // submission rate 等指標 max 1<br/>"
    "}"
))

story.append(section("🎯 應用情境"))
story.append(kv_table([
    ("所有評分函式末段",  "clamp(score, 0, 100) 確保不溢出"),
    ("日期 parse",        "「即時生效」、「null」、空字串都要擋"),
    ("除法",              "空 array 算 mean 時分母為 0 — safeRatio 擋住"),
    ("submission rate",   "管理層交週報時可能 &gt; 1，要 clamp"),
]))

story.append(PageBreak())

# ====== #29 Linear Regression ======
story.extend(algo_block(29, "Linear Regression Baseline Drift Slope", "線性回歸基準漂移", "v2.2 新工具 · Cohort 核心"))

story.append(section("🎓 起源"))
story.append(Paragraph(
    "<b>1805 年</b> Adrien-Marie Legendre 提出最小平方法 (Method of Least Squares)。<br/>"
    "<b>1809 年</b> Carl Friedrich Gauss 給出正式統計證明。<br/>"
    "<b>現在</b>是統計學最基本工具，所有 spreadsheet 都內建。",
    style_body,
))

story.append(section("🎯 為什麼用線性回歸"))
story.append(Paragraph(
    "<b>教授必問</b>：「為什麼不用前後兩週直接相減除以天數算出變化就好？」<br/><br/>"
    "<b>答</b>：因為單一週的數據極易包含隨機雜訊（如某週剛好放連續假期導致指標失真）。"
    "線性回歸能有效利用過去 12 週的所有資料點，互相抵消短期隨機雜訊，"
    "抓出最穩健、最不失真的長期方向性趨勢。",
    style_body,
))

story.append(section("🔢 公式（最小平方法）"))
story.append(formula(
    "給定 N 個點 (xᵢ, yᵢ)：<br/>"
    "<br/>"
    "斜率 m = Σ (xᵢ - x̄)(yᵢ - ȳ) / Σ (xᵢ - x̄)²<br/>"
    "<br/>"
    "其中 x̄ = mean(x), ȳ = mean(y)<br/>"
    "<br/>"
    "→ 我們只取斜率 m 作為「每日漂移率」，截距 c 不重要"
))

story.append(section("📥 完整實作"))
story.append(code_block(
    "function linearRegressionSlope(points: {x, y}[]): number {<br/>"
    "&nbsp;&nbsp;const n = points.length<br/>"
    "&nbsp;&nbsp;if (n &lt; 2) return 0<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 1. 算均值<br/>"
    "&nbsp;&nbsp;const meanX = stats.mean(points.map(p =&gt; p.x))<br/>"
    "&nbsp;&nbsp;const meanY = stats.mean(points.map(p =&gt; p.y))<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 2. 算分子分母<br/>"
    "&nbsp;&nbsp;let numerator = 0, denominator = 0<br/>"
    "&nbsp;&nbsp;for (const p of points) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const devX = p.x - meanX<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const devY = p.y - meanY<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;numerator += devX * devY<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;denominator += devX * devX<br/>"
    "&nbsp;&nbsp;}<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 3. 防分母為零（所有點 X 重疊）<br/>"
    "&nbsp;&nbsp;return denominator === 0 ? 0 : numerator / denominator<br/>"
    "}<br/>"
    "<br/>"
    "// 在 Decision Impact 中使用<br/>"
    "function computeBaselineDriftSlope(data, cache) {<br/>"
    "&nbsp;&nbsp;if (cache.ratePerDay !== undefined) return cache.ratePerDay<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 採樣 12 週快照<br/>"
    "&nbsp;&nbsp;const samples = []<br/>"
    "&nbsp;&nbsp;for (let i = 0; i &lt; 12; i++) {<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const asOf = new Date(NOW)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;asOf.setDate(asOf.getDate() - (11 - i) * 7)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;const snap = computeHealthSnapshot(asOf, ...data)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;samples.push({<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;x: (+asOf - +NOW) / 86400000,  // 距 NOW 天數（負值）<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;y: snap.overall<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;})<br/>"
    "&nbsp;&nbsp;}<br/>"
    "<br/>"
    "&nbsp;&nbsp;cache.ratePerDay = linearRegressionSlope(samples)<br/>"
    "&nbsp;&nbsp;return cache.ratePerDay<br/>"
    "}"
))

story.append(section("⚠️ 限制", RED))
story.append(Paragraph(
    "<b>1.</b> 假設線性趨勢 — 若組織有 S 型成長或週期性，會失真<br/>"
    "<b>2.</b> 12 週樣本對「跨季度」事件可能不夠<br/>"
    "<b>3.</b> Slope 對首尾極端點敏感（leverage effect）— 業界做法可換 Theil-Sen estimator",
    style_body,
))

story.append(PageBreak())

# ============================================================
# 結語
# ============================================================
story.append(Paragraph("結語 · 演算法選擇的設計哲學", style_h1))

story.append(Paragraph(
    "本系統 29 個演算法共同實現一個目標：<br/>"
    "<b>「用恰當的演算法解決恰當規模的問題」</b>。",
    style_body,
))

story.append(Paragraph("4 條核心原則", style_algo))
story.append(kv_table([
    ("1. 學術可考",
     "BM25F、Gini、Linear Regression 等都有 100+ 年歷史，論文可查"),
    ("2. 經驗有據",
     "Time decay 半衰期 = Andy Grove 注意力週期、Gini 0.35 = Lambert 2001"),
    ("3. 可解釋性優先",
     "每個分數都能逐層拆解，不用黑盒模型"),
    ("4. 跨頁面一致",
     "同一個指標在不同頁面用同一個分析器，避免「兩邊數字對不上」"),
]))

story.append(Paragraph("為什麼不用 LLM / Embedding", style_algo))
story.append(Paragraph(
    "(1) <b>資料量小</b>：53 筆歷史案、200 筆週報。BM25F 比 Embedding 更可靠且零成本。<br/>"
    "(2) <b>可解釋性</b>：管理層需要知道「為什麼推薦這筆」，BM25F 可逐項列出命中詞貢獻。<br/>"
    "(3) <b>機密敏感</b>：投資資料不能送 cloud API。<br/>"
    "(4) <b>計算成本</b>：所有演算法都是 O(N) 或 O(N log N)。<br/>"
    "(5) <b>確定性</b>：相同輸入永遠回傳相同結果，LLM 有 stochasticity。",
    style_body,
))

story.append(Spacer(1, 1 * cm))
story.append(hr())
story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph(
    "<i>「資料越少，演算法的選擇越重要。」</i><br/>"
    "<i>「跨頁面的一致性，比單頁的炫技更重要。」</i><br/>"
    "<i>「能解釋的演算法，比準確 1% 的黑盒更值錢。」</i><br/><br/>"
    "—— 串連系統 v2.2 設計哲學",
    ParagraphStyle("end", fontName=CN, fontSize=11, textColor=GREY, leading=18),
))

# ============================================================
# 輸出
# ============================================================
import os
os.makedirs("docs", exist_ok=True)
out_path = "docs/串連系統_演算法深度解析.pdf"


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(CN, 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1 * cm, "串連系統 v2.2 · 演算法深度解析")
    canvas.drawRightString(19 * cm, 1 * cm, f"第 {doc.page} 頁")
    canvas.restoreState()


doc = SimpleDocTemplate(
    out_path, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="串連系統 v2.2 — 演算法深度解析",
    author="資管導論 第 13 組",
)
doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
print(f"OK -> {out_path}")
