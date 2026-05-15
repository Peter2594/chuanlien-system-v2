import { useState } from "react";
import { FileText, Check, Send } from "lucide-react";
import { motion } from "motion/react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Pill } from "../components/ui/Pill";
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

  const thisWeek = reports.filter((r) => r.week === CURRENT_WEEK_LABEL);
  const lastWeek = reports.filter((r) => {
    const d = parseWeekStart(r.week);
    if (!d) return false;
    const days = Math.round((+NOW - +d) / 86400000);
    return days >= 7 && days < 14;
  });

  // 計算週日截止
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
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto pb-8">
      {/* Header */}
      <div className="mb-8">
        <div className="text-[11px] text-slate-400 tracking-[0.25em] font-bold mb-2">WEEKLY REPORT</div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          本週週報 · 已交 <span className="text-blue-500">{thisWeek.length}/3</span> 部門
        </h1>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          <span>本週：{CURRENT_WEEK_LABEL}</span>
          <span className={cn(
            "px-2.5 py-0.5 rounded-full text-xs font-bold",
            daysLeft < 0 ? "bg-red-100 text-red-700"
            : daysLeft === 0 ? "bg-amber-100 text-amber-700"
            : "bg-blue-50 text-blue-700",
          )}>
            繳交截止：週日{daysLeft >= 0 ? `（還有 ${daysLeft} 天）` : `（已逾期 ${-daysLeft} 天）`}
          </span>
        </div>
      </div>

      {/* 表單 */}
      <Card className="p-6 mb-6">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
          <FileText size={16} className="text-blue-500" />
          填寫本週週報
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">所屬部門</label>
            <select value={form.dept} onChange={(e) => setForm({ ...form, dept: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg cursor-pointer focus:outline-none focus:border-blue-500">
              {activeDepts.map((d) => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1.5">填寫人 *</label>
            <input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })}
              className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500" />
          </div>
        </div>

        <FormField label="本週進行中案件 *" value={form.cases} onChange={(v) => setForm({ ...form, cases: v })}
          placeholder="• 案件 1&#10;• 案件 2" rows={4} />
        <FormField label="本週卡點" value={form.blockers} onChange={(v) => setForm({ ...form, blockers: v })}
          placeholder="說明目前卡住的原因" rows={2} />
        <FormField label="需要協助" value={form.needHelp} onChange={(v) => setForm({ ...form, needHelp: v })}
          placeholder="需要哪個部門/管理層介入" rows={2} />
        <FormField label="下週計畫" value={form.nextWeek} onChange={(v) => setForm({ ...form, nextWeek: v })}
          placeholder="下週重點工作" rows={2} />
        <FormField label="關鍵字（逗號分隔）" value={form.keywords} onChange={(v) => setForm({ ...form, keywords: v })}
          placeholder="例：A 新創, FinTech, Pre-A" />

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
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
            送出本週週報
          </Button>
        </div>
      </Card>

      {/* 本週已交 */}
      {thisWeek.length > 0 && (
        <section className="mb-6">
          <h3 className="text-sm font-bold text-slate-700 mb-3">本週已提交（{thisWeek.length}/3）</h3>
          <div className="space-y-2">
            {thisWeek.map((r) => <ReportRow key={r.id} r={r} />)}
          </div>
        </section>
      )}

      {/* 上週 */}
      {lastWeek.length > 0 && (
        <section>
          <h3 className="text-sm font-bold text-slate-700 mb-3">上週週報</h3>
          <div className="space-y-2">
            {lastWeek.map((r) => <ReportRow key={r.id} r={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function FormField({ label, value, onChange, placeholder, rows }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number;
}) {
  const T = rows ? "textarea" : "input";
  return (
    <div className="mb-3">
      <label className="block text-[11px] font-bold text-slate-600 mb-1.5">{label}</label>
      {/* @ts-ignore */}
      <T value={value} rows={rows} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
    </div>
  );
}

function ReportRow({ r }: { r: Report; key?: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="text-sm font-bold text-slate-900">{r.dept}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{r.author} · {r.submittedAt}</div>
        </div>
        <div className="flex flex-wrap gap-1 justify-end">
          {(r.keywords || []).slice(0, 3).map((k) => <Pill key={k} tone="blue">{k}</Pill>)}
        </div>
      </div>
      {r.cases && (
        <div className="text-xs text-slate-600 mt-2 whitespace-pre-line line-clamp-3">{r.cases}</div>
      )}
      {r.blockers && (
        <div className="mt-2 text-xs text-red-600 bg-red-50 rounded px-2 py-1">⚠ {r.blockers}</div>
      )}
    </Card>
  );
}
