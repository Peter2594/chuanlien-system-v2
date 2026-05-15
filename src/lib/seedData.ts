/**
 * 種子資料（程序化產生 + 詳細故事）
 * 從 project/src/App.jsx 遷移而來
 */
import { NOW, getISOWeek, formatWeekLabel } from "./dateUtils";
import { BLOCKER_CATEGORIES } from "./constants";
import type {
  Report, Handoff, Decision, Blocker, HistoryCase, Employee, MeetingHistory,
} from "./types";

const CURRENT_WEEK_LABEL = formatWeekLabel(0);

// ===== 員工 =====
export const SEED_EMPLOYEES: Employee[] = [
  { name: "吳君",   dept: "營運與管理層", role: "董事長" },
  { name: "陳文翰", dept: "營運與管理層", role: "營運總監(COO)" },
  { name: "黃詩涵", dept: "營運與管理層", role: "財務長(CFO)" },
  { name: "周世倫", dept: "投資研究部",   role: "資深研究員" },
  { name: "鍾皓明", dept: "投資研究部",   role: "資深研究員" },
  { name: "張偉",   dept: "投資研究部",   role: "研究員" },
  { name: "李宥廷", dept: "投資研究部",   role: "研究員" },
  { name: "謝佳穎", dept: "投資研究部",   role: "研究助理" },
  { name: "王子翔", dept: "投資研究部",   role: "研究助理" },
  { name: "廖宜萱", dept: "投資研究部",   role: "產業分析師" },
  { name: "林聿平", dept: "業務開發部",   role: "業務經理" },
  { name: "林欣逸", dept: "業務開發部",   role: "業務專員" },
  { name: "蔡明遠", dept: "業務開發部",   role: "業務專員" },
  { name: "楊雅雯", dept: "業務開發部",   role: "客戶關係經理" },
  { name: "羅宇晴", dept: "業務開發部",   role: "業務助理" },
  { name: "陳俊宏", dept: "業務開發部",   role: "新業務開發" },
  { name: "梁嘉芫", dept: "資產管理部",   role: "資管總監" },
  { name: "陳雅文", dept: "資產管理部",   role: "資管經理" },
  { name: "蘇柏豪", dept: "資產管理部",   role: "投資組合分析師" },
  { name: "邱筱慧", dept: "資產管理部",   role: "風險管理專員" },
];

// ===== 程序化產生週報 (49 週歷史) =====
const seedRandom = (seed: number) => {
  let s = seed * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
};
const pick = <T,>(arr: T[], rnd: () => number) => arr[Math.floor(rnd() * arr.length)];

const seasonTopics = (date: Date) => {
  const m = date.getMonth() + 1;
  if (m <= 3) return ["Q1", "年度規劃", "新年開工"];
  if (m <= 6) return ["Q2", "年中盤點", "中期評估"];
  if (m <= 9) return ["Q3", "暑期會議", "結算"];
  return ["Q4", "年底結算", "明年規劃"];
};
const caseRegistry = [
  { code: "A 新創" }, { code: "B 公司" }, { code: "C 標的" }, { code: "D 客戶" },
  { code: "E 標的" }, { code: "F 標的" }, { code: "G 公司" }, { code: "H 案件" },
  { code: "I 標的" }, { code: "J 案件" }, { code: "K 公司" }, { code: "L 標的" },
  { code: "M 平台" }, { code: "N 公司" }, { code: "P 公司" }, { code: "R 公司" },
];
const blockerPool: Record<string, string[]> = {
  research: ["財務資料延遲", "法律意見書未到", "競品數據缺漏", "估值假設待管理層拍板", "盡調訪談排程困難"],
  biz:      ["客戶聯繫困難", "NDA 條款談判中", "客戶決策慢", "創辦人行程難排", "競標對手出價"],
  asset:    ["法遵審核排隊", "稅務試算複雜", "風險模型參數待確認", "投組季報缺資料", "預算審批流程"],
};
const helpPool: Record<string, string[]> = {
  research: ["請業開部聯繫客戶補資料", "需資管部協助評估風險", "需管理層拍板方向"],
  biz:      ["需投研部加速產業評估", "需資管部協助 NDA", "需管理層確認預算"],
  asset:    ["需投研部提供風險評估", "需業開部引介稅務顧問", "需管理層核准方案"],
};

function buildReports(): Report[] {
  const out: Report[] = [];
  const targetStart = new Date(2025, 5, 1);
  const oldestRequired = Math.ceil((+NOW - +targetStart) / (86400000 * 7));

  for (let weeksAgo = 1; weeksAgo <= oldestRequired; weeksAgo++) {
    const target = new Date(NOW);
    target.setDate(target.getDate() - weeksAgo * 7);
    const wkNum = getISOWeek(target);
    const wkLabel = formatWeekLabel(weeksAgo);
    const sd = (() => {
      const d = new Date(target);
      d.setDate(d.getDate() + 6); // 週日
      return d.toISOString().slice(0, 10);
    })();
    const rnd = seedRandom(wkNum * 137 + target.getFullYear());
    const seasons = seasonTopics(target);

    const depts = [
      { dept: "投資研究部", author: "周世倫", key: "research", verbs: ["盡調", "估值", "產業分析", "競品比較", "財務模型"] },
      { dept: "業務開發部", author: "林聿平", key: "biz",      verbs: ["接觸", "簽約", "NDA", "提案", "客戶開發"] },
      { dept: "資產管理部", author: "梁嘉芫", key: "asset",    verbs: ["法遵審核", "投組季報", "稅務評估", "募資配置", "退場評估"] },
    ];

    depts.forEach((d, j) => {
      const cases: string[] = [];
      const numCases = 2 + Math.floor(rnd() * 3);
      const used = new Set<string>();
      for (let k = 0; k < numCases; k++) {
        const c = pick(caseRegistry, rnd);
        if (used.has(c.code)) continue;
        used.add(c.code);
        const verb = pick(d.verbs, rnd);
        cases.push(`• ${c.code} ${verb}${rnd() > 0.7 ? `(進度 ${40 + Math.floor(rnd() * 50)}%)` : ""}`);
      }
      if (rnd() > 0.6) cases.push(`• ${pick(seasons, rnd)}相關工作`);

      const blocker = rnd() > 0.45 ? pick(blockerPool[d.key], rnd) : "";
      const help    = rnd() > 0.5  ? pick(helpPool[d.key], rnd)    : "";

      const keywords = [...Array.from(used).slice(0, 3), pick(seasons, rnd)];
      if (rnd() > 0.6) keywords.push(pick(d.verbs, rnd));

      out.push({
        id: `r-w${target.getFullYear()}-${wkNum}-${j + 1}`,
        dept: d.dept,
        week: wkLabel,
        author: d.author,
        submittedAt: `${sd} 17:${(j + 1) * 12}`,
        cases: cases.join("\n"),
        blockers: blocker,
        needHelp: help,
        nextWeek: `推進${Array.from(used)[0] || "本週"}進度`,
        keywords,
      });
    });
  }
  return out;
}

export const SEED_REPORTS: Report[] = buildReports();

// ===== 程序化產生交接單 =====
function buildHandoffs(): Handoff[] {
  const out: Handoff[] = [];
  const deptPairs = [
    { from: "業務開發部", to: "投資研究部", sender: "林聿平", receiver: "周世倫" },
    { from: "業務開發部", to: "投資研究部", sender: "林欣逸", receiver: "鍾皓明" },
    { from: "業務開發部", to: "資產管理部", sender: "林聿平", receiver: "梁嘉芫" },
    { from: "業務開發部", to: "資產管理部", sender: "蔡明遠", receiver: "陳雅文" },
    { from: "投資研究部", to: "業務開發部", sender: "周世倫", receiver: "林聿平" },
    { from: "投資研究部", to: "業務開發部", sender: "鍾皓明", receiver: "林欣逸" },
    { from: "投資研究部", to: "資產管理部", sender: "周世倫", receiver: "梁嘉芫" },
    { from: "資產管理部", to: "投資研究部", sender: "梁嘉芫", receiver: "周世倫" },
    { from: "資產管理部", to: "業務開發部", sender: "陳雅文", receiver: "蔡明遠" },
  ];
  const caseTypes = [
    { code: "A 新創", actions: ["盡職調查委託", "財報補件追蹤", "估值區間確認"] },
    { code: "B 公司", actions: ["產業分析委託", "競品比較表審閱", "投資契約準備"] },
    { code: "C 標的", actions: ["二次訪談紀錄", "估值試算", "投委會決議轉達"] },
    { code: "D 客戶", actions: ["NDA 草案審閱", "客戶背景調查", "簽約時程確認"] },
    { code: "E 標的", actions: ["教育科技初評", "創辦人面談紀錄", "市場調研"] },
    { code: "F 標的", actions: ["醫療法規審查", "市場大小估算", "客戶留存分析"] },
    { code: "G 公司", actions: ["客戶接觸排程", "管理層會議", "投資簡報"] },
    { code: "K 公司", actions: ["退場稅務評估", "退場時機分析", "投組季報資料"] },
    { code: "L 標的", actions: ["法律意見書追蹤", "監管風險評估", "結案報告"] },
    { code: "M 平台", actions: ["盡調進度同步", "客戶結構分析", "估值期待對齊"] },
    { code: "N 公司", actions: ["技術盡調", "客戶訪談紀錄", "財務模型驗證"] },
    { code: "P 公司", actions: ["A 輪追加評估", "董事會資料審閱", "KPI 達成檢視"] },
  ];
  const statuses: Handoff["status"][] = ["已簽收", "已簽收", "已簽收", "已簽收", "待簽收"];

  let id = 100;
  for (let weeksAgo = 1; weeksAgo <= 49; weeksAgo++) {
    const target = new Date();
    target.setDate(target.getDate() - weeksAgo * 7);
    const rnd = seedRandom(weeksAgo * 211 + 17);
    const num = rnd() > 0.4 ? 2 : 1;
    for (let i = 0; i < num; i++) {
      const pair = pick(deptPairs, rnd);
      const c = pick(caseTypes, rnd);
      const action = pick(c.actions, rnd);
      const status = pick(statuses, rnd);
      const dayOffset = Math.floor(rnd() * 5);
      const createdAt = new Date(target);
      createdAt.setDate(createdAt.getDate() + dayOffset);
      const handoff: Handoff = {
        id: "h" + id++,
        from: pair.from,
        to: pair.to,
        caseId: `C-${createdAt.getFullYear()}-${String(id).padStart(3, "0")}`,
        title: `${c.code} ${action}`,
        background: `${c.code} 為近期持續推進的案件，本次需 ${pair.to} 協助完成 ${action}。`,
        progress: rnd() > 0.5 ? "前置準備已完成。" : "初步資料整理中。",
        todo: `完成 ${action}，並回覆評估結果。`,
        attachments: [`${c.code}_${action}.pdf`],
        status,
        sender: pair.sender,
        receiver: pair.receiver,
        createdAt: createdAt.toISOString().slice(0, 10),
      };
      if (status === "待簽收" && weeksAgo <= 2) {
        handoff.hoursOverdue = pick([12, 24, 48, 72], rnd);
      }
      out.push(handoff);
    }
  }
  return out;
}

export const SEED_HANDOFFS: Handoff[] = buildHandoffs();

// ===== 決策 (精簡示範) =====
const daysAgoIso = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
};
const daysFromNowIso = (n: number) => {
  const d = new Date(NOW);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

export const SEED_DECISIONS: Decision[] = [
  { id: "d1", title: "A 新創 Pre-A 輪投資金額上限", content: "決議對 A 新創 Pre-A 輪投資上限為 3,000 萬，估值不得高於 4 億。",
    decidedBy: "投資委員會", decidedAt: daysAgoIso(9), dueDate: daysFromNowIso(5), assignedDept: "投資研究部",
    status: "執行中", linkedCases: ["C-2025-042"], notes: "需於期限前完成投資條件書草擬。" },
  { id: "d2", title: "Q4 分潤機制檢討", content: "決議調整資產管理部 Q4 分潤比例，由 80/20 改為 75/25。",
    decidedBy: "董事會", decidedAt: daysAgoIso(28), dueDate: daysAgoIso(8), assignedDept: "資產管理部",
    status: "逾期", notes: "預期上線時程已延後。" },
  { id: "d3", title: "設立法遵專員職位", content: "因應法遵案件增加，董事會決議招募 1 位法遵專員。",
    decidedBy: "董事會", decidedAt: daysAgoIso(40), dueDate: daysFromNowIso(60), assignedDept: "營運與管理層",
    status: "執行中", notes: "人事部已開始徵才流程。" },
  { id: "d4", title: "年度預算追加 500 萬", content: "因應新案件量增加，決議追加 Q4 營運預算 500 萬。",
    decidedBy: "董事會", decidedAt: daysAgoIso(45), dueDate: daysAgoIso(30), assignedDept: "營運與管理層",
    status: "已完成", completedAt: daysAgoIso(28), notes: "撥款已完成。" },
  { id: "d5", title: "暫停評估 Web3 類標的", content: "因應監管環境不明，決議暫停所有 Web3 類新案件深度盡調。",
    decidedBy: "投資委員會", decidedAt: daysAgoIso(35), dueDate: "即時生效", assignedDept: "投資研究部",
    status: "已完成", completedAt: daysAgoIso(34) },
];

// ===== 卡點 (簡化) =====
export const SEED_BLOCKERS: Blocker[] = [
  {
    id: "b-1", title: "A 新創財務資料尚未收齊",
    description: "創辦人提供之 2024 年度財報為簡化版，需正式版才能進行估值。",
    dept: "投資研究部", owner: "周世倫", category: "資料/補件",
    status: "open", createdAt: daysAgoIso(14), updatedAt: daysAgoIso(2),
    weekId: CURRENT_WEEK_LABEL, caseId: "A 新創",
    relatedDepartments: ["業務開發部"],
  },
  {
    id: "b-2", title: "D 客戶 NDA 條款有異議",
    description: "D 客戶法務對 NDA 條款有 3 點異議，已轉給資管部審閱中。",
    dept: "業務開發部", owner: "林聿平", category: "法遵/合約",
    status: "open", createdAt: daysAgoIso(5), updatedAt: daysAgoIso(1),
    weekId: CURRENT_WEEK_LABEL, caseId: "D 客戶",
    relatedDepartments: ["資產管理部"],
  },
  {
    id: "b-3", title: "法遵審核等待管理層決議",
    description: "K 公司退場稅務優化方案需董事會決議才能繼續。",
    dept: "資產管理部", owner: "梁嘉芫", category: "決策/簽核",
    status: "open", createdAt: daysAgoIso(8), updatedAt: daysAgoIso(1),
    weekId: CURRENT_WEEK_LABEL, caseId: "K 公司",
    relatedDepartments: ["營運與管理層"],
  },
];

// ===== 歷史案件 (簡化 - 完整 53 筆會在後續批次中遷移) =====
export const SEED_HISTORY: HistoryCase[] = (() => {
  const out: HistoryCase[] = [];
  let id = 1;
  BLOCKER_CATEGORIES.slice(0, 6).forEach((cat) => {
    [2, 5, 9, 14, 22].forEach((days) => {
      const weeksAgo = Math.floor(Math.random() * 30) + 4;
      const cd = new Date(NOW);
      cd.setDate(cd.getDate() - weeksAgo * 7);
      const speed = days <= 3 ? "快速解決" : days <= 7 ? "正常解決" : days <= 14 ? "較慢解決" : "嚴重延誤";
      out.push({
        id: `bh${id++}`,
        title: `${cat.label}類案件 #${id}`,
        date: `${cd.getFullYear()}/${String(cd.getMonth() + 1).padStart(2, "0")}/${String(cd.getDate()).padStart(2, "0")}`,
        tags: [cat.label, "歷史案件", speed],
        summary: `${cat.label}類卡點，歷時 ${days} 天完成解決。`,
        owner: ["周世倫", "林聿平", "梁嘉芫"][id % 3],
        handoffs: 1 + (id % 3),
        outcome: `已解決 · ${days} 天`,
        detail: {
          background: `本卡點屬於「${cat.label}」類別，主要關鍵字：${cat.keywords.slice(0, 3).join("、")}`,
          process: `共歷時 ${days} 天完成解決。`,
          valuation: `解決時間：${days} 天`,
          keyInsights: [`${cat.label}類卡點需要謹慎處理`],
          result: `已成功解決，共花費 ${days} 天。`,
          lessons: `本案處理${speed === "嚴重延誤" ? "時間較長，建議下次提前介入" : "效率良好"}。`,
        },
      });
    });
  });
  return out;
})();

// ===== 會議歷史 (簡化) =====
export const SEED_MEETING_HISTORY: MeetingHistory[] = (() => {
  const out: MeetingHistory[] = [];
  for (let i = 1; i <= 12; i++) {
    const target = new Date(NOW);
    target.setDate(target.getDate() - i * 7);
    out.push({
      id: `mh-${i}`,
      title: i % 4 === 0 ? "月會 · 投資委員會" : "週會（管理層 × 三部門）",
      schedule: i % 4 === 0 ? "每月第二週四" : "每週一 09:00",
      audience: "董事長、COO、三部門主管",
      icon: i % 4 === 0 ? "💼" : "📅",
      archivedAt: target.toISOString().slice(0, 10),
      archivedBy: "system@chuanlien.com",
      agendaSnapshot: [
        { id: "a1", title: "三部門進度同步", priority: "high", notes: "已決議：後續由各部門主管追蹤" },
        { id: "a2", title: "本週重要議題討論", priority: "high", notes: "持續追蹤" },
        { id: "a3", title: "卡點處理進度", priority: "medium", notes: "建立追蹤機制" },
      ],
      textSnapshot: `會議日期：${target.toISOString().slice(0, 10)}\n議程：三部門進度 / 卡點處理`,
    });
  }
  return out;
})();
