/**
 * What-if 決策模擬器
 *
 * 互動式調整 (解卡點、加速決策、簽收交接、降低負載)，
 * 即時試算對組織健康度的影響。
 */
import { useState, useMemo, useDeferredValue } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { motion } from "motion/react";
import { FlaskConical, RotateCcw, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/utils";
import { NOW } from "../lib/dateUtils";
import { computeHealthSnapshot, healthLevel } from "../lib/orgHealth";
import { analyzeBlockerRecord, analyzeEmployeeLoad, isDecisionOverdueAt, daysOverdue } from "../lib/algorithms";
import type { Report, Handoff, Decision, Blocker, Employee, Department, HistoryCase } from "../lib/types";

interface Props {
  reports: Report[];
  handoffs: Handoff[];
  decisions: Decision[];
  blockers: Blocker[];
  employees: Employee[];
  departments: Department[];
  history: HistoryCase[];
}

interface Scenario {
  resolvedBlockerIds: Set<string>;
  expeditedDecisionIds: Set<string>;     // 立即標為已完成
  signedHandoffIds: Set<string>;          // 立即簽收
  loadRelief: Record<string, number>;      // employee name → 降低負載百分比
}

const DIMS = [
  { key: "blockerHealth",      short: "卡點健康" },
  { key: "decisionTimeliness", short: "決策及時" },
  { key: "handoffSmoothness",  short: "交接流暢" },
  { key: "loadBalance",        short: "負載均衡" },
  { key: "crossDept",          short: "部門協作" },
  { key: "reportQuality",      short: "週報品質" },
];

export default function WhatIfPage({
  reports, handoffs, decisions, blockers, employees, departments, history,
}: Props) {
  const [scenario, setScenario] = useState<Scenario>({
    resolvedBlockerIds: new Set(),
    expeditedDecisionIds: new Set(),
    signedHandoffIds: new Set(),
    loadRelief: {},
  });
  // 用 useDeferredValue 延遲重算 computeHealthSnapshot
  // 連續快速點選時不會卡 UI（React 自動 batch + 降優先級）
  const deferredScenario = useDeferredValue(scenario);
  const isPending = scenario !== deferredScenario;

  // 活躍卡點 (依風險排序)
  const activeBlockers = useMemo(() => {
    return blockers
      .filter((b) => b.status !== "resolved")
      .map((b) => ({ blocker: b, ana: analyzeBlockerRecord(b, blockers, history) }))
      .sort((a, b) => (b.ana.percentile || 0) - (a.ana.percentile || 0));
  }, [blockers, history]);

  // 逾期決策
  const overdueDecisions = useMemo(() =>
    decisions.filter((d) => isDecisionOverdueAt(d, NOW)),
  [decisions]);

  // 待簽收交接（逾時的）
  const pendingHandoffs = useMemo(() =>
    handoffs.filter((h) => h.status === "待簽收" && (h.hoursOverdue || 0) > 0)
      .sort((a, b) => (b.hoursOverdue || 0) - (a.hoursOverdue || 0)),
  [handoffs]);

  const currentLoads = useMemo(
    () => analyzeEmployeeLoad(reports, handoffs, employees, NOW),
    [reports, handoffs, employees],
  );

  // 套用 scenario 後的模擬資料 — 使用 deferredScenario 讓 React 自動延遲重算
  const simulated = useMemo(() => {
    const newBlockers = blockers.map((b) =>
      deferredScenario.resolvedBlockerIds.has(b.id) ? { ...b, status: "resolved" as const } : b,
    );
    const newDecisions = decisions.map((d) => {
      if (deferredScenario.expeditedDecisionIds.has(d.id)) {
        return { ...d, status: "已完成" as const, completedAt: NOW.toISOString().slice(0, 10) };
      }
      return d;
    });
    const newHandoffs = handoffs.map((h) =>
      deferredScenario.signedHandoffIds.has(h.id) ? { ...h, status: "已簽收" as const, hoursOverdue: undefined } : h,
    );
    return { newBlockers, newDecisions, newHandoffs };
  }, [deferredScenario, blockers, decisions, handoffs]);

  // 基準健康度（現況）
  const baseline = useMemo(() =>
    computeHealthSnapshot(NOW, reports, handoffs, decisions, blockers, employees, departments, history),
  [reports, handoffs, decisions, blockers, employees, departments, history]);

  // 模擬後健康度
  const projectedBase = useMemo(() =>
    computeHealthSnapshot(
      NOW,
      reports,
      simulated.newHandoffs,
      simulated.newDecisions,
      simulated.newBlockers,
      employees,
      departments,
      history,
    ),
  [reports, simulated, employees, departments, history]);

  const projected = useMemo(() => {
    const adjustedLoads = analyzeEmployeeLoad(reports, simulated.newHandoffs, employees, NOW)
      .map((l) => {
        const relief = Math.max(0, Math.min(80, deferredScenario.loadRelief[l.name] || 0));
        return { ...l, loadScore: +(l.loadScore * (1 - relief / 100)).toFixed(2) };
      });

    if (!adjustedLoads.length) return projectedBase;

    const scores = adjustedLoads.map((l) => l.loadScore).sort((a, b) => a - b);
    const total = scores.reduce((s, v) => s + v, 0);
    const gini = total > 0
      ? scores.reduce((s, v, i) => s + (2 * (i + 1) - scores.length - 1) * v, 0) / (scores.length * total)
      : 0;
    const overload = adjustedLoads.filter((l) => l.loadScore >= 25).length;
    const loadBalance = Math.max(0, Math.min(100, 100 - Math.max(0, gini - 0.35) * 200 - overload * 8));
    const overall = +(projectedBase.overall + (loadBalance - projectedBase.loadBalance) * 0.18).toFixed(1);

    return { ...projectedBase, loadBalance: +loadBalance.toFixed(1), overall };
  }, [deferredScenario, employees, reports, simulated, projectedBase]);

  const delta = +(projected.overall - baseline.overall).toFixed(1);
  const baseLevel = healthLevel(baseline.overall);
  const projLevel = healthLevel(projected.overall);

  // 雷達圖資料
  const radarData = DIMS.map((d) => ({
    axis: d.short,
    現況: (baseline as any)[d.key],
    模擬後: (projected as any)[d.key],
  }));

  const totalChanges =
    scenario.resolvedBlockerIds.size +
    scenario.expeditedDecisionIds.size +
    scenario.signedHandoffIds.size +
    Object.values(scenario.loadRelief).filter((v) => v > 0).length;

  const reset = () => setScenario({
    resolvedBlockerIds: new Set(),
    expeditedDecisionIds: new Set(),
    signedHandoffIds: new Set(),
    loadRelief: {},
  });

  const toggleBlocker = (id: string) => {
    const next = new Set(scenario.resolvedBlockerIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setScenario({ ...scenario, resolvedBlockerIds: next });
  };
  const toggleDecision = (id: string) => {
    const next = new Set(scenario.expeditedDecisionIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setScenario({ ...scenario, expeditedDecisionIds: next });
  };
  const toggleHandoff = (id: string) => {
    const next = new Set(scenario.signedHandoffIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setScenario({ ...scenario, signedHandoffIds: next });
  };
  const updateLoadRelief = (name: string, pct: number) => {
    const next = { ...scenario.loadRelief };
    const value = Math.max(0, Math.min(80, pct));
    if (value === 0) delete next[name];
    else next[name] = value;
    setScenario({
      ...scenario,
      loadRelief: next,
    });
  };

  return (
    <div className="max-w-7xl mx-auto pb-12 px-1">
      {/* Hero */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FlaskConical size={20} className="text-violet-500" />
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">What-if 決策模擬器</h1>
          </div>
          <p className="text-sm text-slate-500">
            在做決策前，先看後果 — 拉開關 / 滑桿模擬不同情境對組織健康度的影響。
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPending && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-violet-600 px-2 py-1 rounded-full bg-violet-50">
              <span className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse" />
              計算中...
            </span>
          )}
          {totalChanges > 0 && (
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 hover:border-slate-400 transition text-slate-700"
            >
              <RotateCcw size={12} />
              重置（已套用 {totalChanges} 個調整）
            </button>
          )}
        </div>
      </div>

      {/* 上方對比區：現況 vs 模擬後 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* 雷達 */}
        <Card className="lg:col-span-3 p-5 rounded-2xl">
          <div className="flex items-baseline justify-between mb-2">
            <h3 className="text-sm font-bold text-slate-900">健康度雷達</h3>
            <span className="text-[10px] text-slate-400">現況 vs 模擬後</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={radarData} margin={{ top: 10, right: 16, bottom: 10, left: 16 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} />
                <Radar name="現況"   dataKey="現況"   stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.35} strokeWidth={1.5} />
                <Radar name="模擬後" dataKey="模擬後" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4}  strokeWidth={2} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }}
                  formatter={(v: any, name: any) => [`${(+v).toFixed(0)} 分`, name]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* 分數對比 */}
        <Card className="lg:col-span-2 p-5 rounded-2xl">
          <div className="text-sm font-bold text-slate-900 mb-4">整體健康度</div>
          <div className="space-y-4">
            <ScoreCompare label="現況"   value={baseline.overall} level={baseLevel} />
            <ScoreCompare label="模擬後" value={projected.overall} level={projLevel} accent />
            <div className={cn(
              "rounded-xl p-4 border",
              delta > 0 ? "bg-emerald-50 border-emerald-200"
              : delta < 0 ? "bg-red-50 border-red-200"
              : "bg-slate-50 border-slate-200",
            )}>
              <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">DELTA</div>
              <div className="flex items-center gap-2">
                {delta > 0 ? <TrendingUp size={20} className="text-emerald-600" />
                  : delta < 0 ? <TrendingDown size={20} className="text-red-600" />
                  : <Minus size={20} className="text-slate-400" />}
                <span className={cn(
                  "text-3xl font-black leading-none",
                  delta > 0 ? "text-emerald-600" : delta < 0 ? "text-red-600" : "text-slate-400",
                )}>
                  {delta > 0 ? "+" : ""}{delta.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">分</span>
              </div>
              <div className="text-[11px] text-slate-600 mt-2">
                {delta > 5 ? "顯著改善 ✨ 強烈建議執行"
                  : delta > 2 ? "有改善，可考慮執行"
                  : delta > -2 ? "影響不大，可保留資源"
                  : delta > -5 ? "略為惡化，需評估"
                  : "顯著惡化 ⚠️ 不建議執行"}
              </div>
            </div>

            {/* 維度 delta */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              {DIMS.map((d) => {
                const dv = +((projected as any)[d.key] - (baseline as any)[d.key]).toFixed(1);
                if (Math.abs(dv) < 0.1) return null;
                return (
                  <div key={d.key} className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-600">{d.short}</span>
                    <span className={cn(
                      "font-bold font-mono",
                      dv > 0 ? "text-emerald-600" : "text-red-600",
                    )}>
                      {dv > 0 ? "+" : ""}{dv.toFixed(1)}
                    </span>
                  </div>
                );
              })}
              {DIMS.every((d) => Math.abs(+((projected as any)[d.key] - (baseline as any)[d.key])) < 0.1) && (
                <div className="text-[11px] text-slate-400 text-center py-2">尚未產生任何變化</div>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* 控制面板 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 解卡點 */}
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-slate-900">解掉卡點</div>
              <div className="text-[11px] text-slate-500">點任一筆 → 標為已解決</div>
            </div>
            <span className="text-[10px] text-slate-400">已解 {scenario.resolvedBlockerIds.size} / {activeBlockers.length}</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {activeBlockers.slice(0, 8).map(({ blocker, ana }) => {
              const checked = scenario.resolvedBlockerIds.has(blocker.id);
              return (
                <ScenarioRow
                  key={blocker.id}
                  checked={checked}
                  title={blocker.title}
                  meta={`${blocker.dept} · ${ana.levelLabel}`}
                  emphasis={`${ana.currentDays} 天`}
                  emphasisColor={ana.level === "critical" ? "text-red-600" : ana.level === "high" ? "text-amber-600" : "text-slate-500"}
                  onToggle={() => toggleBlocker(blocker.id)}
                />
              );
            })}
          </div>
        </Card>

        {/* 加速決策 */}
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-slate-900">加速逾期決策</div>
              <div className="text-[11px] text-slate-500">點任一筆 → 立即標為完成</div>
            </div>
            <span className="text-[10px] text-slate-400">已加速 {scenario.expeditedDecisionIds.size} / {overdueDecisions.length}</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {overdueDecisions.length === 0 ? (
              <div className="text-[11px] text-slate-400 text-center py-4">目前沒有逾期決策</div>
            ) : (
              overdueDecisions.map((d) => {
                const checked = scenario.expeditedDecisionIds.has(d.id);
                const daysLate = daysOverdue(d, NOW);
                return (
                  <ScenarioRow
                    key={d.id}
                    checked={checked}
                    title={d.title}
                    meta={`指派 ${d.assignedDept}`}
                    emphasis={`逾 ${daysLate} 天`}
                    emphasisColor="text-red-600"
                    onToggle={() => toggleDecision(d.id)}
                  />
                );
              })
            )}
          </div>
        </Card>

        {/* 簽收交接 */}
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-slate-900">立即簽收交接</div>
              <div className="text-[11px] text-slate-500">點任一筆 → 改為已簽收</div>
            </div>
            <span className="text-[10px] text-slate-400">已簽 {scenario.signedHandoffIds.size} / {pendingHandoffs.length}</span>
          </div>
          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {pendingHandoffs.length === 0 ? (
              <div className="text-[11px] text-slate-400 text-center py-4">目前沒有逾時交接</div>
            ) : (
              pendingHandoffs.slice(0, 8).map((h) => {
                const checked = scenario.signedHandoffIds.has(h.id);
                return (
                  <ScenarioRow
                    key={h.id}
                    checked={checked}
                    title={h.title}
                    meta={`${h.from} → ${h.to}`}
                    emphasis={`${h.hoursOverdue}h`}
                    emphasisColor="text-amber-600"
                    onToggle={() => toggleHandoff(h.id)}
                  />
                );
              })
            )}
          </div>
        </Card>

        {/* 降低負載 */}
        <Card className="p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-bold text-slate-900">降低高負載員工工作量</div>
              <div className="text-[11px] text-slate-500">模擬把案件/卡點轉出，並用同一批員工重算 Gini</div>
            </div>
            <span className="text-[10px] text-slate-400">
              已調整 {Object.values(scenario.loadRelief).filter((v) => v > 0).length} 人
            </span>
          </div>
          <div className="space-y-3">
            {currentLoads.slice(0, 6).map((load) => {
              const pct = scenario.loadRelief[load.name] || 0;
              return (
                <div key={load.name} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{load.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {load.dept} · 負載 {load.loadScore.toFixed(1)} · P{load.percentile}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateLoadRelief(load.name, pct - 10)}
                      disabled={pct === 0}
                      className={cn(
                        "w-7 h-7 rounded-lg font-bold transition",
                        pct === 0 ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                      )}
                    >−</button>
                    <span className="w-12 text-center text-sm font-bold text-slate-900">
                      {pct}%
                    </span>
                    <button
                      onClick={() => updateLoadRelief(load.name, pct + 10)}
                      disabled={pct >= 80}
                      className={cn(
                        "w-7 h-7 rounded-lg font-bold transition",
                        pct >= 80 ? "bg-slate-100 text-slate-300 cursor-not-allowed"
                        : "bg-violet-100 text-violet-700 hover:bg-violet-200",
                      )}
                    >+</button>
                  </div>
                </div>
              );
            })}
            <div className="text-[10px] text-slate-400 italic mt-2 pt-3 border-t border-slate-100">
              ※ 這裡代表把該員工部分工作量轉出或降低，不新增 0 負載員工；若 Gini 下降，負載均衡分數才會上升。
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function ScoreCompare({ label, value, level, accent }: { label: string; value: number; level: { label: string; color: string; bgColor: string }; accent?: boolean }) {
  return (
    <div className={cn(
      "rounded-xl p-3",
      accent ? "bg-violet-50 border border-violet-200" : "bg-slate-50",
    )}>
      <div className="text-[10px] text-slate-500 font-bold tracking-wider mb-1">{label}</div>
      <div className="flex items-baseline gap-2">
        <span className={cn("text-3xl font-black leading-none", level.color)}>
          {value.toFixed(0)}
        </span>
        <span className="text-xs text-slate-400">/100</span>
        <span className={cn("ml-auto text-[11px] font-bold", level.color)}>
          {level.label}
        </span>
      </div>
    </div>
  );
}

function ScenarioRow({ checked, title, meta, emphasis, emphasisColor, onToggle }: {
  checked: boolean; title: string; meta: string; emphasis?: string; emphasisColor?: string; onToggle: () => void; key?: string;
}) {
  return (
    <motion.button
      onClick={onToggle}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "w-full text-left flex items-center gap-3 px-3 py-2 rounded-lg border transition",
        checked
          ? "bg-violet-50 border-violet-300 shadow-sm"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50",
      )}
    >
      <div className={cn(
        "w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition",
        checked ? "bg-violet-500 border-violet-500" : "border-slate-300",
      )}>
        {checked && <span className="text-white text-[10px] font-bold">✓</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className={cn("text-xs font-bold truncate", checked ? "text-violet-900 line-through" : "text-slate-800")}>
          {title}
        </div>
        <div className="text-[10px] text-slate-500 truncate">{meta}</div>
      </div>
      {emphasis && (
        <span className={cn("text-[10px] font-bold shrink-0", emphasisColor)}>
          {emphasis}
        </span>
      )}
    </motion.button>
  );
}
