import { useState, useMemo, type ReactNode, type Key } from "react";
import { FileText, Check, Send, ChevronDown, Calendar, CircleCheck, CircleAlert, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { CURRENT_WEEK_LABEL, NOW, displayWeek, parseWeekStart } from "../lib/dateUtils";
import type { Report, Department } from "../lib/types";
import type { UserProfile } from "../lib/firebase";

interface Props {
  reports: Report[];
  setReports: (r: Report[] | ((p: Report[]) => Report[])) => void;
  departments: Department[];
  userProfile: UserProfile | null;
}

const DEPT_COLOR: Record<string, { ring: string; bg: string; dot: string; text: string; accent: string }> = {
  "投資研究部": { ring: "ring-blue-200",    bg: "bg-blue-50",    dot: "bg-blue-500",    text: "text-blue-700",    accent: "border-l-blue-500" },
  "業務開發部": { ring: "ring-emerald-200", bg: "bg-emerald-50", dot: "bg-emerald-500", text: "text-emerald-700", accent: "border-l-emerald-500" },
  "資產管理部": { ring: "ring-violet-200",  bg: "bg-violet-50",  dot: "bg-violet-500",  text: "text-violet-700",  accent: "border-l-violet-500" },
};

const fallbackColor = { ring: "ring-slate-200", bg: "bg-slate-50", dot: "bg-slate-500", text: "text-slate-700", accent: "border-l-slate-400" };

export default function WeeklyReportPage({ reports, setReports, departments, userProfile }: Props) {
  const activeDepts = departments.filter((d) => d.active && d.name !== "營運與管理層").map((d) => d.name);
  const [form, setForm] = useState({
    dept: activeDepts[0] || "",
    author: userProfile?.displayName || "",
    cases: "",
    blockers: "",
    needHelp: "",
    nextWeek: "",
    keywords: "",
  });
  const [saved, setSaved] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [expandedReportId, setExpandedReportId] = useState<string | null>(null);
  const [historyVisible, setHistoryVisible] = useState(6);
  const [deptFilter, setDeptFilter] = useState<string>("all");

  const thisWeek = reports.filter((r) => r.week === CURRENT_WEEK_LABEL);
  const submittedDepts = new Set(thisWeek.map((r) => r.dept));

  // 歷史週報依週次分組
  const groupedHistory = useMemo(() => {
    const groups: Record<string, Report[]> = {};
    reports.forEach((r) => {
      if (r.week === CURRENT_WEEK_LABEL) return;
      if (deptFilter !== "all" && r.dept !== deptFilter) return;
      if (!groups[r.week]) groups[r.week] = [];
      groups[r.week].push(r);
    });
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const ka = String(a).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      const kb = String(b).match(/(\d{4})[/-](\d{1,2})[/-](\d{1,2})/);
      const sa = ka ? +ka[1] * 10000 + +ka[2] * 100 + +ka[3] : 0;
      const sb = kb ? +kb[1] * 10000 + +kb[2] * 100 + +kb[3] : 0;
      return sb - sa;
    });
    return sortedKeys.map((w) => ({
      week: w,
      reports: groups[w],
      weeksAgo: Math.max(1, Math.round((+NOW - +(parseWeekStart(w) || NOW)) / (86400000 * 7))),
    }));
  }, [reports, deptFilter]);

  // 週日截止
  const sunday = new Date(NOW);
  const day = sunday.getDay();
  sunday.setDate(sunday.getDate() + (day === 0 ? 0 : 7 - day));
  const daysLeft = Math.ceil((+sunday - +NOW) / 86400000);

  const submit = () => {
    if (!form.author.trim() || !form.cases.trim()) return;
    const newR: Report = {
      id: "r" + Date.now(),
      dept: form.dept,
      week: CURRENT_WEEK_LABEL,
      author: form.author,
      submittedAt: NOW.toISOString().slice(0, 16).replace("T", " "),
      cases: form.cases,
      blockers: form.blockers,
      needHelp: form.needHelp,
      nextWeek: form.nextWeek,
      keywords: form.keywords.split(/[,，\s]+/).filter(Boolean),
    };
    setReports((prev) => [newR, ...prev]);
    setForm({ ...form, cases: "", blockers: "", needHelp: "", nextWeek: "", keywords: "" });
    setSaved(true);
    setFormOpen(false);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-5xl mx-auto pb-12 px-1">
      {/* Hero */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">週報</h1>
          <p className="text-sm text-slate-500 mt-1">三部門每週日前繳交，本週進度一覽。</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <Calendar size={14} className="text-slate-400" />
          <span className="text-slate-600 font-medium">{CURRENT_WEEK_LABEL}</span>
          <span className={cn(
            "px-2.5 py-1 rounded-full font-bold",
            daysLeft < 0 ? "bg-red-100 text-red-700"
            : daysLeft === 0 ? "bg-amber-100 text-amber-700"
            : daysLeft <= 2 ? "bg-amber-50 text-amber-700"
            : "bg-emerald-50 text-emerald-700",
          )}>
            {daysLeft < 0 ? `逾期 ${-daysLeft} 天`
              : daysLeft === 0 ? "今晚截止"
              : `還有 ${daysLeft} 天`}
          </span>
        </div>
      </div>

      {/* 本週狀態 - 3 部門卡片 */}
      <section className="mb-6">
        <div className="flex items-baseline justify-between mb-3">
          <h3 className="text-base font-bold text-slate-900">本週繳交狀態</h3>
          <span className="text-xs text-slate-500">
            <strong className="text-slate-900">{thisWeek.length}</strong> / {activeDepts.length} 部門已交
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {activeDepts.map((dept) => {
            const submitted = submittedDepts.has(dept);
            const report = thisWeek.find((r) => r.dept === dept);
            const color = DEPT_COLOR[dept] || fallbackColor;
            return (
              <motion.div
                key={dept}
                whileHover={submitted ? { y: -2 } : {}}
                onClick={() => {
                  if (report) setExpandedReportId(expandedReportId === report.id ? null : report.id);
                }}
                className={cn(
                  "relative bg-white rounded-2xl border p-5 transition-all overflow-hidden",
                  submitted
                    ? "border-slate-200/70 hover:shadow-md cursor-pointer"
                    : "border-dashed border-slate-300/70",
                )}
              >
                <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", submitted ? color.dot : "bg-slate-200")} />
                <div className="pl-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className={cn("text-sm font-bold", submitted ? "text-slate-900" : "text-slate-500")}>
                      {dept}
                    </span>
                    {submitted
                      ? <CircleCheck size={18} className="text-emerald-500" />
                      : <CircleAlert size={18} className="text-amber-400" />}
                  </div>
                  {submitted && report ? (
                    <>
                      <div className="text-xs text-slate-500 mb-1">
                        <strong className="text-slate-700">{report.author}</strong> · {report.submittedAt.split(" ")[1] || ""}
                      </div>
                      <div className="text-xs text-slate-600 line-clamp-2 mt-2">
                        {report.cases.split("\n")[0]?.replace(/^•\s*/, "")}
                      </div>
                    </>
                  ) : (
                    <div className="text-xs text-slate-400 mt-1">尚未繳交</div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* 寫週報入口 */}
      <section className="mb-8">
        {!formOpen ? (
          <button
            onClick={() => setFormOpen(true)}
            className="w-full bg-gradient-to-r from-blue-500 to-violet-500 hover:from-blue-600 hover:to-violet-600 text-white rounded-2xl px-6 py-4 font-bold shadow-sm hover:shadow-md transition flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            填寫本週週報
          </button>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200/70 shadow-sm"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                  <FileText size={16} className="text-blue-600" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900">填寫本週週報</div>
                  <div className="text-[11px] text-slate-500">{CURRENT_WEEK_LABEL}</div>
                </div>
              </div>
              <button
                onClick={() => setFormOpen(false)}
                className="text-xs text-slate-500 hover:text-slate-900 transition"
              >
                取消
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Field label="所屬部門">
                  <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg cursor-pointer focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10">
                    {activeDepts.map((d) => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="填寫人 *">
                  <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
                    className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
                </Field>
              </div>

              <TextareaField label="本週進行中案件 *" value={form.cases} onChange={(v) => setForm({ ...form, cases: v })}
                placeholder="• 案件 1（進度與重點）&#10;• 案件 2" rows={5} icon="🎯" />
              <TextareaField label="本週卡點" value={form.blockers} onChange={(v) => setForm({ ...form, blockers: v })}
                placeholder="目前卡住的原因、影響範圍" rows={2} icon="🚧" />
              <TextareaField label="需要協助" value={form.needHelp} onChange={(v) => setForm({ ...form, needHelp: v })}
                placeholder="需要哪個部門 / 管理層介入" rows={2} icon="🤝" />
              <TextareaField label="下週計畫" value={form.nextWeek} onChange={(v) => setForm({ ...form, nextWeek: v })}
                placeholder="下週重點工作" rows={2} icon="📅" />
              <TextareaField label="關鍵字（逗號分隔）" value={form.keywords} onChange={(v) => setForm({ ...form, keywords: v })}
                placeholder="例：田宮電機, Pre-A, 盡調" icon="🏷️" />

              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-100">
                {saved && (
                  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-2 text-sm text-emerald-600 font-bold">
                    <Check size={16} /> 已儲存
                  </motion.div>
                )}
                <Button variant="primary" icon={<Send size={14} />}
                  disabled={!form.cases.trim() || !form.author.trim()}
                  onClick={submit}
                  className="ml-auto">
                  送出週報
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </section>

      {/* 已交週報詳細 */}
      {thisWeek.length > 0 && (
        <section className="mb-10">
          <h3 className="text-base font-bold text-slate-900 mb-3">本週週報內容</h3>
          <div className="space-y-2.5">
            {thisWeek.map((r) => (
              <ReportRow key={r.id} r={r} isExpanded={expandedReportId === r.id}
                onToggle={() => setExpandedReportId(expandedReportId === r.id ? null : r.id)} />
            ))}
          </div>
        </section>
      )}

      {/* 歷史週報 */}
      {groupedHistory.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <h3 className="text-base font-bold text-slate-900">
              歷史週報 <span className="text-xs text-slate-400 font-medium ml-1">{groupedHistory.length} 個週次</span>
            </h3>
            <div className="flex border border-slate-200 rounded-xl bg-white text-xs overflow-hidden shadow-sm">
              {[{ k: "all", l: "全部" }, ...activeDepts.map((d) => ({ k: d, l: d.replace("部", "") }))].map((opt, i) => (
                <button key={opt.k}
                  onClick={() => { setDeptFilter(opt.k); setHistoryVisible(6); }}
                  className={cn(
                    "px-3.5 py-2 transition font-medium",
                    i > 0 && "border-l border-slate-200",
                    deptFilter === opt.k ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-900",
                  )}>
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {groupedHistory.slice(0, historyVisible).map((g) => {
              const label = g.weeksAgo === 1 ? "上週"
                          : g.weeksAgo === 2 ? "上上週"
                          : `${g.weeksAgo} 週前`;
              return (
                <div key={g.week} className="bg-white rounded-2xl border border-slate-200/70 overflow-hidden">
                  <div className="px-5 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-100 flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900 text-white tracking-wide">
                      {label}
                    </span>
                    <span className="text-sm font-semibold text-slate-700">{displayWeek(g.week)}</span>
                    <span className="ml-auto text-xs text-slate-400">{g.reports.length} 份報告</span>
                  </div>
                  <div className="p-3 space-y-2">
                    {g.reports.map((r) => (
                      <ReportRow key={r.id} r={r} isExpanded={expandedReportId === r.id}
                        onToggle={() => setExpandedReportId(expandedReportId === r.id ? null : r.id)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {historyVisible < groupedHistory.length && (
            <div className="text-center mt-5">
              <Button variant="secondary" onClick={() => setHistoryVisible(historyVisible + 8)}>
                載入更多（還有 {groupedHistory.length - historyVisible} 週）
              </Button>
            </div>
          )}
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function TextareaField({ label, value, onChange, placeholder, rows, icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number; icon?: string;
}) {
  const T = rows ? "textarea" : "input";
  return (
    <div className="mb-3">
      <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600 mb-1.5 tracking-wide">
        {icon && <span className="text-sm">{icon}</span>}
        {label}
      </label>
      {/* @ts-ignore */}
      <T value={value} rows={rows} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 placeholder:text-slate-300 resize-none" />
    </div>
  );
}

function ReportRow({ r, isExpanded, onToggle }: { r: Report; isExpanded?: boolean; onToggle?: () => void; key?: Key }) {
  const color = DEPT_COLOR[r.dept] || fallbackColor;
  const hasBlocker = (r.blockers || "").trim().length > 0;
  return (
    <button
      onClick={onToggle}
      className={cn(
        "w-full text-left rounded-xl border-l-4 border-y border-r transition-all overflow-hidden bg-white",
        color.accent,
        isExpanded ? "border-y-blue-200 border-r-blue-200 shadow-md" : "border-y-slate-200/70 border-r-slate-200/70 hover:shadow-sm",
      )}
    >
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("w-1.5 h-1.5 rounded-full", color.dot)} />
              <span className="text-sm font-bold text-slate-900">{r.dept}</span>
              {hasBlocker && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">
                  <AlertTriangle size={10} /> 有卡點
                </span>
              )}
            </div>
            <div className="text-[11px] text-slate-500">
              {r.author} · {r.submittedAt}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-wrap gap-1 justify-end max-w-[200px]">
              {(r.keywords || []).slice(0, 3).map((k) => (
                <span key={k} className={cn("px-2 py-0.5 rounded text-[10px] font-semibold", color.bg, color.text)}>
                  {k}
                </span>
              ))}
            </div>
            <ChevronDown size={14} className={cn("text-slate-400 transition", isExpanded && "rotate-180")} />
          </div>
        </div>

        {!isExpanded && r.cases && (
          <div className="text-xs text-slate-600 mt-2.5 whitespace-pre-line line-clamp-2 pl-3.5">
            {r.cases}
          </div>
        )}
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-100">
            <div className="p-5 space-y-3 text-xs bg-gradient-to-b from-slate-50/50 to-transparent">
              {r.cases && (
                <DetailField label="🎯 本週進行中案件" value={r.cases} />
              )}
              {r.blockers && (
                <DetailField label="🚧 本週卡點" value={r.blockers} variant="warn" />
              )}
              {r.needHelp && (
                <DetailField label="🤝 需要協助" value={r.needHelp} variant="hint" />
              )}
              {r.nextWeek && (
                <DetailField label="📅 下週計畫" value={r.nextWeek} />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

function DetailField({ label, value, variant }: { label: string; value: string; variant?: "warn" | "hint" }) {
  const bg = variant === "warn" ? "bg-red-50 text-red-800 border-red-100"
           : variant === "hint" ? "bg-amber-50 text-amber-800 border-amber-100"
           : "bg-white text-slate-700 border-slate-200/60";
  return (
    <div>
      <div className="text-[11px] text-slate-500 font-bold tracking-wide mb-1.5">{label}</div>
      <div className={cn("rounded-lg p-3 leading-relaxed whitespace-pre-line border", bg)}>{value}</div>
    </div>
  );
}
