/**
 * 員工負荷模型驗證
 *
 * 目的：
 * 1. 用極端測資檢查排序是否符合管理直覺
 * 2. 用 seed data 檢查 Top-N 是否可由 breakdown 解釋
 * 3. 用權重敏感度分析證明模型不依賴精確小數點
 *
 * 執行：npx tsx scripts/employee_load_validation.ts
 */
import { analyzeEmployeeLoad } from "../src/lib/algorithms";
import { NOW, formatWeekLabel, parseWeekStart } from "../src/lib/dateUtils";
import { SEED_EMPLOYEES, SEED_HANDOFFS, SEED_REPORTS } from "../src/lib/seedData";
import type { Employee, Handoff, Report } from "../src/lib/types";

interface Weights {
  timeDecay: number[];
  caseNormal: number;
  caseRequest: number;
  caseBlocker: number;
  blockerWeight: number;
  mentionWeight: number;
  handoffNormal: number;
  handoffPending: number;
}

const BASELINE: Weights = {
  timeDecay: [1.0, 0.7, 0.4, 0.15],
  caseNormal: 1.0,
  caseRequest: 1.5,
  caseBlocker: 2.0,
  blockerWeight: 2.5,
  mentionWeight: 1.5,
  handoffNormal: 1.5,
  handoffPending: 4.0,
};

const employees: Employee[] = [
  { name: "A_多案件", dept: "投資部", role: "member" },
  { name: "B_卡點壓力", dept: "投資部", role: "member" },
  { name: "C_常被提及", dept: "研究部", role: "member" },
  { name: "D_待簽交接", dept: "營運部", role: "member" },
  { name: "E_低負荷", dept: "財務部", role: "member" },
];

function report(id: string, author: string, cases: string, blockers = "", needHelp = "", nextWeek = ""): Report {
  return {
    id,
    dept: employees.find((e) => e.name === author)?.dept || "投資部",
    week: formatWeekLabel(0),
    author,
    submittedAt: NOW.toISOString(),
    cases,
    blockers,
    needHelp,
    nextWeek,
    keywords: [],
  };
}

function handoff(id: string, receiver: string, status: Handoff["status"]): Handoff {
  return {
    id,
    from: "投資部",
    to: employees.find((e) => e.name === receiver)?.dept || "營運部",
    caseId: id,
    title: `${receiver} 測試交接`,
    background: "validation fixture",
    progress: "validation fixture",
    todo: "validation fixture",
    attachments: [],
    status,
    sender: "外部交接人",
    receiver,
    createdAt: NOW.toISOString(),
  };
}

const extremeReports: Report[] = [
  report("r-a", "A_多案件", [
    "- 一般案件 1",
    "- 一般案件 2",
    "- 一般案件 3",
    "- 一般案件 4",
    "- 一般案件 5",
  ].join("\n")),
  report("r-b", "B_卡點壓力", [
    "- 一般案件 1",
    "- 一般案件 2",
  ].join("\n"), [
    "- 法遵資料未到，卡住投委會排程",
    "- 客戶補件延遲，估值模型無法收斂",
  ].join("\n")),
  report("r-c-source", "A_多案件", [
    "- 與 C_常被提及 對齊模型假設",
    "- 請 C_常被提及 協助產業資料",
    "- 研究部回覆待確認",
  ].join("\n"), "", "", "C_常被提及 下週 review"),
  report("r-e", "E_低負荷", "- 一般案件 1"),
];

const extremeHandoffs: Handoff[] = [
  handoff("h-d-1", "D_待簽交接", "待簽收"),
  handoff("h-d-2", "D_待簽交接", "待簽收"),
  handoff("h-d-3", "D_待簽交接", "待簽收"),
  handoff("h-d-4", "D_待簽交接", "待簽收"),
  handoff("h-d-5", "D_待簽交接", "待簽收"),
];

function computeLoads(
  reports: Report[],
  handoffs: Handoff[],
  employees: Employee[],
  w: Weights,
  asOf: Date,
): { name: string; score: number }[] {
  const asOfMs = +asOf;

  const getDecay = (weekStr: string) => {
    const d = parseWeekStart(weekStr);
    if (!d || +d > asOfMs) return 0;
    const weeksAgo = Math.max(0, Math.round((asOfMs - +d) / (86400000 * 7)));
    return weeksAgo >= w.timeDecay.length ? 0 : w.timeDecay[weeksAgo];
  };

  const reportComplexity = (r: Report) => {
    const lines = (r.cases || "").split("\n").filter((l) => /^\s*[•\-*]/.test(l));
    return lines.reduce((total, line) => {
      if (/卡|延|未通|缺漏|未到|逾期/.test(line)) return total + w.caseBlocker;
      if (/請|需|協助|跨部門|部$/.test(line)) return total + w.caseRequest;
      return total + w.caseNormal;
    }, 0);
  };

  return employees.map((emp) => {
    let cases = 0;
    let blocker = 0;
    let mentions = 0;
    let handoff = 0;

    reports.forEach((r) => {
      const decay = getDecay(r.week);
      if (decay === 0) return;
      if (r.author === emp.name) {
        cases += reportComplexity(r) * decay;
        if (r.blockers?.trim()) {
          const count = Math.max(1, (r.blockers.match(/[•\-]/g) || []).length);
          blocker += count * w.blockerWeight * decay;
        }
      } else {
        const text = `${r.cases || ""}\n${r.blockers || ""}\n${r.needHelp || ""}\n${r.nextWeek || ""}`;
        const hits = (text.match(new RegExp(emp.name, "g")) || []).length;
        mentions += hits * w.mentionWeight * decay;
      }
    });

    handoffs.forEach((h) => {
      if (h.sender !== emp.name && h.receiver !== emp.name) return;
      const createdAt = h.createdAt ? new Date(h.createdAt) : null;
      if (createdAt && +createdAt > asOfMs) return;
      const weeksAgo = createdAt ? Math.max(0, Math.round((asOfMs - +createdAt) / (86400000 * 7))) : 4;
      const decay = weeksAgo < w.timeDecay.length ? w.timeDecay[weeksAgo] : 0;
      if (decay === 0) return;
      handoff += h.receiver === emp.name && h.status === "待簽收" ? w.handoffPending * decay : w.handoffNormal * decay;
    });

    return { name: emp.name, score: cases + blocker + mentions + handoff };
  }).sort((a, b) => b.score - a.score);
}

function perturb(w: Weights, magnitude: number, rand: () => number): Weights {
  const jitter = (v: number) => v * (1 + (rand() * 2 - 1) * magnitude);
  return {
    timeDecay: w.timeDecay.map(jitter),
    caseNormal: jitter(w.caseNormal),
    caseRequest: jitter(w.caseRequest),
    caseBlocker: jitter(w.caseBlocker),
    blockerWeight: jitter(w.blockerWeight),
    mentionWeight: jitter(w.mentionWeight),
    handoffNormal: jitter(w.handoffNormal),
    handoffPending: jitter(w.handoffPending),
  };
}

function topKMatch(a: string[], b: string[], k: number): number {
  const setA = new Set(a.slice(0, k));
  const setB = new Set(b.slice(0, k));
  return [...setA].filter((x) => setB.has(x)).length / k;
}

function spearman(a: string[], b: string[]): number {
  const ranksA = new Map(a.map((n, i) => [n, i + 1]));
  const ranksB = new Map(b.map((n, i) => [n, i + 1]));
  const n = a.length;
  let sumD2 = 0;
  ranksA.forEach((rankA, name) => {
    const rankB = ranksB.get(name) ?? n + 1;
    sumD2 += (rankA - rankB) ** 2;
  });
  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t |= 0;
    t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function printExtremeValidation() {
  console.log("=".repeat(76));
  console.log("1) 極端值檢驗：模型是否符合管理直覺");
  console.log("=".repeat(76));

  const result = analyzeEmployeeLoad(extremeReports, extremeHandoffs, employees, NOW);
  result.forEach((r, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${r.name.padEnd(8)} score=${r.loadScore.toFixed(2).padStart(5)} ` +
      `案件=${r.timeWeightedCases.toFixed(1).padStart(4)} ` +
      `卡點=${r.blockerLoad.toFixed(1).padStart(4)} ` +
      `被提=${r.mentionsWeighted.toFixed(1).padStart(4)} ` +
      `交接=${r.handoffLoad.toFixed(1).padStart(4)} level=${r.level}`,
    );
  });

  console.log();
  console.log("期待檢查：待簽交接與卡點壓力應明顯高於單純被提及；低負荷員工應在尾端。");
  console.log();
}

function printSeedBreakdown() {
  console.log("=".repeat(76));
  console.log("2) Seed Data 排序合理性：Top-N 是否能被 breakdown 解釋");
  console.log("=".repeat(76));

  const result = analyzeEmployeeLoad(SEED_REPORTS, SEED_HANDOFFS, SEED_EMPLOYEES, NOW);
  result.slice(0, 8).forEach((r, i) => {
    const mainDriver = [
      ["案件", r.timeWeightedCases],
      ["卡點", r.blockerLoad],
      ["被提及", r.mentionsWeighted],
      ["交接", r.handoffLoad],
    ].sort((a, b) => Number(b[1]) - Number(a[1]))[0][0];

    console.log(
      `${String(i + 1).padStart(2)}. ${r.name.padEnd(6)} score=${r.loadScore.toFixed(2).padStart(5)} ` +
      `P${String(r.percentile).padStart(3)} ${r.level.padEnd(8)} ` +
      `案件=${r.timeWeightedCases.toFixed(1).padStart(4)} ` +
      `卡點=${r.blockerLoad.toFixed(1).padStart(4)} ` +
      `被提=${r.mentionsWeighted.toFixed(1).padStart(4)} ` +
      `交接=${r.handoffLoad.toFixed(1).padStart(4)} ` +
      `主因=${mainDriver}`,
    );
  });

  console.log();
  console.log("檢查重點：Top 不是黑箱分數，而是能回拆成案件、卡點、被提及、交接四個來源。");
  console.log();
}

function printSensitivity() {
  console.log("=".repeat(76));
  console.log("3) 敏感度分析：2.0 vs 1.8 這類差異會不會改變判斷");
  console.log("=".repeat(76));

  const baseline = computeLoads(SEED_REPORTS, SEED_HANDOFFS, SEED_EMPLOYEES, BASELINE, NOW);
  const baselineNames = baseline.map((b) => b.name);
  const magnitudes = [0.1, 0.2, 0.3, 0.5];
  const iterations = 500;

  console.log(`${"擾動幅度".padEnd(8)} | ${"Top-3穩定".padEnd(10)} | ${"Top-5穩定".padEnd(10)} | ${"Spearman rho".padEnd(12)}`);
  console.log("-".repeat(58));

  magnitudes.forEach((magnitude) => {
    const rand = mulberry32(42);
    let top3 = 0;
    let top5 = 0;
    let rho = 0;

    for (let i = 0; i < iterations; i++) {
      const weights = perturb(BASELINE, magnitude, rand);
      const current = computeLoads(SEED_REPORTS, SEED_HANDOFFS, SEED_EMPLOYEES, weights, NOW).map((r) => r.name);
      top3 += topKMatch(baselineNames, current, 3);
      top5 += topKMatch(baselineNames, current, 5);
      rho += spearman(baselineNames, current);
    }

    console.log(
      `±${String(Math.round(magnitude * 100)).padEnd(6)} | ` +
      `${((top3 / iterations) * 100).toFixed(1).padStart(6)}%    | ` +
      `${((top5 / iterations) * 100).toFixed(1).padStart(6)}%    | ` +
      `${(rho / iterations).toFixed(3).padStart(8)}`,
    );
  });

  console.log();
  console.log("判讀：若 ±10% 仍高度穩定，代表 2.0 改成 1.8/2.2 並不會推翻 Top 過載判斷。");
  console.log();
}

function main() {
  console.log("員工負荷模型驗證報告");
  console.log(`時點：${NOW.toISOString().slice(0, 10)}`);
  console.log(`Seed：${SEED_EMPLOYEES.length} 員工、${SEED_REPORTS.length} 週報、${SEED_HANDOFFS.length} 交接`);
  console.log();

  printExtremeValidation();
  printSeedBreakdown();
  printSensitivity();

  console.log("結論：目前權重可定位為『管理邏輯設定 + 測資穩健性驗證』，不是任意拍腦袋數字。");
}

main();
