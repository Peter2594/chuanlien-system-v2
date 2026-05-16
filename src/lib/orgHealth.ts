/**
 * 組織健康度 (Organization Health) - 6 維雷達指標 + 12 週趨勢
 *
 * 設計原則：所有維度都正規化到 0-100，越高越健康（與 ORI 反向）
 *
 * 6 維：
 *   - 卡點健康 (Blocker Health):    P95+ 卡點越少 + 平均 percentile 越低 = 越健康
 *   - 決策及時 (Decision Timeliness): 逾期決策少 + 已完成決策快 = 越健康
 *   - 交接流暢 (Handoff Smoothness): 待簽收逾時少 + 完成率高 = 越健康
 *   - 負載均衡 (Load Balance):      Gini < 0.35、top1 < 20% = 越健康
 *   - 部門協作 (Cross-Dept):        雙向 mention 對稱 = 越健康
 *   - 週報品質 (Report Quality):    本週繳交率 + 平均字數 + 含卡點/協助比例 = 越健康
 */
import { NOW } from "./dateUtils";
import type { Report, Handoff, Decision, Blocker, Employee, Department, HistoryCase } from "./types";
import { analyzeEmployeeLoad, analyzeBlockerRecord, analyzeDeptNetwork } from "./algorithms";

export interface HealthSnapshot {
  blockerHealth: number;
  decisionTimeliness: number;
  handoffSmoothness: number;
  loadBalance: number;
  crossDept: number;
  reportQuality: number;
  overall: number;
  weekISO: string;        // 該週週次 (用於趨勢圖 x 軸)
  events: string[];       // 該週發生的關鍵事件，用於 hover 提示
}

const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

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
  const weekISO = `${asOf.getFullYear()}-W${Math.ceil(((+asOf - +new Date(asOf.getFullYear(), 0, 1)) / 86400000 + 1) / 7)}`;
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
  let blockerHealth = 100;
  if (activeBlockers.length > 0) {
    const analyses = activeBlockers
      .filter((b) => b.status !== "resolved")
      .map((b) => analyzeBlockerRecord(b, blockers, history));
    const p95 = analyses.filter((a) => a.level === "critical").length;
    const p90 = analyses.filter((a) => a.level === "high").length;
    const avgP = analyses.length
      ? analyses.reduce((s, a) => s + (a.percentile || 0), 0) / analyses.length
      : 0;
    blockerHealth = clamp(100 - p95 * 15 - p90 * 7 - Math.max(0, avgP - 50) * 0.8);
    if (p95 > 0) events.push(`${p95} 件極高風險卡點`);
    if (p90 > 0) events.push(`${p90} 件高風險卡點`);
  }

  // ===== 2. 決策及時 =====
  let decisionTimeliness = 100;
  const overdueDec = activeDecisions.filter((d) => d.status === "逾期").length;
  const completed = activeDecisions.filter((d) => d.status === "已完成" && d.completedAt && d.decidedAt);
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
  let loadBalance = 100;
  const loads = analyzeEmployeeLoad(weekReports, activeHandoffs, employees);
  if (loads.length > 0) {
    const scores = loads.map((l) => l.loadScore).sort((a, b) => a - b);
    const total = scores.reduce((s, v) => s + v, 0) || 1;
    let gini = 0;
    const n = scores.length;
    for (let i = 0; i < n; i++) gini += (2 * (i + 1) - n - 1) * scores[i];
    gini = gini / (n * total);
    const overload = loads.filter((l) => l.level === "overload").length;
    loadBalance = clamp(100 - Math.max(0, gini - 0.35) * 200 - overload * 8);
    if (overload > 0) events.push(`${overload} 位員工過載`);
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

  // ===== 6. 週報品質 =====
  let reportQuality = 100;
  const expectedDepts = departments.filter((d) => d.active && d.name !== "營運與管理層").length;
  const submittedDepts = new Set(weekReports.map((r) => r.dept));
  const submissionRate = expectedDepts > 0 ? submittedDepts.size / expectedDepts : 1;
  // 平均「案件 + 卡點 + 協助 + 下週」字數
  if (weekReports.length > 0) {
    const avgLen = weekReports.reduce((s, r) => {
      return s + (r.cases || "").length + (r.blockers || "").length + (r.needHelp || "").length + (r.nextWeek || "").length;
    }, 0) / weekReports.length;
    const hasBlockerField = weekReports.filter((r) => (r.blockers || "").trim()).length / weekReports.length;
    // 基準：80 字以上 = 滿分；30 字以下 = 大扣分
    const lengthScore = clamp((avgLen - 30) / 50 * 100);
    reportQuality = clamp(submissionRate * 60 + lengthScore * 0.3 + hasBlockerField * 10);
  } else {
    reportQuality = submissionRate * 60;
  }
  if (submissionRate < 1) events.push(`${expectedDepts - submittedDepts.size} 個部門未交週報`);

  const overall = +(
    blockerHealth * 0.22
    + decisionTimeliness * 0.18
    + handoffSmoothness * 0.15
    + loadBalance * 0.18
    + crossDept * 0.12
    + reportQuality * 0.15
  ).toFixed(1);

  return {
    blockerHealth: +blockerHealth.toFixed(1),
    decisionTimeliness: +decisionTimeliness.toFixed(1),
    handoffSmoothness: +handoffSmoothness.toFixed(1),
    loadBalance: +loadBalance.toFixed(1),
    crossDept: +crossDept.toFixed(1),
    reportQuality: +reportQuality.toFixed(1),
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
