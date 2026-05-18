import { useMemo, useState, type ReactNode } from "react";
import { Search, ChevronDown, X, Sparkles, Clock, TrendingUp, Network, Tags } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import {
  buildKnowledgeGraph,
  expandQuery,
  extractCaseFingerprints,
  searchHistoryMined,
} from "../lib/textMining";
import type { HistoryCase } from "../lib/types";

interface Props {
  history: HistoryCase[];
}

// 類別 → 顏色 (跟 constants 對齊)
const CATEGORY_COLOR: Record<string, { bg: string; text: string; ring: string }> = {
  "法遵/合約":   { bg: "bg-rose-50",    text: "text-rose-700",    ring: "ring-rose-200" },
  "資金/募資":   { bg: "bg-amber-50",   text: "text-amber-700",   ring: "ring-amber-200" },
  "資料/補件":   { bg: "bg-sky-50",     text: "text-sky-700",     ring: "ring-sky-200" },
  "跨部門/窗口": { bg: "bg-violet-50",  text: "text-violet-700",  ring: "ring-violet-200" },
  "決策/簽核":   { bg: "bg-indigo-50",  text: "text-indigo-700",  ring: "ring-indigo-200" },
  "時程/聯繫":   { bg: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-200" },
};

const getCategoryFromTags = (tags: string[]): string | null => {
  return tags.find((t) => CATEGORY_COLOR[t]) || null;
};

const extractDays = (outcome?: string): number => {
  const m = String(outcome || "").match(/(\d+)\s*天/);
  return m ? parseInt(m[1]) : 0;
};

export default function HistoryPage({ history }: Props) {
  const [q, setQ] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // BM25F + TextRank fingerprints + query expansion + hybrid reranking
  const results = useMemo(() => searchHistoryMined(q, history), [q, history]);
  const fingerprints = useMemo(() => extractCaseFingerprints(history, 6), [history]);
  const fingerprintMap = useMemo(
    () => new Map(fingerprints.map((fp) => [fp.caseId, fp.keywords.map((k) => k.term)])),
    [fingerprints],
  );
  const knowledgeGraph = useMemo(() => buildKnowledgeGraph(history), [history]);
  const expandedTerms = useMemo(() => expandQuery(q, history), [q, history]);

  // 整體統計
  const overallStats = useMemo(() => {
    const days = history.map((h) => extractDays(h.outcome)).filter((d) => d > 0);
    const sorted = [...days].sort((a, b) => a - b);
    const median = sorted.length ? sorted[Math.floor(sorted.length / 2)] : 0;
    const avg = days.length ? days.reduce((a, b) => a + b, 0) / days.length : 0;
    const fastest = Math.min(...(sorted.length ? sorted : [0]));
    return { total: history.length, median, avg, fastest };
  }, [history]);

  // 熱門標籤 (排除類別、公司名)
  const popularTags = useMemo(() => {
    const freq: Record<string, number> = {};
    history.forEach((h) => (h.tags || []).forEach((t) => {
      // 只計類別標籤、speed 標籤
      if (CATEGORY_COLOR[t] || t.endsWith("解決") || t.endsWith("延誤")) {
        freq[t] = (freq[t] || 0) + 1;
      }
    }));
    return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([t]) => t);
  }, [history]);

  return (
    <div className="max-w-5xl mx-auto pb-12 px-1">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">歷史案件搜尋</h1>
        <p className="text-sm text-slate-500 mt-1">輸入公司名、卡點類別、關鍵字，找過去類似案件的處理經驗。</p>
      </div>

      {/* 統計列 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatTile icon={<Sparkles size={14} />} label="累積案例" value={overallStats.total.toString()} unit="筆" tone="slate" />
        <StatTile icon={<Clock size={14} />}    label="中位解決天數" value={overallStats.median.toString()} unit="天" tone="blue" />
        <StatTile icon={<TrendingUp size={14} />} label="最快解決" value={overallStats.fastest.toString()} unit="天" tone="emerald" />
        <StatTile icon={<Network size={14} />} label="知識連結" value={knowledgeGraph.edges.length.toString()} unit="組" tone="violet" />
      </div>

      {/* 大搜尋框 */}
      <div className="relative mb-3">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-violet-500/5 to-transparent rounded-2xl blur-xl" />
        <div className="relative bg-white rounded-2xl border border-slate-200/70 shadow-sm">
          <div className="relative">
            <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="例如：東京中央銀行、NDA、募資、退場稅務…"
              className="w-full pl-14 pr-14 py-5 text-base bg-transparent focus:outline-none placeholder:text-slate-400 rounded-2xl"
              autoFocus
            />
            {q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            )}
          </div>
          {/* 快速類別 */}
          <div className="px-5 pb-4 -mt-1 flex flex-wrap gap-1.5 items-center">
            <span className="text-[10px] text-slate-400 font-bold tracking-wider mr-1">快速篩選：</span>
            {popularTags.map((t) => {
              const colorMeta = CATEGORY_COLOR[t];
              return (
                <button
                  key={t}
                  onClick={() => setQ(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] font-semibold transition border",
                    colorMeta
                      ? `${colorMeta.bg} ${colorMeta.text} border-transparent hover:ring-2 ${colorMeta.ring}`
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100",
                  )}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Text mining layer */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-3 mb-5">
        <KnowledgeGraphPanel graph={knowledgeGraph} />
        <div className="bg-white rounded-2xl border border-slate-200/70 p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <Tags size={15} />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900">案件指紋與查詢擴展</div>
              <div className="text-[11px] text-slate-500">TextRank + PMI 共現詞</div>
            </div>
          </div>
          {q.trim() ? (
            <div className="mb-3">
              <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">系統聯想到</div>
              <div className="flex flex-wrap gap-1.5">
                {expandedTerms.length > 0 ? expandedTerms.map((term) => (
                  <button
                    key={term}
                    onClick={() => setQ(`${q} ${term}`)}
                    className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 hover:bg-amber-100 transition"
                  >
                    {term}
                  </button>
                )) : (
                  <span className="text-xs text-slate-400">沒有足夠共現訊號</span>
                )}
              </div>
            </div>
          ) : null}
          <div>
            <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">代表性關鍵詞</div>
            <div className="flex flex-wrap gap-1.5">
              {knowledgeGraph.nodes.slice(0, 10).map((node) => (
                <button
                  key={node.term}
                  onClick={() => setQ(node.term)}
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-50 text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition"
                  title={`出現在 ${node.count} 筆案件`}
                >
                  {node.term}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 結果行 */}
      <div className="flex items-baseline justify-between mb-3 px-1">
        <div className="text-sm text-slate-500">
          {q.trim()
            ? <>找到 <strong className="text-slate-900">{results.length}</strong> 筆相關案件</>
            : <>顯示全部 <strong className="text-slate-900">{results.length}</strong> 筆</>}
        </div>
        {q.trim() && (
          <div className="text-[11px] text-slate-400">依相關度排序</div>
        )}
      </div>

      {/* 結果列表 */}
      <div className="space-y-2.5">
        {results.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/70 p-16 text-center">
            <div className="text-slate-300 mb-2 text-4xl">🔍</div>
            <div className="text-sm text-slate-500">找不到符合「{q}」的案件</div>
            <div className="text-xs text-slate-400 mt-2">試試類別名稱、公司名或更短的關鍵字</div>
          </div>
        ) : results.map((r, i) => {
          const isExpanded = expandedId === r.id;
          const category = getCategoryFromTags(r.tags || []);
          const categoryMeta = category ? CATEGORY_COLOR[category] : null;
          const days = extractDays(r.outcome);
          const fingerprint = r.fingerprint?.length ? r.fingerprint : fingerprintMap.get(r.id) || [];
          const company = r.title.split(/[．·\.]/)[0]?.trim() || "";
          const action = r.title.split(/[．·\.]/).slice(1).join(" ").trim() || r.title;
          // 速度判定
          const speedMeta = days === 0 ? null
            : days <= 3 ? { label: "快速", color: "text-emerald-600", bg: "bg-emerald-50" }
            : days <= 7 ? { label: "正常", color: "text-blue-600",    bg: "bg-blue-50" }
            : days <= 14 ? { label: "較慢", color: "text-amber-600",  bg: "bg-amber-50" }
            : { label: "延誤", color: "text-rose-600", bg: "bg-rose-50" };

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.02, 0.3) }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : r.id)}
                className={cn(
                  "w-full text-left bg-white rounded-2xl border transition-all overflow-hidden",
                  isExpanded
                    ? "border-blue-300 shadow-md"
                    : "border-slate-200/70 hover:border-slate-300 hover:shadow-sm",
                )}
              >
                <div className="p-5">
                  <div className="flex items-start gap-4">
                    {/* 左側類別色標 */}
                    {categoryMeta && (
                      <div className={cn("w-1 self-stretch rounded-full", categoryMeta.bg.replace("bg-", "bg-").replace("-50", "-400"))} style={{
                        background: categoryMeta.bg.includes("rose") ? "#fb7185"
                          : categoryMeta.bg.includes("amber") ? "#f59e0b"
                          : categoryMeta.bg.includes("sky") ? "#0ea5e9"
                          : categoryMeta.bg.includes("violet") ? "#a78bfa"
                          : categoryMeta.bg.includes("indigo") ? "#818cf8"
                          : "#10b981",
                      }} />
                    )}
                    <div className="flex-1 min-w-0">
                      {/* 公司 + 行動 */}
                      <div className="flex items-baseline gap-2 flex-wrap mb-1.5">
                        {company && <span className="text-base font-black text-slate-900">{company}</span>}
                        {action && <span className="text-sm text-slate-600">{action}</span>}
                      </div>
                      {/* meta line */}
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span>{r.date}</span>
                        <span className="text-slate-300">·</span>
                        <span>{r.owner}</span>
                        {days > 0 && speedMeta && (
                          <>
                            <span className="text-slate-300">·</span>
                            <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold", speedMeta.bg, speedMeta.color)}>
                              <Clock size={10} />
                              {days} 天 · {speedMeta.label}
                            </span>
                          </>
                        )}
                      </div>
                      {/* tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3">
                        {(r.tags || []).slice(0, 5).map((t) => {
                          const meta = CATEGORY_COLOR[t];
                          return (
                            <span
                              key={t}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                                meta
                                  ? `${meta.bg} ${meta.text} border-transparent`
                                  : "bg-slate-50 text-slate-600 border-slate-200",
                              )}
                            >
                              {t}
                            </span>
                          );
                        })}
                      </div>
                      {fingerprint.length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          <span className="text-[10px] text-slate-400 font-bold mr-0.5">案件指紋</span>
                          {fingerprint.slice(0, 5).map((term) => (
                            <span
                              key={term}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[10px] font-semibold border",
                                r.matchedTerms?.includes(term)
                                  ? "bg-blue-50 text-blue-700 border-blue-100"
                                  : "bg-white text-slate-500 border-slate-200",
                              )}
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* 右側相關度 + chevron */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {q.trim() && (
                        <div className="text-right">
                          <div className={cn(
                            "text-base font-black leading-none",
                            r.relevance >= 70 ? "text-blue-600"
                            : r.relevance >= 40 ? "text-amber-600"
                            : "text-slate-400",
                          )}>
                            {Math.min(99, r.relevance)}%
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold tracking-wider mt-0.5">相關度</div>
                        </div>
                      )}
                      <ChevronDown size={16} className={cn("text-slate-400 transition", isExpanded && "rotate-180")} />
                    </div>
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
                        <div className="space-y-3 text-sm leading-relaxed">
                          {q.trim() && (
                            <div className="grid grid-cols-4 gap-2">
                              <ScoreMini label="BM25F" value={r.scoreBreakdown.bm25} />
                              <ScoreMini label="標籤" value={r.scoreBreakdown.tags} />
                              <ScoreMini label="指紋" value={r.scoreBreakdown.keywords} />
                              <ScoreMini label="新鮮度" value={r.scoreBreakdown.freshness} />
                            </div>
                          )}
                          {r.detail.background && <DetailField label="案件背景" value={r.detail.background} />}
                          {r.detail.process    && <DetailField label="處理過程" value={r.detail.process} />}
                          {r.detail.valuation  && <DetailField label="估值與條件" value={r.detail.valuation} />}
                          {r.detail.keyInsights && r.detail.keyInsights.length > 0 && (
                            <div>
                              <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">關鍵洞察</div>
                              <div className="bg-violet-50 rounded-lg p-3 space-y-1.5 text-violet-800 text-xs">
                                {r.detail.keyInsights.map((k, idx) => (
                                  <div key={idx} className="flex gap-2">
                                    <span className="text-violet-400">•</span>
                                    <span>{k}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {r.detail.result  && <DetailField label="結果"     value={r.detail.result}  highlight />}
                          {r.detail.lessons && <DetailField label="本案經驗" value={r.detail.lessons} italic />}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, unit, tone }: { icon: ReactNode; label: string; value: string; unit: string; tone: "slate" | "blue" | "emerald" | "violet" }) {
  const toneMap = {
    slate:   { iconBg: "bg-slate-100",   iconText: "text-slate-600" },
    blue:    { iconBg: "bg-blue-100",    iconText: "text-blue-600" },
    emerald: { iconBg: "bg-emerald-100", iconText: "text-emerald-600" },
    violet:  { iconBg: "bg-violet-100",  iconText: "text-violet-600" },
  };
  const t = toneMap[tone];
  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-4 flex items-center gap-3">
      <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", t.iconBg, t.iconText)}>
        {icon}
      </div>
      <div className="min-w-0">
        <div className="text-[11px] text-slate-500 font-medium">{label}</div>
        <div className="text-xl font-black text-slate-900 leading-none mt-1">
          {value}<span className="text-xs text-slate-400 font-medium ml-0.5">{unit}</span>
        </div>
      </div>
    </div>
  );
}

function KnowledgeGraphPanel({ graph }: { graph: ReturnType<typeof buildKnowledgeGraph> }) {
  const nodes = graph.nodes.slice(0, 9);
  const positions = nodes.map((node, i) => {
    const angle = (Math.PI * 2 * i) / Math.max(1, nodes.length) - Math.PI / 2;
    const radius = i === 0 ? 0 : 38;
    return {
      ...node,
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius,
    };
  });
  const posMap = new Map(positions.map((p) => [p.term, p]));

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 p-4 overflow-hidden">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <div className="text-sm font-black text-slate-900">關鍵詞共現圖譜</div>
          <div className="text-[11px] text-slate-500">線越粗，代表兩個詞越常一起出現</div>
        </div>
        <span className="text-[10px] text-slate-400 font-bold">{graph.edges.length} links</span>
      </div>
      <div className="relative h-56 rounded-xl bg-slate-50 border border-slate-100">
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" role="img" aria-label="keyword co-occurrence graph">
          {graph.edges.slice(0, 14).map((edge) => {
            const a = posMap.get(edge.source);
            const b = posMap.get(edge.target);
            if (!a || !b) return null;
            return (
              <line
                key={`${edge.source}-${edge.target}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="#93c5fd"
                strokeWidth={Math.max(0.4, Math.min(2.2, edge.strength / 3))}
                strokeOpacity="0.55"
              />
            );
          })}
        </svg>
        {positions.map((node, i) => (
          <button
            key={node.term}
            className={cn(
              "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border shadow-sm text-[10px] font-bold transition hover:scale-105",
              i === 0
                ? "px-3 py-2 bg-blue-600 text-white border-blue-600"
                : "px-2.5 py-1.5 bg-white text-slate-700 border-slate-200",
            )}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            title={`出現在 ${node.count} 筆案件`}
          >
            {node.term}
          </button>
        ))}
      </div>
    </div>
  );
}

function ScoreMini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-slate-50 border border-slate-100 p-2">
      <div className="text-[9px] text-slate-400 font-bold tracking-wider">{label}</div>
      <div className="text-sm font-black text-slate-800 mt-0.5">{value}</div>
    </div>
  );
}

function DetailField({ label, value, highlight, italic }: { label: string; value: string; highlight?: boolean; italic?: boolean }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">{label}</div>
      <div className={cn(
        "rounded-xl p-3.5 text-slate-700 leading-relaxed text-xs",
        highlight ? "bg-emerald-50 text-emerald-800" : "bg-slate-50",
        italic && "italic text-slate-500",
      )}>
        {value}
      </div>
    </div>
  );
}
