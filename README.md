# 串連股份有限公司 · 管理層決策輔助系統 v2.0

> 給中小型投資/管理顧問公司（20–50 人）的單一窗口，
> 讓董事長 5 分鐘看完「公司今天怎麼樣 + 我要做什麼」。

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)]()
[![Tailwind](https://img.shields.io/badge/Tailwind-4-06B6D4?logo=tailwindcss)]()
[![Firebase](https://img.shields.io/badge/Firebase-10-FFCA28?logo=firebase)]()

---

## 🎯 系統定位

**不是賣 Dashboard，是賣 3 個獨家演算法。**

| 亮點演算法 | 解決什麼 | 競品做不到的 |
|---|---|---|
| **加權員工負載**（Andy Grove × 時間衰減 × Gini） | 找出「被高度依賴的單點失敗節點」 | Notion / Asana 只看任務數 |
| **BM25F + 中文 n-gram 歷史檢索** | 把過去案件變可搜尋的組織記憶 | LINE / Email 散落無法檢索 |
| **卡點經驗百分位** | 用同類歷史推算「拖太久」 | SLA 太死板，不貼真實 |

---

## 📦 技術棧

- **前端**：React 19 + TypeScript + Vite 6 + Tailwind CSS v4
- **動畫**：Framer Motion (`motion/react`)
- **圖表**：Recharts + SVG (自繪)
- **後端**：Firebase Authentication + Cloud Firestore

---

## 🚀 本地開發

```bash
# 1. 安裝
npm install

# 2. (選用) 設定 Firebase 環境變數
cp .env.example .env.local
# 編輯 .env.local 填入 Firebase 設定；未設定會快速失敗，避免誤連正式資料庫

# 3. 啟動
npm run dev
```

瀏覽器自動開啟 [http://localhost:3000](http://localhost:3000)

**測試帳號**（需先在 Firebase Console 建立）：
- `admin@test.com` · 管理層
- `manager-research@test.com` · 部門主管
- `member@test.com` · 一般員工

---

## 📁 專案結構

```
src/
├─ App.tsx                  # 主路由 + auth gate
├─ lib/
│  ├─ firebase.ts           # 認證 + Firestore CRUD
│  ├─ types.ts              # TypeScript 型別
│  ├─ algorithms.ts         # 員工負載 / 卡點分位數 / ORI
│  ├─ historySearch.ts      # BM25F + n-gram + PMI 共現擴展 + Substring Boost
│  ├─ seedData.ts           # 程序化產生 150 週報 / 79 交接
│  ├─ constants.ts          # 部門 / 卡點類別 / 使用者
│  └─ dateUtils.ts          # 週次工具
├─ hooks/
│  └─ useAppData.ts         # Firebase 雙向同步
├─ components/
│  ├─ Login.tsx
│  ├─ Shell/                # Sidebar + Header
│  └─ ui/                   # Card / Button / Pill / Modal / PageHeader
└─ pages/
   ├─ Dashboard.tsx         # ★ 3 個亮點 Hero Card
   ├─ WeeklyReport.tsx
   ├─ Handoff.tsx
   ├─ Decisions.tsx
   ├─ EmployeeLoad.tsx      # ★ 加權模型 + 詳情拆解
   ├─ History.tsx           # ★ BM25F 全文檢索（含 n-gram、PMI 共現、Substring Boost）
   ├─ BlockerAnalytics.tsx  # ★ 分位數風險面板
   ├─ OrgAnalytics.tsx      # SVG 部門互動網絡
   └─ MeetingPrep.tsx
```

---

## 🧮 核心演算法

### 1. 加權員工負載 (Weighted Load Model)

```
W_total = Σ (decay × complexity)  +  blocker × 2.5
        + mentions × 1.5
        + handoff × 1.5 (pending × 4)
```

- 時間衰減：本週 1.0 / 上週 0.7 / 2 週前 0.4 / 3 週前 0.15
- 複雜度權重：跨部門 ×1.5 / 卡點相關 ×2.0
- 分位數比較：個人 vs 全公司分布

### 2. BM25F + 中文特化

```
score = Σ_f w_f · IDF(t) · TF(t,f) / (TF(t,f) + k₁(1 − b + b·dl/avgdl))
k₁ = 1.5, b = 0.75  (Lucene 預設)
欄位權重 w_f：標題 5 / 標籤 4 / 摘要 2 / 結論 1.5 / 負責人 1 / 內文 1
```

- 中文 1/2/3-gram tokenize（解決中文無空格）
- PMI 共現擴展：從歷史資料自動學「常一起出現」的詞，不再維護寫死同義詞表
- Substring Boost（中文無 stemming，前綴匹配補救）
- 業界對標：Lucene / Elasticsearch / Notion 全文搜尋皆用 BM25 家族

### 3. 卡點經驗百分位

```
percentile(d) = |{ h ∈ history : h.daysToResolve ≤ d }| / |history|
```

- 不假設常態分佈
- 優先使用同類歷史，不足 5 筆則用全公司
- 風險等級：3σ critical / 2σ high / P75 medium / 其他 normal，P90/P95 只作為歷史分位參考

### 4. ORI (Organizational Risk Index)

```
ORI = 0.35·HCC + 0.25·DL + 0.25·BT + 0.15·CDC
```

- HCC: Human Capital Concentration (Gini + Top-1 share + σ outliers)
- DL: Decision Latency (平均執行 + 逾期)
- BT: Blocker Tail Risk (2σ/3σ 數量 + 平均分位)
- CDC: Cross-Dept Communication (不對稱次數)


### 5. Organization Health Weights

The organization-health score now uses an arithmetic progression by management priority:

| Rank | Dimension | Weight |
| --- | --- | --- |
| 1 | Decision timeliness | 0.28 |
| 2 | Handoff smoothness | 0.24 |
| 3 | Cross-department collaboration | 0.20 |
| 4 | Blocker health | 0.16 |
| 5 | Load balance | 0.12 |

Each step subtracts 0.04 by rank and the weights sum to 1.00, so priority is clear without letting one dimension dominate the total score.

---

## 🔐 角色權限

| 角色 | 可看模組 |
|---|---|
| **admin** (管理層) | 全部 10 個分頁 |
| **manager** (部門主管) | 7 個（除員工負載、組織分析、會議準備） |
| **member** (一般員工) | 3 個（Dashboard、週報、交接） |

---

## 📝 Build

```bash
npm run build      # 產出 dist/
npm run preview    # 本地預覽 production build
npm run lint       # TypeScript 型別檢查
```

**Production bundle：256 KB gzipped**

---

## 👥 開發團隊

資管導論 第 13 組 · 2026

---

## 📄 License

Apache-2.0
