# 串聯系統

串聯系統是為串聯股份有限公司設計的管理決策支援系統。公司以投資業務為核心，業務開發部負責開發資金來源與維護投資人關係，資產管理部負責投資操作，投資研究部則提供基本面交易所需的研究報告。

系統將原本分散的週報、案件交接與管理資訊集中整理，協助管理層快速掌握組織狀況，也讓不同部門能延續過去案件累積的經驗。

線上展示：[https://chuanlien-system-v2.vercel.app/](https://chuanlien-system-v2.vercel.app/)

## 主要功能

| 模組 | 用途 |
|---|---|
| Dashboard 儀表板 | 彙整重要指標、組織健康度與待處理事項 |
| WeeklyReport 週報 | 集中填寫與查閱每週工作進度 |
| Handoff 案件交接 | 記錄交接對象、狀態與逾時情形 |
| Decisions 決策追蹤 | 管理決策事項、負責人與執行期限 |
| EmployeeLoad 員工負載 | 依案件、卡點、被提及次數與交接估算工作負載 |
| History 歷史搜尋 | 使用 BM25F、中文 n-gram 與 PMI 共現擴展搜尋過往案件 |
| Blocker 卡點分析 | 以歷史處理時間、分位數與 2σ/3σ 訊號辨識優先處理項目 |
| OrgAnalytics 組織分析 | 檢視跨部門互動與溝通狀況 |
| MeetingPrep 會議準備 | 彙整會議前需要追蹤的重點 |
| What-if 決策模擬 | 比較解決卡點、加速決策、完成交接或調整負載後的健康度變化 |

## 組織健康度

Dashboard 與 What-if 模組以五個面向呈現組織健康度：

| 面向 | 權重 |
|---|---:|
| 決策及時 | 28% |
| 交接流暢 | 24% |
| 部門協作 | 20% |
| 卡點健康 | 16% |
| 負載均衡 | 12% |

這些指標用於輔助管理者辨識風險與安排處理順序，不代表員工績效評分。

## 角色權限

| 角色 | 可使用範圍 |
|---|---|
| `admin` 管理層 | 全部模組 |
| `manager` 部門主管 | 基本模組、決策追蹤、歷史搜尋、卡點分析與 What-if 模擬 |
| `member` 一般員工 | Dashboard、週報與案件交接 |

## 技術架構

- 前端：React 19、TypeScript、Vite、Tailwind CSS
- 圖表與互動：Recharts、Motion、Lucide React
- 登入與資料儲存：Firebase Authentication、Cloud Firestore
- 部署：Vercel

## 本地開發

```bash
npm install
cp .env.example .env.local
npm run dev
```

請在 `.env.local` 填入 Firebase 專案設定。開發伺服器預設位於 [http://localhost:3000](http://localhost:3000)。

```bash
npm run lint
npm run build
npm run validate:params
```

## 專案結構

```text
src/
├─ components/       # 共用元件與系統框架
├─ hooks/            # Firebase 資料同步
├─ lib/              # 型別、演算法與測試資料
└─ pages/            # 各功能頁面
```

演算法參數與限制說明請參考 [`docs/methodology.md`](docs/methodology.md)。

## 團隊

資訊管理導論第 13 組，2026。
