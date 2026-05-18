/**
 * 決策成效追蹤 (Decision Impact)
 *
 * 對每筆「已完成」決策，比較決策前 N 週 vs 決策後 N 週的組織健康度，
 * 量化該決策對組織的影響。
 */
import { computeHealthSnapshot, type HealthSnapshot } from "./orgHealth";
import type { Decision, Report, Handoff, Blocker, Employee, Department, HistoryCase } from "./types";

export interface DecisionImpact {
  decision: Decision;
  before: HealthSnapshot;
  after: HealthSnapshot;
  deltaOverall: number;
  deltaByDimension: {
    blockerHealth: number;
    decisionTimeliness: number;
    handoffSmoothness: number;
    loadBalance: number;
    crossDept: number;
    reportQuality: number;
  };
  verdict: "正面" | "中性" | "負面";
  score: number;          // -100 ~ +100，正向為改善
}

const DIMS = [
  "blockerHealth", "decisionTimeliness", "handoffSmoothness",
  "loadBalance", "crossDept", "reportQuality",
] as const;

export function analyzeDecisionImpact(
  decision: Decision,
  data: {
    reports: Report[];
    handoffs: Handoff[];
    decisions: Decision[];
    blockers: Blocker[];
    employees: Employee[];
    departments: Department[];
    history: HistoryCase[];
  },
  windowWeeks: number = 4,
): DecisionImpact | null {
  if (!decision.completedAt || !decision.decidedAt) return null;
  const decidedDate = new Date(decision.decidedAt);
  const completedDate = new Date(decision.completedAt);

  // 決策前 N 週的快照（取決策日前 4 週）
  const beforeAsOf = new Date(decidedDate);
  beforeAsOf.setDate(beforeAsOf.getDate() - 1);
  const before = computeHealthSnapshot(
    beforeAsOf, data.reports, data.handoffs, data.decisions, data.blockers,
    data.employees, data.departments, data.history,
  );

  // 決策完成後 N 週的快照
  const afterAsOf = new Date(completedDate);
  afterAsOf.setDate(afterAsOf.getDate() + windowWeeks * 7);
  const after = computeHealthSnapshot(
    afterAsOf, data.reports, data.handoffs, data.decisions, data.blockers,
    data.employees, data.departments, data.history,
  );

  const deltaOverall = +(after.overall - before.overall).toFixed(1);
  const deltaByDimension: any = {};
  DIMS.forEach((d) => {
    deltaByDimension[d] = +(((after as any)[d] - (before as any)[d]) as number).toFixed(1);
  });

  // 評分：deltaOverall 直接當基底，每維度若改善 ≥3 +5 / 惡化 ≥3 -5
  let score = deltaOverall;
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
    deltaByDimension,
    verdict,
    score,
  };
}

// 主管 / 決議單位的累積成效分數
export interface LeaderScore {
  decidedBy: string;
  totalDecisions: number;
  completedDecisions: number;
  avgImpactScore: number;
  positiveCount: number;
  negativeCount: number;
  neutralCount: number;
}

export function computeLeaderScores(
  data: {
    reports: Report[];
    handoffs: Handoff[];
    decisions: Decision[];
    blockers: Blocker[];
    employees: Employee[];
    departments: Department[];
    history: HistoryCase[];
  },
): LeaderScore[] {
  const groups: Record<string, Decision[]> = {};
  data.decisions.forEach((d) => {
    if (!groups[d.decidedBy]) groups[d.decidedBy] = [];
    groups[d.decidedBy].push(d);
  });

  return Object.entries(groups).map(([decidedBy, decisions]) => {
    const completed = decisions.filter((d) => d.status === "已完成");
    const impacts = completed
      .map((d) => analyzeDecisionImpact(d, data, 4))
      .filter((x): x is DecisionImpact => x !== null);
    const positive = impacts.filter((i) => i.verdict === "正面").length;
    const negative = impacts.filter((i) => i.verdict === "負面").length;
    const neutral = impacts.filter((i) => i.verdict === "中性").length;
    const avg = impacts.length
      ? +(impacts.reduce((s, i) => s + i.score, 0) / impacts.length).toFixed(1)
      : 0;
    return {
      decidedBy,
      totalDecisions: decisions.length,
      completedDecisions: completed.length,
      avgImpactScore: avg,
      positiveCount: positive,
      negativeCount: negative,
      neutralCount: neutral,
    };
  }).sort((a, b) => b.avgImpactScore - a.avgImpactScore);
}
