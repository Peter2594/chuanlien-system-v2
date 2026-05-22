/**
 * 決策成效追蹤 (Decision Impact) — v2.2 加入 Cohort Adjustment
 *
 * 對每筆「已完成」決策，比較決策前 vs 完成後 N 週的組織健康度，量化該決策對組織的影響。
 *
 * ★ Cohort Adjustment（v2.2 新增，解決因果歸因問題）：
 *   原本：decisionDelta = after.overall − before.overall
 *   問題：若整體趨勢下滑，所有決策的 delta 都被「冤枉」變負分
 *   修正：扣掉「同期基準變化」（baseline drift）
 *         adjustedDelta = decisionDelta − baselineDrift
 *         baselineDrift = 同樣時間長度內，整體組織健康度的平均自然漂移
 */
import { computeHealthSnapshot, type HealthSnapshot } from "./orgHealth";
import { NOW } from "./dateUtils";
import type { Decision, Report, Handoff, Blocker, Employee, Department, HistoryCase } from "./types";

export interface DecisionImpact {
  decision: Decision;
  before: HealthSnapshot;
  after: HealthSnapshot;
  deltaOverall: number;            // 原始 delta (raw)
  adjustedDelta: number;           // ★ Cohort-adjusted delta (扣掉基準漂移)
  baselineDrift: number;           // 同期基準漂移
  deltaByDimension: {
    blockerHealth: number;
    decisionTimeliness: number;
    handoffSmoothness: number;
    loadBalance: number;
    crossDept: number;
  };
  verdict: "正面" | "中性" | "負面";
  score: number;                   // -100 ~ +100，用 adjustedDelta 計算
  insufficient?: boolean;
  daysSinceCompleted?: number;
}

const DIMS = [
  "blockerHealth", "decisionTimeliness", "handoffSmoothness",
  "loadBalance", "crossDept",
] as const;

interface ImpactData {
  reports: Report[];
  handoffs: Handoff[];
  decisions: Decision[];
  blockers: Blocker[];
  employees: Employee[];
  departments: Department[];
  history: HistoryCase[];
}

/**
 * 計算同期基準漂移：給定一個時間窗口（startDate, endDate），
 * 取 12 週均勻採樣點，估算整體組織健康度的「自然變化速率」，
 * 乘以該時間窗口長度，得到 expected drift。
 *
 * 用快取避免每筆決策都重算 12 個 snapshot。
 */
function computeBaselineDrift(
  startDate: Date,
  endDate: Date,
  data: ImpactData,
  driftCache: { value?: number; ratePerDay?: number },
): number {
  const totalDays = Math.max(1, (+endDate - +startDate) / 86400000);

  // 估算每日漂移率（用 12 週均勻採樣計算整體趨勢的線性回歸斜率）
  if (driftCache.ratePerDay === undefined) {
    const samples = 12;
    const overall: { x: number; y: number }[] = [];
    for (let i = 0; i < samples; i++) {
      const asOf = new Date(NOW);
      asOf.setDate(asOf.getDate() - (samples - 1 - i) * 7);
      const snap = computeHealthSnapshot(
        asOf, data.reports, data.handoffs, data.decisions, data.blockers,
        data.employees, data.departments, data.history,
      );
      overall.push({ x: (+asOf - +NOW) / 86400000, y: snap.overall });
    }
    // 簡單線性回歸 y = ax + b 取斜率 a (per day)
    const n = overall.length;
    const meanX = overall.reduce((s, p) => s + p.x, 0) / n;
    const meanY = overall.reduce((s, p) => s + p.y, 0) / n;
    const num = overall.reduce((s, p) => s + (p.x - meanX) * (p.y - meanY), 0);
    const den = overall.reduce((s, p) => s + (p.x - meanX) ** 2, 0);
    driftCache.ratePerDay = den === 0 ? 0 : num / den;
  }

  return +(driftCache.ratePerDay! * totalDays).toFixed(2);
}

export function analyzeDecisionImpact(
  decision: Decision,
  data: ImpactData,
  windowWeeks: number = 4,
  driftCache: { value?: number; ratePerDay?: number } = {},
): DecisionImpact | null {
  if (!decision.completedAt || !decision.decidedAt) return null;
  const decidedDate = new Date(decision.decidedAt);
  const completedDate = new Date(decision.completedAt);
  if (isNaN(+decidedDate) || isNaN(+completedDate)) return null;

  // 決策前 N 週的快照（取決策日前 1 天）
  const beforeAsOf = new Date(decidedDate);
  beforeAsOf.setDate(beforeAsOf.getDate() - 1);
  const before = computeHealthSnapshot(
    beforeAsOf, data.reports, data.handoffs, data.decisions, data.blockers,
    data.employees, data.departments, data.history,
  );

  // 決策完成後 N 週的快照，clamp 到 NOW
  const wantedAfter = new Date(completedDate);
  wantedAfter.setDate(wantedAfter.getDate() + windowWeeks * 7);
  const afterAsOf = +wantedAfter > +NOW ? NOW : wantedAfter;
  const daysSinceCompleted = Math.round((+NOW - +completedDate) / 86400000);
  const insufficient = +wantedAfter > +NOW;

  const after = computeHealthSnapshot(
    afterAsOf, data.reports, data.handoffs, data.decisions, data.blockers,
    data.employees, data.departments, data.history,
  );

  const deltaOverall = +(after.overall - before.overall).toFixed(1);
  const deltaByDimension: any = {};
  DIMS.forEach((d) => {
    deltaByDimension[d] = +(((after as any)[d] - (before as any)[d]) as number).toFixed(1);
  });

  // ★ Cohort Adjustment：扣掉同期基準漂移
  // baselineDrift = 整體組織健康度在 (beforeAsOf, afterAsOf) 期間的自然變化
  const baselineDrift = computeBaselineDrift(beforeAsOf, afterAsOf, data, driftCache);
  const adjustedDelta = +(deltaOverall - baselineDrift).toFixed(1);

  // 評分用「校正後 delta」，每維度大幅改善 / 惡化 ±2
  let score = adjustedDelta;
  DIMS.forEach((d) => {
    const v = deltaByDimension[d];
    if (v >= 3) score += 2;
    else if (v <= -3) score -= 2;
  });
  score = Math.max(-100, Math.min(100, +score.toFixed(1)));

  const verdict: "正面" | "中性" | "負面" =
    score >= 3 ? "正面" : score <= -3 ? "負面" : "中性";

  return {
    decision,
    before,
    after,
    deltaOverall,
    adjustedDelta,
    baselineDrift,
    deltaByDimension,
    verdict,
    score,
    insufficient,
    daysSinceCompleted,
  };
}

// 主管 / 決議單位的累積成效分數
export interface LeaderScore {
  decidedBy: string;
  totalDecisions: number;
  completedDecisions: number;
  avgImpactScore: number;
  avgAdjustedDelta: number;     // ★ 平均校正後 delta
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

export function computeLeaderScores(data: ImpactData): LeaderScore[] {
  const groups: Record<string, Decision[]> = {};
  data.decisions.forEach((d) => {
    if (!groups[d.decidedBy]) groups[d.decidedBy] = [];
    groups[d.decidedBy].push(d);
  });

  // 共用 driftCache 避免每筆決策重跑 12 週快照
  const driftCache = {};

  return Object.entries(groups).map(([decidedBy, decisions]) => {
    const completed = decisions.filter((d) => d.status === "已完成");
    const impacts = completed
      .map((d) => analyzeDecisionImpact(d, data, 4, driftCache))
      .filter((x): x is DecisionImpact => x !== null);
    const positive = impacts.filter((i) => i.verdict === "正面").length;
    const negative = impacts.filter((i) => i.verdict === "負面").length;
    const neutral = impacts.filter((i) => i.verdict === "中性").length;
    const avgScore = impacts.length
      ? +(impacts.reduce((s, i) => s + i.score, 0) / impacts.length).toFixed(1)
      : 0;
    const avgAdjustedDelta = impacts.length
      ? +(impacts.reduce((s, i) => s + i.adjustedDelta, 0) / impacts.length).toFixed(1)
      : 0;
    return {
      decidedBy,
      totalDecisions: decisions.length,
      completedDecisions: completed.length,
      avgImpactScore: avgScore,
      avgAdjustedDelta,
      positiveCount: positive,
      negativeCount: negative,
      neutralCount: neutral,
    };
  }).sort((a, b) => b.avgImpactScore - a.avgImpactScore);
}
