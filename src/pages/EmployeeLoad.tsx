import { useMemo, useState } from "react";
import { AlertTriangle, Heart, X, Calendar } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Card } from "../components/ui/Card";
import { Modal } from "../components/ui/Modal";
import { cn } from "../lib/utils";
import { analyzeEmployeeLoad, type EmployeeLoad as EL } from "../lib/algorithms";
import { NOW } from "../lib/dateUtils";
import type { Report, Handoff, Employee } from "../lib/types";

interface Props {
  reports: Report[];
  handoffs: Handoff[];
  employees: Employee[];
}

const LEVEL_STYLE = {
  overload: { label: "馬上解決", color: "bg-red-600",    text: "text-red-700",    bg: "bg-red-50" },
  high:     { label: "紅標示警", color: "bg-red-500",    text: "text-red-600",    bg: "bg-red-50" },
  normal:   { label: "正常", color: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  low:      { label: "低",   color: "bg-slate-400",  text: "text-slate-600",  bg: "bg-slate-50" },
  idle:     { label: "閒置", color: "bg-slate-300",  text: "text-slate-400",  bg: "bg-slate-50" },
} as const;

type FilterMode = null | "overload" | "idle" | { type: "dept"; name: string };

export default function EmployeeLoadPage({ reports, handoffs, employees }: Props) {
  const [selected, setSelected] = useState<EL | null>(null);
  const [filter, setFilter] = useState<FilterMode>(null);
  const [weeksAgo, setWeeksAgo] = useState(0); // 0 = 本週

  // asOf：依選定週次計算
  const asOf = useMemo(() => {
    const d = new Date(NOW);
    d.setDate(d.getDate() - weeksAgo * 7);
    return d;
  }, [weeksAgo]);

  const loads = useMemo(
    () => analyzeEmployeeLoad(reports, handoffs, employees, asOf),
    [reports, handoffs, employees, asOf],
  );

  // 上一週的負載作對比
  const prevAsOf = useMemo(() => {
    const d = new Date(asOf);
    d.setDate(d.getDate() - 7);
    return d;
  }, [asOf]);
  const prevLoads = useMemo(
    () => analyzeEmployeeLoad(reports, handoffs, employees, prevAsOf),
    [reports, handoffs, employees, prevAsOf],
  );
  const prevByName: Record<string, number> = {};
  prevLoads.forEach((l) => { prevByName[l.name] = l.loadScore; });

  const overload = loads.filter((l) => l.sigmaLevel === "warning" || l.sigmaLevel === "critical");
  const idle = loads.filter((l) => l.level === "idle");
  const totalScore = loads.reduce((s, l) => s + l.loadScore, 0);
  const avgScore = loads.length ? totalScore / loads.length : 0;

  // 依部門分組
  const byDept: Record<string, EL[]> = {};
  loads.forEach((l) => {
    if (!byDept[l.dept]) byDept[l.dept] = [];
    byDept[l.dept].push(l);
  });

  // 管理層用別的指標（決策數、簽核數），不適用員工負載維度，過濾掉
  const deptBarData = Object.entries(byDept)
    .filter(([d, list]) => d !== "營運與管理層" && list.length > 0)
    .map(([d, list]) => ({
      dept: d.replace("投資研究部", "投研").replace("業務開發部", "業開").replace("資產管理部", "資管"),
      fullDept: d,
      avg: +(list.reduce((s, e) => s + e.loadScore, 0) / list.length).toFixed(1),
      count: list.length,
    }));

  // 根據 filter 篩選出顯示的員工
  const filteredEmps: EL[] | null =
    filter === "overload" ? overload
    : filter === "idle" ? idle
    : filter && filter.type === "dept" ? byDept[filter.name] || []
    : loads;

  const filterTitle =
    filter === "overload" ? `負載示警員工 (${overload.length} 人)`
    : filter === "idle" ? `閒置員工 (${idle.length} 人)`
    : filter && filter.type === "dept" ? `${filter.name} (${byDept[filter.name]?.length || 0} 人)`
    : `全部員工 (${loads.length} 人)`;

  return (
    <div className="max-w-6xl mx-auto pb-8">
      {/* 一句話總結 */}
      <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            員工負載分析
          </h1>
          <p className="text-sm text-slate-500">
            可切換週次回看過去負載分布、點員工看 4 元素 breakdown（案件 / 卡點 / 提及 / 交接）。
          </p>
        </div>
        <div className="inline-flex items-center gap-2 text-xs text-slate-600">
          <Calendar size={14} className="text-slate-400" />
          <span>{weeksAgo === 0 ? "本週" : `${weeksAgo} 週前`}</span>
          <span className="text-slate-400">
            ({asOf.getFullYear()}/{String(asOf.getMonth() + 1).padStart(2, "0")}/{String(asOf.getDate()).padStart(2, "0")})
          </span>
        </div>
      </div>

      {/* 週次選擇器 */}
      <Card className="p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[11px] text-slate-400 font-bold tracking-wider">VIEW BY WEEK</span>
          <span className="text-[11px] text-slate-500">切換時點，看當週的負載分布</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: 12 }, (_, i) => i).map((w) => {
            const isSelected = weeksAgo === w;
            const label = w === 0 ? "本週" : w === 1 ? "上週" : `${w}週前`;
            return (
              <button
                key={w}
                onClick={() => { setWeeksAgo(w); setFilter(null); }}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold transition",
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
                )}
              >
                {label}
              </button>
            );
          })}
        </div>
      </Card>

      {/* 3 張 mini 統計 + 部門對比 chart */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-2 grid grid-cols-3 gap-3">
          <ClickableStat
            label="負載示警"
            value={overload.length}
            color="text-red-500"
            hint={loads.length > 0 ? `占 ${Math.round((overload.length / loads.length) * 100)}%` : "尚無資料"}
            active={filter === "overload"}
            onClick={() => setFilter(filter === "overload" ? null : "overload")}
          />
          <ClickableStat
            label="平均負載"
            value={avgScore.toFixed(1)}
            color="text-slate-700"
            hint="全公司均值"
            disabled
          />
          <ClickableStat
            label="閒置人數"
            value={idle.length}
            color="text-slate-400"
            hint={weeksAgo === 0 ? "本週無記錄" : "當週無記錄"}
            active={filter === "idle"}
            onClick={() => setFilter(filter === "idle" ? null : "idle")}
          />
        </div>

        <Card className="p-5 lg:col-span-3">
          <div className="text-[10px] font-bold tracking-wider text-slate-400 mb-3">
            各部門平均負載 <span className="text-slate-300 font-normal ml-1">· 點長條看員工</span>
          </div>
          <div className="h-32">
            <ResponsiveContainer>
              <BarChart data={deptBarData}>
                <XAxis dataKey="dept" tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }}
                  formatter={(v: any) => [`${v} 分`, "平均負載"]}
                />
                <Bar dataKey="avg" radius={[6, 6, 0, 0]} cursor="pointer"
                  onClick={(payload: any) => {
                    const dept = payload?.fullDept;
                    if (!dept) return;
                    setFilter((prev) =>
                      prev && typeof prev === "object" && prev.type === "dept" && prev.name === dept
                        ? null
                        : { type: "dept", name: dept },
                    );
                  }}>
                  {deptBarData.map((d, idx) => {
                    const isSelected = filter && typeof filter === "object" && filter.type === "dept" && filter.name === d.fullDept;
                    const color = d.avg >= 25 ? "#ef4444" : d.avg >= 15 ? "#f59e0b" : "#10b981";
                    return <Cell key={idx} fill={color} opacity={isSelected ? 1 : (filter && typeof filter === "object" && filter.type === "dept" ? 0.35 : 0.9)} stroke={isSelected ? "#1e293b" : "none"} strokeWidth={isSelected ? 2 : 0} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 員工列表；未篩選時顯示全部，點統計卡或部門條可縮小範圍 */}
      <AnimatePresence>
        {filteredEmps && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                {filter === "overload" && <AlertTriangle size={16} className="text-red-500" />}
                {filterTitle}
              </h3>
              {filter && (
                <button
                  onClick={() => setFilter(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1"
                >
                  <X size={14} /> 取消篩選
                </button>
              )}
            </div>

            {filteredEmps.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-sm">沒有符合的員工</Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredEmps.map((emp, i) => (
                  <EmployeeCard
                    key={emp.name}
                    emp={emp}
                    index={i}
                    onClick={() => setSelected(emp)}
                    prevScore={prevByName[emp.name]}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 員工詳情 Modal */}
      <Modal
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.name}
        subtitle={selected && `${selected.dept} · ${selected.role}`}
        maxWidth={520}
      >
        {selected && (
          <div className="space-y-5">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black text-slate-900">{selected.loadScore.toFixed(1)}</span>
              <span className="text-sm text-slate-500">加權分數</span>
              <span className={cn("ml-auto px-3 py-1 rounded-full text-xs font-bold", LEVEL_STYLE[selected.level].bg, LEVEL_STYLE[selected.level].text)}>
                P{selected.percentile} · {selected.zScore.toFixed(2)}σ · {LEVEL_STYLE[selected.level].label}
              </span>
            </div>

            <div>
              <div className="text-[11px] text-slate-400 tracking-wider font-bold mb-3">負載組成</div>
              <div className="space-y-2">
                <BreakdownRow label="本人案件 (時間加權)" value={selected.timeWeightedCases} max={Math.max(20, selected.loadScore)} color="bg-blue-400" />
                <BreakdownRow label="自身卡點"          value={selected.blockerLoad}     max={Math.max(20, selected.loadScore)} color="bg-red-400" />
                <BreakdownRow label="被提及次數"        value={selected.mentionsWeighted} max={Math.max(20, selected.loadScore)} color="bg-purple-400" />
                <BreakdownRow label="交接單參與"        value={selected.handoffLoad}     max={Math.max(20, selected.loadScore)} color="bg-amber-400" />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Heart size={14} className="text-pink-500" />
                建議行動
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {selected.level === "overload" && "已達 3 個標準差以上，請馬上解決：指派 backup、重新分流，並安排主管 1-on-1 確認瓶頸。"}
                {selected.level === "high"     && "已達 2 個標準差以上，需紅標示警。請主管留意並確認是否需要支援或分流。"}
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

function ClickableStat({ label, value, color, hint, active, disabled, onClick }: {
  label: string; value: string | number; color: string; hint: string;
  active?: boolean; disabled?: boolean; onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "text-left p-4 bg-white rounded-2xl border transition-all",
        disabled ? "border-slate-200/60 cursor-default" :
        active ? "border-red-300 ring-2 ring-red-100 shadow-md" :
        "border-slate-200/60 hover:border-slate-300 hover:shadow-sm cursor-pointer",
      )}
    >
      <div className="text-[10px] text-slate-400 tracking-wider font-bold mb-1.5">{label.toUpperCase()}</div>
      <div className={cn("text-3xl font-black tracking-tight", color)}>{value}</div>
      <div className="text-[11px] text-slate-500 mt-1">{hint}</div>
    </button>
  );
}

function EmployeeCard({ emp, index, onClick, prevScore }: { emp: EL; index: number; onClick: () => void; prevScore?: number; key?: any }) {
  const style = LEVEL_STYLE[emp.level];
  const delta = prevScore !== undefined ? +(emp.loadScore - prevScore).toFixed(1) : null;
  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={cn(
        "text-left p-4 rounded-xl border transition-all bg-white",
        emp.sigmaLevel !== "normal" ? "border-red-200 hover:border-red-400 hover:shadow-md"
        : "border-slate-200/60 hover:border-slate-300 hover:shadow-sm",
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{emp.name}</div>
          <div className="text-[11px] text-slate-500 truncate">{emp.role}</div>
        </div>
        {emp.sigmaLevel !== "normal" && (
          <AlertTriangle size={14} className="text-red-500 shrink-0" />
        )}
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className={cn("text-2xl font-black", style.text)}>{emp.loadScore.toFixed(1)}</span>
        <span className="text-[10px] text-slate-400">分</span>
        {delta !== null && delta !== 0 && (
          <span className={cn(
            "text-[10px] font-bold",
            delta > 0 ? "text-red-500" : "text-emerald-600",
          )}>
            {delta > 0 ? "↑" : "↓"} {Math.abs(delta).toFixed(1)}
          </span>
        )}
        <span className={cn("ml-auto text-[10px] font-mono", emp.sigmaLevel !== "normal" ? "text-red-600 font-bold" : "text-slate-500")}>
          P{emp.percentile} · {emp.zScore.toFixed(2)}σ
        </span>
      </div>

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
