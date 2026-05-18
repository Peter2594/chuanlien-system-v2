import { useState, useMemo, type ReactNode } from "react";
import { Calendar, ChevronDown, FileWarning, AlertTriangle, ArrowRight, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { NOW } from "../lib/dateUtils";
import { isDecisionOverdueAt, daysOverdue } from "../lib/algorithms";
import type { MeetingHistory, Decision, Handoff, Blocker } from "../lib/types";

interface Props {
  meetingHistory: MeetingHistory[];
  decisions: Decision[];
  handoffs: Handoff[];
  blockers: Blocker[];
}

function classifyMeeting(title: string): "週會" | "月會" | "季度" | "其他" {
  if (/週會|周會|weekly/i.test(title)) return "週會";
  if (/月會|monthly|投資委員會|業務檢討|資產管理檢討/i.test(title)) return "月會";
  if (/季|quarterly|Q[1-4]/i.test(title)) return "季度";
  return "其他";
}

const CATEGORY_STYLE: Record<string, { color: string; bg: string; label: string }> = {
  週會:   { color: "text-blue-700",    bg: "bg-blue-50",    label: "週會" },
  月會:   { color: "text-emerald-700", bg: "bg-emerald-50", label: "月會" },
  季度:   { color: "text-violet-700",  bg: "bg-violet-50",  label: "季度會議" },
  其他:   { color: "text-slate-700",   bg: "bg-slate-50",   label: "其他" },
};

export default function MeetingPrepPage({ meetingHistory, decisions, handoffs, blockers }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");

  // 按分類統計
  const categorized = useMemo(() => {
    const groups: Record<string, MeetingHistory[]> = { 週會: [], 月會: [], 季度: [], 其他: [] };
    meetingHistory.forEach((m) => {
      const cat = classifyMeeting(m.title);
      groups[cat].push(m);
    });
    return groups;
  }, [meetingHistory]);

  const visibleMeetings = filterCat === "all"
    ? meetingHistory
    : categorized[filterCat] || [];

  // 自動議程資料（保留實體物件，方便視覺化）
  const blockerItems = blockers
    .filter((b) => b.status !== "resolved")
    .map((b) => ({
      ...b,
      days: Math.round((+NOW - +new Date(b.createdAt)) / 86400000),
    }))
    .sort((a, b) => b.days - a.days)
    .slice(0, 4);

  const overdueDecisions = decisions
    .filter((d) => isDecisionOverdueAt(d, NOW))
    .map((d) => ({
      ...d,
      daysLate: daysOverdue(d, NOW),
    }))
    .sort((a, b) => b.daysLate - a.daysLate)
    .slice(0, 4);

  const pendingHandoffs = handoffs
    .filter((h) => h.status === "待簽收")
    .sort((a, b) => (b.hoursOverdue || 0) - (a.hoursOverdue || 0))
    .slice(0, 4);

  const totalItems = blockerItems.length + overdueDecisions.length + pendingHandoffs.length;

  // 下次週會時間 (下週一)
  const nextMon = new Date(NOW);
  const day = nextMon.getDay();
  nextMon.setDate(nextMon.getDate() + (day === 0 ? 1 : 8 - day));

  return (
    <div className="max-w-6xl mx-auto pb-12 px-1">
      {/* Hero */}
      <div className="mb-6">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">下次週會</h1>
        <div className="flex items-center gap-3 mt-2 flex-wrap">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 text-blue-700">
            <Calendar size={14} />
            <span className="text-sm font-bold">
              {nextMon.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" })}
            </span>
          </div>
          <span className="text-xs text-slate-500">
            系統依卡點 / 決策 / 交接自動產出議程
          </span>
        </div>
      </div>

      {/* 議程總覽 - 視覺化 3 卡 */}
      <section className="mb-8">
        <div className="flex items-baseline justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">建議議程</h3>
            <span className="text-xs text-slate-400 ml-1">共 {totalItems} 項待討論</span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold tracking-wider">AUTO-GENERATED</span>
        </div>

        {totalItems === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center">
            <div className="text-emerald-400 text-4xl mb-2">✨</div>
            <div className="text-sm text-slate-600 font-medium">本週運作順利，無重大議題需討論</div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Card 1: 卡點 */}
            <AgendaCard
              index={1}
              icon={<FileWarning size={18} />}
              title="本週重點卡點"
              subtitle="風險最高的卡點優先討論"
              color="rose"
              count={blockerItems.length}
              items={blockerItems.length === 0 ? null : blockerItems.map((b) => ({
                key: b.id,
                title: b.title,
                meta: `${b.dept} · 已卡 ${b.days} 天`,
                badge: b.days >= 28 ? "極高" : b.days >= 20 ? "高" : b.days >= 10 ? "關注" : "正常",
                badgeColor: b.days >= 28 ? "red" : b.days >= 20 ? "amber" : b.days >= 10 ? "blue" : "emerald",
              }))}
            />

            {/* Card 2: 逾期決策 */}
            <AgendaCard
              index={2}
              icon={<AlertTriangle size={18} />}
              title="逾期決策追蹤"
              subtitle="未在期限內完成的決議"
              color="amber"
              count={overdueDecisions.length}
              items={overdueDecisions.length === 0 ? null : overdueDecisions.map((d) => ({
                key: d.id,
                title: d.title,
                meta: `指派 ${d.assignedDept}`,
                badge: `逾期 ${d.daysLate} 天`,
                badgeColor: "red",
              }))}
            />

            {/* Card 3: 未閉環交接 */}
            <AgendaCard
              index={3}
              icon={<ArrowRight size={18} />}
              title="未閉環交接"
              subtitle="待簽收的部門交接"
              color="blue"
              count={pendingHandoffs.length}
              items={pendingHandoffs.length === 0 ? null : pendingHandoffs.map((h) => ({
                key: h.id,
                title: h.title,
                meta: `${h.from} → ${h.to}`,
                badge: h.hoursOverdue ? `${h.hoursOverdue} 小時` : "待簽收",
                badgeColor: (h.hoursOverdue || 0) >= 48 ? "red" : (h.hoursOverdue || 0) >= 24 ? "amber" : "blue",
              }))}
            />
          </div>
        )}
      </section>

      {/* 歷史會議 - 分類 */}
      <section>
        <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
          <h3 className="text-base font-bold text-slate-900">
            歷史會議紀錄
            <span className="text-xs text-slate-400 font-medium ml-2">共 {meetingHistory.length} 場</span>
          </h3>
          <div className="flex border border-slate-200 bg-white rounded-xl overflow-hidden text-xs shadow-sm">
            <button
              onClick={() => setFilterCat("all")}
              className={cn(
                "px-3.5 py-2 transition font-medium",
                filterCat === "all" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
              )}>
              全部 <span className="opacity-60 ml-0.5">({meetingHistory.length})</span>
            </button>
            {(["週會", "月會", "季度", "其他"] as const).map((cat) => {
              const s = CATEGORY_STYLE[cat];
              const count = categorized[cat]?.length || 0;
              if (count === 0) return null;
              return (
                <button key={cat}
                  onClick={() => setFilterCat(cat)}
                  className={cn(
                    "px-3.5 py-2 transition font-medium border-l border-slate-200",
                    filterCat === cat ? `${s.bg} ${s.color}` : "text-slate-500 hover:text-slate-900",
                  )}>
                  {s.label} <span className="opacity-60 ml-0.5">({count})</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          {visibleMeetings.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/70 p-12 text-center text-slate-400 text-sm">
              此分類沒有會議紀錄
            </div>
          ) : visibleMeetings.map((m) => {
            const isExp = expandedId === m.id;
            const cat = classifyMeeting(m.title);
            const catStyle = CATEGORY_STYLE[cat];
            return (
              <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
                <button onClick={() => setExpandedId(isExp ? null : m.id)}
                  className={cn(
                    "w-full text-left bg-white rounded-2xl border p-5 transition-all",
                    isExp ? "border-blue-300 shadow-md" : "border-slate-200/70 hover:border-slate-300 hover:shadow-sm",
                  )}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{m.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <span className="text-sm font-bold text-slate-900">{m.title}</span>
                        <span className={cn("text-[10px] px-1.5 py-0.5 rounded font-bold tracking-wide shrink-0", catStyle.bg, catStyle.color)}>
                          {catStyle.label}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {m.schedule} · {m.archivedAt}
                      </div>
                    </div>
                    <ChevronDown size={16} className={cn("text-slate-400 transition", isExp && "rotate-180")} />
                  </div>

                  <AnimatePresence>
                    {isExp && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-slate-100">
                        <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-3">
                          當時議程 · 與會：{m.audience}
                        </div>
                        <div className="space-y-2">
                          {m.agendaSnapshot.map((item, i) => (
                            <div key={i} className="bg-slate-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-800">{i + 1}. {item.title}</span>
                                {item.priority === "high" && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700 font-bold">高優先</span>
                                )}
                              </div>
                              {item.notes && (
                                <div className="text-[11px] text-slate-500 leading-relaxed mt-1.5">
                                  {item.notes}
                                </div>
                              )}
                            </div>
                          ))}
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
    </div>
  );
}

interface AgendaItem {
  key: string;
  title: string;
  meta: string;
  badge: string;
  badgeColor: "red" | "amber" | "blue" | "emerald";
}

function AgendaCard({ index, icon, title, subtitle, color, count, items }: {
  index: number;
  icon: ReactNode;
  title: string;
  subtitle: string;
  color: "rose" | "amber" | "blue";
  count: number;
  items: AgendaItem[] | null;
}) {
  const palette = {
    rose:  { headerBg: "bg-gradient-to-br from-rose-50 to-white",  iconBg: "bg-rose-100",  iconText: "text-rose-600",  numBg: "bg-rose-500" },
    amber: { headerBg: "bg-gradient-to-br from-amber-50 to-white", iconBg: "bg-amber-100", iconText: "text-amber-600", numBg: "bg-amber-500" },
    blue:  { headerBg: "bg-gradient-to-br from-blue-50 to-white",  iconBg: "bg-blue-100",  iconText: "text-blue-600",  numBg: "bg-blue-500" },
  }[color];

  const badgePalette = {
    red:     "bg-red-100 text-red-700",
    amber:   "bg-amber-100 text-amber-700",
    blue:    "bg-blue-100 text-blue-700",
    emerald: "bg-emerald-100 text-emerald-700",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden flex flex-col">
      {/* Header */}
      <div className={cn("px-5 py-4 border-b border-slate-100", palette.headerBg)}>
        <div className="flex items-start gap-3">
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", palette.iconBg, palette.iconText)}>
            {icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={cn("w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center", palette.numBg)}>
                {index}
              </span>
              <span className="text-sm font-bold text-slate-900">{title}</span>
            </div>
            <div className="text-[11px] text-slate-500">{subtitle}</div>
          </div>
          <div className="text-right">
            <div className={cn(
              "text-3xl font-black leading-none",
              count === 0 ? "text-slate-300" : palette.iconText,
            )}>{count}</div>
            <div className="text-[9px] text-slate-400 font-bold tracking-wider mt-1">項</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="p-3 flex-1 space-y-1.5">
        {items === null || items.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <div className="text-2xl mb-1">✓</div>
            無待處理事項
          </div>
        ) : (
          items.map((item) => (
            <div key={item.key} className="px-3 py-2.5 rounded-lg hover:bg-slate-50 transition border border-transparent hover:border-slate-200/70">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="text-xs font-bold text-slate-800 leading-snug flex-1">
                  {item.title}
                </div>
                <span className={cn(
                  "px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide shrink-0",
                  badgePalette[item.badgeColor],
                )}>
                  {item.badge}
                </span>
              </div>
              <div className="text-[10px] text-slate-500">{item.meta}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
