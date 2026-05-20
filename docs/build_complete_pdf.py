# -*- coding: utf-8 -*-
"""
串連系統 v2.1 — 完整技術參考手冊
含所有演算法、公式、常數、資料結構、UI 邏輯、bug 修復記錄、設計限制
不漏任何細節。
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
ROSE  = HexColor("#fb7185")

# 樣式
style_title    = ParagraphStyle("title", fontName=CN, fontSize=26, leading=32, textColor=NAVY, spaceAfter=6)
style_subtitle = ParagraphStyle("st", fontName=CN, fontSize=12, leading=18, textColor=SLATE, spaceAfter=24)
style_h1       = ParagraphStyle("h1", fontName=CN, fontSize=18, leading=24, textColor=NAVY, spaceBefore=14, spaceAfter=8)
style_h2       = ParagraphStyle("h2", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceBefore=12, spaceAfter=4)
style_h3       = ParagraphStyle("h3", fontName=CN, fontSize=11.5, leading=17, textColor=NAVY, spaceBefore=8, spaceAfter=2)
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
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
        ("LINEBEFORE", (0, 0), (0, -1), 3, color),
    ]))
    return KeepTogether([t, Spacer(1, 6)])


def kv_table(rows, col_widths=None):
    col_widths = col_widths or [4.5 * cm, 12.5 * cm]
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
    return Table([[" "]], colWidths=[18 * cm], style=TableStyle([
        ("LINEABOVE", (0, 0), (-1, -1), 0.4, GREY),
    ]))


# ============================================================
story = []

# ---------- 封面 ----------
story.append(Spacer(1, 3 * cm))
story.append(Paragraph("串連系統 v2.1", style_title))
story.append(Paragraph("完整技術參考手冊 · Complete Technical Reference",
                        ParagraphStyle("h_en", fontName=CN, fontSize=14, leading=20, textColor=BLUE, spaceAfter=4)))
story.append(Paragraph("管理層決策輔助系統 · 投資公司應用",
                        ParagraphStyle("h_sub", fontName=CN, fontSize=11, leading=16, textColor=SLATE, spaceAfter=20)))

story.append(Paragraph(
    "本手冊完整涵蓋串連系統 v2.1 的所有技術細節：核心演算法（25 項）、資料結構、"
    "常數定義、UI 元件、同步機制、權限模型、Bug 修復記錄、設計限制與已知議題。"
    "適合 (a) 期末口試 cheatsheet (b) 教師深度檢閱 (c) 新進工程師完整交接 "
    "(d) 論文方法章節附錄。<b>本文件不漏任何技術細節</b>。",
    style_subtitle,
))

story.append(Spacer(1, 1.2 * cm))

cover_info = kv_table([
    ("專案名稱",   "串連系統 v2.0 (Chuanlien System)"),
    ("應用場景",   "20–50 人規模投資公司的管理層決策輔助"),
    ("前端技術",   "React 19 + TypeScript 5 + Vite 6 + Tailwind v4 + Framer Motion 12 + Recharts 2"),
    ("後端服務",   "Firebase Authentication + Cloud Firestore"),
    ("演算法總數", "25 項（22 核心 + 3 工具機制）"),
    ("UI 模組數",  "11 個主要頁面"),
    ("資料模型",   "10 個 collection (reports, handoffs, decisions, blockers, history,\n"
                  "employees, departments, users, meetingHistory, ...)"),
    ("程式碼行數", "約 8,500 行 TypeScript + JSX"),
    ("作者",       "資管導論 第 13 組"),
    ("文件版本",   "v2.1 完整版 · 2026-05"),
], col_widths=[3.5 * cm, 13.5 * cm])
story.append(cover_info)

story.append(PageBreak())

# ---------- 目錄 ----------
story.append(Paragraph("目錄", style_h1))
toc_data = [
    ("第一部 系統概觀", ""),
    ("1.",  "系統總覽與技術棧"),
    ("2.",  "檔案結構與模組關係圖"),
    ("3.",  "資料模型與型別定義"),
    ("第二部 演算法詳解（25 項）", ""),
    ("4.",  "① 資訊檢索 (6 項) — BM25F、IDF、n-gram、Substring、同義詞、Cosine"),
    ("5.",  "② 統計分析 (3 項) — Empirical Percentile、Gini、敘述統計"),
    ("6.",  "③ 時間序列 (4 項) — Exp Decay、asOf Snapshot、Local Minima、Weekly Series"),
    ("7.",  "④ 加權評分 (5 項) — Load Score、ORI、Health 6D、Decision Impact、Leader Score"),
    ("8.",  "⑤ 圖論網絡 (3 項) — Adjacency Matrix、Force-directed、Asymmetric Detection"),
    ("9.",  "⑥ 狀態判定 (2 項) — Decision Status Helpers、Risk/Load/Health Level"),
    ("10.", "⑦ 預測模擬 (2 項) — What-if Simulation、Smart Suggestion"),
    ("11.", "⑧ 工具機制 (3 項) — Optimistic Sync、SEED Protection、NaN Guards"),
    ("第三部 常數與配置", ""),
    ("12.", "全域常數定義表"),
    ("13.", "SEED 資料結構"),
    ("14.", "色彩系統與 UI 等級配色"),
    ("第四部 UI 與互動", ""),
    ("15.", "11 個主要頁面與功能矩陣"),
    ("16.", "權限模型與角色"),
    ("17.", "通知中心與事件流"),
    ("第五部 工程實踐", ""),
    ("18.", "Bug 修復記錄（v2.0 → v2.1，共 9 件）"),
    ("19.", "已知設計限制與未來改進方向"),
    ("20.", "演算法選用對照與設計哲學"),
    ("附錄", ""),
    ("A.",  "演算法快速索引（25 項對應檔案）"),
    ("B.",  "公式速查表"),
    ("C.",  "FAQ — 教授可能問的 12 個問題"),
]
toc_rows = []
for n, t in toc_data:
    if t == "":
        toc_rows.append([
            Paragraph(f"<b><font color='#3b82f6'>{n}</font></b>",
                      ParagraphStyle("toc_h", fontName=CN, fontSize=11, textColor=BLUE, leading=18, spaceBefore=4)),
            Paragraph("", ParagraphStyle("e", fontName=CN, fontSize=10)),
        ])
    else:
        toc_rows.append([
            Paragraph(f"<b>{n}</b>", ParagraphStyle("toc_n", fontName=CN, fontSize=10, textColor=BLUE)),
            Paragraph(t, ParagraphStyle("toc_t", fontName=CN, fontSize=10, textColor=NAVY, leading=14)),
        ])
toc_table = Table(toc_rows, colWidths=[1.5 * cm, 14 * cm])
toc_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
]))
story.append(toc_table)

story.append(PageBreak())

# ========================================================================
# 第一部 系統概觀
# ========================================================================

# ---------- 1. 系統總覽 ----------
story.append(Paragraph("1. 系統總覽與技術棧", style_h1))
story.append(Paragraph(
    "串連系統 v2.1 是面向中小型投資公司管理層的決策輔助平台。系統的設計核心並非「資料儲存」，"
    "而是「演算法層」 — 在原始資料之上，用統計、資訊檢索、圖論、時間序列、加權評分等方法，"
    "把瑣碎事件融合成「組織儀表板」與「決策閉環」（Plan → Decide → Track → Learn）。",
    style_body,
))

story.append(Paragraph("1.1 技術棧", style_h2))
story.append(kv_table([
    ("前端框架",     "React 19 (含 hooks: useState, useMemo, useEffect, useCallback)"),
    ("語言",         "TypeScript 5 (strict mode, ESM)"),
    ("打包工具",     "Vite 6 (HMR, ESBuild, code splitting)"),
    ("CSS",          "Tailwind CSS v4 (utility-first, JIT)"),
    ("動畫",         "Framer Motion 12 (motion/react, AnimatePresence)"),
    ("圖表",         "Recharts 2 (LineChart, BarChart, RadarChart, PieChart)"),
    ("Icon",         "Lucide React (TreeShakable SVG icons)"),
    ("認證",         "Firebase Authentication (Email/Password)"),
    ("資料庫",       "Cloud Firestore (NoSQL document DB)"),
    ("部署",         "Vercel (自動 CI/CD from GitHub main branch)"),
    ("版控",         "Git + GitHub (Peter2594/chuanlien-system-v2)"),
]))

story.append(Paragraph("1.2 設計原則", style_h2))
story.append(Paragraph(
    "(1) <b>用恰當的演算法解決恰當規模的問題</b> — 50 人公司、200 筆歷史案，BM25F 比 LLM Embedding 更可靠。<br/>"
    "(2) <b>可解釋性優先</b> — 每個分數都能逐項拆解，管理層能追溯來源。<br/>"
    "(3) <b>機密敏感</b> — 全部運算在前端 + 自有 Firebase 跑，零外部 API call。<br/>"
    "(4) <b>跨頁面一致性</b> — 同一個指標在不同頁面用同一個分析器，避免「兩邊數字對不上」。<br/>"
    "(5) <b>互動即時</b> — 篩選、模擬、切換週次都是 O(N log N) 級別，瀏覽器毫秒級回應。",
    style_body,
))

story.append(PageBreak())

# ---------- 2. 檔案結構 ----------
story.append(Paragraph("2. 檔案結構與模組關係圖", style_h1))

story.append(Paragraph("2.1 目錄結構", style_h2))
file_tree = """src/
├── App.tsx                          # 主入口，路由 + 角色權限
├── components/
│   ├── Login.tsx                    # 登入頁
│   ├── Shell/
│   │   ├── Sidebar.tsx              # 左側導覽
│   │   ├── Header.tsx               # 頂部 bar
│   │   └── NotificationPanel.tsx    # 鈴鐺通知中心
│   ├── OrgHealthCard.tsx            # 組織健康度雷達 + 趨勢
│   ├── SimilarCases.tsx             # BM25F 智能推薦
│   └── ui/
│       ├── Card.tsx · Button.tsx · Modal.tsx · Pill.tsx
├── pages/                           # 11 個主要頁面
│   ├── Dashboard.tsx                # 管理層摘要儀表板
│   ├── WeeklyReport.tsx             # 週報填寫 + 歷史
│   ├── Handoff.tsx                  # 案件交接
│   ├── Decisions.tsx                # 決策追蹤 + Leader 排行
│   ├── EmployeeLoad.tsx             # 員工負載 + 週次切換
│   ├── History.tsx                  # 歷史案件搜尋
│   ├── BlockerAnalytics.tsx         # 卡點分析
│   ├── OrgAnalytics.tsx             # 部門互動網絡
│   ├── MeetingPrep.tsx              # 會議準備
│   ├── WhatIf.tsx                   # 決策模擬器
│   └── LineBot.tsx                  # LINE 推播設定
├── lib/                             # 核心演算法層
│   ├── algorithms.ts                # 員工負載、卡點分析、ORI、決策狀態 helper
│   ├── orgHealth.ts                 # 健康度 6 維、12 週快照、拐點偵測
│   ├── decisionImpact.ts            # 決策成效追蹤 + Leader 排行
│   ├── historySearch.ts             # BM25F 搜尋引擎
│   ├── firebase.ts                  # Auth + Firestore CRUD
│   ├── dateUtils.ts                 # NOW, parseWeekStart, formatWeekLabel
│   ├── seedData.ts                  # 程序化產生 SEED 資料
│   ├── constants.ts                 # 部門、用戶、卡點類別常數
│   ├── types.ts                     # TypeScript 型別定義
│   └── utils.ts                     # cn() className merger
└── hooks/
    └── useAppData.ts                # 全域資料 + Firestore 同步"""

story.append(code_block(file_tree.replace("\n", "<br/>").replace(" ", "&nbsp;")))

story.append(Paragraph("2.2 模組依賴關係", style_h2))
story.append(Paragraph(
    "<b>由下而上的層次</b>：<br/>"
    "<font face='Courier'>dateUtils + types + constants</font> → 基礎層<br/>"
    "<font face='Courier'>algorithms + historySearch + seedData</font> → 演算法層<br/>"
    "<font face='Courier'>orgHealth + decisionImpact</font> → 高階演算法（依賴 algorithms）<br/>"
    "<font face='Courier'>useAppData</font> → 資料整合層（依賴 firebase + algorithms）<br/>"
    "<font face='Courier'>各 pages/* + components/*</font> → UI 層<br/>"
    "<font face='Courier'>App.tsx</font> → 入口層",
    style_body,
))

story.append(PageBreak())

# ---------- 3. 資料模型 ----------
story.append(Paragraph("3. 資料模型與型別定義", style_h1))

story.append(Paragraph("3.1 核心型別（src/lib/types.ts）", style_h2))

types = [
    ("Report", "週報", "id, dept, week, author, submittedAt, cases, blockers, needHelp, nextWeek, keywords[]"),
    ("Handoff", "案件交接", "id, from, to, caseId, title, background, progress, todo, attachments[], status, sender, receiver, createdAt, hoursOverdue?"),
    ("Decision", "決策", "id, title, content, decidedBy, decidedAt, dueDate, assignedDept, status, linkedCases?[], notes?, completedAt?"),
    ("Blocker", "卡點", "id, title, description, dept, owner, category, status, createdAt, updatedAt, weekId, caseId, relatedDepartments?[], daysToResolve?"),
    ("HistoryCase", "歷史案件", "id, title, date, tags[], summary, owner, handoffs, outcome, detail: { background, process, valuation, keyInsights[], result, lessons }"),
    ("Employee", "員工", "name, dept, role"),
    ("Department", "部門", "id, name, shortName?, active, order?"),
    ("SystemUser", "系統使用者", "id, email, name, role (admin/manager/member), dept?, active?"),
    ("MeetingHistory", "歷史會議", "id, title, schedule, audience, icon, archivedAt, archivedBy, agendaSnapshot[], textSnapshot"),
]
types_table = Table(
    [[Paragraph(f"<b>{t[0]}</b>", ParagraphStyle("tt", fontName=CN, fontSize=9.5, textColor=BLUE, leading=12)),
      Paragraph(t[1], ParagraphStyle("td", fontName=CN, fontSize=9.5, textColor=NAVY, leading=12)),
      Paragraph(f"<font face='Courier' size='8'>{t[2]}</font>",
                ParagraphStyle("tf", fontName="Courier", fontSize=7.5, textColor=SLATE, leading=11))]
     for t in types],
    colWidths=[2.8 * cm, 2.2 * cm, 12 * cm],
)
types_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 6),
    ("RIGHTPADDING", (0, 0), (-1, -1), 6),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LINEBELOW", (0, 0), (-1, -2), 0.3, HexColor("#e2e8f0")),
    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fcfdfe")),
]))
story.append(types_table)

story.append(Paragraph("3.2 衍生型別", style_h2))
story.append(kv_table([
    ("EmployeeLoad",        "Employee + { loadScore, percentile, level, timeWeightedCases, blockerLoad, mentionsWeighted, handoffLoad, ... }"),
    ("HealthSnapshot",      "{ blockerHealth, decisionTimeliness, handoffSmoothness, loadBalance, crossDept, reportQuality, overall, weekISO, events[] }"),
    ("DecisionImpact",      "{ decision, before, after, deltaOverall, deltaByDimension, verdict, score, insufficient?, daysSinceCompleted? }"),
    ("LeaderScore",         "{ decidedBy, totalDecisions, completedDecisions, avgImpactScore, positiveCount, neutralCount, negativeCount }"),
    ("DeptNetwork",         "{ matrix, edges[], stats, depts[] } — 部門互動圖"),
    ("ORI",                 "{ index, drivers: [{ code: HCC/DL/BT/CDC, value, weight }] }"),
]))

story.append(PageBreak())

# ========================================================================
# 第二部 演算法詳解
# ========================================================================

# ---------- 4. 資訊檢索 ----------
story.append(Paragraph("4. ① 資訊檢索演算法（6 項）", style_h1))

story.append(Paragraph("4.1 BM25F (Okapi BM25 with Field Weighting) — 主搜尋演算法", style_h2))
story.append(Paragraph("用途：歷史案件搜尋、智能推薦。Elasticsearch / Lucene 同款。", style_body))
story.append(formula(
    "score(q, d) = Σ_t∈q  idf(t) × Σ_f  field_weight(f) × tf_norm(t, d, f)<br/>"
    "<br/>"
    "tf_norm(t, d, f) = tf(t,d,f) × (k1 + 1)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ─────────────────────────────────────────────────<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; tf(t,d,f) + k1 × (1 − b + b × len(d,f) / avgLen(f))<br/>"
    "<br/>"
    "k1 = 1.5  (TF 飽和速度，1.2-2.0 為合理範圍)<br/>"
    "b  = 0.75 (長度正規化強度，0=不正規化 1=完全正規化)"
))
story.append(Paragraph("欄位權重表：title=5.0、tags=4.0、summary=2.0、outcome=1.5、owner=1.0、detail=1.0", style_body))
story.append(Paragraph("實作位置：<font face='Courier' size='9'>src/lib/historySearch.ts ─ buildIndex(), searchHistory()</font>", style_body))

story.append(Paragraph("4.2 Robertson-Sparck-Jones IDF — 詞權重", style_h2))
story.append(formula(
    "idf(t) = log(1 + (N − df(t) + 0.5) / (df(t) + 0.5))<br/>"
    "<br/>"
    "N    = 文件總數<br/>"
    "df(t) = 含詞 t 的文件數<br/>"
    "+0.5 = Lidstone smoothing"
))
story.append(Paragraph(
    "比 v1 的 <font face='Courier'>log(N/df)</font> 更穩健，stop word（的、了、是）會自動接近 0 分，"
    "罕見詞（東京中央銀行）獲得高分。", style_body))

story.append(Paragraph("4.3 多 n-gram 中文 Tokenization", style_h2))
story.append(formula(
    "tokenize('東京中央銀行'):<br/>"
    "&nbsp;&nbsp;1-gram: 東, 京, 中, 央, 銀, 行<br/>"
    "&nbsp;&nbsp;2-gram: 東京, 京中, 中央, 央銀, 銀行<br/>"
    "&nbsp;&nbsp;3-gram: 東京中, 京中央, 中央銀, 央銀行"
))
story.append(Paragraph(
    "中文無詞界，1+2+3-gram 混合切。投資領域多為 3-4 字術語（投委會、董事會、伊勢島飯店），3-gram 特別重要。",
    style_body))

story.append(Paragraph("4.4 Substring Boost", style_h2))
story.append(formula(
    "if document.toLowerCase().includes(query)  → score × 1.8<br/>"
    "if title.toLowerCase().includes(query)     → score × 1.4"
))
story.append(Paragraph(
    "解決 n-gram 把專有名詞拆碎後被「銀行」這種 high-DF 詞稀釋的問題。完整匹配優先級高。",
    style_body))

story.append(Paragraph("4.5 同義詞表（14 組）", style_h2))
story.append(code_block(
    "募資 ≈ 融資 ≈ 募款 ≈ fundraising<br/>"
    "盡調 ≈ 盡職調查 ≈ DD ≈ due diligence<br/>"
    "NDA ≈ 保密協議<br/>"
    "LOI ≈ 意向書<br/>"
    "估值 ≈ valuation ≈ 定價<br/>"
    "退場 ≈ exit ≈ 出場<br/>"
    "投委會 ≈ 投資委員會 ≈ IC<br/>"
    "董事會 ≈ board<br/>"
    "A 輪 ≈ A輪 ≈ series a<br/>"
    "Pre-A ≈ PreA ≈ 種子輪後<br/>"
    "法遵 ≈ compliance ≈ 合規<br/>"
    "稅務 ≈ tax<br/>"
    "風控 ≈ 風險管理 ≈ risk<br/>"
    "客戶 ≈ client ≈ customer"
))
story.append(Paragraph(
    "Tokenize 前統一替換為 canonical form。從長到短替換避免子字串覆蓋（先「盡職調查」再「盡調」）。",
    style_body))

story.append(Paragraph("4.6 Cosine Similarity（已退役）", style_h2))
story.append(formula("sim(q, d) = (q · d) / (||q|| × ||d||)"))
story.append(Paragraph(
    "v1 使用 TF-IDF + Cosine，因「線性 TF 計分」與「無欄位權重」兩個缺陷在 v2 被 BM25F 取代。"
    "本演算法不再用於主流程但保留說明，作為對照組。",
    style_body))

story.append(PageBreak())

# ---------- 5. 統計分析 ----------
story.append(Paragraph("5. ② 統計分析（3 項）", style_h1))

story.append(Paragraph("5.1 Empirical Percentile（經驗分位數）", style_h2))
story.append(formula(
    "percentile(arr, p):<br/>"
    "&nbsp;&nbsp;sorted = sort_asc(arr)<br/>"
    "&nbsp;&nbsp;n = len(sorted)<br/>"
    "&nbsp;&nbsp;idx = (n - 1) × p / 100<br/>"
    "&nbsp;&nbsp;lo, hi = floor(idx), ceil(idx)<br/>"
    "&nbsp;&nbsp;return sorted[lo] × (hi - idx) + sorted[hi] × (idx - lo)"
))
story.append(Paragraph(
    "線性內插版本，無需資料量很大也能給出合理 P75/P90/P95。用於卡點風險判定（對照同類歷史解決天數分布）"
    "與員工負載 percentile rank。",
    style_body))
story.append(Paragraph("實作位置：<font face='Courier' size='9'>src/lib/algorithms.ts ─ stats.percentile()</font>", style_body))

story.append(Paragraph("5.2 Gini Coefficient（不平均度）", style_h2))
story.append(formula(
    "Gini(scores) = Σᵢ (2i − n − 1) × score[i]  /  (n × Σ score[i])<br/>"
    "<br/>"
    "範圍 [0, 1]:<br/>"
    "&nbsp;&nbsp;0    = 完全公平（所有人負載相同）<br/>"
    "&nbsp;&nbsp;1    = 極端不公平（一人扛全部）<br/>"
    "&nbsp;&nbsp;0.35 = 管理警示門檻（不是公平 / 不公平的絕對裁判）"
))
story.append(Paragraph(
    "用於：(1) ORI 的 HCC 因子（人力集中度）。(2) 健康度的 loadBalance 維度。"
    "比「標準差」更直觀；標準差受平均值影響，Gini 為純不均度比例。",
    style_body))
story.append(Paragraph("實作位置：<font face='Courier' size='9'>src/lib/algorithms.ts (computeORI 內), src/lib/orgHealth.ts (loadBalance 內)</font>", style_body))

story.append(Paragraph("5.3 敘述統計（Mean / Std / Min / Max / Median）", style_h2))
story.append(formula(
    "stats.mean(arr) = Σ arr[i] / n<br/>"
    "stats.std(arr)  = √( Σ (arr[i] − mean)² / (n − 1) )<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (sample standard deviation, Bessel correction)"
))
story.append(Paragraph(
    "基礎統計工具。最常見用途：(a) ORI HCC 的 outlier 偵測（mean + 1.5 × std）。"
    "(b) 卡點分析的平均 percentile。(c) 健康度的平均完成天數。",
    style_body))

story.append(PageBreak())

# ---------- 6. 時間序列 ----------
story.append(Paragraph("6. ③ 時間序列（4 項）", style_h1))

story.append(Paragraph("6.1 Exponential Time Decay（指數時間衰減）", style_h2))
story.append(formula(
    "TIME_DECAY = [1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02]<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ↑      ↑     ↑     ↑      ↑    ...<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 本週  1週前  2週前  3週前  4週前<br/>"
    "<br/>"
    "weeksAgo = round((asOf − reportWeek) / 7 days)<br/>"
    "if weeksAgo >= 9: weight = 0   // 太久了直接忽略<br/>"
    "else: weight = TIME_DECAY[weeksAgo]"
))
story.append(Paragraph(
    "用於：員工負載分數的時間加權、cross-dept network 的時間範圍切片。"
    "決策依據：本週案件實質權重 1.0，4 週前剩 25%，9 週前完全忽略，符合「近期工作影響更大」的人類直覺。",
    style_body))

story.append(Paragraph("6.2 asOf Snapshot Computation — v2.1 重大重構", style_h2))
story.append(formula(
    "analyzeEmployeeLoad(reports, handoffs, employees, asOf: Date = NOW)<br/>"
    "analyzeBlockerRecord(blocker, historyDB, history, asOf: Date = NOW)<br/>"
    "computeHealthSnapshot(asOf, reports, handoffs, decisions, blockers, ...)<br/>"
    "isDecisionOverdueAt(d, asOf: Date = NOW)<br/>"
    "isDecisionCompletedAt(d, asOf: Date = NOW)<br/>"
    "<br/>"
    "規則：未來資料（reportDate > asOf）一律排除"
))
story.append(info_box(
    "為什麼 asOf 重要",
    "原本所有分析器內部用 new Date() → 12 週趨勢線每週數字相同（毫無資訊價值）。"
    "v2.1 新增 asOf 參數讓「歷史快照」反映該週時點的真實狀態，趨勢線從此有意義。",
    AMBER,
))

story.append(Paragraph("6.3 Local Minima Detection（拐點偵測）", style_h2))
story.append(formula(
    "function detectInflectionPoints(series):<br/>"
    "&nbsp;&nbsp;result = []<br/>"
    "&nbsp;&nbsp;for i in 1..n-2:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if series[i].overall &lt; series[i-1].overall − 3<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp; AND series[i].overall &lt; series[i+1].overall − 3:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;result.push(i)<br/>"
    "&nbsp;&nbsp;return result"
))
story.append(Paragraph(
    "閾值 3 分避免雜訊，只標真正顯著的 V 型谷底。在 12 週健康度趨勢圖上用紅點顯示。"
    "點選後展開該週事件清單。",
    style_body))

story.append(Paragraph("6.4 Weekly Series Computation（12 週快照序列）", style_h2))
story.append(formula(
    "function computeWeeklySeries(weeks: number = 12):<br/>"
    "&nbsp;&nbsp;out = []<br/>"
    "&nbsp;&nbsp;for i in weeks-1 downto 0:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;asOf_i = NOW − i × 7 days<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;out.push(computeHealthSnapshot(asOf_i, ...))<br/>"
    "&nbsp;&nbsp;return out  // 長度 12，由舊到新"
))
story.append(Paragraph(
    "對過去 12 週分別跑健康度快照。複雜度 O(12 × N)，N = 資料總量。"
    "在組織健康度卡片繪製趨勢線。",
    style_body))

story.append(PageBreak())

# ---------- 7. 加權評分 ----------
story.append(Paragraph("7. ④ 加權評分模型（5 項）", style_h1))

story.append(Paragraph("7.1 Weighted Load Score（員工負載）", style_h2))
story.append(formula(
    "loadScore = timeWeightedCases × 1.5<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + blockerLoad      × 2.0<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + mentionsWeighted × 0.8<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + handoffLoad      × 1.0<br/>"
    "<br/>"
    "Level 判定：<br/>"
    "&nbsp;&nbsp;overload = loadScore ≥ 25 OR percentile ≥ 90<br/>"
    "&nbsp;&nbsp;high     = loadScore ≥ 15 OR percentile ≥ 75<br/>"
    "&nbsp;&nbsp;normal   = loadScore ≥ 6<br/>"
    "&nbsp;&nbsp;low      = loadScore ≥ 1<br/>"
    "&nbsp;&nbsp;idle     = loadScore &lt; 1"
))
story.append(Paragraph("各分量定義：", style_body))
story.append(kv_table([
    ("timeWeightedCases", "員工的案件複雜度 × decay。複雜度 = 含「請/需/協助/跨部門」(×1.5) "
                          "或「卡/延/未通/缺漏/逾期」(×2.0) 等關鍵字權重。"),
    ("blockerLoad",       "員工負責的活躍卡點數 × 2.5 × decay（每筆卡點按 bullet 點數計）。"
                          "外層再 ×2.0，所以一筆卡點實質權重 ×5.0。"),
    ("mentionsWeighted",  "員工在他人週報中被提及的次數 × 1.5 × decay。"
                          "外層再 ×0.8，避免「常被提到但實際沒分配工作」者被高估。"),
    ("handoffLoad",       "員工作為交接接收者：待簽收 = 4 × decay、已簽收 = 1.5 × decay。"
                          "外層 ×1.0。"),
]))

story.append(Paragraph("7.2 ORI — Organizational Risk Index", style_h2))
story.append(formula(
    "ORI = 0.35 × HCC + 0.25 × DL + 0.25 × BT + 0.15 × CDC<br/>"
    "<br/>"
    "HCC = clamp(100 + (Gini − 0.35) × 400 + (top1 − 0.2) × 200 + outliers × 8, 0, 200)<br/>"
    "DL  = clamp(100 + (avgCompletionDays − 14) × 4 + overdueCount × 12, 0, 200)<br/>"
    "BT  = clamp(100 + (avgP − 50) × 1.5 + p90 × 8 + p95 × 12, 0, 200)<br/>"
    "CDC = clamp(100 + asymCount × 18 + asymRatio × 0.5, 0, 200)<br/>"
    "<br/>"
    "範圍 0-200，越低越健康"
))
story.append(Paragraph("五級告警：", style_body))
story.append(kv_table([
    ("ORI ≥ 175", "今天要花時間 — 整週都會被拖住"),
    ("ORI ≥ 150", "要注意 — 有事在惡化"),
    ("ORI ≥ 125", "可關注 — 少量需注意"),
    ("ORI ≥ 100", "還可以 — 整體穩定"),
    ("ORI <  100", "順利 — 公司運作正常"),
]))

story.append(Paragraph("7.3 Organization Health Score（6 維雷達） — v2.1 主指標", style_h2))
story.append(formula(
    "overall = blockerHealth      × 0.22<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + decisionTimeliness × 0.18<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + handoffSmoothness  × 0.15<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + loadBalance        × 0.18<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + crossDept          × 0.12<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; + reportQuality      × 0.15<br/>"
    "<br/>"
    "範圍 0-100，越高越健康"
))
story.append(Paragraph("六個維度子公式：", style_body))
story.append(kv_table([
    ("卡點健康 (22%)",  "100 − P95數 × 15 − P90數 × 7 − max(0, avgPercentile − 50) × 0.8"),
    ("決策及時 (18%)",  "100 − max(0, avgCompletionDays − 14) × 3 − overdueCount × 10"),
    ("交接流暢 (15%)",  "50 + completionRate × 50 − overdueHandoffs × 8"),
    ("負載均衡 (18%)",  "100 − max(0, Gini − 0.35) × 200 − overloadCount × 8"),
    ("部門協作 (12%)",  "100 − asymCount × 15"),
    ("週報品質 (15%)",  "min(1, submitRate) × 60 + lengthScore × 0.3 + blockerFillRate × 10"),
]))
story.append(Paragraph("五級評等：優異 (≥85) / 良好 (≥70) / 可關注 (≥55) / 需注意 (≥40) / 亟需介入 (&lt;40)", style_body))

story.append(Paragraph("7.4 Decision Impact Score（決策成效） — v2.1 新模型", style_h2))
story.append(formula(
    "before = computeHealthSnapshot(decidedAt − 1 day)<br/>"
    "afterWanted = completedAt + windowWeeks × 7  // windowWeeks = 4<br/>"
    "afterAsOf = min(afterWanted, NOW)  // clamp 避免取未來<br/>"
    "after = computeHealthSnapshot(afterAsOf)<br/>"
    "<br/>"
    "deltaOverall = after.overall − before.overall<br/>"
    "score = deltaOverall<br/>"
    "for each dimension:<br/>"
    "&nbsp;&nbsp;dimDelta = after.dim − before.dim<br/>"
    "&nbsp;&nbsp;if dimDelta ≥  3: score += 2<br/>"
    "&nbsp;&nbsp;if dimDelta ≤ −3: score −= 2<br/>"
    "score = clamp(score, −100, +100)<br/>"
    "<br/>"
    "verdict = score ≥  +3 → '正面'<br/>"
    "        ≤  −3 → '負面'<br/>"
    "        else → '中性'<br/>"
    "<br/>"
    "若 afterWanted > NOW: insufficient = true（標記「⏳ 追蹤中（暫評）」）"
))
story.append(info_box(
    "已知設計限制",
    "本算法假設「決策後的健康度變化 = 該決策的成效」，但實際上組織健康度受多重因素影響。"
    "若整體趨勢正在下滑，所有決策的 delta 都會偏負（不是它們的鍋）。"
    "建議搭配 Cohort Adjustment 或 Dimension-specific Impact 改進。",
    RED,
))

story.append(Paragraph("7.5 Leader Scorecard（主管成效排行）", style_h2))
story.append(formula(
    "function computeLeaderScores(data):<br/>"
    "&nbsp;&nbsp;groups = groupBy(data.decisions, d => d.decidedBy)<br/>"
    "&nbsp;&nbsp;for each (decidedBy, decisions) in groups:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;completed = filter completedAt ≤ NOW<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;impacts = completed.map(d => analyzeDecisionImpact(d, data))<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;avgImpactScore = mean(impacts.map(i => i.score))<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;positiveCount = impacts.filter(i => i.verdict === '正面').length<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;...<br/>"
    "&nbsp;&nbsp;sort by avgImpactScore desc"
))

story.append(PageBreak())

# ---------- 8. 圖論網絡 ----------
story.append(Paragraph("8. ⑤ 圖論 / 網絡分析（3 項）", style_h1))

story.append(Paragraph("8.1 Directed Weighted Adjacency Matrix", style_h2))
story.append(formula(
    "matrix: Record&lt;dept, Record&lt;dept, number&gt;&gt; = {}<br/>"
    "<br/>"
    "// 從週報文字萃取 mention<br/>"
    "for each report r:<br/>"
    "&nbsp;&nbsp;text = r.cases + r.blockers + r.needHelp + r.nextWeek<br/>"
    "&nbsp;&nbsp;for each target ≠ r.dept:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;count = number of target mentions in text<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;matrix[r.dept][target] += count<br/>"
    "<br/>"
    "// 從交接補強<br/>"
    "for each handoff h:<br/>"
    "&nbsp;&nbsp;matrix[h.from][h.to] += 1"
))
story.append(Paragraph("實作位置：<font face='Courier' size='9'>src/lib/algorithms.ts ─ analyzeDeptNetwork()</font>", style_body))

story.append(Paragraph("8.2 Force-directed Graph Layout", style_h2))
story.append(formula(
    "節點間斥力 (Coulomb-like):  F_rep = k_rep / distance²<br/>"
    "邊吸引力 (Hooke spring):    F_attr = k_attr × distance × edge_weight<br/>"
    "迭代:<br/>"
    "&nbsp;&nbsp;for step in 0..max_iter:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;for each node:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;net_force = Σ F_rep + Σ F_attr<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;velocity += net_force × dt<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;position += velocity × dt × damping"
))
story.append(Paragraph(
    "經典 D3.js 風格 force simulation。在 SVG 中以動畫迭代到平衡。節點大小依「對外溝通總量」、"
    "邊粗細依協作密度。",
    style_body))

story.append(Paragraph("8.3 Asymmetric Communication Detection（單向溝通偵測）", style_h2))
story.append(formula(
    "asymCount = 0<br/>"
    "for each (A, B) in depts × depts where A ≠ B:<br/>"
    "&nbsp;&nbsp;ab = matrix[A][B] || 0<br/>"
    "&nbsp;&nbsp;ba = matrix[B][A] || 0<br/>"
    "&nbsp;&nbsp;if ab ≥ 5 AND ba = 0:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;asymCount += 1<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;asymRatio += ab"
))
story.append(Paragraph(
    "識別「A 部門一直找 B，B 完全沒回應 A」這種組織病徵。每組扣 15-18 分到 ORI 的 CDC 維度與"
    "健康度的部門協作維度。",
    style_body))

story.append(PageBreak())

# ---------- 9. 狀態判定 ----------
story.append(Paragraph("9. ⑥ 狀態判定（2 項）", style_h1))

story.append(Paragraph("9.1 Decision Status Helpers — v2.1 新增", style_h2))
story.append(formula(
    "function isDecisionOverdueAt(d, asOf = NOW): boolean<br/>"
    "&nbsp;&nbsp;if !d.dueDate || d.dueDate === '即時生效': return false<br/>"
    "&nbsp;&nbsp;due = new Date(d.dueDate)<br/>"
    "&nbsp;&nbsp;if isNaN(+due): return false<br/>"
    "&nbsp;&nbsp;if +due >= +asOf: return false      // 截止日還沒到<br/>"
    "&nbsp;&nbsp;if d.completedAt:<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;completed = new Date(d.completedAt)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;if !isNaN(+completed) && +completed <= +asOf: return false<br/>"
    "&nbsp;&nbsp;return true<br/>"
    "<br/>"
    "function isDecisionInProgressAt(d, asOf):<br/>"
    "&nbsp;&nbsp;if !d.decidedAt || new Date(d.decidedAt) > asOf: return false<br/>"
    "&nbsp;&nbsp;if d.completedAt && new Date(d.completedAt) <= asOf: return false<br/>"
    "&nbsp;&nbsp;return !isDecisionOverdueAt(d, asOf)<br/>"
    "<br/>"
    "function isDecisionCompletedAt(d, asOf):<br/>"
    "&nbsp;&nbsp;if !d.completedAt: return false<br/>"
    "&nbsp;&nbsp;completed = new Date(d.completedAt)<br/>"
    "&nbsp;&nbsp;return !isNaN(+completed) && +completed <= +asOf<br/>"
    "<br/>"
    "function daysOverdue(d, asOf):<br/>"
    "&nbsp;&nbsp;if !isDecisionOverdueAt(d, asOf): return 0<br/>"
    "&nbsp;&nbsp;return max(0, round((+asOf − +new Date(d.dueDate)) / 86400000))"
))
story.append(info_box(
    "為什麼需要這套 helper",
    "v2.0 各頁面用 d.status === '逾期' 字串判斷，但 orgHealth 用動態日期判斷 → 兩套標準並存。"
    "v2.1 統一改用 helper，全系統一致，且自動偵測「dueDate 已過但 status 仍是執行中」的決策。",
    GREEN,
))

story.append(Paragraph("9.2 Risk / Load / Health Level — 多層級分類", style_h2))
story.append(Paragraph("<b>Blocker Level（卡點等級）：</b>", style_body))
story.append(code_block(
    "critical (極高風險) = currentDays ≥ P95 of 同類歷史<br/>"
    "high     (高風險)   = currentDays ≥ P90<br/>"
    "medium   (關注中)   = currentDays ≥ P75<br/>"
    "normal   (正常)     = otherwise"
))
story.append(Paragraph("<b>Employee Load Level：</b>", style_body))
story.append(code_block(
    "overload (過載) = loadScore ≥ 25 OR percentile ≥ 90<br/>"
    "high     (高)   = loadScore ≥ 15 OR percentile ≥ 75<br/>"
    "normal   (正常) = loadScore ≥ 6<br/>"
    "low      (低)   = loadScore ≥ 1<br/>"
    "idle     (閒置) = loadScore &lt; 1"
))
story.append(Paragraph("<b>Health Level：</b>", style_body))
story.append(code_block(
    "優異     = overall ≥ 85<br/>"
    "良好     = overall ≥ 70<br/>"
    "可關注   = overall ≥ 55<br/>"
    "需注意   = overall ≥ 40<br/>"
    "亟需介入 = overall &lt; 40"
))

story.append(PageBreak())

# ---------- 10. 預測模擬 ----------
story.append(Paragraph("10. ⑦ 預測 / 模擬（2 項）", style_h1))

story.append(Paragraph("10.1 What-if Scenario Simulation — v2.1 核心新功能", style_h2))
story.append(formula(
    "// State<br/>"
    "scenario = {<br/>"
    "&nbsp;&nbsp;resolvedBlockerIds:    Set&lt;string&gt;,  // 要解掉的卡點<br/>"
    "&nbsp;&nbsp;expeditedDecisionIds:  Set&lt;string&gt;,  // 加速完成的決策<br/>"
    "&nbsp;&nbsp;signedHandoffIds:      Set&lt;string&gt;,  // 立即簽收的交接<br/>"
    "&nbsp;&nbsp;extraHeadcount:        { [dept]: 0..5 }  // 額外人力<br/>"
    "}<br/>"
    "<br/>"
    "// 套用 scenario 產生 shadow data<br/>"
    "function applyScenario(data, scenario):<br/>"
    "&nbsp;&nbsp;newBlockers  = data.blockers.map(b => scenario.resolvedBlockerIds.has(b.id) ? {...b, status: 'resolved'} : b)<br/>"
    "&nbsp;&nbsp;newDecisions = data.decisions.map(d => scenario.expeditedDecisionIds.has(d.id) ? {...d, status: '已完成', completedAt: NOW} : d)<br/>"
    "&nbsp;&nbsp;newHandoffs  = data.handoffs.map(h => scenario.signedHandoffIds.has(h.id) ? {...h, status: '已簽收', hoursOverdue: undefined} : h)<br/>"
    "&nbsp;&nbsp;newEmployees = [...data.employees, ...generate(scenario.extraHeadcount)]<br/>"
    "<br/>"
    "// 對比<br/>"
    "baseline = computeHealthSnapshot(NOW, originalData)<br/>"
    "projected = computeHealthSnapshot(NOW, applyScenario(data, scenario))<br/>"
    "delta = projected.overall − baseline.overall<br/>"
    "deltaByDimension = projected.dim − baseline.dim  for each dim"
))
story.append(Paragraph("實作位置：<font face='Courier' size='9'>src/pages/WhatIf.tsx</font>", style_body))

story.append(Paragraph("10.2 Smart Suggestion（智能建議文案）", style_h2))
story.append(code_block(
    "if delta ≥  +5      → '顯著改善 ✨ 強烈建議執行'<br/>"
    "if delta in (+2, +5) → '有改善，可考慮執行'<br/>"
    "if delta in (−2, +2) → '影響不大，可保留資源'<br/>"
    "if delta in (−5, −2) → '略為惡化，需評估'<br/>"
    "if delta ≤  −5      → '顯著惡化 ⚠️ 不建議執行'"
))
story.append(Paragraph(
    "把 delta 數字轉成人類可讀的決策建議，降低管理層的解讀成本。"
    "搭配雙圖層雷達（灰色 = 現況、紫色 = 模擬後）視覺化。",
    style_body))

story.append(PageBreak())

# ---------- 11. 工具機制 ----------
story.append(Paragraph("11. ⑧ 工具機制（3 項）", style_h1))

story.append(Paragraph("11.1 Optimistic UI Sync（樂觀同步）", style_h2))
story.append(formula(
    "// 寫入流程<br/>"
    "user action<br/>"
    "&nbsp;&nbsp;↓<br/>"
    "setState(new value)            // 1. UI 立即更新<br/>"
    "&nbsp;&nbsp;↓<br/>"
    "useEffect 監聽到 state 變化<br/>"
    "&nbsp;&nbsp;↓<br/>"
    "syncStatus = 'syncing'<br/>"
    "saveDocumentCollection(name, value)   // 2. 寫 Firestore<br/>"
    "&nbsp;&nbsp;↓<br/>"
    "if ok: syncStatus = 'idle'<br/>"
    "else:  syncStatus = 'error'<br/>"
    "<br/>"
    "Sidebar 顯示同步狀態指示燈（綠/橙/紅）"
))

story.append(Paragraph("11.2 SEED Protection Thresholds（種子資料保護）", style_h2))
story.append(formula(
    "// 讀取流程<br/>"
    "rows = fetchDocumentCollection(name, SEED_FALLBACK)<br/>"
    "<br/>"
    "// reports / handoffs<br/>"
    "hasOldFormat = rows.some(r => /第\\s*\\d+\\s*週/.test(r.week))<br/>"
    "isEmpty = rows.length &lt; 10<br/>"
    "final = (hasOldFormat || isEmpty) ? SEED : rows<br/>"
    "<br/>"
    "// blockers / history / meetings / decisions / employees<br/>"
    "final = rows.length === 0 ? SEED : rows<br/>"
    "<br/>"
    "// departments / users (v2.1 新增)<br/>"
    "final = rows.length === 0 ? SEED : rows"
))
story.append(Paragraph("實作位置：<font face='Courier' size='9'>src/hooks/useAppData.ts</font>", style_body))

story.append(Paragraph("11.3 NaN Guards / Clamp（數值安全保護）", style_h2))
story.append(formula(
    "// Clamp（裁切到區間）<br/>"
    "clamp(v, lo, hi) = max(lo, min(hi, v))<br/>"
    "<br/>"
    "// NaN 檢查（日期）<br/>"
    "if !dateStr || dateStr === '即時生效': fallback<br/>"
    "d = new Date(dateStr)<br/>"
    "if isNaN(+d): fallback<br/>"
    "<br/>"
    "// 除法保護<br/>"
    "if denominator > 0:<br/>"
    "&nbsp;&nbsp;ratio = numerator / denominator<br/>"
    "else:<br/>"
    "&nbsp;&nbsp;return 0 // 或 '尚無資料'<br/>"
    "<br/>"
    "// Bounded ratio<br/>"
    "submissionRate = Math.min(1, submitted / expected)"
))

story.append(PageBreak())

# ========================================================================
# 第三部 常數與配置
# ========================================================================

# ---------- 12. 全域常數 ----------
story.append(Paragraph("12. 全域常數定義表", style_h1))

story.append(Paragraph("12.1 演算法常數", style_h2))
story.append(kv_table([
    ("k1 (BM25)",          "1.5 — TF 飽和速度。建議範圍 1.2-2.0。"),
    ("b (BM25)",           "0.75 — 長度正規化強度。0=不正規化、1=完全正規化。"),
    ("FIELD_WEIGHTS",      "title=5.0、tags=4.0、summary=2.0、outcome=1.5、owner=1.0、detail=1.0"),
    ("TIME_DECAY",         "[1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02] (9 週)"),
    ("Gini 公平/不公平分界", "0.35（學術標準）"),
    ("Local Minima 閾值",  "3 分（拐點顯著性）"),
    ("Decision Impact windowWeeks", "4 週"),
    ("Org Health 權重",    "卡點 22% / 決策 18% / 交接 15% / 負載 18% / 協作 12% / 週報 15%"),
    ("ORI 權重",           "HCC 35% / DL 25% / BT 25% / CDC 15%"),
    ("Load Score 權重",    "cases 1.5 / blocker 2.0 / mentions 0.8 / handoff 1.0"),
]))

story.append(Paragraph("12.2 等級閾值", style_h2))
story.append(kv_table([
    ("Blocker critical",   "currentDays ≥ P95"),
    ("Blocker high",       "currentDays ≥ P90"),
    ("Blocker medium",     "currentDays ≥ P75"),
    ("Load overload",      "loadScore ≥ 25 OR percentile ≥ 90"),
    ("Load high",          "loadScore ≥ 15 OR percentile ≥ 75"),
    ("Health 優異",        "overall ≥ 85"),
    ("Health 良好",        "overall ≥ 70"),
    ("Health 可關注",      "overall ≥ 55"),
    ("Decision Impact 正面", "score ≥ +3"),
    ("Decision Impact 負面", "score ≤ −3"),
    ("Handoff overdue 24h", "hoursOverdue ≥ 24 計入 critical"),
    ("Asymmetric 偵測",    "weight(A→B) ≥ 5 AND weight(B→A) = 0"),
]))

story.append(Paragraph("12.3 SEED 資料量", style_h2))
story.append(kv_table([
    ("SEED_EMPLOYEES",      "20 位（管理層 3 + 投研 8 + 業開 6 + 資管 4）"),
    ("SEED_REPORTS",        "~240 筆（80 週 × 3 部門 + 本週 3 筆手寫）"),
    ("SEED_HANDOFFS",       "~150 筆（80 週，每週 1-2 筆）"),
    ("SEED_HISTORY",        "53 筆（按 6 大類別分布）"),
    ("SEED_DECISIONS",      "18 筆（7 執行中 + 4 逾期 + 7 已完成）"),
    ("SEED_BLOCKERS",       "12 筆（2 極高 + 3 高 + 3 中 + 4 正常）"),
    ("SEED_MEETING_HISTORY", "12 場（週會 9 + 月會 3）"),
    ("caseRegistry (公司)", "26 家池井戶潤宇宙公司（金融、製造、IT、飯店、航空、建設）"),
]))

story.append(PageBreak())

# ---------- 13. SEED 結構 ----------
story.append(Paragraph("13. SEED 資料結構", style_h1))

story.append(Paragraph("13.1 真實企業池（caseRegistry）", style_h2))
story.append(Paragraph("依產業分類的 26 家虛構但具沉浸感的公司：", style_body))
story.append(code_block(
    "<b>金融 (9):</b> 東京中央銀行、白水銀行、大東京銀行、關西城市銀行、東京首都銀行、<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; 開發投資銀行、內海信用金庫、東京中央證券、太洋證券<br/>"
    "<b>製造 (6):</b> 西大阪鋼鐵、淡路鋼材、田宮電機、駒田工業、竹下金屬、牧野精機<br/>"
    "<b>IT (5):</b>   電腦雜技集團、斯派拉爾、電腦電設、Skyhope、Fox<br/>"
    "<b>飯店 (3):</b> 伊勢島飯店、伊勢志摩 State、福斯特連鎖酒店集團<br/>"
    "<b>其他 (3):</b> 帝國航空、小村建設、丸岡商工"
))

story.append(Paragraph("13.2 員工池（依部門）", style_h2))
story.append(kv_table([
    ("營運與管理層 (3)", "吳君(董事長)、陳文翰(COO)、黃詩涵(CFO)"),
    ("投資研究部 (7)",   "周世倫、鍾皓明、張偉、李宥廷、謝佳穎、王子翔、廖宜萱"),
    ("業務開發部 (6)",   "林聿平、林欣逸、蔡明遠、楊雅雯、羅宇晴、陳俊宏"),
    ("資產管理部 (4)",   "梁嘉芫、陳雅文、蘇柏豪、邱筱慧"),
]))

story.append(Paragraph("13.3 卡點類別（6 大類）", style_h2))
story.append(kv_table([
    ("法遵/合約",   "rose 色 · 平均 7-8 天 · 對應東京中央銀行、白水銀行等金融標的"),
    ("資金/募資",   "amber 色 · 平均 5-6 天 · 對應飯店、航空、製造類"),
    ("資料/補件",   "sky 色 · 平均 6-7 天 · 對應製造業 DD"),
    ("跨部門/窗口", "violet 色 · 平均 4-5 天 · 對應 IT 類"),
    ("決策/簽核",   "indigo 色 · 平均 8-10 天 · 對應大型銀行"),
    ("時程/聯繫",   "emerald 色 · 平均 5-6 天 · 對應飯店、航空"),
]))

story.append(PageBreak())

# ---------- 14. 色彩系統 ----------
story.append(Paragraph("14. 色彩系統與 UI 等級配色", style_h1))

story.append(Paragraph("14.1 健康度配色", style_h2))
story.append(kv_table([
    ("優異 (≥85)",    "emerald-600 / emerald-500 / emerald-50"),
    ("良好 (≥70)",    "blue-600 / blue-500 / blue-50"),
    ("可關注 (≥55)",  "amber-600 / amber-500 / amber-50"),
    ("需注意 (≥40)",  "orange-600 / orange-500 / orange-50"),
    ("亟需介入 (<40)", "red-600 / red-500 / red-50"),
]))

story.append(Paragraph("14.2 卡點風險配色", style_h2))
story.append(kv_table([
    ("critical (極高)", "red-500 + 紅色 gradient"),
    ("high (高)",       "amber-500 + 琥珀 gradient"),
    ("medium (關注)",   "blue-500"),
    ("normal (正常)",   "emerald-500"),
]))

story.append(Paragraph("14.3 部門配色", style_h2))
story.append(kv_table([
    ("投資研究部", "blue (藍 — 研究、分析)"),
    ("業務開發部", "emerald (綠 — 開發、成長)"),
    ("資產管理部", "violet (紫 — 風險、長期)"),
    ("營運與管理層", "slate (灰 — 中性)"),
]))

story.append(Paragraph("14.4 速度標籤配色（歷史搜尋）", style_h2))
story.append(kv_table([
    ("快速解決 (≤3 天)", "emerald-50 / emerald-600"),
    ("正常解決 (4-7 天)", "blue-50 / blue-600"),
    ("較慢解決 (8-14 天)", "amber-50 / amber-600"),
    ("嚴重延誤 (>14 天)", "rose-50 / rose-600"),
]))

story.append(PageBreak())

# ========================================================================
# 第四部 UI 與互動
# ========================================================================

# ---------- 15. 11 個頁面 ----------
story.append(Paragraph("15. 11 個主要頁面與功能矩陣", style_h1))

pages = [
    ("Dashboard",         "管理層摘要儀表板",  "整體狀態 + 3 Hero Cards + 組織健康度 + 今日 3 件事"),
    ("WeeklyReport",      "週報填寫 + 歷史",   "本週狀態 3 卡 + 填寫表單 + 歷史 12 週累積"),
    ("Handoff",           "案件交接",         "2 大狀態板 + 列表 + Modal 詳情 + 智能推薦"),
    ("Decisions",         "決策追蹤",         "3 大狀態板 + 主管成效排行 + Decision Impact 詳情"),
    ("EmployeeLoad",      "員工負載 + 週次切換", "12 週切換器 + 過載/閒置篩選 + 4 元素 breakdown"),
    ("History",           "歷史案件搜尋",      "BM25F 搜尋 + 速度標籤 + 類別 chip + 詳情 Modal"),
    ("BlockerAnalytics",  "卡點分析",         "4 風險磚 + 點擊展開卡點清單 + 類別分布"),
    ("OrgAnalytics",      "部門互動網絡",      "Force-directed SVG + 時間範圍 + 節點點擊"),
    ("MeetingPrep",       "會議準備",         "3 卡片視覺議程 + 歷史會議分類"),
    ("WhatIf",            "決策模擬器 (v2.1)", "4 情境模組 + 雙圖層雷達 + 智能建議"),
    ("LineBot",           "LINE 推播設定",     "推播規則 + 訂閱者 + 範本"),
]
pg_table = Table(
    [[Paragraph(f"<b>{p[0]}</b>", ParagraphStyle("pn", fontName=CN, fontSize=9.5, textColor=BLUE, leading=13)),
      Paragraph(p[1], ParagraphStyle("pl", fontName=CN, fontSize=9.5, textColor=NAVY, leading=13)),
      Paragraph(p[2], ParagraphStyle("pd", fontName=CN, fontSize=9, textColor=NAVY, leading=12))]
     for p in pages],
    colWidths=[3 * cm, 4 * cm, 10 * cm],
)
pg_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LINEBELOW", (0, 0), (-1, -2), 0.3, HexColor("#e2e8f0")),
    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fcfdfe")),
]))
story.append(pg_table)

story.append(PageBreak())

# ---------- 16. 權限模型 ----------
story.append(Paragraph("16. 權限模型與角色", style_h1))

story.append(Paragraph("16.1 三層角色", style_h2))
story.append(kv_table([
    ("admin (管理員)",   "看全部 11 個分頁。董事長、COO、CFO"),
    ("manager (主管)",   "看 8 個分頁（不含員工負載、組織分析、會議準備）。各部門主管"),
    ("member (一般員工)", "看 4 個分頁（Dashboard、週報、交接、LineBot）"),
]))

story.append(Paragraph("16.2 角色推斷邏輯", style_h2))
story.append(formula(
    "function inferUserProfile(email): UserProfile<br/>"
    "&nbsp;&nbsp;從 users collection 查 email 完全匹配<br/>"
    "&nbsp;&nbsp;if 找到 → 用該 SystemUser 的 role 欄位<br/>"
    "&nbsp;&nbsp;else → fallback 為 'member'<br/>"
    "&nbsp;&nbsp;補上 displayName, dept 等推斷欄位"
))

story.append(Paragraph("16.3 頁面權限檢查", style_h2))
story.append(code_block(
    "// App.tsx<br/>"
    "if (navItem && !navItem.roles.includes(userRole)) {<br/>"
    "&nbsp;&nbsp;setActiveTab('dashboard')   // 強制跳回首頁<br/>"
    "}<br/>"
    "<br/>"
    "// Sidebar.tsx<br/>"
    "const items = NAV.filter(n => n.roles.includes(role || 'member'))"
))

story.append(PageBreak())

# ---------- 17. 通知中心 ----------
story.append(Paragraph("17. 通知中心與事件流", style_h1))

story.append(Paragraph("17.1 通知來源（4 大類）", style_h2))
story.append(formula(
    "function buildNotifications(data):<br/>"
    "&nbsp;&nbsp;list = []<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 1. P95+ / P90+ 高風險卡點<br/>"
    "&nbsp;&nbsp;blockers.filter(level in ['critical', 'high']).top(5)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;→ list.push({ level: 'critical'/'warn', tab: 'analytics' })<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 2. 逾期決策<br/>"
    "&nbsp;&nbsp;decisions.filter(isDecisionOverdueAt).top(5)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;→ list.push({ level: 'critical', tab: 'decisions' })<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 3. 待簽收 + 逾時 24h 交接<br/>"
    "&nbsp;&nbsp;handoffs.filter(status='待簽收' && hoursOverdue > 0).top(5)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;→ list.push({ level: (≥48h ? 'critical' : 'warn'), tab: 'handoff' })<br/>"
    "<br/>"
    "&nbsp;&nbsp;// 4. 本週未交週報的部門<br/>"
    "&nbsp;&nbsp;activeDepts.filter(!submitted)<br/>"
    "&nbsp;&nbsp;&nbsp;&nbsp;→ list.push({ level: 'info', tab: 'report' })<br/>"
    "<br/>"
    "&nbsp;&nbsp;return list"
))

story.append(Paragraph("17.2 視覺呈現", style_h2))
story.append(kv_table([
    ("徽章顏色",   "紅(有 critical) / 黃(僅 warn) / 無(空)"),
    ("徽章數字",   "totalCount，超過 9 顯示 '9+'"),
    ("展開行為",   "點擊鈴鐺 → 滑出 96 寬下拉、點外面關閉、點 X 關閉"),
    ("項目互動",   "點任一項 → onNavigate(tab) 跳對應頁面 + 關閉面板"),
    ("空狀態",     "顯示 ✓ 圖示 + 「一切順利 ✨」"),
]))

story.append(PageBreak())

# ========================================================================
# 第五部 工程實踐
# ========================================================================

# ---------- 18. Bug 修復記錄 ----------
story.append(Paragraph("18. Bug 修復記錄（v2.0 → v2.1）", style_h1))
story.append(Paragraph(
    "agent 深度掃描報告找出的 9 件 bug，於 commit 5a0cfd4 一次修復。涵蓋跨頁面數據一致性、邊界條件、SEED 保護。",
    style_body,
))

bugs = [
    ("B1", "🔴 確定", "Dashboard analyzeBlockerRecord 漏傳 history",
     "percentile / level 與其他頁不一致",
     "補上第 3 個參數 history"),
    ("B5", "🔴 確定", "analyzeBlockerRecord 用 new Date() 算 currentDays",
     "歷史快照 days 永遠偏大、12 週趨勢不準",
     "新增 asOf 參數，預設 NOW；orgHealth + OrgHealthCard 都傳入"),
    ("B2", "🔴 確定", "d.status === '逾期' 字串 vs orgHealth 動態判定",
     "兩套標準並存，用戶看到健康度被扣分卻找不到對應決策",
     "新增 4 helper (isDecisionOverdueAt 等)，全系統統一改用"),
    ("B3", "🔴 確定", "dueDate 為 'NaN 字串' 或 '即時生效'",
     "畫面顯示「逾期 NaN 天」",
     "helper 內部 isNaN 檢查 + clamp to 0"),
    ("B6", "🔴 確定", "decisionImpact.afterAsOf 落在未來",
     "「決策後快照 = 現況快照」，無法區分前後影響",
     "clamp 到 NOW，未滿 4 週標記「⏳ 追蹤中」"),
    ("B8", "🟡 潛在", "orgHealth submissionRate 可超過 1",
     "管理層交週報導致分子大於分母、reportQuality 異常高",
     "分母與分子皆過濾 expectedDeptSet，加 Math.min(1, ...)"),
    ("B9", "🟡 潛在", "EmployeeLoad 過載百分比在空資料",
     "顯示 'NaN%'",
     "加 loads.length > 0 守門"),
    ("B7", "🟡 潛在", "Firestore departments / users 集合誤刪",
     "setDepartments([]) → 整個 app 崩潰",
     "兩個集合都加 SEED fallback"),
    ("B11", "🟢 建議", "Dashboard 未使用的 Sparkles import",
     "TS 雖然通過但程式碼整潔度差",
     "移除"),
]
bug_table = Table(
    [[Paragraph(f"<b>{b[0]}</b>", ParagraphStyle("bg_id", fontName=CN, fontSize=8.5, textColor=RED, leading=11)),
      Paragraph(b[1], ParagraphStyle("bg_t", fontName=CN, fontSize=8, leading=11, textColor=NAVY)),
      Paragraph(f"<b>{b[2]}</b><br/><font color='#475569' size='8'>{b[3]}</font>",
                ParagraphStyle("bg_p", fontName=CN, fontSize=8.5, leading=11, textColor=NAVY)),
      Paragraph(b[4], ParagraphStyle("bg_f", fontName=CN, fontSize=8.5, leading=11, textColor=GREEN))]
     for b in bugs],
    colWidths=[1 * cm, 1.4 * cm, 8 * cm, 6.6 * cm],
)
bug_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 5),
    ("RIGHTPADDING", (0, 0), (-1, -1), 5),
    ("TOPPADDING", (0, 0), (-1, -1), 5),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ("LINEBELOW", (0, 0), (-1, -2), 0.3, HexColor("#e2e8f0")),
    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fcfdfe")),
]))
story.append(bug_table)

story.append(PageBreak())

# ---------- 19. 設計限制 ----------
story.append(Paragraph("19. 已知設計限制與未來改進方向", style_h1))

story.append(Paragraph("19.1 Decision Impact 的因果歸因問題", style_h2))
story.append(Paragraph(
    "本算法假設「決策後的健康度變化 = 該決策的成效」。實際上組織健康度受多重因素影響："
    "若整體趨勢正在下滑（如目前 SEED 中 5 週前到本週掉了 18 分），所有完成於此期間的決策，"
    "其 delta 都會偏負，不是它們的鍋。<br/><br/>"
    "<b>改進方向</b>：",
    style_body,
))
story.append(Paragraph(
    "(A) <b>Cohort Adjustment</b>：每筆決策的 delta 扣掉同期基準變化。adjusted_delta = decision_delta − baseline_delta_of_period。<br/>"
    "(B) <b>Window Shortening</b>：4 週 → 1 週，減少其他事件干擾。<br/>"
    "(C) <b>Dimension-specific Impact</b>：只比較決策直接相關的維度。<br/>"
    "(D) <b>Causal Inference</b>：加 propensity score matching 或更複雜的 attribution model。",
    style_body,
))

story.append(Paragraph("19.2 歷史快照的 percentile 偏差", style_h2))
story.append(Paragraph(
    "analyzeBlockerRecord 現已接受 asOf，但 stats.percentile 是對「現在的歷史資料」算分位。"
    "若想完全還原 5 週前的 percentile，需要對該週的「同類歷史 + asOf 之前已解決」過濾。"
    "目前簡化為用全部 history（53 筆）算 percentile，誤差不大但非完美。",
    style_body,
))

story.append(Paragraph("19.3 Force-directed Layout 收斂", style_h2))
story.append(Paragraph(
    "目前 SVG 實作為簡化版（無 quadtree、無 alpha decay），對於 7 個部門節點足夠，"
    "但部門數 >20 時會明顯卡頓。改進方向：(A) 用 D3 force simulation 套件 (B) Worker 卸載計算。",
    style_body,
))

story.append(Paragraph("19.4 What-if 加員工的 loadBalance 影響", style_h2))
story.append(Paragraph(
    "目前模擬員工 loadScore = 0，Gini 反而可能被「全 0 員工」拉高（不均度增加）。"
    "改進方向：模擬時把 overload 員工的部分分數平移到新員工（reassignment 機制）。",
    style_body,
))

story.append(Paragraph("19.5 BM25F 對純英文查詢", style_h2))
story.append(Paragraph(
    "目前 n-gram 主要針對中文（一-龥 Unicode range）。英文用 \\w+ 整詞匹配，無 stemming（如 \"investing\" 與 \"investment\" 不互通）。"
    "改進方向：加 Porter Stemmer 或 Snowball。",
    style_body,
))

story.append(PageBreak())

# ---------- 20. 設計哲學 ----------
story.append(Paragraph("20. 演算法選用對照與設計哲學", style_h1))

story.append(Paragraph("20.1 對照表", style_h2))
story.append(kv_table([
    ("資訊檢索",    "BM25F（Lucene 同款）— 而非 TF-IDF cosine 或 LLM Embedding"),
    ("風險量化",    "Empirical Percentile — 而非絕對天數門檻"),
    ("不平均度",    "Gini 係數（經濟學標準）— 而非標準差"),
    ("時間衰減",    "Exponential Decay 含 asOf 切片 — 支援歷史快照"),
    ("拐點偵測",    "Local Minima — 而非機器學習 anomaly detection"),
    ("組織網絡",    "Force-directed Graph + 雙向 Matrix"),
    ("決策狀態",    "動態日期判定 helper — 不依賴可能過期的 status 字串"),
    ("決策成效",    "前後快照對比 + 時間 clamp 避免未來"),
    ("文字搜尋",    "純前端 BM25F — 不送 cloud API"),
]))

story.append(Paragraph("20.2 為什麼不用 LLM?", style_h2))
story.append(Paragraph(
    "(1) <b>資料量小</b>：53 筆歷史案、240 筆週報、150 筆交接。BM25F 比 Embedding 更可靠且零成本。<br/>"
    "(2) <b>可解釋性</b>：管理層需要知道「為什麼推薦這筆」，BM25F 可逐項列出命中詞貢獻。<br/>"
    "(3) <b>機密敏感</b>：投資公司資料不能送 cloud API，本系統全部前端 + 自有 Firebase。<br/>"
    "(4) <b>計算成本</b>：BM25F、Gini、percentile 都是 O(N) 或 O(N log N)，瀏覽器毫秒級。<br/>"
    "(5) <b>確定性</b>：相同輸入永遠回傳相同結果，LLM 有 stochasticity。",
    style_body,
))

story.append(Paragraph("20.3 Plan → Decide → Track → Learn 閉環", style_h2))
story.append(Paragraph(
    "v2.1 形成完整的決策週期：<br/><br/>"
    "&nbsp;&nbsp;<b>Plan</b>（規劃） · 卡點分析 + 員工負載 + 組織健康度 看現狀<br/>"
    "&nbsp;&nbsp;<b>Decide</b>（決策） · What-if 模擬器 決策前看後果<br/>"
    "&nbsp;&nbsp;<b>Track</b>（執行） · 決策追蹤 + 交接 + 週報<br/>"
    "&nbsp;&nbsp;<b>Learn</b>（學習） · Decision Impact 量化效益、Leader 排行<br/><br/>"
    "下次做決策時，系統可用過去的 impact 推薦類似類型 — 形成自我強化的決策智慧。",
    style_body,
))

story.append(PageBreak())

# ========================================================================
# 附錄
# ========================================================================

# ---------- A. 演算法快速索引 ----------
story.append(Paragraph("附錄 A. 演算法快速索引（25 項對應檔案）", style_h1))

summary = [
    ("#",  "演算法",                              "類別",         "檔案 + 函式"),
    ("1",  "BM25F",                               "資訊檢索",     "historySearch.ts ─ searchHistory()"),
    ("2",  "Robertson-Sparck-Jones IDF",          "資訊檢索",     "historySearch.ts ─ buildIndex()"),
    ("3",  "多 n-gram Tokenization",              "資訊檢索",     "historySearch.ts ─ tokenize()"),
    ("4",  "Substring Boost",                     "資訊檢索",     "historySearch.ts ─ searchHistory()"),
    ("5",  "Synonym Normalization",               "資訊檢索",     "historySearch.ts ─ SYNONYM_MAP"),
    ("6",  "Cosine Similarity (退役)",            "資訊檢索",     "v1 歷史"),
    ("7",  "Empirical Percentile",                "統計",         "algorithms.ts ─ stats.percentile()"),
    ("8",  "Gini Coefficient",                    "統計",         "algorithms.ts + orgHealth.ts"),
    ("9",  "Mean / Std / Median",                 "統計",         "algorithms.ts ─ stats"),
    ("10", "Exponential Time Decay",              "時間序列",     "algorithms.ts ─ getDecayWeight"),
    ("11", "asOf Snapshot",                       "時間序列",     "algorithms.ts + orgHealth.ts"),
    ("12", "Local Minima Detection",              "時間序列",     "orgHealth.ts ─ detectInflectionPoints()"),
    ("13", "Weekly Series",                       "時間序列",     "orgHealth.ts ─ computeWeeklySeries()"),
    ("14", "Weighted Load Score",                 "加權評分",     "algorithms.ts ─ analyzeEmployeeLoad()"),
    ("15", "ORI Index",                           "加權評分",     "algorithms.ts ─ computeORI()"),
    ("16", "Org Health 6D Score",                 "加權評分",     "orgHealth.ts ─ computeHealthSnapshot()"),
    ("17", "Decision Impact Score",               "加權評分",     "decisionImpact.ts ─ analyzeDecisionImpact()"),
    ("18", "Leader Scorecard",                    "加權評分",     "decisionImpact.ts ─ computeLeaderScores()"),
    ("19", "Adjacency Matrix",                    "圖論",         "algorithms.ts ─ analyzeDeptNetwork()"),
    ("20", "Force-directed Layout",               "圖論",         "OrgAnalytics.tsx"),
    ("21", "Asymmetric Detection",                "圖論",         "algorithms.ts + orgHealth.ts"),
    ("22", "Decision Status Helpers",             "狀態判定",     "algorithms.ts ─ isDecisionOverdueAt 等"),
    ("23", "Risk / Load / Health Level",          "狀態判定",     "各檔"),
    ("24", "What-if Scenario Simulation",         "預測模擬",     "WhatIf.tsx ─ applyScenario"),
    ("25", "Smart Suggestion",                    "預測模擬",     "WhatIf.tsx"),
]
header_style = ParagraphStyle("hd", fontName=CN, fontSize=9.5, leading=12, textColor=BLUE)
cell_style   = ParagraphStyle("cl", fontName=CN, fontSize=8.5, leading=11, textColor=NAVY)
header = [Paragraph(f"<b>{h}</b>", header_style) for h in summary[0]]
body_rows = [
    [Paragraph(str(r[0]), cell_style),
     Paragraph(r[1], cell_style),
     Paragraph(r[2], cell_style),
     Paragraph(f"<font face='Courier' size='7.5'>{r[3]}</font>",
               ParagraphStyle("c", fontName="Courier", fontSize=7.5, leading=10, textColor=SLATE))]
    for r in summary[1:]
]
summary_tbl = Table([header] + body_rows, colWidths=[0.8 * cm, 5 * cm, 2.5 * cm, 8.7 * cm])
summary_tbl.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, 0), HexColor("#eff6ff")),
    ("LINEBELOW",  (0, 0), (-1, 0), 0.6, BLUE),
    ("VALIGN",     (0, 0), (-1, -1), "MIDDLE"),
    ("LEFTPADDING",(0, 0), (-1, -1), 5),
    ("RIGHTPADDING",(0, 0), (-1, -1), 5),
    ("TOPPADDING", (0, 0), (-1, -1), 4),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ("LINEBELOW", (0, 1), (-1, -2), 0.2, HexColor("#e2e8f0")),
]))
story.append(summary_tbl)

story.append(PageBreak())

# ---------- B. 公式速查 ----------
story.append(Paragraph("附錄 B. 公式速查表", style_h1))

formulas = [
    ("BM25 TF",         "(tf × (k1+1)) / (tf + k1 × (1 − b + b × len/avgLen))"),
    ("RSJ IDF",         "log(1 + (N − df + 0.5) / (df + 0.5))"),
    ("Substring Boost", "doc.contains(q) → ×1.8 ; title.contains(q) → ×1.4"),
    ("Percentile",      "sorted[ (n−1) × p/100 ] (linear interp)"),
    ("Gini",            "Σ (2i−n−1) × s[i] / (n × Σ s[i])"),
    ("Time Decay",      "[1.0, 0.7, 0.5, 0.35, 0.25, 0.15, 0.1, 0.05, 0.02]"),
    ("Local Minima",    "s[i] < s[i−1] − 3 AND s[i] < s[i+1] − 3"),
    ("Load Score",      "cases×1.5 + blocker×2.0 + mentions×0.8 + handoff×1.0"),
    ("ORI",             "0.35×HCC + 0.25×DL + 0.25×BT + 0.15×CDC"),
    ("Org Health",      "0.22×blocker + 0.18×decision + 0.15×handoff + 0.18×load + 0.12×cross + 0.15×report"),
    ("Decision Impact", "deltaOverall + Σ(dim ±2)，clamp [−100, +100]"),
    ("Overdue Check",   "dueDate < asOf AND (!completedAt OR completedAt > asOf)"),
    ("Days Overdue",    "max(0, round((asOf − dueDate) / 86400000))"),
    ("Asym Comm",       "weight(A→B) ≥ 5 AND weight(B→A) = 0"),
    ("Health Level",    "≥85優異 / ≥70良好 / ≥55可關注 / ≥40需注意 / <40亟需介入"),
]
fl_table = Table(
    [[Paragraph(f"<b>{f[0]}</b>", ParagraphStyle("ft", fontName=CN, fontSize=9.5, textColor=BLUE, leading=12)),
      Paragraph(f"<font face='Courier' size='8.5'>{f[1]}</font>",
                ParagraphStyle("ff", fontName="Courier", fontSize=8.5, textColor=NAVY, leading=12))]
     for f in formulas],
    colWidths=[3.5 * cm, 13 * cm],
)
fl_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("LEFTPADDING", (0, 0), (-1, -1), 8),
    ("RIGHTPADDING", (0, 0), (-1, -1), 8),
    ("TOPPADDING", (0, 0), (-1, -1), 6),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ("LINEBELOW", (0, 0), (-1, -2), 0.3, HexColor("#e2e8f0")),
    ("BACKGROUND", (0, 0), (-1, -1), HexColor("#fcfdfe")),
]))
story.append(fl_table)

story.append(PageBreak())

# ---------- C. FAQ ----------
story.append(Paragraph("附錄 C. FAQ — 教授可能問的 12 個問題", style_h1))

faqs = [
    ("Q1: 為什麼用 BM25F 不用 GPT Embedding?",
     "資料量小（200 筆級別）、可解釋性、機密敏感、零成本、確定性。詳見 §20.2。"),
    ("Q2: 健康度分數怎麼算的?",
     "6 維加權平均，公式見 §7.3。每維度有獨立子公式（卡點 P95+ 扣 15、決策逾期扣 10...）。"),
    ("Q3: 為什麼 Gini 0.35 是分界?",
     "0.35 來自分配不均研究的參考區間；在本系統中只作為負載離散程度的管理警示門檻，需搭配過載人數與角色差異判讀。"),
    ("Q4: 12 週趨勢線的拐點怎麼找的?",
     "Local Minima Detection，閾值 3 分避免雜訊。詳見 §6.3。"),
    ("Q5: Decision Impact 全是負分，怎麼回事?",
     "因果歸因限制，組織整體趨勢下滑期間的決策都會被「冤枉」。改進方向見 §19.1。"),
    ("Q6: 為什麼員工負載要用 percentile?",
     "公司規模不同、產業淡旺季不同，固定門檻不適用。Percentile 自動適應分布。"),
    ("Q7: 時間衰減為什麼選指數而非滑動視窗?",
     "指數平滑漸進；滑動視窗有「邊緣斷裂」問題。本週案件不會 8 週後突然消失。"),
    ("Q8: 健康度跟 ORI 有什麼不同?",
     "兩者底層共享分析器。ORI 0-200 反向（內部 dashboard 用）、健康度 0-100 正向（管理層 demo）。"),
    ("Q9: 部門協作維度怎麼算?",
     "從週報文字 + 交接紀錄萃取部門 mention，建構有向圖。偵測單向溝通（A→B ≥5、B→A=0）扣分。"),
    ("Q10: What-if 模擬器的數學基礎?",
     "對原始資料 fork shadow data，套用修改後重跑 computeHealthSnapshot。雙圖層雷達對比 delta。"),
    ("Q11: 為什麼決策有「執行中 / 逾期」兩個狀態但用 helper 動態判定?",
     "v2.0 用 status 字串時，dueDate 過期但 status 未更新會錯。v2.1 改動態判定避免人為誤差。"),
    ("Q12: 系統未來可以怎麼擴展?",
     "(A) 卡點解決時間預測（多元迴歸）(B) 員工技能向量化 + 智能分派 (C) 投組即時行情看板 "
     "(D) 一鍵董事會 PDF (E) 語音輸入週報。詳見聊天歷程的「亮點建議」。"),
]
faq_rows = []
for q, a in faqs:
    faq_rows.append([
        Paragraph(f"<b><font color='#3b82f6'>{q}</font></b>",
                  ParagraphStyle("fq", fontName=CN, fontSize=10, leading=14, textColor=BLUE)),
    ])
    faq_rows.append([
        Paragraph(a,
                  ParagraphStyle("fa", fontName=CN, fontSize=9.5, leading=14, textColor=NAVY, leftIndent=8, spaceAfter=10)),
    ])
faq_table = Table(faq_rows, colWidths=[17 * cm])
faq_table.setStyle(TableStyle([
    ("VALIGN", (0, 0), (-1, -1), "TOP"),
    ("TOPPADDING", (0, 0), (-1, -1), 2),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 2),
]))
story.append(faq_table)

story.append(Spacer(1, 1 * cm))
story.append(hr())
story.append(Spacer(1, 0.4 * cm))
story.append(Paragraph(
    "<b>串連系統 v2.1 完整技術參考手冊</b><br/>"
    "<font color='#94a3b8'>共 25 演算法 / 機制、11 個 UI 模組、10 個 collection、9 件 bug 修復記錄。</font><br/><br/>"
    "<i>「資料越少，演算法的選擇越重要。」</i><br/>"
    "<i>「跨頁面的一致性，比單頁的炫技更重要。」</i><br/><br/>"
    "—— 串連系統設計哲學",
    ParagraphStyle("end", fontName=CN, fontSize=10, textColor=GREY, leading=16),
))

# ============= 輸出 =============
import os
os.makedirs("docs", exist_ok=True)
out_path = "docs/串連系統_完整技術手冊.pdf"


def add_footer(canvas, doc):
    canvas.saveState()
    canvas.setFont(CN, 8)
    canvas.setFillColor(GREY)
    canvas.drawString(2 * cm, 1 * cm, "串連系統 v2.1 · 完整技術參考手冊")
    canvas.drawRightString(19 * cm, 1 * cm, f"第 {doc.page} 頁")
    canvas.restoreState()


doc = SimpleDocTemplate(
    out_path, pagesize=A4,
    leftMargin=2 * cm, rightMargin=2 * cm,
    topMargin=2 * cm, bottomMargin=2 * cm,
    title="串連系統 v2.1 — 完整技術參考手冊",
    author="資管導論 第 13 組",
)
doc.build(story, onFirstPage=add_footer, onLaterPages=add_footer)
print(f"OK -> {out_path}")
