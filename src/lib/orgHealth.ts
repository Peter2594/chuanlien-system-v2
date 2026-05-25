/**
 * 組織健康度 (Organization Health) - 5 維雷達指標 + 12 週趨勢
 *
 * 設計原則：所有維度都正規化到 0-100，越高越健康（與 ORI 反向）
 *
 * 5 維：
 *   - 卡點健康 (Blocker Health):    2σ/3σ 卡點越少 + 平均 percentile 越低 = 越健康
 *   - 決策及時 (Decision Timeliness): 逾期決策少 + 已完成決策快 = 越健康
 *   - 交接流暢 (Handoff Smoothness): 待簽收逾時少 + 完成率高 = 越健康
 *   - 負載均衡 (Load Balance):      Gini、2σ/3σ 異常值、Top1 占比複合警示
 *   - 部門協作 (Cross-Dept):        雙向 mention 對稱 = 越健康
 */
import { NOW, getISOWeek } from "./dateUtils";
import type { Report, Handoff, Decision, Blocker, Employee, Department, HistoryCase } from "./types";
import { analyzeEmployeeLoad, analyzeBlockerRecord, analyzeDeptNetwork, isDecisionOverdueAt, isDecisionCompletedAt } from "./algorithms";

export interface HealthSnapshot {
  blockerHealth: number;
  decisionTimeliness: number;
  handoffSmoothness: number;
  loadBalance: number;
  crossDept: number;
  overall: number;
  weekISO: string;        // 該週週次 (用於趨勢圖 x 軸)
  events: string[];       // 該週發生的關鍵事件，用於 hover 提示
}

export const ORG_HEALTH_WEIGHTS = {
  decisionTimeliness: 0.28,
  handoffSmoothness: 0.24,
  crossDept: 0.20,
  blockerHealth: 0.16,
  loadBalance: 0.12,
} as const;

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

interface LoadScoreLike {
  loadScore: number;
}

export interface LoadBalanceBreakdown {
  score: number;
  gini: number;
  overloadCount: number;
  top1Share: number;
  mean: number;
  stdDev: number;
  twoSigmaCount: number;
  threeSigmaCount: number;
  maxZScore: number;
}

export function computeLoadBalanceScore(loads: LoadScoreLike[]): LoadBalanceBreakdown {
  if (!loads.length) {
    return { score: 100, gini: 0, overloadCount: 0, top1Share: 0, mean: 0, stdDev: 0, twoSigmaCount: 0, threeSigmaCount: 0, maxZScore: 0 };
  }

  const scores = loads.map((l) => Math.max(0, l.loadScore)).sort((a, b) => a - b);
  const total = scores.reduce((s, v) => s + v, 0);
  if (total <= 0) {
    return { score: 100, gini: 0, overloadCount: 0, top1Share: 0, mean: 0, stdDev: 0, twoSigmaCount: 0, threeSigmaCount: 0, maxZScore: 0 };
  }

  const n = scores.length;
  const gini = scores.reduce((s, v, i) => s + (2 * (i + 1) - n - 1) * v, 0) / (n * total);
  const mean = total / n;
  const variance = n > 1 ? scores.reduce((s, v) => s + (v - mean) ** 2, 0) / (n - 1) : 0;
  const stdDev = Math.sqrt(variance);
  const zScores = scores.map((v) => stdDev > 0 ? (v - mean) / stdDev : 0);
  let twoSigmaCount = zScores.filter((z) => z >= 2 && z < 3).length;
  let threeSigmaCount = zScores.filter((z) => z >= 3).length;
  const maxZScore = Math.max(...zScores, 0);
  const top1Share = scores[n - 1] / total;
  if (n < 10 && threeSigmaCount === 0 && top1Share >= 0.8) {
    threeSigmaCount = 1;
  } else if (n < 10 && twoSigmaCount + threeSigmaCount === 0 && top1Share >= 0.6) {
    twoSigmaCount = 1;
  }
  const overloadCount = twoSigmaCount + threeSigmaCount;

  const giniPenalty = Math.max(0, gini - 0.35) * 120;
  const overloadPenalty = twoSigmaCount * 8 + threeSigmaCount * 16;
  const topSharePenalty = Math.max(0, top1Share - 0.25) * 80;
  const sigmaSeverityPenalty = Math.max(0, maxZScore - 2) * 6;
  const score = clamp(100 - giniPenalty - overloadPenalty - topSharePenalty - sigmaSeverityPenalty);

  return {
    score: +score.toFixed(1),
    gini: +gini.toFixed(3),
    overloadCount,
    top1Share: +top1Share.toFixed(3),
    mean: +mean.toFixed(2),
    stdDev: +stdDev.toFixed(2),
    twoSigmaCount,
    threeSigmaCount,
    maxZScore: +maxZScore.toFixed(2),
  };
}

export function computeHealthSnapshot(
  asOf: Date,
  reports: Report[],
  handoffs: Handoff[],
  decisions: Decision[],
  blockers: Blocker[],
  employees: Employee[],
  departments: Department[],
  history: HistoryCase[] = [],
): HealthSnapshot {
  const weekISO = `${asOf.getFullYear()}-W${getISOWeek(asOf)}`;
  const events: string[] = [];

  // 「截至 asOf」的活躍 / 已發生資料
  const isBefore = (dStr?: string) => !dStr ? false : new Date(dStr) <= asOf;
  const activeBlockers = blockers.filter((b) => isBefore(b.createdAt));
  const activeDecisions = decisions.filter((d) => isBefore(d.decidedAt));
  const activeHandoffs = handoffs.filter((h) => isBefore(h.createdAt));
  // 該週週報（粗略：submittedAt 在該週前 7 天內）
  const weekStart = new Date(asOf); weekStart.setDate(weekStart.getDate() - 7);
  const weekReports = reports.filter((r) => {
    if (!r.submittedAt) return false;
    const d = new Date(r.submittedAt);
    return d > weekStart && d <= asOf;
  });

  // ===== 1. 卡點健康 =====
  // 修正：歷史快照不能用「現在的 status」判斷已解決，
  // 否則回看過去週次時，今天才解決的卡點會被誤判為當時就已解決，
  // 趨勢圖會比真實情況漂亮。改用「resolvedAt 是否在 asOf 之前」判斷。
  let blockerHealth = 100;
  if (activeBlockers.length > 0) {
    const wasUnresolvedAt = (b: Blocker) => {
      if (b.status !== "resolved") return true;                    // 目前還沒解 → 一直未解
      if (!b.resolvedAt) {
        // 沒有 resolvedAt（通常是 SEED 資料）→ 用 createdAt + 14 天估算解決時間
        if (!b.createdAt) return true;
        const estimate = new Date(+new Date(b.createdAt) + 14 * 86400000);
        return estimate > asOf;
      }
      return new Date(b.resolvedAt) > asOf;                        // 解決時間在 asOf 之後 → 當時還沒解
    };
    const analyses = activeBlockers
      .filter(wasUnresolvedAt)
      .map((b) => analyzeBlockerRecord(b, blockers, history, asOf));
    const threeSigma = analyses.filter((a) => a.sigmaLevel === "critical").length;
    const twoSigma = analyses.filter((a) => a.sigmaLevel === "warning").length;
    const avgP = analyses.length
      ? analyses.reduce((s, a) => s + (a.percentile || 0), 0) / analyses.length
      : 0;
    blockerHealth = clamp(100 - threeSigma * 18 - twoSigma * 10 - Math.max(0, avgP - 50) * 0.6);
    if (threeSigma > 0) events.push(`${threeSigma} 件卡點達 3σ立即處理`);
    if (twoSigma > 0) events.push(`${twoSigma} 件卡點達 2σ紅標示警`);
  }

  // ===== 2. 決策及時 =====
  let decisionTimeliness = 100;
  const overdueDec = activeDecisions.filter((d) => isDecisionOverdueAt(d, asOf)).length;
  // 「當週時點」已完成：completedAt ≤ asOf
  const completed = activeDecisions.filter(
    (d) => d.decidedAt && isDecisionCompletedAt(d, asOf),
  );
  if (completed.length > 0) {
    const days = completed.map((d) => (+new Date(d.completedAt!) - +new Date(d.decidedAt)) / 86400000);
    const avg = days.reduce((s, v) => s + v, 0) / days.length;
    decisionTimeliness = clamp(100 - Math.max(0, avg - 14) * 3);
  }
  decisionTimeliness = clamp(decisionTimeliness - overdueDec * 10);
  if (overdueDec > 0) events.push(`${overdueDec} 筆決策逾期`);

  // ===== 3. 交接流暢 =====
  let handoffSmoothness = 100;
  if (activeHandoffs.length > 0) {
    const pending = activeHandoffs.filter((h) => h.status === "待簽收");
    const overdueH = pending.filter((h) => (h.hoursOverdue || 0) >= 24).length;
    const completionRate = 1 - pending.length / activeHandoffs.length;
    handoffSmoothness = clamp(50 + completionRate * 50 - overdueH * 8);
    if (overdueH > 0) events.push(`${overdueH} 件交接逾時`);
  }

  // ===== 4. 負載均衡 =====
  // analyzeEmployeeLoad 接 asOf 參數，依該時點計算時間衰減。
  // Gini 只作為離散程度警示之一，需搭配 2σ/3σ 異常值與 Top1 占比判讀。
  let loadBalance = 100;
  const loads = analyzeEmployeeLoad(reports, activeHandoffs, employees, asOf);
  if (loads.length > 0) {
    const loadBalanceStats = computeLoadBalanceScore(loads);
    loadBalance = loadBalanceStats.score;
    if (loadBalanceStats.overloadCount > 0) events.push(`${loadBalanceStats.overloadCount} 位員工負載示警`);
  }

  // ===== 5. 部門協作 =====
  let crossDept = 100;
  const network = analyzeDeptNetwork(weekReports, departments, activeHandoffs);
  if (network.depts.length > 1) {
    let asymCount = 0;
    network.depts.forEach((a) => {
      network.depts.forEach((b) => {
        if (a === b) return;
        const ab = network.matrix[a]?.[b] || 0;
        const ba = network.matrix[b]?.[a] || 0;
        if (ab >= 5 && ba === 0) asymCount++;
      });
    });
    crossDept = clamp(100 - asymCount * 15);
    if (asymCount > 0) events.push(`${asymCount} 組部門單向溝通`);
  }

  const overall = +(
    decisionTimeliness * ORG_HEALTH_WEIGHTS.decisionTimeliness
    + handoffSmoothness * ORG_HEALTH_WEIGHTS.handoffSmoothness
    + crossDept         * ORG_HEALTH_WEIGHTS.crossDept
    + blockerHealth     * ORG_HEALTH_WEIGHTS.blockerHealth
    + loadBalance       * ORG_HEALTH_WEIGHTS.loadBalance
  ).toFixed(1);

  return {
    blockerHealth: +blockerHealth.toFixed(1),
    decisionTimeliness: +decisionTimeliness.toFixed(1),
    handoffSmoothness: +handoffSmoothness.toFixed(1),
    loadBalance: +loadBalance.toFixed(1),
    crossDept: +crossDept.toFixed(1),
    overall,
    weekISO,
    events,
  };
}

// 過去 N 週快照（用於趨勢圖）
export function computeWeeklySeries(
  weeks: number,
  reports: Report[],
  handoffs: Handoff[],
  decisions: Decision[],
  blockers: Blocker[],
  employees: Employee[],
  departments: Department[],
  history: HistoryCase[] = [],
): HealthSnapshot[] {
  const out: HealthSnapshot[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const asOf = new Date(NOW);
    asOf.setDate(asOf.getDate() - i * 7);
    out.push(computeHealthSnapshot(asOf, reports, handoffs, decisions, blockers, employees, departments, history));
  }
  return out;
}

// 偵測拐點（local minima）：overall 比前後都低
export function detectInflectionPoints(series: HealthSnapshot[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < series.length - 1; i++) {
    if (series[i].overall < series[i - 1].overall - 3 && series[i].overall < series[i + 1].overall - 3) {
      out.push(i);
    }
  }
  return out;
}

// 健康度等級
export function healthLevel(v: number): { label: string; color: string; bgColor: string; advice: string } {
  if (v >= 85) return { label: "優異",   color: "text-emerald-600", bgColor: "bg-emerald-500", advice: "組織運作健康，維持節奏即可" };
  if (v >= 70) return { label: "良好",   color: "text-blue-600",    bgColor: "bg-blue-500",    advice: "整體穩定，少數指標可優化" };
  if (v >= 55) return { label: "可關注", color: "text-amber-600",   bgColor: "bg-amber-500",   advice: "有幾個維度偏弱，建議檢視" };
  if (v >= 40) return { label: "需注意", color: "text-orange-600",  bgColor: "bg-orange-500",  advice: "多個維度警示，需採取行動" };
  return                { label: "亟需介入", color: "text-red-600", bgColor: "bg-red-500",     advice: "組織健康度顯著下滑" };
}
