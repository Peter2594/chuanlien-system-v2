import { useMemo, useState } from "react";
import { Search, Sparkles, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../components/ui/Card";
import { Pill } from "../components/ui/Pill";
import { cn } from "../lib/utils";
import { displayWeek } from "../lib/dateUtils";
import type { HistoryCase } from "../lib/types";

interface Props {
  history: HistoryCase[];
}

// TF-IDF tokenize（中英 2-gram + 英數連續）
function tokenize(text: string): string[] {
  if (!text) return [];
  const s = String(text).toLowerCase();
  const tokens: string[] = [];
  const alnum = s.match(/[a-z0-9]+/g) || [];
  tokens.push(...alnum);
  const chineseChars = s.replace(/[^一-龥]/g, "");
  for (let i = 0; i < chineseChars.length - 1; i++) {
    tokens.push(chineseChars.slice(i, i + 2));
  }
  return tokens;
}

export default function HistoryPage({ history }: Props) {
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // TF-IDF 計算
  const { results, hotTerms } = useMemo(() => {
    const docText = (item: HistoryCase) => [
      item.title, item.title, item.title,
      ...(item.tags || []).flatMap((t) => [t, t]),
      item.summary, item.outcome, item.owner,
      item.detail?.background, item.detail?.process,
      item.detail?.valuation, item.detail?.result, item.detail?.lessons,
      ...(item.detail?.keyInsights || []),
    ].filter(Boolean).join(" ");

    const docs = history.map((item) => {
      const tokens = tokenize(docText(item));
      const tf: Record<string, number> = {};
      tokens.forEach((t) => { tf[t] = (tf[t] || 0) + 1; });
      return { item, tokens, tf, length: tokens.length };
    });

    const N = docs.length || 1;
    const df: Record<string, number> = {};
    docs.forEach((d) => Object.keys(d.tf).forEach((t) => { df[t] = (df[t] || 0) + 1; }));
    const idf: Record<string, number> = {};
    Object.keys(df).forEach((t) => { idf[t] = Math.log((N + 1) / (df[t] + 1)) + 1; });

    const queryTokens = tokenize(q);
    const queryTf: Record<string, number> = {};
    queryTokens.forEach((t) => { queryTf[t] = (queryTf[t] || 0) + 1; });

    const queryVec: Record<string, number> = {};
    let qNorm = 0;
    Object.keys(queryTf).forEach((t) => {
      const v = (queryTf[t] / Math.max(1, queryTokens.length)) * (idf[t] || 1);
      queryVec[t] = v;
      qNorm += v * v;
    });
    qNorm = Math.sqrt(qNorm);

    const scored = docs.map((d) => {
      if (!q.trim()) return { ...d.item, relevance: 100, _terms: [] as string[] };
      if (qNorm === 0) return { ...d.item, relevance: 0, _terms: [] as string[] };
      let dot = 0, dNorm = 0;
      const contribs: { term: string; w: number }[] = [];
      Object.keys(queryVec).forEach((t) => {
        const dTfidf = ((d.tf[t] || 0) / Math.max(1, d.length)) * (idf[t] || 1);
        const c = queryVec[t] * dTfidf;
        if (c > 0) contribs.push({ term: t, w: c });
        dot += c;
      });
      Object.keys(d.tf).forEach((t) => {
        const v = (d.tf[t] / Math.max(1, d.length)) * (idf[t] || 1);
        dNorm += v * v;
      });
      dNorm = Math.sqrt(dNorm);
      const sim = dNorm === 0 ? 0 : dot / (qNorm * dNorm);
      const topTerms = contribs.sort((a, b) => b.w - a.w).slice(0, 4).map((x) => x.term);
      return { ...d.item, relevance: Math.round(sim * 100), _terms: topTerms };
    });

    const filtered = scored
      .filter((h) => h.relevance > 0 || !q.trim())
      .sort((a, b) => b.relevance - a.relevance);

    const hotTerms = q.trim()
      ? Object.keys(queryVec).sort((a, b) => (idf[b] || 0) - (idf[a] || 0)).slice(0, 5).map((t) => ({ term: t, idf: (idf[t] || 0).toFixed(2) }))
      : [];

    return { results: filtered, hotTerms };
  }, [q, history]);

  // 熱門標籤
  const popularTags = useMemo(() => {
    const freq: Record<string, number> = {};
    history.forEach((h) => (h.tags || []).forEach((t) => { freq[t] = (freq[t] || 0) + 1; }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([t]) => t);
  }, [history]);

  return (
    <div className="max-w-5xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={12} className="text-blue-500" />
          <span className="text-[11px] text-blue-500 tracking-[0.25em] font-bold">TF-IDF · COSINE SIMILARITY</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          歷史智慧庫 · 共 {history.length} 筆累積案件
        </h1>
        <p className="text-sm text-slate-500">
          打關鍵字，系統用 TF-IDF 計算相似度排序，過去同類案件 1 秒內就能找到。
        </p>
      </div>

      {/* 大搜尋框 */}
      <Card className="p-4 mb-4">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜尋過往案件、卡點、估值經驗…"
            className="w-full pl-12 pr-4 py-4 text-lg bg-transparent focus:outline-none placeholder:text-slate-400"
            autoFocus
          />
        </div>
        {/* 快速標籤 */}
        <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <span className="text-[10px] text-slate-400 font-bold tracking-wider mr-1 self-center">熱門標籤：</span>
          {popularTags.map((t) => (
            <button
              key={t}
              onClick={() => setQ(t)}
              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[11px] font-semibold transition"
            >
              {t}
            </button>
          ))}
        </div>
      </Card>

      {/* TF-IDF 透明度 hint */}
      {q.trim() && hotTerms.length > 0 && (
        <div className="mb-4 px-4 py-2 bg-blue-50 border border-blue-100 rounded-lg text-[11px] text-blue-700 flex items-center gap-2 flex-wrap">
          <span className="font-bold tracking-wide">HIGH-IDF 切詞</span>
          {hotTerms.map((t) => (
            <span key={t.term} className="px-2 py-0.5 bg-white rounded font-mono">
              {t.term} <span className="text-blue-400">{t.idf}</span>
            </span>
          ))}
          <span className="ml-auto text-blue-500">← IDF 越高 = 區分力越強</span>
        </div>
      )}

      {/* 結果列表 */}
      <div className="text-xs text-slate-500 mb-3">
        找到 <strong className="text-slate-900">{results.length}</strong> 筆相關案件
      </div>

      <div className="space-y-3">
        {results.length === 0 ? (
          <Card className="p-12 text-center text-slate-400">無符合搜尋的案件</Card>
        ) : results.map((r, i) => {
          const isExpanded = expandedId === r.id;
          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className={cn(
                  "w-full text-left bg-white rounded-xl border transition-all p-5",
                  isExpanded ? "border-blue-300 shadow-md" : "border-slate-200/60 hover:border-slate-300 hover:shadow-sm",
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-slate-900 mb-1">{r.title}</div>
                    <div className="text-xs text-slate-500">
                      {displayWeek(r.date)} · 負責 {r.owner} · 結論：{r.outcome}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {q.trim() && (
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold",
                        r.relevance >= 70 ? "bg-blue-100 text-blue-700"
                        : r.relevance >= 40 ? "bg-amber-100 text-amber-700"
                        : "bg-slate-100 text-slate-500",
                      )}>
                        相關 {Math.min(99, r.relevance)}%
                      </span>
                    )}
                    <ChevronDown size={16} className={cn("text-slate-400 transition", isExpanded && "rotate-180")} />
                  </div>
                </div>

                {/* tags + matched terms */}
                <div className="flex flex-wrap items-center gap-1.5 mt-3">
                  {r.tags.map((t) => <Pill key={t} tone="purple">{t}</Pill>)}
                  {r._terms && r._terms.length > 0 && (
                    <span className="ml-2 flex items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-mono">match:</span>
                      {r._terms.map((t) => (
                        <span key={t} className="px-1.5 py-0.5 bg-amber-50 text-amber-700 rounded font-mono text-[10px]">
                          {t}
                        </span>
                      ))}
                    </span>
                  )}
                </div>

                {/* 展開內容 */}
                <AnimatePresence>
                  {isExpanded && r.detail && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-slate-100"
                    >
                      <div className="space-y-3 text-xs leading-relaxed">
                        {r.detail.background && <DetailField label="案件背景" value={r.detail.background} />}
                        {r.detail.process    && <DetailField label="處理過程" value={r.detail.process} />}
                        {r.detail.valuation  && <DetailField label="估值與條件" value={r.detail.valuation} />}
                        {r.detail.keyInsights && r.detail.keyInsights.length > 0 && (
                          <div>
                            <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">關鍵洞察</div>
                            <div className="bg-violet-50 rounded-lg p-3 space-y-1 text-violet-800">
                              {r.detail.keyInsights.map((k, idx) => <div key={idx}>• {k}</div>)}
                            </div>
                          </div>
                        )}
                        {r.detail.result  && <DetailField label="結果"     value={r.detail.result}  highlight />}
                        {r.detail.lessons && <DetailField label="本案經驗" value={r.detail.lessons} italic />}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function DetailField({ label, value, highlight, italic }: { label: string; value: string; highlight?: boolean; italic?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">{label}</div>
      <div className={cn(
        "rounded-lg p-3 text-slate-700 leading-relaxed",
        highlight ? "bg-emerald-50 text-emerald-800" : "bg-slate-50",
        italic && "italic text-slate-500",
      )}>
        {value}
      </div>
    </div>
  );
}
