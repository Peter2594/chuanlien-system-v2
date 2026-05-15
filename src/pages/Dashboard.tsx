import * as React from "react";
import { useMemo, useState } from "react";
import {
  Users, Search, AlertCircle, ChevronRight, ArrowUpRight, Sparkles,
  Activity, TrendingUp, Network,
} from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../components/ui/Card";
import { cn } from "../lib/utils";
import {
  analyzeEmployeeLoad, analyzeDeptNetwork, analyzeBlockerRecord, computeORI, oriLevel,
} from "../lib/algorithms";
import { NOW } from "../lib/dateUtils";
import type {
  Report, Handoff, Decision, Blocker, Employee, Department, HistoryCase,
} from "../lib/types";
import type { UserProfile } from "../lib/firebase";
import type { TabId } from "../components/Shell/Sidebar";

interface DashboardProps {
  reports: Report[];
  handoffs: Handoff[];
  decisions: Decision[];
  blockers: Blocker[];
  employees: Employee[];
  departments: Department[];
  history: HistoryCase[];
  userProfile: UserProfile | null;
  onNav: (tab: TabId) => void;
}

export default function Dashboard({
  reports, handoffs, decisions, blockers, employees, departments, history, userProfile, onNav,
}: DashboardProps) {

  const data = useMemo(() => {
    const loads = analyzeEmployeeLoad(reports, handoffs, employees);
    const network = analyzeDeptNetwork(reports, departments, handoffs);
    const activeBlockers = blockers
      .filter((b) => b.status !== "resolved")
      .map((b) => analyzeBlockerRecord(b, blockers));
    const ori = computeORI({ loads, decisions, activeBlockers, network });
    const lvl = oriLevel(ori.index);

    // 員工負載相關
    const overloaded = loads.filter((l) => l.level === "overload");
    const topLoaded = loads[0]; // already sorted by loadScore desc
    const deptLoadMap: Record<string, number> = {};
    const deptCountMap: Record<string, number> = {};
    loads.forEach((l) => {
      deptLoadMap[l.dept] = (deptLoadMap[l.dept] || 0) + l.loadScore;
      deptCountMap[l.dept] = (deptCountMap[l.dept] || 0) + 1;
    });
    const deptLoads = Object.entries(deptLoadMap)
      .map(([d, total]) => ({ dept: d, avg: total / deptCountMap[d] }))
      .sort((a, b) => b.avg - a.avg);

    // Gini coefficient
    const scoresAsc = loads.map((l) => l.loadScore).sort((a, b) => a - b);
    const sumScores = scoresAsc.reduce((s, v) => s + v, 0) || 1;
    let gini = 0;
    for (let i = 0; i < scoresAsc.length; i++) {
      gini += (2 * (i + 1) - scoresAsc.length - 1) * scoresAsc[i];
    }
    gini = scoresAsc.length > 0 ? gini / (scoresAsc.length * sumScores) : 0;

    // 卡點相關
    const p95Blockers = activeBlockers.filter((b) => (b.percentile || 0) >= 95);
    const p90Blockers = activeBlockers.filter((b) => (b.percentile || 0) >= 90 && (b.percentile || 0) < 95);
    const topBlocker = activeBlockers.sort((a, b) => (b.percentile || 0) - (a.percentile || 0))[0];

    // 卡點類別分布
    const blockerCategoryCount: Record<string, number> = {};
    activeBlockers.forEach((b) => {
      const cat = b.categoryInfo?.label || "其他";
      blockerCategoryCount[cat] = (blockerCategoryCount[cat] || 0) + 1;
    });

    // 歷史搜尋熱門關鍵字 (從 tags 統計)
    const tagFreq: Record<string, number> = {};
    history.forEach((h) => {
      (h.tags || []).forEach((t) => {
        tagFreq[t] = (tagFreq[t] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));

    // 今天要做的 3 件事
    const overdueDec = decisions.filter((d) => d.status === "逾期");
    const overdueHandoffs = handoffs.filter((h) => h.status === "待簽收" && (h.hoursOverdue || 0) >= 24);
    const todoItems = [
      ...overdueDec.slice(0, 2).map((d) => {
        const days = Math.max(1, Math.round((+NOW - +new Date(d.dueDate || NOW)) / 86400000));
        return {
          id: "d-" + d.id, type: "decision" as const, name: d.title,
          reason: `${d.assignedDept} · 逾期 ${days} 天`,
        };
      }),
      ...p95Blockers.slice(0, 2).map((b) => ({
        id: "b-" + (b.blocker?.id || Math.random()), type: "blocker" as const,
        name: b.blocker?.title || b.originalText || "未命名卡點",
        reason: `${b.categoryInfo?.label || "卡點"} · 已卡 ${b.currentDays} 天 · P${b.percentile}`,
      })),
      ...overdueHandoffs.slice(0, 2).map((h) => ({
        id: "h-" + h.id, type: "handoff" as const, name: h.title,
        reason: `${h.from} → ${h.to} · 逾期 ${h.hoursOverdue}h`,
      })),
    ].slice(0, 3);

    return {
      loads, overloaded, topLoaded, deptLoads, gini,
      activeBlockers, p95Blockers, p90Blockers, topBlocker, blockerCategoryCount,
      topTags,
      todoItems,
      ori, lvl,
    };
  }, [reports, handoffs, decisions, blockers, employees, departments, history]);

  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="max-w-7xl mx-auto pb-8">
      {/* === 開頭：狀態一句話 === */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between gap-6 flex-wrap">
          <div>
            <div className="text-[11px] text-slate-400 tracking-[0.25em] font-bold mb-2 uppercase">
              {NOW.getFullYear()}/{String(NOW.getMonth() + 1).padStart(2, "0")}/{String(NOW.getDate()).padStart(2, "0")} · {["週日","週一","週二","週三","週四","週五","週六"][NOW.getDay()]}
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
              {data.lvl.label}
              <span className="text-slate-300 mx-3 font-thin">|</span>
              <span className="text-base text-slate-500 font-medium">
                {data.todoItems.length === 0
                  ? "今天沒有需要立即處理的事"
                  : `今天 ${data.todoItems.length} 件事要處理`}
              </span>
            </h1>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {data.lvl.advice}
            </p>
          </div>

          {/* 右側：今天 Top 3 (極簡列表) */}
          {data.todoItems.length > 0 && (
            <div className="space-y-1.5">
              {data.todoItems.slice(0, 3).map((item, i) => (
                <button
                  key={item.id}
                  onClick={() =>
                    item.type === "decision" ? onNav("decisions")
                    : item.type === "blocker" ? onNav("analytics")
                    : onNav("handoff")
                  }
                  className="flex items-center gap-3 px-4 py-2 bg-white border border-slate-200/60 rounded-xl hover:border-red-300 hover:shadow-sm transition group max-w-md"
                >
                  <span className="text-red-500 font-black text-xs">0{i + 1}</span>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-800 truncate">{item.name}</div>
                    <div className="text-[10px] text-slate-500 truncate">{item.reason}</div>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-0.5 transition" />
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* === 3 個技術亮點 Hero Cards === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

        {/* ─────────────────────────────────────
            Hero 1 · 加權員工負載
        ───────────────────────────────────── */}
        <HeroCard
          algorithm="WEIGHTED LOAD MODEL"
          algorithmDetail="Andy Grove × 時間衰減 × 分位數"
          icon={Users}
          accentColor="text-red-500"
          accentBg="bg-red-500"
          title="加權員工負載"
          subtitle="不是件數加總 · 是公司結構性風險"
          onClick={() => onNav("employees")}
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-5xl font-black text-slate-900 tracking-tight">
              {data.overloaded.length}
            </span>
            <span className="text-sm text-slate-500 font-medium">人過載</span>
            <span className="ml-auto text-[10px] font-mono text-slate-400">
              Gini: <span className="text-slate-700 font-bold">{data.gini.toFixed(2)}</span>
            </span>
          </div>

          {/* 最重的那個人 */}
          {data.topLoaded && (
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="text-[10px] text-slate-400 mb-1 tracking-wide font-bold">
                CONCENTRATION RISK · 風險最高
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-900">{data.topLoaded.name}</span>
                <span className={cn(
                  "text-xs font-mono font-bold",
                  data.topLoaded.percentile >= 90 ? "text-red-500" : "text-amber-600"
                )}>
                  P{data.topLoaded.percentile}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {data.topLoaded.dept} · 加權分數 {data.topLoaded.loadScore.toFixed(1)}
              </div>
            </div>
          )}

          {/* 部門 mini bar */}
          <div className="space-y-2 mb-2">
            {data.deptLoads.slice(0, 4).map((d) => {
              const max = data.deptLoads[0]?.avg || 1;
              const pct = (d.avg / max) * 100;
              return (
                <div key={d.dept} className="flex items-center gap-2 text-[10px]">
                  <span className="w-16 text-slate-500 truncate">{d.dept}</span>
                  <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8 }}
                      className={cn("h-full rounded-full", pct > 80 ? "bg-red-400" : "bg-slate-400")}
                    />
                  </div>
                  <span className="w-8 text-right text-slate-600 font-mono font-bold">
                    {d.avg.toFixed(0)}
                  </span>
                </div>
              );
            })}
          </div>
        </HeroCard>

        {/* ─────────────────────────────────────
            Hero 2 · TF-IDF 歷史智慧庫
        ───────────────────────────────────── */}
        <HeroCard
          algorithm="TF-IDF + COSINE SIMILARITY"
          algorithmDetail="中英 2-gram tokenize · 全文檢索"
          icon={Search}
          accentColor="text-blue-500"
          accentBg="bg-blue-500"
          title="歷史智慧庫"
          subtitle="把組織經驗變成可搜尋的資產"
          onClick={() => onNav("history")}
        >
          <div className="flex items-baseline gap-3 mb-4">
            <span className="text-5xl font-black text-slate-900 tracking-tight">
              {history.length}
            </span>
            <span className="text-sm text-slate-500 font-medium">筆累積案件</span>
          </div>

          {/* 內建搜尋框 */}
          <div className="relative mb-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchQuery.trim()) onNav("history");
              }}
              placeholder="搜尋過去案件…"
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition"
            />
          </div>

          {/* 熱門標籤 */}
          <div className="text-[10px] text-slate-400 mb-2 tracking-wide font-bold">
            TRENDING TAGS · 熱門關鍵字
          </div>
          <div className="flex flex-wrap gap-1.5">
            {data.topTags.slice(0, 6).map((t) => (
              <button
                key={t.tag}
                onClick={(e) => { e.stopPropagation(); setSearchQuery(t.tag); onNav("history"); }}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-[10px] font-bold transition"
              >
                {t.tag} <span className="opacity-50 ml-0.5">×{t.count}</span>
              </button>
            ))}
          </div>
        </HeroCard>

        {/* ─────────────────────────────────────
            Hero 3 · 卡點分位數預警
        ───────────────────────────────────── */}
        <HeroCard
          algorithm="EMPIRICAL PERCENTILE"
          algorithmDetail="非常態分佈 · 同類經驗比較"
          icon={AlertCircle}
          accentColor="text-amber-500"
          accentBg="bg-amber-500"
          title="卡點分位數預警"
          subtitle="不是 SLA 是「歷史同類拖多久」"
          onClick={() => onNav("analytics")}
        >
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-5xl font-black text-slate-900 tracking-tight">
              {data.activeBlockers.length}
            </span>
            <span className="text-sm text-slate-500 font-medium">筆活躍</span>
            <span className="ml-auto text-[10px] font-mono">
              <span className="text-red-500 font-bold">{data.p95Blockers.length} P95+</span>
              <span className="text-slate-300 mx-1">/</span>
              <span className="text-amber-600 font-bold">{data.p90Blockers.length} P90+</span>
            </span>
          </div>

          {/* 風險最高的卡點 */}
          {data.topBlocker && data.topBlocker.hasData && (
            <div className="bg-slate-50 rounded-xl p-3 mb-4">
              <div className="text-[10px] text-slate-400 mb-1 tracking-wide font-bold">
                TAIL RISK · 最高風險
              </div>
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-bold text-slate-900 truncate">
                  {data.topBlocker.blocker?.title || data.topBlocker.originalText}
                </span>
                <span className={cn(
                  "text-xs font-mono font-bold shrink-0",
                  (data.topBlocker.percentile || 0) >= 95 ? "text-red-500" : "text-amber-600"
                )}>
                  P{data.topBlocker.percentile}
                </span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">
                {data.topBlocker.categoryInfo?.label} · 已卡 {data.topBlocker.currentDays} 天
              </div>
            </div>
          )}

          {/* 類別分布 mini bar */}
          <div className="space-y-2">
            {(Object.entries(data.blockerCategoryCount) as [string, number][])
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([cat, count]) => {
                const max = Math.max(...(Object.values(data.blockerCategoryCount) as number[]), 1);
                const pct = (count / max) * 100;
                return (
                  <div key={cat} className="flex items-center gap-2 text-[10px]">
                    <span className="w-20 text-slate-500 truncate">{cat}</span>
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8 }}
                        className="h-full rounded-full bg-amber-400"
                      />
                    </div>
                    <span className="w-6 text-right text-slate-600 font-mono font-bold">{count}</span>
                  </div>
                );
              })}
          </div>
        </HeroCard>
      </div>

      {/* === 底部：3 個次要入口 (組織分析、決策追蹤、會議準備) === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SecondaryCard
          icon={Network}
          label="組織互動網絡"
          value={`${departments.filter((d) => d.active && d.name !== "營運與管理層").length} 個部門`}
          hint="跨部門協作熱度 + 趨勢預警"
          color="text-violet-500"
          bg="bg-violet-50"
          onClick={() => onNav("orgnetwork")}
        />
        <SecondaryCard
          icon={Activity}
          label="決策執行軌跡"
          value={`${decisions.filter((d) => d.status === "執行中").length} 執行中 · ${decisions.filter((d) => d.status === "逾期").length} 逾期`}
          hint="平均執行時長與達成率"
          color="text-emerald-500"
          bg="bg-emerald-50"
          onClick={() => onNav("decisions")}
        />
        <SecondaryCard
          icon={TrendingUp}
          label="本週週報"
          value={`${reports.filter((r) => r.week).length} 份 · 49 週累積`}
          hint="週日截止 · 趨勢預測 B2"
          color="text-blue-500"
          bg="bg-blue-50"
          onClick={() => onNav("report")}
        />
      </div>
    </div>
  );
}

// ============================================================
// HeroCard - 三大亮點專用大卡
// ============================================================
interface HeroCardProps {
  algorithm: string;
  algorithmDetail: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  accentColor: string;
  accentBg: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  onClick?: () => void;
}

function HeroCard({
  algorithm, algorithmDetail, icon: Icon, accentColor, accentBg, title, subtitle, children, onClick,
}: HeroCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/60 p-6 shadow-sm hover:shadow-lg transition-all cursor-pointer relative overflow-hidden group"
    >
      {/* 頂部演算法標記 (亮點) */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />
      <div className="flex items-center gap-2 mb-1">
        <Sparkles size={11} className={accentColor} />
        <span className={cn("text-[10px] font-black tracking-[0.15em]", accentColor)}>
          {algorithm}
        </span>
      </div>
      <div className="text-[10px] text-slate-400 mb-4 ml-4 font-mono italic">
        {algorithmDetail}
      </div>

      {/* 標題列 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Icon size={18} className={accentColor} />
            {title}
          </h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{subtitle}</p>
        </div>
        <div className={cn("p-2 rounded-xl group-hover:scale-110 transition", accentBg.replace("bg-", "bg-") + "/10")}>
          <ArrowUpRight size={16} className={accentColor} />
        </div>
      </div>

      {/* 內容 */}
      {children}
    </motion.div>
  );
}

// ============================================================
// SecondaryCard - 底部次要入口
// ============================================================
interface SecondaryCardProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  hint: string;
  color: string;
  bg: string;
  onClick?: () => void;
}

function SecondaryCard({ icon: Icon, label, value, hint, color, bg, onClick }: SecondaryCardProps) {
  return (
    <button
      onClick={onClick}
      className="bg-white rounded-2xl border border-slate-200/60 p-5 hover:shadow-md hover:border-slate-300 transition-all text-left group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={cn("p-2 rounded-xl group-hover:scale-110 transition", bg)}>
          <Icon size={16} className={color} />
        </div>
        <ChevronRight size={14} className="text-slate-300 group-hover:translate-x-1 transition" />
      </div>
      <div className="text-[10px] text-slate-400 tracking-wide font-bold mb-1.5 uppercase">{label}</div>
      <div className="text-base font-bold text-slate-900 mb-1">{value}</div>
      <div className="text-[11px] text-slate-500">{hint}</div>
    </button>
  );
}
