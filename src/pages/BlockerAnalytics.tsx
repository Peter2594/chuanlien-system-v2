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

export default function BlockerAnalyticsPage({ blockers, history }: Props) {
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewCase, setViewCase] = useState<HistoryCase | null>(null);

  // 各類別統計（用 history）
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

  // 活躍卡點（傳入 history 解決樣本不足問題）
  const activeBlockers = useMemo(() => {
    return blockers
      .filter((b) => b.status !== "resolved")
      .map((b) => analyzeBlockerRecord(b, blockers, history))
      .sort((a, b) => (b.percentile || 0) - (a.percentile || 0));
  }, [blockers, history]);

  const selectedCatData = categorySummary.find((c) => c.key === selectedCat);

  // 風險統計
  const riskCounts = {
    critical: activeBlockers.filter((b) => b.level === "critical").length,
    high:     activeBlockers.filter((b) => b.level === "high").length,
    medium:   activeBlockers.filter((b) => b.level === "medium").length,
    normal:   activeBlockers.filter((b) => b.level === "normal").length,
  };

  return (
    <div className="max-w-6xl mx-auto pb-12 px-1">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">卡點分析</h1>
        <p className="text-sm text-slate-500 mt-1">點分類看歷史案例，點卡點看處理建議。</p>
      </div>

      {/* 風險摘要列 */}
      <div className="grid grid-cols-4 gap-3 mb-8">
        <RiskTile label="極高風險" value={riskCounts.critical} color="bg-red-500"     textColor="text-red-600" />
        <RiskTile label="高風險"   value={riskCounts.high}     color="bg-amber-500"   textColor="text-amber-600" />
        <RiskTile label="關注中"   value={riskCounts.medium}   color="bg-blue-500"    textColor="text-blue-600" />
        <RiskTile label="正常"     value={riskCounts.normal}   color="bg-emerald-500" textColor="text-emerald-600" />
      </div>

      {/* 活躍卡點 */}
      {activeBlockers.length > 0 && (
        <section className="mb-10">
          <div className="flex items-baseline gap-2 mb-4">
            <h3 className="text-base font-bold text-slate-900">活躍卡點</h3>
            <span className="text-xs text-slate-400">共 {activeBlockers.length} 筆 · 按風險排序</span>
          </div>
          <div className="space-y-2.5">
            {activeBlockers.map((a, i) => {
              const id = a.blocker?.id || String(i);
              const isExpanded = expandedId === id;
              const tone = a.level === "critical" ? "border-red-200 bg-gradient-to-r from-red-50 to-white"
                         : a.level === "high"     ? "border-amber-200 bg-gradient-to-r from-amber-50 to-white"
                         : a.level === "medium"   ? "border-blue-200 bg-gradient-to-r from-blue-50/60 to-white"
                         : "border-slate-200 bg-white";
              const dot  = a.level === "critical" ? "bg-red-500"
                         : a.level === "high"     ? "bg-amber-500"
                         : a.level === "medium"   ? "bg-blue-500"
                         : "bg-emerald-500";
              const pillBg = a.level === "critical" ? "bg-red-500"
                           : a.level === "high"     ? "bg-amber-500"
                           : a.level === "medium"   ? "bg-blue-500"
                           : "bg-emerald-500";
              return (
                <motion.div
                  key={id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : id)}
                    className={cn(
                      "w-full text-left rounded-2xl border transition-all hover:shadow-md",
                      tone,
                    )}
                  >
                    <div className="flex items-center gap-4 p-5">
                      <div className={cn("w-2.5 h-2.5 rounded-full shrink-0", dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="text-base font-bold text-slate-900 truncate">
                          {a.blocker?.title || a.originalText}
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-slate-500">
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
                          pillBg,
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
                              <StatMini label="負責部門"   value={a.blocker?.dept || "-"} />
                              <StatMini label="負責人"     value={a.blocker?.owner || "-"} />
                              <StatMini label="關聯案件"   value={a.blocker?.caseId || "-"} />
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
        </section>
      )}

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

function RiskTile({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3">
      <div className={cn("w-2 h-10 rounded-full", color)} />
      <div className="flex-1">
        <div className="text-[11px] text-slate-500 font-medium">{label}</div>
        <div className={cn("text-2xl font-black leading-none mt-1", value === 0 ? "text-slate-300" : textColor)}>
          {value}
        </div>
      </div>
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
