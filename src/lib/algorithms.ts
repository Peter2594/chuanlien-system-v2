/**
 * 核心演算法：員工負載、卡點風險、組織網絡、ORI
 */
import { NOW, parseWeekStart } from "./dateUtils";
import { BLOCKER_CATEGORIES } from "./constants";
import type {
  Report, Handoff, Decision, Blocker, HistoryCase, Employee, Department,
} from "./types";

// ===== 決策狀態 helper =====
// 統一「逾期」的判定邏輯，避免不同頁面用不同標準
// 規則：已決議 + 截止日 < asOf + (尚未完成 OR 完成在 asOf 之後)

// 把日期截斷到當地午夜（避免時分秒殘留造成 ±1 天浮動）
function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function isDecisionOverdueAt(d: Decision, asOf: Date = new Date()): boolean {
  if (!d.dueDate || d.dueDate === "即時生效") return false;
  const due = new Date(d.dueDate);
  if (isNaN(+due)) return false;
  if (+due >= +asOf) return false;
  if (d.completedAt) {
    const completed = new Date(d.completedAt);
    if (!isNaN(+completed) && +completed <= +asOf) return false;
  }
  return true;
}

// 該決策是否還算「執行中」(已決議但尚未完成且未逾期)
export function isDecisionInProgressAt(d: Decision, asOf: Date = new Date()): boolean {
  if (!d.decidedAt || new Date(d.decidedAt) > asOf) return false;
  if (d.completedAt && new Date(d.completedAt) <= asOf) return false;
  return !isDecisionOverdueAt(d, asOf);
}

export function isDecisionCompletedAt(d: Decision, asOf: Date = new Date()): boolean {
  if (!d.completedAt) return false;
  const completed = new Date(d.completedAt);
  return !isNaN(+completed) && +completed <= +asOf;
}

// 計算逾期天數（已逾期才有意義）
// 先把兩個時間都對齊到當地午夜，避免時分秒/時區造成的 ±1 天誤差
export function daysOverdue(d: Decision, asOf: Date = new Date()): number {
  if (!d.dueDate || d.dueDate === "即時生效") return 0;
  const due = new Date(d.dueDate);
  if (isNaN(+due)) return 0;
  const dueDay = startOfDay(due);
  const asOfDay = startOfDay(asOf);
  return Math.max(0, Math.round((+asOfDay - +dueDay) / 86400000));
}

// ===== 統計工具 =====
export const stats = {
  mean(arr: number[]) {
    if (!arr.length) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  },
  std(arr: number[]) {
    if (arr.length < 2) return 0;
    const m = stats.mean(arr);
    const v = arr.reduce((s, x) => s + (x - m) ** 2, 0) / (arr.length - 1);
    return Math.sqrt(v);
  },
  percentile(arr: number[], p: number) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const idx = (sorted.length - 1) * (p / 100);
    const lo = Math.floor(idx);
    const hi = Math.ceil(idx);
    if (lo === hi) return sorted[lo];
    return sorted[lo] * (hi - idx) + sorted[hi] * (idx - lo);
  },
};

// ===== 員工負載 v2 (加權模型) =====
export interface EmployeeLoad extends Employee {
  loadScore: number;
  percentile: number;
  level: "overload" | "high" | "normal" | "low" | "idle";
  hasReport: boolean;
  caseCount: number;
  blockerLoad: number;
  mentions: number;
  mentionsWeighted: number;
  asHandoffSender: number;
  asHandoffReceiver: number;
  pendingReceive: number;
  totalHandoffs: number;
  handoffLoad: number;
  timeWeightedCases: number;
  activeWeeks: number;
}

const TIME_DECAY = [1.0, 0.7, 0.4, 0.15];

export function analyzeEmployeeLoad(
  reports: Report[],
  handoffs: Handoff[],
  employees: Employee[],
  asOf: Date = NOW,
): EmployeeLoad[] {
  const asOfMs = +asOf;
  const getDecayWeight = (weekStr: string): number => {
    const d = parseWeekStart(weekStr);
    if (!d) return 0;
    // 未來週次（asOf 還沒到）不計入
    if (+d > asOfMs) return 0;
    const weeksAgo = Math.max(0, Math.round((asOfMs - +d) / (86400000 * 7)));
    if (weeksAgo >= TIME_DECAY.length) return 0;
    return TIME_DECAY[weeksAgo];
  };

  const reportComplexity = (r: Report): number => {
    const lines = (r.cases || "").split("\n").filter((l) => /^\s*[•\-*]/.test(l));
    let w = 0;
    lines.forEach((line) => {
      let factor = 1.0;
      if (/請|需|協助|跨部門|部$/.test(line)) factor = 1.5;
      if (/卡|延|未通|缺漏|未到|逾期/.test(line)) factor = 2.0;
      w += factor;
    });
    return w;
  };

  const scores = employees.map((emp) => {
    let timeWeightedCases = 0;
    let blockerLoad = 0;
    let mentionsScore = 0;
    let activeWeeks = 0;
    let mentionsCount = 0;

    reports.forEach((r) => {
      const decay = getDecayWeight(r.week);
      if (decay === 0) return;
      if (r.author === emp.name) {
        timeWeightedCases += reportComplexity(r) * decay;
        activeWeeks++;
        if (r.blockers?.trim()) {
          const bCount = Math.max(1, (r.blockers.match(/[•\-]/g) || []).length);
          blockerLoad += bCount * 2.5 * decay;
        }
      } else {
        const fullText = `${r.cases || ""}\n${r.blockers || ""}\n${r.needHelp || ""}\n${r.nextWeek || ""}`;
        const hits = (fullText.match(new RegExp(emp.name, "g")) || []).length;
        if (hits > 0) {
          mentionsCount += hits;
          mentionsScore += hits * 1.5 * decay;
        }
      }
    });

    let handoffLoad = 0;
    let asHandoffSender = 0;
    let asHandoffReceiver = 0;
    let pendingReceive = 0;
    handoffs.forEach((h) => {
      if (h.sender !== emp.name && h.receiver !== emp.name) return;
      const hd = h.createdAt ? new Date(h.createdAt) : null;
      // 未來建立的交接（asOf 還沒到）不計入
      if (hd && +hd > asOfMs) return;
      const weeksAgo = hd ? Math.max(0, Math.round((asOfMs - +hd) / (86400000 * 7))) : 4;
      const decay = weeksAgo < TIME_DECAY.length ? TIME_DECAY[weeksAgo] : 0;
      if (decay === 0) return;
      if (h.sender === emp.name) asHandoffSender++;
      if (h.receiver === emp.name) asHandoffReceiver++;
      if (h.receiver === emp.name && h.status === "待簽收") {
        pendingReceive++;
        handoffLoad += 4 * decay;
      } else {
        handoffLoad += 1.5 * decay;
      }
    });

    const loadScore = +(timeWeightedCases + blockerLoad + mentionsScore + handoffLoad).toFixed(2);
    return {
      ...emp,
      loadScore,
      timeWeightedCases: +timeWeightedCases.toFixed(1),
      blockerLoad: +blockerLoad.toFixed(1),
      mentionsWeighted: +mentionsScore.toFixed(1),
      handoffLoad: +handoffLoad.toFixed(1),
      mentions: mentionsCount,
      caseCount: Math.round(timeWeightedCases),
      asHandoffSender,
      asHandoffReceiver,
      pendingReceive,
      totalHandoffs: asHandoffSender + asHandoffReceiver,
      hasReport: activeWeeks > 0,
      activeWeeks,
    };
  });

  const allScores = scores.map((s) => s.loadScore).sort((a, b) => a - b);
  return scores
    .map((s) => {
      const rank = allScores.findIndex((v) => v >= s.loadScore);
      const percentile = allScores.length > 1 ? Math.round((rank / (allScores.length - 1)) * 100) : 50;
      let level: EmployeeLoad["level"];
      if (s.loadScore >= 25 || percentile >= 90) level = "overload";
      else if (s.loadScore >= 15 || percentile >= 75) level = "high";
      else if (s.loadScore >= 6) level = "normal";
      else if (s.loadScore >= 1) level = "low";
      else level = "idle";
      return { ...s, percentile, level } as EmployeeLoad;
    })
    .sort((a, b) => b.loadScore - a.loadScore);
}

// ===== 卡點分位數風險分析 =====
// 從歷史案件抽出「解決天數」：標籤含類別關鍵字 → 同類；否則進整體池
const extractDays = (outcome?: string) => {
  const m = String(outcome || "").match(/(\d+)\s*天/);
  return m ? parseInt(m[1]) : 0;
};

export function analyzeBlockerRecord(
  blocker: Blocker,
  historyDB: Blocker[],
  historyCases: HistoryCase[] = [],
  asOf?: Date,
) {
  const ref = asOf || new Date();
  const createdAt = blocker.createdAt ? new Date(blocker.createdAt) : ref;
  const currentDays = Math.max(1, Math.round((+ref - +createdAt) / 86400000));

  const catLabel = BLOCKER_CATEGORIES.find((c) => c.key === blocker.category)?.label;

  // 池一：同類別已解決卡點
  const sameCatBlockers = (historyDB || [])
    .filter((h) => h.category === blocker.category && h.daysToResolve !== undefined)
    .map((h) => h.daysToResolve!);
  // 池二：同類別歷史案件
  const sameCatHistory = (historyCases || [])
    .filter((h) => catLabel && (h.tags || []).includes(catLabel))
    .map((h) => extractDays(h.outcome))
    .filter((v) => v > 0);
  // 池三：所有歷史案件
  const allHistory = (historyCases || []).map((h) => extractDays(h.outcome)).filter((v) => v > 0);
  const allBlockers = (historyDB || [])
    .filter((h) => h.daysToResolve !== undefined)
    .map((h) => h.daysToResolve!);

  const sameCat = [...sameCatBlockers, ...sameCatHistory];
  const pool = sameCat.length >= 5 ? sameCat : [...allBlockers, ...allHistory];
  const days = pool.filter((v) => v > 0);

  if (days.length === 0) {
    return {
      blocker, originalText: blocker.title, currentDays,
      level: currentDays > 21 ? "high" : currentDays > 14 ? "medium" : "normal",
      levelLabel: currentDays > 21 ? "高風險" : currentDays > 14 ? "關注" : "正常",
      hasData: false, percentile: null, p75: 0, p90: 0, p95: 0,
      categoryInfo: BLOCKER_CATEGORIES.find((c) => c.key === blocker.category) || BLOCKER_CATEGORIES[BLOCKER_CATEGORIES.length - 1],
      basisLabel: "SLA 提醒",
    };
  }

  const sorted = [...days].sort((a, b) => a - b);
  const p75 = stats.percentile(sorted, 75);
  const p90 = stats.percentile(sorted, 90);
  const p95 = stats.percentile(sorted, 95);
  const belowCount = sorted.filter((v) => v <= currentDays).length;
  const percentile = Math.round((belowCount / sorted.length) * 100);

  let level: "critical" | "high" | "medium" | "normal" = "normal";
  let levelLabel = "正常";
  if (currentDays >= p95) { level = "critical"; levelLabel = "極高風險"; }
  else if (currentDays >= p90) { level = "high"; levelLabel = "高風險"; }
  else if (currentDays >= p75) { level = "medium"; levelLabel = "關注"; }

  return {
    blocker, originalText: blocker.title, currentDays,
    level, levelLabel, hasData: true, percentile,
    p75, p90, p95,
    categoryInfo: BLOCKER_CATEGORIES.find((c) => c.key === blocker.category) || BLOCKER_CATEGORIES[BLOCKER_CATEGORIES.length - 1],
    basisLabel: sameCat.length >= 5 ? "同類歷史" : "全公司歷史",
    sampleSize: days.length,
  };
}

// ===== 部門互動網絡 =====
export interface DeptNetwork {
  matrix: Record<string, Record<string, number>>;
  edges: { from: string; to: string; weight: number }[];
  stats: Record<string, { outgoing: number; incoming: number }>;
  depts: string[];
}

export function analyzeDeptNetwork(
  reports: Report[],
  departments: Department[],
  handoffs: Handoff[] = [],
): DeptNetwork {
  const depts = departments.filter((d) => d.active !== false && d.name !== "營運與管理層").map((d) => d.name);
  const deptShortMap: Record<string, string> = {};
  departments.forEach((d) => {
    if (d.active === false) return;
    deptShortMap[d.name] = d.name;
    if (d.shortName) deptShortMap[d.shortName] = d.name;
  });
  const resolveDept = (name: string) => deptShortMap[name] || (depts.includes(name) ? name : null);

  const matrix: Record<string, Record<string, number>> = {};
  depts.forEach((d) => {
    matrix[d] = {};
    depts.forEach((d2) => (matrix[d][d2] = 0));
  });

  reports.forEach((r) => {
    const text = `${r.cases || ""}\n${r.blockers || ""}\n${r.needHelp || ""}\n${r.nextWeek || ""}`;
    depts.forEach((target) => {
      if (target === r.dept) return;
      let count = 0;
      Object.entries(deptShortMap).forEach(([alias, fullName]) => {
        if (fullName !== target) return;
        const re = new RegExp(alias, "g");
        count += (text.match(re) || []).length;
      });
      if (matrix[r.dept] && matrix[r.dept][target] !== undefined) {
        matrix[r.dept][target] += count;
      }
    });
  });

  (handoffs || []).forEach((h) => {
    const from = resolveDept(h.from);
    const to = resolveDept(h.to);
    if (from && to && from !== to && matrix[from] && matrix[from][to] !== undefined) {
      matrix[from][to] += 2;
    }
  });

  const edges: { from: string; to: string; weight: number }[] = [];
  depts.forEach((from) => {
    depts.forEach((to) => {
      if (from !== to && matrix[from][to] > 0) {
        edges.push({ from, to, weight: matrix[from][to] });
      }
    });
  });

  const stat: DeptNetwork["stats"] = {};
  depts.forEach((d) => {
    stat[d] = {
      outgoing: depts.reduce((s, d2) => s + matrix[d][d2], 0),
      incoming: depts.reduce((s, d2) => s + matrix[d2][d], 0),
    };
  });

  return { matrix, edges, stats: stat, depts };
}

// ===== ORI 計算 =====
export interface ORI {
  index: number;
  drivers: { code: string; name: string; value: number; weight: number }[];
}

export function computeORI({
  loads, decisions, activeBlockers, network,
}: {
  loads: EmployeeLoad[];
  decisions: Decision[];
  activeBlockers: ReturnType<typeof analyzeBlockerRecord>[];
  network: DeptNetwork;
}): ORI {
  const clamp = (v: number, lo = 0, hi = 200) => Math.max(lo, Math.min(hi, v));

  // HCC
  let HCC = 100;
  if (loads.length > 0) {
    const scores = loads.map((l) => l.loadScore).sort((a, b) => a - b);
    const total = scores.reduce((s, v) => s + v, 0) || 1;
    let gini = 0;
    const n = scores.length;
    for (let i = 0; i < n; i++) gini += (2 * (i + 1) - n - 1) * scores[i];
    gini = gini / (n * total);
    const top1 = scores[scores.length - 1] / total;
    const mean = total / n;
    const std = Math.sqrt(scores.reduce((s, v) => s + (v - mean) ** 2, 0) / n);
    const outliers = std > 0 ? loads.filter((l) => (l.loadScore - mean) / std > 1.5).length : 0;
    HCC = clamp(100 + (gini - 0.35) * 400 + (top1 - 0.2) * 200 + outliers * 8);
  }

  // DL
  let DL = 100;
  const completed = decisions.filter((d) => d.status === "已完成" && d.completedAt && d.decidedAt);
  if (completed.length > 0) {
    const days = completed.map((d) => (+new Date(d.completedAt!) - +new Date(d.decidedAt)) / 86400000);
    const avgDays = days.reduce((s, v) => s + v, 0) / days.length;
    DL = clamp(100 + (avgDays - 14) * 4);
  }
  const overdue = decisions.filter((d) => isDecisionOverdueAt(d)).length;
  DL = clamp(DL + overdue * 12);

  // BT
  let BT = 100;
  if (activeBlockers.length > 0) {
    const percentiles = activeBlockers.map((b) => b.percentile || 0).filter((p) => p > 0);
    const avgP = percentiles.length ? percentiles.reduce((s, v) => s + v, 0) / percentiles.length : 50;
    const p90 = activeBlockers.filter((b) => (b.percentile || 0) >= 90).length;
    const p95 = activeBlockers.filter((b) => (b.percentile || 0) >= 95).length;
    BT = clamp(100 + (avgP - 50) * 1.5 + p90 * 8 + p95 * 12);
  }

  // CDC
  let CDC = 100;
  if (network.depts.length > 1) {
    let asymCount = 0;
    let asymRatio = 0;
    network.depts.forEach((a) => {
      network.depts.forEach((b) => {
        if (a === b) return;
        const ab = network.matrix[a]?.[b] || 0;
        const ba = network.matrix[b]?.[a] || 0;
        if (ab >= 5 && ba === 0) {
          asymCount++;
          asymRatio += ab;
        }
      });
    });
    CDC = clamp(100 + asymCount * 18 + asymRatio * 0.5);
  }

  const ORI = clamp(0.35 * HCC + 0.25 * DL + 0.25 * BT + 0.15 * CDC);

  return {
    index: +ORI.toFixed(1),
    drivers: [
      { code: "HCC", name: "Human Capital Concentration", value: +HCC.toFixed(1), weight: 0.35 },
      { code: "DL",  name: "Decision Latency",            value: +DL.toFixed(1),  weight: 0.25 },
      { code: "BT",  name: "Blocker Tail Risk",           value: +BT.toFixed(1),  weight: 0.25 },
      { code: "CDC", name: "Cross-Dept Comm Health",      value: +CDC.toFixed(1), weight: 0.15 },
    ],
  };
}

export function oriLevel(v: number) {
  if (v >= 175) return { label: "今天要花時間", advice: "下面這幾件事不解掉，整週都會被拖住", color: "text-red-600" };
  if (v >= 150) return { label: "要注意",       advice: "有幾件事在惡化，建議今天看一下",   color: "text-amber-600" };
  if (v >= 125) return { label: "可關注",       advice: "整體穩定，但有少量需要注意的事項", color: "text-slate-600" };
  if (v >= 100) return { label: "還可以",       advice: "整體穩定，無重大警示",            color: "text-slate-600" };
  return                { label: "順利",        advice: "本週公司運作正常，無重大警示",     color: "text-emerald-600" };
}
