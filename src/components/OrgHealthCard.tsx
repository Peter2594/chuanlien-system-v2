/**
 * 組織健康度卡片：雷達圖（本週 vs 12週均值） + 12 週趨勢線（含拐點）
 */
import { useMemo, useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ReferenceDot, Legend,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import { Activity, TrendingUp, AlertCircle, X, MousePointerClick } from "lucide-react";
import { computeWeeklySeries, computeHealthSnapshot, detectInflectionPoints, healthLevel } from "../lib/orgHealth";
import { NOW } from "../lib/dateUtils";
import { cn } from "../lib/utils";
import type { Report, Handoff, Decision, Blocker, Employee, Department, HistoryCase } from "../lib/types";
import type { TabId } from "./Shell/Sidebar";

interface Props {
  reports: Report[];
  handoffs: Handoff[];
  decisions: Decision[];
  blockers: Blocker[];
  employees: Employee[];
  departments: Department[];
  history: HistoryCase[];
  onNavigate?: (tab: TabId) => void;
}

// 把事件字串對應到該跳去的分頁
function eventToTab(event: string): TabId | null {
  if (/卡點/.test(event)) return "analytics";
  if (/決策/.test(event)) return "decisions";
  if (/交接/.test(event)) return "handoff";
  if (/過載|員工/.test(event)) return "employees";
  if (/單向溝通|部門/.test(event) && !/未交週報/.test(event)) return "orgnetwork";
  if (/週報/.test(event)) return "report";
  return null;
}

const AXIS_LABELS = [
  { key: "blockerHealth",      short: "卡點健康", desc: "P95+ 卡點越少越健康" },
  { key: "decisionTimeliness", short: "決策及時", desc: "逾期決策越少越健康" },
  { key: "handoffSmoothness",  short: "交接流暢", desc: "待簽收逾時越少越健康" },
  { key: "loadBalance",        short: "負載均衡", desc: "Gini < 0.35 為健康" },
  { key: "crossDept",          short: "部門協作", desc: "雙向溝通對稱為健康" },
  { key: "reportQuality",      short: "週報品質", desc: "繳交率+內容深度" },
];

export function OrgHealthCard({
  reports, handoffs, decisions, blockers, employees, departments, history, onNavigate,
}: Props) {
  const [pinnedWeek, setPinnedWeek] = useState<number | null>(null);

  const { series, current, avg, inflections } = useMemo(() => {
    const series = computeWeeklySeries(12, reports, handoffs, decisions, blockers, employees, departments, history);
    const current = computeHealthSnapshot(NOW, reports, handoffs, decisions, blockers, employees, departments, history);
    // 平均（過去 12 週的）
    const avgVal = (key: string) => {
      const vals = series.map((s: any) => s[key] as number);
      return vals.length ? +(vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1) : 0;
    };
    const avg = {
      blockerHealth: avgVal("blockerHealth"),
      decisionTimeliness: avgVal("decisionTimeliness"),
      handoffSmoothness: avgVal("handoffSmoothness"),
      loadBalance: avgVal("loadBalance"),
      crossDept: avgVal("crossDept"),
      reportQuality: avgVal("reportQuality"),
    };
    const inflections = detectInflectionPoints(series);
    return { series, current, avg, inflections };
  }, [reports, handoffs, decisions, blockers, employees, departments, history]);

  // 雷達圖資料 (含本週 vs 12週均值)
  const radarData = AXIS_LABELS.map((a) => ({
    axis: a.short,
    本週: (current as any)[a.key] as number,
    "12週均值": (avg as any)[a.key] as number,
    desc: a.desc,
  }));

  // 趨勢線資料
  const trendData = series.map((s, i) => ({
    week: i === series.length - 1 ? "本週" : `${series.length - 1 - i}週前`,
    idx: i,
    overall: s.overall,
    events: s.events,
  }));

  const level = healthLevel(current.overall);
  const prevOverall = series.length >= 2 ? series[series.length - 2].overall : current.overall;
  const delta = +(current.overall - prevOverall).toFixed(1);
  const pinnedSnap = pinnedWeek !== null ? series[pinnedWeek] : null;
  const pinnedWeekLabel = pinnedWeek !== null ? trendData[pinnedWeek].week : "";

  // 顯示哪些維度最弱（前 2 名）
  const weakAxes = [...AXIS_LABELS]
    .map((a) => ({ ...a, value: (current as any)[a.key] as number }))
    .sort((a, b) => a.value - b.value)
    .slice(0, 2);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity size={16} className="text-blue-500" />
              <h3 className="text-base font-bold text-slate-900">組織健康度儀表板</h3>
              <span className="text-[10px] text-slate-400 font-bold tracking-wider ml-1">ORG HEALTH</span>
            </div>
            <p className="text-xs text-slate-500">6 維雷達 × 12 週趨勢 — 點趨勢線看當週事件</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center justify-end gap-2">
                <div className={cn("text-4xl font-black leading-none", level.color)}>
                  {current.overall.toFixed(0)}
                </div>
                <span className="text-sm text-slate-400 font-medium">/100</span>
              </div>
              <div className={cn("text-[11px] font-bold tracking-wide mt-1", level.color)}>
                {level.label}
                {delta !== 0 && (
                  <span className={cn("ml-2", delta > 0 ? "text-emerald-600" : "text-red-600")}>
                    {delta > 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="mt-2 text-xs text-slate-500 italic">{level.advice}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-0">
        {/* 雷達圖 */}
        <div className="lg:col-span-2 p-5 border-r border-slate-100">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">6 維雷達</span>
            <span className="text-[10px] text-slate-400">本週 vs 12 週均值</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <RadarChart data={radarData} margin={{ top: 10, right: 16, bottom: 10, left: 16 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="axis" tick={{ fontSize: 11, fill: "#475569", fontWeight: 600 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 9, fill: "#94a3b8" }} axisLine={false} />
                <Radar name="12週均值" dataKey="12週均值" stroke="#cbd5e1" fill="#cbd5e1" fillOpacity={0.35} strokeWidth={1.5} />
                <Radar name="本週"     dataKey="本週"     stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} strokeWidth={2} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }}
                  formatter={(v: any, name: any) => [`${(+v).toFixed(0)} 分`, name]}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 趨勢線 */}
        <div className="lg:col-span-3 p-5">
          <div className="flex items-baseline justify-between mb-2">
            <span className="text-xs font-bold text-slate-700">12 週趨勢</span>
            <div className="flex items-center gap-3 text-[10px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-blue-500" /> 健康度
              </span>
              {inflections.length > 0 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-500" /> 拐點 ({inflections.length})
                </span>
              )}
            </div>
          </div>
          <div className="h-56">
            <ResponsiveContainer>
              <LineChart
                data={trendData}
                margin={{ top: 8, right: 16, bottom: 4, left: 0 }}
                onClick={(s: any) => {
                  if (s && s.activeTooltipIndex !== undefined && s.activeTooltipIndex !== null) {
                    setPinnedWeek((prev) => prev === s.activeTooltipIndex ? null : s.activeTooltipIndex);
                  }
                }}
                style={{ cursor: "pointer" }}
              >
                <XAxis dataKey="week" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.12)", fontSize: 11 }}
                  formatter={(v: any) => [`${(+v).toFixed(1)} 分`, "健康度"]}
                  labelFormatter={(label: any) => `${label} · 點圖看當週事件`}
                />
                <Line type="monotone" dataKey="overall" stroke="#3b82f6" strokeWidth={2.5}
                  dot={(props: any) => {
                    const { cx, cy, index } = props;
                    const isPinned = pinnedWeek === index;
                    return (
                      <circle
                        key={`dot-${index}`}
                        cx={cx} cy={cy}
                        r={isPinned ? 6 : 3}
                        fill={isPinned ? "#1d4ed8" : "#3b82f6"}
                        stroke={isPinned ? "#fff" : "none"}
                        strokeWidth={isPinned ? 3 : 0}
                        style={{ cursor: "pointer" }}
                      />
                    );
                  }}
                  activeDot={{ r: 6, fill: "#1d4ed8", stroke: "#fff", strokeWidth: 2 }} />
                {inflections.map((i) => (
                  <ReferenceDot key={i} x={trendData[i].week} y={trendData[i].overall}
                    r={5} fill="#ef4444" stroke="#fff" strokeWidth={2} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 點擊後 pin 住的事件提示區 */}
          <AnimatePresence mode="wait">
            {pinnedSnap ? (
              <motion.div
                key={pinnedSnap.weekISO}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3 overflow-hidden"
              >
                <div className={cn(
                  "px-4 py-3 rounded-xl border text-xs",
                  pinnedSnap.events.length > 0
                    ? "bg-blue-50 border-blue-200"
                    : "bg-emerald-50 border-emerald-200",
                )}>
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className={cn(
                        "flex items-center gap-1.5 font-bold mb-1",
                        pinnedSnap.events.length > 0 ? "text-blue-700" : "text-emerald-700",
                      )}>
                        <AlertCircle size={12} />
                        {pinnedWeekLabel} · 健康度 {pinnedSnap.overall.toFixed(1)} 分
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {pinnedSnap.events.length > 0
                          ? `該週發生 ${pinnedSnap.events.length} 件事`
                          : "該週運作平穩，無重大事件"}
                      </div>
                    </div>
                    <button
                      onClick={() => setPinnedWeek(null)}
                      className={cn(
                        "p-1 rounded-full transition shrink-0",
                        pinnedSnap.events.length > 0
                          ? "hover:bg-blue-100 text-blue-600"
                          : "hover:bg-emerald-100 text-emerald-600",
                      )}
                    >
                      <X size={12} />
                    </button>
                  </div>
                  {pinnedSnap.events.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {pinnedSnap.events.map((e, i) => {
                        const tab = eventToTab(e);
                        const clickable = !!(tab && onNavigate);
                        return (
                          <button
                            key={i}
                            onClick={() => clickable && onNavigate!(tab!)}
                            disabled={!clickable}
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded text-blue-700 font-medium border border-blue-100 transition",
                              clickable
                                ? "bg-white hover:bg-blue-100 hover:border-blue-300 cursor-pointer hover:shadow-sm"
                                : "bg-white cursor-default",
                            )}
                          >
                            {e}
                            {clickable && (
                              <span className="text-blue-400 text-[10px]">→</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-3 text-xs text-slate-500 flex items-center gap-1.5"
              >
                <MousePointerClick size={12} className="text-slate-400" />
                <span>
                  點趨勢線任一週看當週事件
                  {inflections.length > 0 && (
                    <>，或檢視 <strong className="text-red-600">{inflections.length}</strong> 個拐點</>
                  )}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* 最弱的兩個維度 - 下方建議區 */}
      {weakAxes.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50">
          <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-2">本週優先改善</div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {weakAxes.map((a) => {
              const meta = healthLevel(a.value);
              return (
                <div key={a.key} className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200/70">
                  <div className={cn("w-1 h-10 rounded-full", meta.bgColor)} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800">{a.short}</div>
                    <div className="text-[10px] text-slate-500 truncate">{a.desc}</div>
                  </div>
                  <div className={cn("text-xl font-black", meta.color)}>{a.value.toFixed(0)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
