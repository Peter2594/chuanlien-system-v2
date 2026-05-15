import { useMemo, useState } from "react";
import { AlertTriangle, Heart } from "lucide-react";
import { motion } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { cn } from "../lib/utils";
import { analyzeEmployeeLoad, type EmployeeLoad as EL } from "../lib/algorithms";
import type { Report, Handoff, Employee } from "../lib/types";

interface Props {
  reports: Report[];
  handoffs: Handoff[];
  employees: Employee[];
}

const LEVEL_STYLE = {
  overload: { label: "過載", color: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50" },
  high:     { label: "高",   color: "bg-amber-500",  text: "text-amber-700",  bg: "bg-amber-50" },
  normal:   { label: "正常", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  low:      { label: "低",   color: "bg-slate-400",  text: "text-slate-600",  bg: "bg-slate-50" },
  idle:     { label: "閒置", color: "bg-slate-300",  text: "text-slate-400",  bg: "bg-slate-50" },
} as const;

export default function EmployeeLoadPage({ reports, handoffs, employees }: Props) {
  const loads = useMemo(() => analyzeEmployeeLoad(reports, handoffs, employees), [reports, handoffs, employees]);
  const [selected, setSelected] = useState<EL | null>(null);

  const overload = loads.filter((l) => l.level === "overload");
  const totalScore = loads.reduce((s, l) => s + l.loadScore, 0);
  const avgScore = loads.length ? totalScore / loads.length : 0;

  // 依部門分組
  const byDept: Record<string, EL[]> = {};
  loads.forEach((l) => {
    if (!byDept[l.dept]) byDept[l.dept] = [];
    byDept[l.dept].push(l);
  });

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* 一句話總結 */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          目前 <span className="text-red-500">{overload.length}</span> 位員工過載
        </h1>
        <p className="text-sm text-slate-500">點擊任一人查看詳情。</p>
      </div>

      {/* 3 張 mini 統計 + 部門對比 chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-8">
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          <MiniStat label="過載人數" value={overload.length} color="text-red-500" hint={`占 ${Math.round((overload.length / loads.length) * 100)}%`} />
          <MiniStat label="平均負載" value={avgScore.toFixed(1)} color="text-slate-700" hint="全公司均值" />
          <MiniStat label="閒置人數" value={loads.filter((l) => l.level === "idle").length} color="text-slate-400" hint="本週無記錄" />
        </div>

        <Card className="p-5 lg:col-span-3">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 mb-3">各部門平均負載</div>
          <div className="h-32">
            <ResponsiveContainer>
              <BarChart data={Object.entries(byDept).map(([d, list]) => ({
                dept: d.replace("營運與管理層", "管理").replace("投資研究部", "投研").replace("業務開發部", "業開").replace("資產管理部", "資管"),
                avg: +(list.reduce((s, e) => s + e.loadScore, 0) / list.length).toFixed(1),
                count: list.length,
              }))}>
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }}
                  formatter={(v: any) => [`${v} 分`, "平均負載"]}
                />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]}>
                  {Object.values(byDept).map((list, idx) => {
                    const avg = list.reduce((s, e) => s + e.loadScore, 0) / list.length;
                    const color = avg >= 25 ? "#ef4444" : avg >= 15 ? "#f59e0b" : "#10b981";
                    return <Cell key={idx} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 員工列表 - 按部門分組 */}
      <div className="space-y-6">
        {Object.entries(byDept).map(([dept, members]) => (
          <div key={dept}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-700">{dept}</h3>
              <span className="text-xs text-slate-400">{members.length} 人</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {members.map((emp, i) => (
                <EmployeeCard key={emp.name} emp={emp} index={i} onClick={() => setSelected(emp)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 詳情 Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected && `${selected.dept} · ${selected.role}`}
        maxWidth={520}
      >
        {selected && (
          <div className="space-y-5">
            {/* 大數字 */}
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-slate-900">{selected.loadScore.toFixed(1)}</span>
              <span className="text-sm text-slate-500">加權分數</span>
              <span className={cn("ml-auto px-3 py-1 rounded-full text-xs font-bold", LEVEL_STYLE[selected.level].bg, LEVEL_STYLE[selected.level].text)}>
                P{selected.percentile} · {LEVEL_STYLE[selected.level].label}
              </span>
            </div>

            {/* 拆解 4 項 */}
            <div>
              <div className="text-[11px] text-slate-400 tracking-wider font-bold mb-3">負載組成</div>
              <div className="space-y-2">
                <BreakdownRow label="本人案件 (時間加權)" value={selected.timeWeightedCases} max={Math.max(20, selected.loadScore)} color="bg-blue-400" />
                <BreakdownRow label="自身卡點"          value={selected.blockerLoad}     max={Math.max(20, selected.loadScore)} color="bg-red-400" />
                <BreakdownRow label="被提及次數"        value={selected.mentionsWeighted} max={Math.max(20, selected.loadScore)} color="bg-purple-400" />
                <BreakdownRow label="交接單參與"        value={selected.handoffLoad}     max={Math.max(20, selected.loadScore)} color="bg-amber-400" />
              </div>
            </div>

            {/* 建議 */}
            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Heart size={14} className="text-pink-500" />
                建議行動
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selected.level === "overload" && "建議盡快指派 backup 或重新分流，避免單點失敗。可安排 1-on-1 了解情況。"}
                {selected.level === "high"     && "工作量較高，請主管留意。下週可詢問是否需要支援。"}
                {selected.level === "normal"   && "負荷在正常範圍內，維持目前節奏即可。"}
                {selected.level === "low"      && "可接更多案件，或安排培訓/跨部門協作。"}
                {selected.level === "idle"     && "本週沒有案件記錄。請確認是否需要重新分派工作。"}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function MiniStat({ label, value, color, hint }: { label: string; value: string | number; color: string; hint: string }) {
  return (
    <Card className="p-4">
      <div className="text-[10px] text-slate-400 tracking-wider font-bold mb-1.5">{label.toUpperCase()}</div>
      <div className={cn("text-3xl font-black tracking-tight", color)}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{hint}</div>
    </Card>
  );
}

function EmployeeCard({ emp, index, onClick }: { emp: EL; index: number; onClick: () => void; key?: any }) {
  const style = LEVEL_STYLE[emp.level];
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-xl border transition-all bg-white",
        emp.level === "overload" ? "border-red-200 hover:border-red-400 hover:shadow-md"
        : "border-slate-200/60 hover:border-slate-300 hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
          <div className="text-[11px] text-slate-500 truncate">{emp.role}</div>
        </div>
        {emp.level === "overload" && (
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn("text-2xl font-black", style.text)}>{emp.loadScore.toFixed(1)}</span>
        <span className="text-[10px] text-slate-400">分</span>
        <span className="ml-auto text-[10px] text-slate-500 font-mono">P{emp.percentile}</span>
      </div>

      {/* mini 進度條 */}
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (emp.loadScore / 30) * 100)}%` }}
          transition={{ duration: 0.6, delay: index * 0.05 }}
          className={cn("h-full rounded-full", style.color)}
        />
      </div>
    </motion.button>
  );
}

function BreakdownRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-32 text-slate-600 shrink-0">{label}</span>
      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5 }}
          className={cn("h-full rounded-full", color)}
        />
      </div>
      <span className="w-10 text-right font-mono font-bold text-slate-700">{value.toFixed(1)}</span>
    </div>
  );
}
