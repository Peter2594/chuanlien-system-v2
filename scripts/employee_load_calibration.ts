/**
 * 員工負荷權重校準示範
 *
 * 流程：
 * 1. 主管先排序訊號重要性：卡點 > 案件 > 交接 > 被提及
 * 2. 初始權重全部設為 1
 * 3. 用主管標記的 Top-N 名單作為校準目標
 * 4. 在符合重要性排序的權重空間中搜尋最佳組合
 *
 * 執行：npx tsx scripts/employee_load_calibration.ts
 */
import { NOW, parseWeekStart } from "../src/lib/dateUtils";
import { SEED_EMPLOYEES, SEED_HANDOFFS, SEED_REPORTS } from "../src/lib/seedData";
import type { Employee, Handoff, Report } from "../src/lib/types";

type SignalKey = "blocker" | "cases" | "handoff" | "mentions";

interface SignalWeights {
  blocker: number;
  cases: number;
  handoff: number;
  mentions: number;
}

interface EmployeeSignals {
  name: string;
  blocker: number;
  cases: number;
  handoff: number;
  mentions: number;
}

const IMPORTANCE_ORDER: SignalKey[] = ["blocker", "cases", "handoff", "mentions"];

// 這裡模擬主管標記。未來可改成問卷/CSV 匯入。
const supervisorTarget = {
  top3: ["林聿平", "周世倫", "梁嘉芫"],
  top5: ["林聿平", "周世倫", "梁嘉芫", "鍾皓明", "蔡明遠"],
};

const INITIAL_WEIGHTS: SignalWeights = {
  blocker: 1.3,
  cases: 1.2,
  handoff: 1.1,
  mentions: 1.0,
};

function getDecay(weekStr: string, asOf: Date): number {
  const d = parseWeekStart(weekStr);
  if (!d || +d > +asOf) return 0;
  const weeksAgo = Math.max(0, Math.round((+asOf - +d) / (86400000 * 7)));
  const timeDecay = [1.0, 0.7, 0.4, 0.15];
  return weeksAgo >= timeDecay.length ? 0 : timeDecay[weeksAgo];
}

function countCaseItems(r: Report): number {
  return (r.cases || "").split("\n").filter((line) => /^\s*[•\-*]/.test(line)).length;
}

function countBlockerItems(r: Report): number {
  if (!r.blockers?.trim()) return 0;
  const bulletCount = (r.blockers.match(/[•\-]/g) || []).length;
  return Math.max(1, bulletCount);
}

function extractSignals(
  reports: Report[],
  handoffs: Handoff[],
  employees: Employee[],
  asOf: Date,
): EmployeeSignals[] {
  return employees.map((emp) => {
    let cases = 0;
    let blocker = 0;
    let handoff = 0;
    let mentions = 0;

    reports.forEach((r) => {
      const decay = getDecay(r.week, asOf);
      if (decay === 0) return;

      if (r.author === emp.name) {
        cases += countCaseItems(r) * decay;
        blocker += countBlockerItems(r) * decay;
      } else {
        const text = `${r.cases || ""}\n${r.blockers || ""}\n${r.needHelp || ""}\n${r.nextWeek || ""}`;
        mentions += (text.match(new RegExp(emp.name, "g")) || []).length * decay;
      }
    });

    handoffs.forEach((h) => {
      if (h.sender !== emp.name && h.receiver !== emp.name) return;
      const createdAt = h.createdAt ? new Date(h.createdAt) : null;
      if (createdAt && +createdAt > +asOf) return;
      const weeksAgo = createdAt ? Math.max(0, Math.round((+asOf - +createdAt) / (86400000 * 7))) : 4;
      const timeDecay = [1.0, 0.7, 0.4, 0.15];
      const decay = weeksAgo < timeDecay.length ? timeDecay[weeksAgo] : 0;
      if (decay === 0) return;
      handoff += decay;
    });

    return {
      name: emp.name,
      blocker: +blocker.toFixed(2),
      cases: +cases.toFixed(2),
      handoff: +handoff.toFixed(2),
      mentions: +mentions.toFixed(2),
    };
  });
}

function scoreEmployee(signals: EmployeeSignals, weights: SignalWeights): number {
  return (
    signals.blocker * weights.blocker +
    signals.cases * weights.cases +
    signals.handoff * weights.handoff +
    signals.mentions * weights.mentions
  );
}

function rankEmployees(signals: EmployeeSignals[], weights: SignalWeights) {
  return signals
    .map((s) => ({ ...s, score: scoreEmployee(s, weights) }))
    .sort((a, b) => b.score - a.score);
}

function topKOverlap(actual: string[], target: string[], k: number): number {
  const actualSet = new Set(actual.slice(0, k));
  return target.slice(0, k).filter((name) => actualSet.has(name)).length / k;
}

function orderedPairAccuracy(actual: string[], target: string[]): number {
  const actualRank = new Map(actual.map((name, i) => [name, i]));
  let good = 0;
  let total = 0;

  for (let i = 0; i < target.length; i++) {
    for (let j = i + 1; j < target.length; j++) {
      total++;
      if ((actualRank.get(target[i]) ?? 999) < (actualRank.get(target[j]) ?? 999)) good++;
    }
  }

  return total === 0 ? 1 : good / total;
}

function respectsImportanceOrder(w: SignalWeights): boolean {
  return IMPORTANCE_ORDER.every((key, i) => {
    const next = IMPORTANCE_ORDER[i + 1];
    return !next || w[key] > w[next];
  });
}

function evaluate(signals: EmployeeSignals[], weights: SignalWeights) {
  const ranked = rankEmployees(signals, weights);
  const names = ranked.map((r) => r.name);
  const top3 = topKOverlap(names, supervisorTarget.top3, 3);
  const top5 = topKOverlap(names, supervisorTarget.top5, 5);
  const pairwise = orderedPairAccuracy(names, supervisorTarget.top5);
  const regularization =
    Math.abs(weights.blocker - 1) +
    Math.abs(weights.cases - 1) +
    Math.abs(weights.handoff - 1) +
    Math.abs(weights.mentions - 1);

  return {
    ranked,
    top3,
    top5,
    pairwise,
    objective: top3 * 50 + top5 * 30 + pairwise * 20 - regularization * 0.8,
  };
}

function searchBestWeights(signals: EmployeeSignals[]) {
  const values = [0.8, 0.9, 1, 1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.4, 1.5, 1.6, 1.8, 2.0];
  let best: { weights: SignalWeights; evalResult: ReturnType<typeof evaluate> } | null = null;

  values.forEach((blocker) => {
    values.forEach((cases) => {
      values.forEach((handoff) => {
        values.forEach((mentions) => {
          const weights = { blocker, cases, handoff, mentions };
          if (!respectsImportanceOrder(weights)) return;
          const evalResult = evaluate(signals, weights);
          if (!best || evalResult.objective > best.evalResult.objective) {
            best = { weights, evalResult };
          }
        });
      });
    });
  });

  return best!;
}

function findImpossibleOrderedPairs(signals: EmployeeSignals[], orderedNames: string[]) {
  const byName = new Map(signals.map((s) => [s.name, s]));
  const impossible: string[] = [];

  for (let i = 0; i < orderedNames.length; i++) {
    for (let j = i + 1; j < orderedNames.length; j++) {
      const higher = byName.get(orderedNames[i]);
      const lower = byName.get(orderedNames[j]);
      if (!higher || !lower) continue;

      const neverHigher = IMPORTANCE_ORDER.every((key) => higher[key] <= lower[key]);
      const strictlyLowerSomewhere = IMPORTANCE_ORDER.some((key) => higher[key] < lower[key]);
      if (neverHigher && strictlyLowerSomewhere) {
        impossible.push(`${higher.name} > ${lower.name}`);
      }
    }
  }

  return impossible;
}

function printRanking(title: string, ranked: ReturnType<typeof rankEmployees>) {
  console.log(title);
  ranked.slice(0, 8).forEach((r, i) => {
    console.log(
      `${String(i + 1).padStart(2)}. ${r.name.padEnd(6)} score=${r.score.toFixed(2).padStart(5)} ` +
      `卡點=${r.blocker.toFixed(2).padStart(4)} ` +
      `案件=${r.cases.toFixed(2).padStart(4)} ` +
      `交接=${r.handoff.toFixed(2).padStart(4)} ` +
      `被提=${r.mentions.toFixed(2).padStart(4)}`,
    );
  });
  console.log();
}

function main() {
  const signals = extractSignals(SEED_REPORTS, SEED_HANDOFFS, SEED_EMPLOYEES, NOW);
  const initial = evaluate(signals, INITIAL_WEIGHTS);
  const best = searchBestWeights(signals);

  console.log("員工負荷權重校準示範");
  console.log(`時點：${NOW.toISOString().slice(0, 10)}`);
  console.log(`主管重要性排序：${IMPORTANCE_ORDER.join(" > ")}`);
  console.log("校準原則：主管排序決定方向，測資結果決定幅度");
  console.log(`主管目標 Top-3：${supervisorTarget.top3.join("、")}`);
  console.log(`主管目標 Top-5：${supervisorTarget.top5.join("、")}`);
  console.log();

  const impossiblePairs = findImpossibleOrderedPairs(signals, supervisorTarget.top5);
  if (impossiblePairs.length > 0) {
    console.log("資料檢查：有些主管指定的細部排序無法用非負權重達成");
    impossiblePairs.forEach((pair) => console.log(`  - ${pair}`));
    console.log("原因：前者在四個訊號上沒有任何一項高於後者，調正權重也無法讓它排前面。");
    console.log();
  }

  console.log("初始權重：", INITIAL_WEIGHTS);
  console.log(
    `初始符合度：Top-3 ${(initial.top3 * 100).toFixed(1)}%, ` +
    `Top-5 ${(initial.top5 * 100).toFixed(1)}%, ` +
    `排序對 ${(initial.pairwise * 100).toFixed(1)}%`,
  );
  printRanking("弱先驗初始排名 Top 8", initial.ranked);

  console.log("搜尋後權重：", best.weights);
  console.log(
    `校準符合度：Top-3 ${(best.evalResult.top3 * 100).toFixed(1)}%, ` +
    `Top-5 ${(best.evalResult.top5 * 100).toFixed(1)}%, ` +
    `排序對 ${(best.evalResult.pairwise * 100).toFixed(1)}%`,
  );
  printRanking("校準後排名 Top 8", best.evalResult.ranked);

  console.log("解讀：");
  console.log("1. 弱先驗權重保留主管排序，但不一開始大幅放大差距。");
  console.log("2. 若主管要求更細的名次順序，腳本會檢查資料訊號是否支持該排序。");
  console.log("3. 未來只要把 supervisorTarget 換成真實主管標記，就能重跑得到公司版本的權重。");
}

main();
