import { useMemo, useState } from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { Pill } from "../components/ui/Pill";
import { cn } from "../lib/utils";
import { BLOCKER_CATEGORIES } from "../lib/constants";
import { analyzeBlockerRecord, stats } from "../lib/algorithms";
import type { Blocker, HistoryCase } from "../lib/types";

interface Props {
  blockers: Blocker[];
  history: HistoryCase[];
}

type RiskLevel = "critical" | "high" | "medium" | "normal";

const RISK_META: Record<RiskLevel, { label: string; color: string; ring: string; bg: string; text: string; dot: string }> = {
  critical: { label: "極高風險", color: "bg-red-500",     ring: "ring-red-300",     bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500" },
  high:     { label: "高風險",   color: "bg-amber-500",   ring: "ring-amber-300",   bg: "bg-amber-50",   text: "text-amber-600",   dot: "bg-amber-500" },
  medium:   { label: "關注中",   color: "bg-blue-500",    ring: "ring-blue-300",    bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-500" },
  normal:   { label: "正常",     color: "bg-emerald-500", ring: "ring-emerald-300", bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500" },
};

export default function BlockerAnalyticsPage({ blockers, history }: Props) {
  const [selectedRisk, setSelectedRisk] = useState<RiskLevel | null>(null);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewCase, setViewCase] = useState<HistoryCase | null>(null);

  // 各類別統計
  const categorySummary = useMemo(() => {
    return BLOCKER_CATEGORIES.map((cat) => {
      const items = history.filter((h) => (h.tags || []).includes(cat.label));
      const days = items.map((h) => {
        const m = String(h.outcome || "").match(/(\d+)\s*天/);
        return m ? parseInt(m[1]) : 0;
      }).filter((d) => d > 0);
      return {
        ...cat,
        count: items.length,
        mean: stats.mean(days),
        p75: stats.percentile(days, 75),
        p90: stats.percentile(days, 90),
        p95: stats.percentile(days, 95),
        items,
      };
    }).sort((a, b) => b.mean - a.mean);
  }, [history]);

  // 活躍卡點
  const activeBlockers = useMemo(() => {
    return blockers
      .filter((b) => b.status !== "resolved")
      .map((b) => analyzeBlockerRecord(b, blockers, history))
      .sort((a, b) => (b.percentile || 0) - (a.percentile || 0));
  }, [blockers, history]);

  const riskCounts: Record<RiskLevel, number> = {
    critical: activeBlockers.filter((b) => b.level === "critical").length,
    high:     activeBlockers.filter((b) => b.level === "high").length,
    medium:   activeBlockers.filter((b) => b.level === "medium").length,
    normal:   activeBlockers.filter((b) => b.level === "normal").length,
  };

  const filteredBlockers = selectedRisk
    ? activeBlockers.filter((b) => b.level === selectedRisk)
    : [];

  const selectedCatData = categorySummary.find((c) => c.key === selectedCat);

  return (
    <div className="max-w-6xl mx-auto pb-12 px-1">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">卡點分析</h1>
        <p className="text-sm text-slate-500 mt-1">
          共 <strong className="text-slate-700">{activeBlockers.length}</strong> 筆活躍卡點 · 點下方風險區塊看詳細
        </p>
      </div>

      {/* 大型風險摘要 - 點擊展開 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {(Object.keys(RISK_META) as RiskLevel[]).map((level) => {
          const meta = RISK_META[level];
          const count = riskCounts[level];
          const isSelected = selectedRisk === level;
          const isDisabled = count === 0;
          return (
            <motion.button
              key={level}
              whileHover={!isDisabled ? { y: -2 } : {}}
              whileTap={!isDisabled ? { scale: 0.98 } : {}}
              onClick={() => !isDisabled && setSelectedRisk(isSelected ? null : level)}
              disabled={isDisabled}
              className={cn(
                "relative text-left bg-white rounded-2xl border p-6 transition-all overflow-hidden",
                isDisabled
                  ? "border-slate-200/60 opacity-50 cursor-not-allowed"
                  : isSelected
                    ? `border-transparent shadow-lg ring-4 ${meta.ring}`
                    : "border-slate-200/70 hover:shadow-md cursor-pointer",
              )}
            >
              {/* 左側色條 */}
              <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", meta.color)} />
              <div className="pl-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 tracking-wide">{meta.label}</span>
                  {isSelected && (
                    <ChevronDown size={16} className="text-slate-400 rotate-180 transition" />
                  )}
                </div>
                <div className={cn(
                  "text-5xl font-black leading-none",
                  count === 0 ? "text-slate-300" : meta.text,
                )}>
                  {count}
                </div>
                <div className="text-[11px] text-slate-400 mt-2">
                  {count === 0 ? "目前無此風險卡點"
                    : isSelected ? "點此收合" : "點擊看清單"}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* 選中風險的卡點清單（預設收起） */}
      <AnimatePresence initial={false}>
        {selectedRisk && filteredBlockers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden mb-10"
          >
            <div className="pt-4 pb-2 flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", RISK_META[selectedRisk].dot)} />
              <h3 className="text-base font-bold text-slate-900">
                {RISK_META[selectedRisk].label} · {filteredBlockers.length} 筆
              </h3>
            </div>
            <div className="space-y-2.5">
              {filteredBlockers.map((a, i) => {
                const id = a.blocker?.id || String(i);
                const isExpanded = expandedId === id;
                const meta = RISK_META[a.level as RiskLevel];
                return (
                  <motion.div
                    key={id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : id)}
                      className={cn(
                        "w-full text-left rounded-2xl border bg-white transition-all hover:shadow-md",
                        isExpanded ? "border-slate-300 shadow-md" : "border-slate-200/70",
                      )}
                    >
                      <div className="flex items-center gap-4 p-5">
                        <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", meta.dot)} />
                        <div className="flex-1 min-w-0">
                          <div className="text-base font-bold text-slate-900 truncate">
                            {a.blocker?.title || a.originalText}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                            <span className="font-medium text-slate-600">{a.categoryInfo?.label}</span>
                            <span className="text-slate-300">·</span>
                            <span>已卡 <strong className="text-slate-800">{a.currentDays}</strong> 天</span>
                            {a.hasData ? (
                              <>
                                <span className="text-slate-300">·</span>
                                <span>超過歷史 <strong className="text-slate-800">{a.percentile}%</strong></span>
                              </>
                            ) : (
                              <>
                                <span className="text-slate-300">·</span>
                                <span className="text-slate-400">無同類歷史可比對</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={cn(
                            "px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide text-white",
                            meta.color,
                          )}>
                            {a.levelLabel}
                          </span>
                          <ChevronDown size={18} className={cn("text-slate-400 transition", isExpanded && "rotate-180")} />
                        </div>
                      </div>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-5 pb-5 pt-1 border-t border-slate-200/70">
                              {a.blocker?.description && (
                                <p className="text-sm text-slate-700 leading-relaxed mb-4">
                                  {a.blocker.description}
                                </p>
                              )}
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                                <StatMini label="負責部門" value={a.blocker?.dept || "-"} />
                                <StatMini label="負責人"   value={a.blocker?.owner || "-"} />
                                <StatMini label="關聯案件" value={a.blocker?.caseId || "-"} />
                                <StatMini
                                  label="同類 P75 / P90"
                                  value={a.hasData ? `${a.p75.toFixed(0)} / ${a.p90.toFixed(0)} 天` : "尚無樣本"}
                                />
                              </div>
                              {a.hasData && (
                                <div className={cn(
                                  "mt-4 px-4 py-3 rounded-xl text-sm leading-relaxed",
                                  a.level === "critical" ? "bg-red-100/80 text-red-900"
                                  : a.level === "high"   ? "bg-amber-100/80 text-amber-900"
                                  : a.level === "medium" ? "bg-blue-50 text-blue-800"
                                  : "bg-emerald-50 text-emerald-800",
                                )}>
                                  <strong className="font-bold">處理建議：</strong>
                                  {a.level === "critical" && "已達極高風險（P95+），請立刻召開協調會議。"}
                                  {a.level === "high"     && "建議在本週內安排升級處理。"}
                                  {a.level === "medium"   && "進入關注區，請追蹤後續進度。"}
                                  {a.level === "normal"   && "仍在正常處理時程內。"}
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </button>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 隔線 */}
      <div className="my-8 border-t border-slate-200/60" />

      {/* 各類別平均解決天數 chart */}
      <Card className="p-6 mb-8 rounded-2xl">
        <div className="flex items-baseline justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">各類別平均解決天數</h3>
            <p className="text-xs text-slate-500 mt-0.5">越長表示這類卡點通常越棘手</p>
          </div>
          <span className="text-[11px] text-slate-400">資料來自 {history.length} 筆歷史案例</span>
        </div>
        <div className="h-56">
          <ResponsiveContainer>
            <BarChart data={categorySummary.map((c) => ({
              cat: c.label,
              avg: +c.mean.toFixed(1),
              color: c.color,
            }))} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }}>
              <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis dataKey="cat" type="category" tick={{ fontSize: 12, fill: "#475569" }} width={100} axisLine={false} tickLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(0,0,0,0.03)" }}
                contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 12 }}
                formatter={(v: any) => [`${v} 天`, "平均"]}
              />
              <Bar dataKey="avg" radius={[0, 8, 8, 0]} barSize={22}>
                {categorySummary.map((c, i) => (<Cell key={i} fill={c.color} />))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* 各類別統計 - 卡片網格 */}
      <section>
        <div className="flex items-baseline gap-2 mb-4">
          <h3 className="text-base font-bold text-slate-900">歷史卡點分類</h3>
          <span className="text-xs text-slate-400">點卡片看相關案例</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categorySummary.map((c) => (
            <motion.button
              key={c.key}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedCat(selectedCat === c.key ? null : c.key)}
              className={cn(
                "text-left p-5 rounded-2xl border transition-all bg-white",
                selectedCat === c.key
                  ? "border-amber-400 shadow-md ring-2 ring-amber-200/60"
                  : "border-slate-200/70 hover:border-slate-300 hover:shadow-sm",
              )}
            >
              <div className="flex items-center gap-2 mb-4">
                <div className="w-3 h-3 rounded-full" style={{ background: c.color }} />
                <h4 className="text-sm font-bold text-slate-900">{c.label}</h4>
                <span className="ml-auto text-[11px] text-slate-400 font-medium">{c.count} 筆</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <Stat label="平均" value={c.mean.toFixed(1)} unit="天" />
                <Stat label="P75"  value={c.p75.toFixed(0)}  unit="天" />
                <Stat label="P90"  value={c.p90.toFixed(0)}  unit="天" />
              </div>
            </motion.button>
          ))}
        </div>
      </section>

      {/* 選中類別 → 相關案例 */}
      <AnimatePresence>
        {selectedCatData && selectedCatData.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <Card className="p-6 rounded-2xl">
              <div className="flex items-center gap-2 mb-4">
                <AlertCircle size={16} className="text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedCatData.label} · {selectedCatData.items.length} 筆歷史案例
                </h4>
              </div>
              <div className="space-y-0.5">
                {selectedCatData.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setViewCase(item)}
                    className="w-full flex items-center gap-3 py-3 px-3 -mx-3 rounded-lg hover:bg-amber-50/60 border-b border-slate-100 last:border-0 text-xs transition group"
                  >
                    <span className="text-slate-400 font-mono shrink-0 w-20 text-left">{item.date}</span>
                    <span className="flex-1 truncate text-slate-700 text-left group-hover:text-slate-900 font-medium">{item.title}</span>
                    <span className="text-amber-600 font-bold shrink-0">{item.outcome}</span>
                    <ChevronDown size={12} className="text-slate-300 -rotate-90 group-hover:translate-x-0.5 transition" />
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 案件詳情 Modal */}
      <Modal open={!!viewCase} onClose={() => setViewCase(null)}
        title={viewCase?.title}
        subtitle={viewCase && `${viewCase.date} · ${viewCase.owner} · ${viewCase.outcome}`}
        maxWidth={620}>
        {viewCase && (
          <div className="space-y-3 text-xs leading-relaxed">
            <div className="flex flex-wrap gap-1.5">
              {viewCase.tags.map((t) => <Pill key={t} tone="purple">{t}</Pill>)}
            </div>
            {viewCase.detail?.background && (
              <DetailField label="案件背景" value={viewCase.detail.background} />
            )}
            {viewCase.detail?.process && (
              <DetailField label="處理過程" value={viewCase.detail.process} />
            )}
            {viewCase.detail?.valuation && (
              <DetailField label="估值與條件" value={viewCase.detail.valuation} />
            )}
            {viewCase.detail?.keyInsights && viewCase.detail.keyInsights.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">關鍵洞察</div>
                <div className="bg-violet-50 rounded-lg p-3 text-violet-800 space-y-1">
                  {viewCase.detail.keyInsights.map((k, i) => <div key={i}>• {k}</div>)}
                </div>
              </div>
            )}
            {viewCase.detail?.result && (
              <div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">結果</div>
                <div className="bg-emerald-50 text-emerald-800 rounded-lg p-3">{viewCase.detail.result}</div>
              </div>
            )}
            {viewCase.detail?.lessons && (
              <div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">💡 本案經驗</div>
                <div className="italic text-slate-500 leading-relaxed">{viewCase.detail.lessons}</div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">{label}</div>
      <div className="bg-slate-50 rounded-lg p-3 text-slate-700 leading-relaxed">{value}</div>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg py-2.5">
      <div className="text-[10px] text-slate-400 tracking-wider font-bold">{label}</div>
      <div className="text-lg font-black text-slate-900 mt-0.5">{value}<span className="text-[10px] text-slate-400 ml-0.5">{unit}</span></div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/80 rounded-lg p-3 border border-slate-200/60">
      <div className="text-[10px] text-slate-400 font-bold tracking-wider">{label}</div>
      <div className="text-sm font-bold text-slate-800 mt-1 truncate">{value}</div>
    </div>
  );
}
