import { useState, useMemo } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../components/ui/Card";
import { Pill } from "../components/ui/Pill";
import { cn } from "../lib/utils";
import { NOW } from "../lib/dateUtils";
import type { MeetingHistory, Decision, Handoff, Blocker } from "../lib/types";

interface Props {
  meetingHistory: MeetingHistory[];
  decisions: Decision[];
  handoffs: Handoff[];
  blockers: Blocker[];
}

// 自動分類
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

  // 自動生成本週議程
  const autoAgenda = [
    {
      title: "本週重點卡點討論",
      items: blockers.filter((b) => b.status !== "resolved").slice(0, 3).map((b) =>
        `${b.title}（${b.dept}，已 ${Math.round((+NOW - +new Date(b.createdAt)) / 86400000)} 天）`,
      ),
    },
    {
      title: "逾期決策追蹤",
      items: decisions.filter((d) => d.status === "逾期").slice(0, 3).map((d) =>
        `${d.title}（指派 ${d.assignedDept}）`,
      ),
    },
    {
      title: "未閉環交接",
      items: handoffs.filter((h) => h.status === "待簽收").slice(0, 3).map((h) =>
        `${h.from} → ${h.to}：${h.title}`,
      ),
    },
  ].filter((g) => g.items.length > 0);

  // 下次週會時間 (下週一)
  const nextMon = new Date(NOW);
  const day = nextMon.getDay();
  nextMon.setDate(nextMon.getDate() + (day === 0 ? 1 : 8 - day));

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="mb-8">
        <div className="text-[11px] text-slate-400 tracking-[0.25em] font-bold mb-2">MEETING PREP</div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          下次週會 · {nextMon.toLocaleDateString("zh-TW", { month: "long", day: "numeric", weekday: "long" })}
        </h1>
        <p className="text-sm text-slate-500">
          系統根據卡點、決策、交接自動產出議程（援引 Andy Grove《High Output Management》）
        </p>
      </div>

      {/* 自動議程 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Calendar size={18} className="text-blue-500" />
          <h3 className="text-base font-bold text-slate-900">建議議程</h3>
          <span className="ml-auto text-[10px] text-slate-400 font-bold tracking-wider">AUTO-GENERATED</span>
        </div>
        {autoAgenda.length === 0 ? (
          <div className="text-sm text-slate-400 text-center py-8">本週沒有需要特別討論的議題</div>
        ) : (
          <div className="space-y-5">
            {autoAgenda.map((g, i) => (
              <div key={i}>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-800 mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs">{i + 1}</span>
                  {g.title}
                  <Pill tone="warn">高優先</Pill>
                </div>
                <div className="ml-8 space-y-1">
                  {g.items.map((it, j) => (
                    <div key={j} className="text-xs text-slate-600 leading-relaxed flex gap-2">
                      <span className="text-slate-400">•</span>
                      <span>{it}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* 歷史會議 - 分類 */}
      <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-700">歷史會議紀錄</h3>
        <span className="text-xs text-slate-400">共 {meetingHistory.length} 場</span>
      </div>

      {/* 分類 tabs */}
      <div className="flex border border-slate-200 bg-white rounded-lg mb-4 overflow-hidden text-xs">
        <button
          onClick={() => setFilterCat("all")}
          className={cn(
            "flex-1 px-3 py-2 transition flex items-center justify-center gap-2",
            filterCat === "all" ? "bg-slate-900 text-white font-bold" : "text-slate-500 hover:text-slate-900",
          )}>
          全部 <span className="opacity-60">({meetingHistory.length})</span>
        </button>
        {(["週會", "月會", "季度", "其他"] as const).map((cat) => {
          const s = CATEGORY_STYLE[cat];
          const count = categorized[cat]?.length || 0;
          if (count === 0) return null;
          return (
            <button key={cat}
              onClick={() => setFilterCat(cat)}
              className={cn(
                "flex-1 px-3 py-2 transition flex items-center justify-center gap-2 border-l border-slate-200",
                filterCat === cat ? `${s.bg} ${s.color} font-bold` : "text-slate-500 hover:text-slate-900",
              )}>
              {s.label} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="space-y-2">
        {visibleMeetings.length === 0 ? (
          <Card className="p-8 text-center text-slate-400 text-xs">此分類沒有會議紀錄</Card>
        ) : visibleMeetings.map((m) => {
          const isExp = expandedId === m.id;
          const cat = classifyMeeting(m.title);
          const catStyle = CATEGORY_STYLE[cat];
          return (
            <motion.div key={m.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}>
              <button onClick={() => setExpandedId(isExp ? null : m.id)}
                className={cn(
                  "w-full text-left bg-white rounded-xl border p-4 transition-all",
                  isExp ? "border-blue-300 shadow-sm" : "border-slate-200/60 hover:border-slate-300",
                )}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-slate-900 truncate">{m.title}</span>
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-bold tracking-wider shrink-0", catStyle.bg, catStyle.color)}>
                        {catStyle.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {m.schedule} · {m.archivedAt}
                    </div>
                  </div>
                  <ChevronDown size={14} className={cn("text-slate-400 transition", isExp && "rotate-180")} />
                </div>

                <AnimatePresence>
                  {isExp && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-4 pt-4 border-t border-slate-100">
                      <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-2">
                        當時議程 · 與會：{m.audience}
                      </div>
                      <div className="space-y-2">
                        {m.agendaSnapshot.map((item, i) => (
                          <div key={i} className="bg-slate-50 rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-bold text-slate-800">{i + 1}. {item.title}</span>
                              {item.priority === "high" && <Pill tone="danger">高優先</Pill>}
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
    </div>
  );
}
