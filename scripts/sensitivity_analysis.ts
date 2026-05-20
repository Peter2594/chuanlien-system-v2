/**
 * 員工負載權重 — 敏感度分析
 *
 * 目的：證明系統 ranking 對「精確權重」不敏感
 *      → 即使權重浮動 ±20%，「誰過載」的排序仍穩定
 *
 * 方法：對所有人工權重做 N 次隨機擾動，跑模擬，看 top-K ranking 變化
 *
 * 執行：npx tsx scripts/sensitivity_analysis.ts
 */
import { SEED_EMPLOYEES, SEED_REPORTS, SEED_HANDOFFS } from "../src/lib/seedData";
import { parseWeekStart as _parseWeekStart, NOW as DATE_NOW } from "../src/lib/dateUtils";
import type { Report, Handoff, Employee } from "../src/lib/types";

const seed = {
  employees: SEED_EMPLOYEES,
  reports: SEED_REPORTS,
  handoffs: SEED_HANDOFFS,
};

// ============================================================
// 可調權重（與 algorithms.ts:99-178 對應）
// ============================================================
interface Weights {
  timeDecay: number[];           // 每週衰減 [1.0, 0.7, 0.4, 0.15]
  caseNormal: number;            // 一般案件項
  caseRequest: number;           // 含「請/需/協助」的項
  caseBlocker: number;           // 含「卡/延/逾」的項
  blockerWeight: number;         // 卡點區的倍數 (2.5)
  mentionWeight: number;         // 被提及的倍數 (1.5)
  handoffNormal: number;         // 一般交接 (1.5)
  handoffPending: number;        // 待簽收交接 (4)
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

// ============================================================
// 參數化的負載計算函式（從 algorithms.ts 抽出來）
// ============================================================
const parseWeekStart = _parseWeekStart;

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
    if (!d) return 0;
    if (+d > asOfMs) return 0;
    const weeksAgo = Math.max(0, Math.round((asOfMs - +d) / (86400000 * 7)));
    return weeksAgo >= w.timeDecay.length ? 0 : w.timeDecay[weeksAgo];
  };

  const reportComplexity = (r: Report) => {
    const lines = (r.cases || "").split("\n").filter((l) => /^\s*[•\-*]/.test(l));
    let total = 0;
    lines.forEach((line) => {
      let f = w.caseNormal;
      if (/請|需|協助|跨部門|部$/.test(line)) f = w.caseRequest;
      if (/卡|延|未通|缺漏|未到|逾期/.test(line)) f = w.caseBlocker;
      total += f;
    });
    return total;
  };

  return employees.map((emp) => {
    let cases = 0, blocker = 0, mentions = 0, handoff = 0;

    reports.forEach((r) => {
      const dec = getDecay(r.week);
      if (dec === 0) return;
      if (r.author === emp.name) {
        cases += reportComplexity(r) * dec;
        if (r.blockers?.trim()) {
          const n = Math.max(1, (r.blockers.match(/[•\-]/g) || []).length);
          blocker += n * w.blockerWeight * dec;
        }
      } else {
        const text = `${r.cases || ""}\n${r.blockers || ""}\n${r.needHelp || ""}\n${r.nextWeek || ""}`;
        const hits = (text.match(new RegExp(emp.name, "g")) || []).length;
        if (hits > 0) mentions += hits * w.mentionWeight * dec;
      }
    });

    handoffs.forEach((h) => {
      if (h.sender !== emp.name && h.receiver !== emp.name) return;
      const hd = h.createdAt ? new Date(h.createdAt) : null;
      if (hd && +hd > asOfMs) return;
      const weeksAgo = hd ? Math.max(0, Math.round((asOfMs - +hd) / (86400000 * 7))) : 4;
      const dec = weeksAgo < w.timeDecay.length ? w.timeDecay[weeksAgo] : 0;
      if (dec === 0) return;
      if (h.receiver === emp.name && h.status === "待簽收") {
        handoff += w.handoffPending * dec;
      } else {
        handoff += w.handoffNormal * dec;
      }
    });

    return { name: emp.name, score: cases + blocker + mentions + handoff };
  }).sort((a, b) => b.score - a.score);
}

// ============================================================
// 擾動 + 比對
// ============================================================
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
  let overlap = 0;
  setA.forEach((x) => { if (setB.has(x)) overlap++; });
  return overlap / k;
}

function spearman(a: string[], b: string[]): number {
  const ranksA = new Map(a.map((n, i) => [n, i + 1]));
  const ranksB = new Map(b.map((n, i) => [n, i + 1]));
  const n = a.length;
  let sumD2 = 0;
  ranksA.forEach((ra, name) => {
    const rb = ranksB.get(name) ?? n + 1;
    sumD2 += (ra - rb) ** 2;
  });
  return 1 - (6 * sumD2) / (n * (n * n - 1));
}

// 簡單 PRNG (deterministic)
function mulberry32(seed: number) {
  let t = seed;
  return () => {
    t |= 0; t = (t + 0x6D2B79F5) | 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

// ============================================================
// 主程式
// ============================================================
function main() {
  // 用系統 NOW（與 SEED 對齊）
  const asOf = DATE_NOW;

  console.log("=".repeat(70));
  console.log("員工負載權重 — 敏感度分析");
  console.log("=".repeat(70));
  console.log(`SEED：${seed.employees.length} 員工、${seed.reports.length} 週報、${seed.handoffs.length} 交接`);
  console.log(`時點：${asOf.toISOString().slice(0, 10)}`);
  console.log();

  // 1. 基準排名
  const baseline = computeLoads(seed.reports, seed.handoffs, seed.employees, BASELINE, asOf);
  const baselineNames = baseline.map((b) => b.name);

  console.log("【基準排名】Top 5（用論述中的權重）");
  baseline.slice(0, 5).forEach((b, i) => {
    console.log(`  ${i + 1}. ${b.name.padEnd(6)} ${b.score.toFixed(2)}`);
  });
  console.log();

  // 2. 敏感度測試
  const magnitudes = [0.1, 0.2, 0.3, 0.5];
  const ITER = 500;

  console.log("【敏感度測試】每個權重 ±X% 隨機擾動 × 500 次");
  console.log(`${"擾動".padEnd(8)} | ${"Top-3 穩定".padEnd(10)} | ${"Top-5 穩定".padEnd(10)} | ${"Spearman ρ".padEnd(10)}`);
  console.log("-".repeat(60));

  for (const mag of magnitudes) {
    const rand = mulberry32(42);
    let top3Sum = 0, top5Sum = 0, rhoSum = 0;

    for (let i = 0; i < ITER; i++) {
      const w = perturb(BASELINE, mag, rand);
      const r = computeLoads(seed.reports, seed.handoffs, seed.employees, w, asOf);
      const names = r.map((x) => x.name);
      top3Sum += topKMatch(baselineNames, names, 3);
      top5Sum += topKMatch(baselineNames, names, 5);
      rhoSum += spearman(baselineNames, names);
    }

    const t3 = ((top3Sum / ITER) * 100).toFixed(1);
    const t5 = ((top5Sum / ITER) * 100).toFixed(1);
    const rho = (rhoSum / ITER).toFixed(3);
    const pct = `±${(mag * 100).toFixed(0)}%`;
    console.log(`${pct.padEnd(8)} | ${(t3 + "%").padEnd(10)} | ${(t5 + "%").padEnd(10)} | ${rho.padEnd(10)}`);
  }

  console.log();
  console.log("【解讀】");
  console.log("Top-K 穩定 = 擾動後 top K 名單跟原本重疊比例的平均（100% = 完全一致）");
  console.log("Spearman ρ = 排名相關性（1.0 = 完美一致、0 = 無關、-1 = 完全相反）");
  console.log();
  console.log("【結論】");
  console.log("若 Top-3 穩定 > 90%，代表系統不依賴『精確權重』，");
  console.log("只要保持合理範圍，誰過載的判斷不會被改變。");
}

main();
