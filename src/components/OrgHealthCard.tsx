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
import { analyzeBlockerRecord, analyzeEmployeeLoad } from "../lib/algorithms";

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

// 事件 → 還原當週的具體項目（依 asOf 時間點推算）
function resolveEventItems(
  event: string,
  asOf: Date,
  data: { blockers: Blocker[]; decisions: Decision[]; handoffs: Handoff[]; reports: Report[]; departments: Department[]; employees: Employee[]; history: HistoryCase[] },
): { title: string; meta?: string; emphasis?: string }[] {
  const asOfMs = +asOf;
  const daysAt = (createdAt: string) =>
    Math.max(0, Math.round((asOfMs - +new Date(createdAt)) / 86400000));

  // 卡點分析：用 analyzeBlockerRecord 取得 level，與 chip 的計算來源一致
  // 注意：analyzeBlockerRecord 用 new Date() 算 currentDays，所以歷史週的 days 會偏大；
  //       為了讓 chip 與 inline 數量一致，這裡刻意用同樣的方式分析。
  const analyzeAll = () => data.blockers
    .filter((b) => b.status !== "resolved" && new Date(b.createdAt) <= asOf)
    .map((b) => ({ blocker: b, ana: analyzeBlockerRecord(b, data.blockers, data.history) }));

  if (/極高風險卡點/.test(event)) {
    return analyzeAll()
      .filter(({ ana }) => ana.level === "critical")
      .sort((a, b) => (b.ana.percentile || 0) - (a.ana.percentile || 0))
      .map(({ blocker, ana }) => ({
        title: blocker.title,
        meta: `${blocker.dept} · ${blocker.owner}`,
        emphasis: `當週已卡 ${ana.currentDays} 天`,
      }));
  }
  if (/高風險卡點/.test(event)) {
    return analyzeAll()
      .filter(({ ana }) => ana.level === "high")
      .sort((a, b) => (b.ana.percentile || 0) - (a.ana.percentile || 0))
      .map(({ blocker, ana }) => ({
        title: blocker.title,
        meta: `${blocker.dept} · ${blocker.owner}`,
        emphasis: `當週已卡 ${ana.currentDays} 天`,
      }));
  }
  if (/決策逾期|筆決策/.test(event)) {
    // 當週的「逾期」= 已決議 + 截止日已過 + (尚未完成 或 完成在 asOf 之後)
    return data.decisions
      .filter((d) => {
        if (!d.decidedAt || !d.dueDate || d.dueDate === "即時生效") return false;
        if (new Date(d.decidedAt) > asOf) return false;
        if (new Date(d.dueDate) >= asOf) return false;
        if (d.completedAt && new Date(d.completedAt) <= asOf) return false;
        return true;
      })
      .map((d) => {
        const days = Math.max(0, Math.round((asOfMs - +new Date(d.dueDate)) / 86400000));
        return {
          title: d.title,
          meta: `指派 ${d.assignedDept}`,
          emphasis: days === 0 ? "當週剛逾期" : `當週逾期 ${days} 天`,
        };
      });
  }
  if (/員工過載|位員工/.test(event)) {
    // 用 analyzeEmployeeLoad 取得當週時點的負載，篩 level === "overload"
    // 與 chip 的計算來源一致
    const weekStart = +asOf - 7 * 86400000;
    const weekReports = data.reports.filter((r) => {
      if (!r.submittedAt) return false;
      const t = +new Date(r.submittedAt);
      return t > weekStart && t <= asOfMs;
    });
    const activeHandoffs = data.handoffs.filter((h) => new Date(h.createdAt) <= asOf);
    const loads = analyzeEmployeeLoad(weekReports, activeHandoffs, data.employees);
    return loads
      .filter((l) => l.level === "overload")
      .sort((a, b) => b.loadScore - a.loadScore)
      .map((l) => ({
        title: l.name,
        meta: `${l.dept} · ${l.role}`,
        emphasis: `負載分 ${l.loadScore.toFixed(1)} · P${l.percentile}`,
      }));
  }
  if (/交接逾時/.test(event)) {
    return data.handoffs
      .filter((h) => new Date(h.createdAt) <= asOf && h.status === "待簽收" && (h.hoursOverdue || 0) > 0)
      .sort((a, b) => (b.hoursOverdue || 0) - (a.hoursOverdue || 0))
      .map((h) => ({
        title: h.title,
        meta: `${h.from} → ${h.to}`,
        emphasis: `當週逾時 ${h.hoursOverdue} 小時`,
      }));
  }
  if (/單向溝通/.test(event)) {
    return [{
      title: "當週偵測到部門間溝通不對稱",
      meta: "請至組織分析頁的網絡圖查看",
      emphasis: "查看詳細",
    }];
  }
  if (/未交週報/.test(event)) {
    const activeDepts = data.departments.filter((d) => d.active && d.name !== "營運與管理層").map((d) => d.name);
    // 該週繳交：submittedAt 在 asOf 前 7 天內
    const weekStart = +asOf - 7 * 86400000;
    const submitted = new Set(
      data.reports
        .filter((r) => {
          if (!r.submittedAt) return false;
          const t = +new Date(r.submittedAt);
          return t > weekStart && t <= asOfMs;
        })
        .map((r) => r.dept),
    );
    return activeDepts
      .filter((d) => !submitted.has(d))
      .map((d) => ({ title: d, meta: "當週尚未繳交週報", emphasis: "待繳" }));
  }
  return [];
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
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

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
                    setExpandedEvent(null);
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
                    <>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {pinnedSnap.events.map((e, i) => {
                          const isExpanded = expandedEvent === e;
                          return (
                            <button
                              key={i}
                              onClick={() => setExpandedEvent(isExpanded ? null : e)}
                              className={cn(
                                "inline-flex items-center gap-1 px-2 py-1 rounded font-medium border transition cursor-pointer",
                                isExpanded
                                  ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                  : "bg-white text-blue-700 border-blue-100 hover:bg-blue-100 hover:border-blue-300 hover:shadow-sm",
                              )}
                            >
                              {e}
                              <span className={cn(
                                "text-[10px] transition",
                                isExpanded ? "rotate-180 text-white" : "text-blue-400",
                              )}>▾</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Inline 詳細項目展開區 */}
                      <AnimatePresence>
                        {expandedEvent && (
                          <motion.div
                            key={expandedEvent}
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.18 }}
                            className="overflow-hidden mt-3"
                          >
                            {(() => {
                              // 用 pinned 週次的 asOf 還原當週狀態
                              const asOf = new Date(NOW);
                              const weeksBack = series.length - 1 - (pinnedWeek ?? series.length - 1);
                              asOf.setDate(asOf.getDate() - weeksBack * 7);
                              const items = resolveEventItems(expandedEvent, asOf, {
                                blockers, decisions, handoffs, reports, departments, employees, history,
                              });
                              const tab = eventToTab(expandedEvent);
                              return (
                                <div className="bg-white rounded-lg border border-blue-200 p-3">
                                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100">
                                    <div className="text-[11px] font-bold text-slate-700">
                                      {pinnedWeekLabel}．{expandedEvent}
                                      <span className="text-slate-400 font-normal"> · 共 {items.length} 項</span>
                                    </div>
                                    {tab && onNavigate && (
                                      <button
                                        onClick={() => onNavigate(tab)}
                                        className="text-[10px] text-blue-600 hover:text-blue-700 font-bold hover:underline"
                                      >
                                        前往完整頁面 →
                                      </button>
                                    )}
                                  </div>

                                  {items.length === 0 ? (
                                    <div className="text-[11px] text-slate-400 py-3 text-center">
                                      無相關資料
                                    </div>
                                  ) : (
                                    <div className="space-y-1">
                                      {items.slice(0, 6).map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50">
                                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                          <div className="flex-1 min-w-0">
                                            <div className="text-[11px] font-bold text-slate-800 truncate">{item.title}</div>
                                            {item.meta && (
                                              <div className="text-[10px] text-slate-500 truncate mt-0.5">{item.meta}</div>
                                            )}
                                          </div>
                                          {item.emphasis && (
                                            <span className="text-[10px] font-bold text-blue-600 shrink-0">
                                              {item.emphasis}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                      {items.length > 6 && (
                                        <div className="text-[10px] text-slate-400 text-center pt-1">
                                          還有 {items.length - 6} 項…
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </>
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
