import { useMemo, useRef, useEffect, useState, type ReactNode } from "react";
import { Bell, AlertTriangle, Clock, CheckCircle2, FileWarning, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../../lib/utils";
import { NOW } from "../../lib/dateUtils";
import { CURRENT_WEEK_LABEL } from "../../lib/dateUtils";
import { analyzeBlockerRecord } from "../../lib/algorithms";
import type { Decision, Handoff, Blocker, Report, HistoryCase, Department } from "../../lib/types";
import type { TabId } from "./Sidebar";

interface Props {
  decisions: Decision[];
  handoffs: Handoff[];
  blockers: Blocker[];
  reports: Report[];
  history: HistoryCase[];
  departments: Department[];
  onNavigate: (tab: TabId) => void;
}

interface NotificationItem {
  id: string;
  level: "critical" | "warn" | "info";
  icon: ReactNode;
  title: string;
  desc: string;
  meta: string;
  tab: TabId;
}

export function NotificationPanel({ decisions, handoffs, blockers, reports, departments, history, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // 點外面關閉
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const items = useMemo<NotificationItem[]>(() => {
    const list: NotificationItem[] = [];

    // 1. 極高 / 高風險卡點
    const risky = blockers
      .filter((b) => b.status !== "resolved")
      .map((b) => analyzeBlockerRecord(b, blockers, history))
      .filter((a) => a.level === "critical" || a.level === "high")
      .sort((a, b) => (b.percentile || 0) - (a.percentile || 0))
      .slice(0, 5);
    risky.forEach((a) => {
      list.push({
        id: `blocker-${a.blocker?.id}`,
        level: a.level === "critical" ? "critical" : "warn",
        icon: <FileWarning size={14} />,
        title: a.blocker?.title || "高風險卡點",
        desc: `${a.blocker?.dept} · ${a.categoryInfo?.label}`,
        meta: `${a.levelLabel} · 已卡 ${a.currentDays} 天`,
        tab: "analytics",
      });
    });

    // 2. 逾期決策
    decisions
      .filter((d) => d.status === "逾期")
      .slice(0, 5)
      .forEach((d) => {
        const days = Math.max(0, Math.round((+NOW - +new Date(d.dueDate)) / 86400000));
        list.push({
          id: `decision-${d.id}`,
          level: "critical",
          icon: <AlertTriangle size={14} />,
          title: d.title,
          desc: `指派 ${d.assignedDept}`,
          meta: `逾期 ${days} 天`,
          tab: "decisions",
        });
      });

    // 3. 待簽收 + 已逾時的交接
    handoffs
      .filter((h) => h.status === "待簽收" && (h.hoursOverdue || 0) > 0)
      .sort((a, b) => (b.hoursOverdue || 0) - (a.hoursOverdue || 0))
      .slice(0, 5)
      .forEach((h) => {
        list.push({
          id: `handoff-${h.id}`,
          level: (h.hoursOverdue || 0) >= 48 ? "critical" : "warn",
          icon: <Clock size={14} />,
          title: h.title,
          desc: `${h.from} → ${h.to}`,
          meta: `待簽收 ${h.hoursOverdue} 小時`,
          tab: "handoff",
        });
      });

    // 4. 本週未交週報
    const submitted = new Set(reports.filter((r) => r.week === CURRENT_WEEK_LABEL).map((r) => r.dept));
    const activeDepts = departments.filter((d) => d.active && d.name !== "營運與管理層").map((d) => d.name);
    activeDepts.forEach((dept) => {
      if (!submitted.has(dept)) {
        list.push({
          id: `report-${dept}`,
          level: "info",
          icon: <Clock size={14} />,
          title: `${dept} 本週尚未繳交週報`,
          desc: "週日 23:59 前繳交",
          meta: "週報",
          tab: "report",
        });
      }
    });

    return list;
  }, [decisions, handoffs, blockers, reports, history, departments]);

  const criticalCount = items.filter((i) => i.level === "critical").length;
  const totalCount = items.length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "relative p-2 rounded-full transition-colors",
          open ? "bg-slate-100 text-slate-700" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50",
        )}
      >
        <Bell size={20} />
        {totalCount > 0 && (
          <span className={cn(
            "absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white",
            criticalCount > 0 ? "bg-red-500" : "bg-amber-500",
          )}>
            {totalCount > 9 ? "9+" : totalCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-12 w-96 bg-white rounded-2xl shadow-2xl border border-slate-200/70 overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white">
              <div>
                <div className="text-sm font-bold text-slate-900">通知中心</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  {totalCount > 0
                    ? `${criticalCount > 0 ? `${criticalCount} 件緊急` : "全部"}・共 ${totalCount} 件`
                    : "目前沒有待處理事項"}
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X size={14} />
              </button>
            </div>

            {/* Items */}
            <div className="max-h-[480px] overflow-y-auto custom-scrollbar">
              {items.length === 0 ? (
                <div className="px-5 py-10 text-center">
                  <CheckCircle2 size={32} className="text-emerald-400 mx-auto mb-2" />
                  <div className="text-sm text-slate-600 font-medium">一切順利 ✨</div>
                  <div className="text-[11px] text-slate-400 mt-1">沒有需要立即處理的事項</div>
                </div>
              ) : (
                items.map((item) => {
                  const tone = item.level === "critical"
                    ? { iconBg: "bg-red-100",    iconText: "text-red-600",    accent: "border-l-red-500" }
                    : item.level === "warn"
                    ? { iconBg: "bg-amber-100",  iconText: "text-amber-600",  accent: "border-l-amber-500" }
                    : { iconBg: "bg-slate-100",  iconText: "text-slate-500",  accent: "border-l-slate-300" };
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onNavigate(item.tab);
                        setOpen(false);
                      }}
                      className={cn(
                        "w-full text-left px-5 py-3 flex items-start gap-3 border-l-2 hover:bg-slate-50 transition border-b border-slate-100 last:border-b-0",
                        tone.accent,
                      )}
                    >
                      <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", tone.iconBg, tone.iconText)}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">{item.desc}</div>
                      </div>
                      <div className={cn(
                        "text-[10px] font-bold tracking-wide shrink-0 self-center",
                        item.level === "critical" ? "text-red-600"
                        : item.level === "warn" ? "text-amber-600"
                        : "text-slate-400",
                      )}>
                        {item.meta}
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {totalCount > 0 && (
              <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 text-[11px] text-slate-500 text-center">
                點任一項目跳至對應頁面處理
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
