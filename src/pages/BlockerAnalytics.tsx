import { useMemo, useState } from "react";
import { AlertCircle, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../components/ui/Card";
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
      .map((b) => analyzeBlockerRecord(b, blockers))
      .sort((a, b) => (b.percentile || 0) - (a.percentile || 0));
  }, [blockers]);

  const selectedCatData = categorySummary.find((c) => c.key === selectedCat);

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} className="text-amber-500" />
          <span className="text-[11px] text-amber-500 tracking-[0.25em] font-bold">EMPIRICAL PERCENTILE</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          卡點分位數預警 · 共 {activeBlockers.length} 筆活躍
        </h1>
        <p className="text-sm text-slate-500">
          直接拿歷史同類比較：「目前已卡 N 天，比歷史 X% 都久」。比 SLA 更貼真實經驗。
        </p>
      </div>

      {/* 活躍卡點 - 最嚴重的浮在上面 */}
      {activeBlockers.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-bold text-slate-700 mb-3">當前活躍卡點（按風險排序）</h3>
          <div className="space-y-2">
            {activeBlockers.map((a, i) => {
              const id = a.blocker?.id || String(i);
              const isExpanded = expandedId === id;
              const tone = a.level === "critical" ? "border-red-300 bg-red-50/40"
                         : a.level === "high"     ? "border-amber-300 bg-amber-50/40"
                         : a.level === "medium"   ? "border-blue-200 bg-blue-50/30"
                         : "border-slate-200 bg-white";
              const dot  = a.level === "critical" ? "bg-red-500"
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
                    className={cn("w-full text-left rounded-xl border transition-all p-4 hover:shadow-sm", tone)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn("w-2 h-2 rounded-full shrink-0", dot)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 text-sm font-bold text-slate-900 truncate">
                          <span>{a.blocker?.title || a.originalText}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          {a.categoryInfo?.label} · 已卡 <strong className="text-slate-700">{a.currentDays}</strong> 天 ·{" "}
                          {a.hasData
                            ? <>超過歷史 <strong className="text-slate-700">{a.percentile}%</strong> 的解決時間</>
                            : <>樣本不足 · 採 SLA 提醒</>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide",
                          a.level === "critical" ? "bg-red-500 text-white"
                          : a.level === "high"   ? "bg-amber-500 text-white"
                          : a.level === "medium" ? "bg-blue-500 text-white"
                          : "bg-emerald-500 text-white",
                        )}>
                          {a.levelLabel}
                        </span>
                        <ChevronDown size={16} className={cn("text-slate-400 transition", isExpanded && "rotate-180")} />
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden mt-3 pt-3 border-t border-slate-200"
                        >
                          {a.blocker?.description && (
                            <p className="text-xs text-slate-600 leading-relaxed mb-3">
                              {a.blocker.description}
                            </p>
                          )}
                          <div className="grid grid-cols-4 gap-2 text-[11px]">
                            <StatMini label="負責部門"   value={a.blocker?.dept || "-"} />
                            <StatMini label="負責人"     value={a.blocker?.owner || "-"} />
                            <StatMini label="關聯案件"   value={a.blocker?.caseId || "-"} />
                            <StatMini label="P75 / P90" value={a.hasData ? `${a.p75.toFixed(0)} / ${a.p90.toFixed(0)}` : "-"} />
                          </div>
                          {a.hasData && (
                            <div className={cn(
                              "mt-3 px-3 py-2 rounded-lg text-xs",
                              a.level === "critical" ? "bg-red-100 text-red-800"
                              : a.level === "high"   ? "bg-amber-100 text-amber-800"
                              : "bg-blue-50 text-blue-700",
                            )}>
                              <strong>建議：</strong>
                              {a.level === "critical" && "已達極高風險（P95+），請立刻召開協調會議。"}
                              {a.level === "high"     && "建議在本週內安排升級處理。"}
                              {a.level === "medium"   && "進入關注區，請追蹤後續進度。"}
                              {a.level === "normal"   && "仍在正常處理時程內。"}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* 各類別統計 - 卡片網格 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-slate-700 mb-3">歷史卡點分類（點看相關案例）</h3>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorySummary.map((c) => (
          <motion.button
            key={c.key}
            whileHover={{ y: -2 }}
            onClick={() => setSelectedCat(selectedCat === c.key ? null : c.key)}
            className={cn(
              "text-left p-5 rounded-xl border transition-all bg-white",
              selectedCat === c.key
                ? "border-amber-400 shadow-md ring-2 ring-amber-200"
                : "border-slate-200/60 hover:border-slate-300 hover:shadow-sm",
            )}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: c.color }} />
              <h4 className="text-sm font-bold text-slate-900">{c.label}</h4>
              <span className="ml-auto text-[10px] text-slate-400 font-mono">n={c.count}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="平均" value={c.mean.toFixed(1)} unit="天" />
              <Stat label="P75"  value={c.p75.toFixed(0)}  unit="天" />
              <Stat label="P90"  value={c.p90.toFixed(0)}  unit="天" />
            </div>
          </motion.button>
        ))}
      </div>

      {/* 選中類別 → 相關案例 */}
      <AnimatePresence>
        {selectedCatData && selectedCatData.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden"
          >
            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle size={14} className="text-amber-600" />
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedCatData.label} · {selectedCatData.items.length} 筆歷史案例
                </h4>
              </div>
              <div className="space-y-2">
                {selectedCatData.items.slice(0, 8).map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0 text-xs">
                    <span className="text-slate-400 font-mono shrink-0 w-20">{item.date}</span>
                    <span className="flex-1 truncate text-slate-700">{item.title}</span>
                    <span className="text-amber-600 font-bold shrink-0">{item.outcome}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="bg-slate-50 rounded-lg py-2">
      <div className="text-[9px] text-slate-400 tracking-wider font-bold">{label}</div>
      <div className="text-base font-black text-slate-900">{value}<span className="text-[10px] text-slate-400 ml-0.5">{unit}</span></div>
    </div>
  );
}

function StatMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded p-2">
      <div className="text-[9px] text-slate-400 font-bold">{label}</div>
      <div className="text-xs font-bold text-slate-700 truncate">{value}</div>
    </div>
  );
}
