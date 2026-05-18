/**
 * 智能案件推薦
 * 用 BM25F 演算法從歷史案件搜尋類似案，提供處理參考
 */
import { useMemo, useState } from "react";
import { Sparkles, ChevronRight, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { searchHistoryMined } from "../lib/textMining";
import { cn } from "../lib/utils";
import type { HistoryCase } from "../lib/types";

interface Props {
  query: string;                 // 用來搜尋的查詢字串（標題 + 描述 / 案件名等）
  history: HistoryCase[];
  limit?: number;
  variant?: "card" | "inline";   // card: 卡片包覆 / inline: 嵌入展開區
}

const extractDays = (outcome?: string) => {
  const m = String(outcome || "").match(/(\d+)\s*天/);
  return m ? parseInt(m[1]) : 0;
};

export function SimilarCases({ query, history, limit = 3, variant = "card" }: Props) {
  const [viewCase, setViewCase] = useState<HistoryCase | null>(null);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    return searchHistoryMined(query, history).filter((r) => r.relevance > 20).slice(0, limit);
  }, [query, history, limit]);

  if (results.length === 0) return null;

  // 平均解決天數
  const days = results.map((r) => extractDays(r.outcome)).filter((d) => d > 0);
  const avgDays = days.length ? Math.round(days.reduce((a, b) => a + b, 0) / days.length) : 0;

  const Container = variant === "card"
    ? "div"
    : "div";

  return (
    <>
      <Container className={cn(
        variant === "card"
          ? "bg-gradient-to-br from-violet-50/60 via-white to-blue-50/40 rounded-2xl border border-violet-200/60 overflow-hidden"
          : "border-t border-slate-100 pt-3 mt-3",
      )}>
        <div className={cn(variant === "card" ? "px-4 py-3 border-b border-violet-100/60 bg-white/50" : "")}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                類似歷史案件
                <span className="text-[10px] text-slate-400 font-normal">Hybrid 推薦</span>
              </div>
              {avgDays > 0 && (
                <div className="text-[10px] text-slate-500 mt-0.5">
                  過去類似案平均 <strong className="text-slate-700">{avgDays}</strong> 天解決
                </div>
              )}
            </div>
            <span className="text-[10px] text-slate-400 font-bold">{results.length} 筆</span>
          </div>
        </div>

        <div className={cn(variant === "card" ? "p-2" : "mt-2", "space-y-1")}>
          {results.map((r, i) => {
            const days = extractDays(r.outcome);
            const speed = days === 0 ? null
              : days <= 3 ? { label: "快", color: "text-emerald-600", bg: "bg-emerald-50" }
              : days <= 7 ? { label: "正常", color: "text-blue-600",  bg: "bg-blue-50" }
              : days <= 14 ? { label: "較慢", color: "text-amber-600", bg: "bg-amber-50" }
              : { label: "延誤", color: "text-rose-600", bg: "bg-rose-50" };
            return (
              <motion.button
                key={r.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setViewCase(r)}
                className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-white border border-transparent hover:border-violet-200 transition group"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-slate-800 truncate">{r.title}</span>
                      {speed && (
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold inline-flex items-center gap-0.5", speed.bg, speed.color)}>
                          <Clock size={9} /> {days} 天 · {speed.label}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate">
                      {r.date} · {r.owner} · 相關度 <strong className="text-violet-700">{Math.min(99, r.relevance)}%</strong>
                    </div>
                    {r.fingerprint.length > 0 && (
                      <div className="text-[10px] text-slate-400 mt-1 truncate">
                        指紋：{r.fingerprint.slice(0, 3).join(" · ")}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:text-violet-500 group-hover:translate-x-0.5 transition shrink-0" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </Container>

      {/* 案件詳情 Modal */}
      <AnimatePresence>
        {viewCase && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setViewCase(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 px-6 py-4 border-b border-slate-100 bg-white/95 backdrop-blur flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="text-base font-bold text-slate-900">{viewCase.title}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {viewCase.date} · {viewCase.owner} · {viewCase.outcome}
                  </div>
                </div>
                <button onClick={() => setViewCase(null)} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition">
                  <X size={16} />
                </button>
              </div>

              <div className="p-6 space-y-3 text-xs">
                <div className="flex flex-wrap gap-1.5">
                  {viewCase.tags.map((t) => (
                    <span key={t} className="px-2 py-0.5 bg-violet-50 text-violet-700 rounded text-[10px] font-bold">{t}</span>
                  ))}
                </div>
                {viewCase.detail?.background && (
                  <Field label="📋 案件背景" value={viewCase.detail.background} />
                )}
                {viewCase.detail?.process && (
                  <Field label="⚙️ 處理過程" value={viewCase.detail.process} />
                )}
                {viewCase.detail?.keyInsights && viewCase.detail.keyInsights.length > 0 && (
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">💡 關鍵洞察</div>
                    <div className="bg-violet-50 rounded-lg p-3 text-violet-800 space-y-1">
                      {viewCase.detail.keyInsights.map((k, i) => <div key={i}>• {k}</div>)}
                    </div>
                  </div>
                )}
                {viewCase.detail?.result && (
                  <Field label="✅ 結果" value={viewCase.detail.result} variant="success" />
                )}
                {viewCase.detail?.lessons && (
                  <Field label="🎓 本案經驗" value={viewCase.detail.lessons} variant="italic" />
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Field({ label, value, variant }: { label: string; value: string; variant?: "success" | "italic" }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">{label}</div>
      <div className={cn(
        "rounded-lg p-3 leading-relaxed",
        variant === "success" ? "bg-emerald-50 text-emerald-800"
        : variant === "italic" ? "italic text-slate-500 bg-slate-50"
        : "bg-slate-50 text-slate-700",
      )}>
        {value}
      </div>
    </div>
  );
}
