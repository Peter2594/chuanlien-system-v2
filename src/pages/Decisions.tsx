import { useState, useMemo } from "react";
import { Plus, Check, Trash2, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { cn } from "../lib/utils";
import { NOW } from "../lib/dateUtils";
import type { Decision, Report, Handoff, Blocker, Employee, HistoryCase, Department } from "../lib/types";
import type { UserProfile } from "../lib/firebase";
import { analyzeDecisionImpact, computeLeaderScores } from "../lib/decisionImpact";
import { isDecisionOverdueAt, isDecisionInProgressAt, isDecisionCompletedAt } from "../lib/algorithms";

interface Props {
  decisions: Decision[];
  setDecisions: (d: Decision[] | ((p: Decision[]) => Decision[])) => void;
  departments: Department[];
  userProfile: UserProfile | null;
  reports: Report[];
  handoffs: Handoff[];
  blockers: Blocker[];
  employees: Employee[];
  history: HistoryCase[];
}

const STATUS_STYLE = {
  逾期:   { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-500",     ring: "ring-red-200",     border: "border-red-300",     hex: "#ef4444" },
  執行中: { bg: "bg-blue-50",    text: "text-blue-600",    dot: "bg-blue-500",    ring: "ring-blue-200",    border: "border-blue-300",    hex: "#3b82f6" },
  已完成: { bg: "bg-emerald-50", text: "text-emerald-600", dot: "bg-emerald-500", ring: "ring-emerald-200", border: "border-emerald-300", hex: "#10b981" },
};

type Filter = null | "逾期" | "執行中" | "已完成" | { type: "dept"; name: string };
const today = () => NOW.toISOString().slice(0, 10);

export default function DecisionsPage({
  decisions, setDecisions, departments, userProfile,
  reports, handoffs, blockers, employees, history,
}: Props) {
  const [viewing, setViewing] = useState<Decision | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Decision | null>(null);
  const [filter, setFilter] = useState<Filter>(null);

  // 用動態 helper 判定狀態（避免 status 欄位與 dueDate 不一致）
  const overdue    = decisions.filter((d) => isDecisionOverdueAt(d, NOW));
  const inProgress = decisions.filter((d) => isDecisionInProgressAt(d, NOW));
  const done       = decisions.filter((d) => isDecisionCompletedAt(d, NOW));

  const deptDistribution = useMemo(() => {
    const m: Record<string, number> = {};
    decisions.forEach((d) => {
      const short = d.assignedDept.replace("營運與管理層", "管理").replace("投資研究部", "投研").replace("業務開發部", "業開").replace("資產管理部", "資管");
      m[short] = (m[short] || 0) + 1;
    });
    return Object.entries(m).map(([dept, count]) => ({ dept, count, fullDept: dept }));
  }, [decisions]);

  // 取得 filter 結果
  const filteredDecisions =
    filter === "逾期" ? overdue
    : filter === "執行中" ? inProgress
    : filter === "已完成" ? done
    : filter && typeof filter === "object" && filter.type === "dept"
      ? decisions.filter((d) => {
          const short = d.assignedDept.replace("營運與管理層", "管理").replace("投資研究部", "投研").replace("業務開發部", "業開").replace("資產管理部", "資管");
          return short === filter.name;
        })
      : null;

  const filterTitle =
    filter === "逾期" ? `逾期決策（${overdue.length} 件）·需優先處理`
    : filter === "執行中" ? `執行中（${inProgress.length} 件）`
    : filter === "已完成" ? `已完成（${done.length} 件）`
    : filter && typeof filter === "object" ? `${filter.name} 部門（${filteredDecisions?.length || 0} 件）`
    : "";

  const markDone = (id: string) => {
    setDecisions((prev) => prev.map((d) => d.id === id ? { ...d, status: "已完成", completedAt: today() } : d));
    setViewing(null);
  };
  const deleteOne = (d: Decision) => {
    if (!confirm(`確認刪除決策「${d.title}」？`)) return;
    setDecisions((prev) => prev.filter((x) => x.id !== d.id));
    setViewing(null);
  };

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[11px] text-slate-400 tracking-[0.25em] font-bold mb-2">DECISION LOG</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            還有 <span className="text-blue-500">{inProgress.length + overdue.length}</span> 件決策待完成
          </h1>
          <p className="text-sm text-slate-500 mt-1">點數據卡片看對應決策。</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setCreating(true)}>
          新增決策
        </Button>
      </div>

      {/* 主視覺：左 3 大卡 + 右 2 張圖 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        {/* 左側 3 大狀態卡 */}
        <div className="lg:col-span-3 grid grid-cols-3 gap-3">
          <BigStatCard
            label="逾期"
            count={overdue.length}
            status="逾期"
            active={filter === "逾期"}
            onClick={() => setFilter(filter === "逾期" ? null : "逾期")}
          />
          <BigStatCard
            label="執行中"
            count={inProgress.length}
            status="執行中"
            active={filter === "執行中"}
            onClick={() => setFilter(filter === "執行中" ? null : "執行中")}
          />
          <BigStatCard
            label="已完成"
            count={done.length}
            status="已完成"
            active={filter === "已完成"}
            onClick={() => setFilter(filter === "已完成" ? null : "已完成")}
          />
        </div>

        {/* 右側：上 donut, 下 bar */}
        <div className="lg:col-span-2 flex flex-col gap-3">
          <Card className="p-4 flex items-center gap-3 flex-1">
            <div className="w-24 h-24 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: "執行中", value: inProgress.length },
                    { name: "逾期",   value: overdue.length },
                    { name: "已完成", value: done.length },
                  ]} innerRadius={28} outerRadius={46} dataKey="value" startAngle={90} endAngle={-270} stroke="none">
                    <Cell fill="#3b82f6" />
                    <Cell fill="#ef4444" />
                    <Cell fill="#10b981" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="text-xs space-y-1.5 flex-1">
              <div className="text-[9px] font-bold tracking-wider text-slate-400 mb-1.5">STATUS</div>
              <Legend dot="bg-blue-500"    label="執行中" value={inProgress.length} />
              <Legend dot="bg-red-500"     label="逾期"   value={overdue.length} />
              <Legend dot="bg-emerald-500" label="已完成" value={done.length} />
            </div>
          </Card>

          <Card className="p-4">
            <div className="text-[9px] font-bold tracking-wider text-slate-400 mb-2">
              指派部門分布 <span className="text-slate-300 font-normal">· 點長條看決策</span>
            </div>
            <div className="h-20">
              <ResponsiveContainer>
                <BarChart data={deptDistribution}>
                  <XAxis dataKey="dept" tick={{ fontSize: 9, fill: "#64748b" }} axisLine={false} tickLine={false} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)", fontSize: 11 }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} cursor="pointer"
                    onClick={(payload: any) => {
                      const d = payload?.fullDept;
                      if (!d) return;
                      setFilter((prev) =>
                        prev && typeof prev === "object" && prev.type === "dept" && prev.name === d
                          ? null
                          : { type: "dept", name: d },
                      );
                    }}>
                    {deptDistribution.map((d, i) => {
                      const isSel = filter && typeof filter === "object" && filter.type === "dept" && filter.name === d.fullDept;
                      const isDeptMode = filter && typeof filter === "object" && filter.type === "dept";
                      return <Cell key={i} fill="#3b82f6" opacity={isSel ? 1 : (isDeptMode ? 0.3 : 0.85)} stroke={isSel ? "#1e293b" : "none"} strokeWidth={isSel ? 2 : 0} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* 篩選結果 */}
      <AnimatePresence>
        {filter && filteredDecisions && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{filterTitle}</h3>
              <button onClick={() => setFilter(null)} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                <X size={14} /> 取消篩選
              </button>
            </div>
            {filteredDecisions.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-sm">沒有符合的決策</Card>
            ) : (
              <div className="space-y-2">
                {filteredDecisions.map((d) => (
                  <DecisionRow key={d.id} d={d} onClick={() => setViewing(d)} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Leader Scorecard - 決策成效排行 */}
      {!filter && done.length > 0 && (() => {
        const scores = computeLeaderScores({
          reports, handoffs, decisions, blockers, employees, departments, history,
        }).filter((s) => s.completedDecisions > 0);
        if (scores.length === 0) return null;
        const top = scores[0];
        return (
          <div className="mb-6">
            <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-bold text-slate-900">決策成效排行</h3>
                <span className="text-xs text-slate-400">依「Cohort-adjusted 影響」排序</span>
              </div>
              <div className="text-[10px] text-violet-600 font-bold">
                ✨ 已扣除同期基準漂移
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {scores.slice(0, 6).map((s, i) => {
                const tone = s.avgImpactScore >= 3 ? { color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200" }
                            : s.avgImpactScore <= -3 ? { color: "text-red-600", bg: "bg-red-50", border: "border-red-200" }
                            : { color: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200" };
                const isTop = s.decidedBy === top.decidedBy && s.avgImpactScore > 0;
                return (
                  <div key={s.decidedBy}
                    className={cn(
                      "p-4 rounded-2xl border bg-white relative",
                      isTop ? "border-emerald-300 shadow-sm" : "border-slate-200/70",
                    )}
                  >
                    {isTop && (
                      <span className="absolute -top-2 -right-2 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
                        🏆 #1
                      </span>
                    )}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="text-sm font-bold text-slate-900">{s.decidedBy}</span>
                      <span className={cn("text-[10px] font-bold tracking-wide px-1.5 py-0.5 rounded", tone.bg, tone.color)}>
                        #{i + 1}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className={cn("text-3xl font-black leading-none", tone.color)}>
                        {s.avgImpactScore > 0 ? "+" : ""}{s.avgImpactScore.toFixed(1)}
                      </span>
                      <span className="text-[10px] text-slate-400">平均成效分</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1 text-[10px]">
                      <div className="text-center bg-emerald-50 rounded py-1.5">
                        <div className="font-black text-emerald-600">{s.positiveCount}</div>
                        <div className="text-emerald-700 mt-0.5">正面</div>
                      </div>
                      <div className="text-center bg-slate-100 rounded py-1.5">
                        <div className="font-black text-slate-600">{s.neutralCount}</div>
                        <div className="text-slate-500 mt-0.5">中性</div>
                      </div>
                      <div className="text-center bg-red-50 rounded py-1.5">
                        <div className="font-black text-red-600">{s.negativeCount}</div>
                        <div className="text-red-700 mt-0.5">負面</div>
                      </div>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-2 text-center">
                      {s.completedDecisions} / {s.totalDecisions} 已完成
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* 預設提示 */}
      {!filter && (
        <Card className="p-12 text-center bg-slate-50/50 border-dashed">
          <div className="text-slate-400 text-sm mb-1">尚未選擇篩選條件</div>
          <div className="text-slate-400 text-xs">點上方狀態卡片或部門條來查看決策</div>
        </Card>
      )}

      {decisions.length === 0 && (
        <Card className="p-12 text-center text-slate-400 mt-4">尚無決策記錄</Card>
      )}

      {/* 詳情 Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title}
        subtitle={viewing && `${viewing.decidedBy} · 決議於 ${viewing.decidedAt}`} maxWidth={580}>
        {viewing && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm leading-relaxed text-slate-700">{viewing.content}</div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <KV label="指派部門" value={viewing.assignedDept} />
              <KV label="預期完成" value={viewing.dueDate} />
              <KV label="目前狀態" value={viewing.status} status={viewing.status} />
              <KV label={viewing.completedAt ? "完成日" : "關聯案件"} value={viewing.completedAt || (viewing.linkedCases?.join(", ") || "—")} />
            </div>
            {viewing.notes && (
              <div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">備註</div>
                <div className="text-xs text-slate-600 bg-blue-50/50 rounded-lg p-3 leading-relaxed">{viewing.notes}</div>
              </div>
            )}

            {/* 決策成效（Decision Impact） — 僅已完成決策有 */}
            {viewing.status === "已完成" && viewing.completedAt && (() => {
              const impact = analyzeDecisionImpact(viewing, {
                reports, handoffs, decisions, blockers, employees, departments, history,
              });
              if (!impact) return null;
              const tone = impact.verdict === "正面" ? { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "📈" }
                         : impact.verdict === "負面" ? { bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: "📉" }
                         : { bg: "bg-slate-50", text: "text-slate-700", border: "border-slate-200", icon: "→" };
              return (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="text-[10px] text-slate-400 font-bold tracking-wider">
                      決策成效 · 對組織健康度影響
                    </div>
                    {impact.insufficient ? (
                      <div className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        ⏳ 追蹤中
                      </div>
                    ) : (
                      <div className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", tone.bg, tone.text)}>
                        {tone.icon} {impact.verdict}
                      </div>
                    )}
                  </div>
                  {impact.insufficient && (
                    <div className="mb-1.5 text-[10px] text-slate-500 px-2.5 py-1.5 rounded bg-slate-50 border border-slate-200">
                      完成才 {impact.daysSinceCompleted} 天，需累積 28 天才能算最終成效 — 目前為暫評
                    </div>
                  )}
                  <div className={cn("rounded-lg p-3 border", tone.bg, tone.border)}>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className={cn("text-3xl font-black leading-none", tone.text)}>
                        {impact.adjustedDelta > 0 ? "+" : ""}{impact.adjustedDelta.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-500">校正後成效</span>
                      <span className="ml-auto text-[10px] text-slate-400">
                        {impact.before.overall.toFixed(0)} → {impact.after.overall.toFixed(0)}
                      </span>
                    </div>
                    {/* Cohort Adjustment 分解 */}
                    <div className="mb-3 text-[10px] text-slate-500 bg-white/60 rounded px-2.5 py-1.5 border border-slate-200/60">
                      <div className="flex justify-between">
                        <span>原始 delta</span>
                        <span className="font-mono font-bold text-slate-700">
                          {impact.deltaOverall > 0 ? "+" : ""}{impact.deltaOverall.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-0.5">
                        <span>− 同期基準漂移</span>
                        <span className="font-mono font-bold text-violet-600">
                          {impact.baselineDrift > 0 ? "+" : ""}{impact.baselineDrift.toFixed(1)}
                        </span>
                      </div>
                      <div className="flex justify-between mt-0.5 pt-0.5 border-t border-slate-200/60">
                        <span className="font-bold">= 決策實際成效</span>
                        <span className={cn("font-mono font-bold", tone.text)}>
                          {impact.adjustedDelta > 0 ? "+" : ""}{impact.adjustedDelta.toFixed(1)}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1 text-[11px]">
                      {Object.entries(impact.deltaByDimension)
                        .filter(([, v]) => Math.abs(v) >= 1)
                        .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
                        .slice(0, 3)
                        .map(([key, v]) => {
                          const label = ({
                            blockerHealth: "卡點健康",
                            decisionTimeliness: "決策及時",
                            handoffSmoothness: "交接流暢",
                            loadBalance: "負載均衡",
                            crossDept: "部門協作",
                            reportQuality: "週報品質",
                          } as Record<string, string>)[key];
                          return (
                            <div key={key} className="flex items-center justify-between">
                              <span className="text-slate-600">{label}</span>
                              <span className={cn("font-bold font-mono", v > 0 ? "text-emerald-600" : "text-red-600")}>
                                {v > 0 ? "+" : ""}{v.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>
              );
            })()}
            <div className="flex justify-between pt-3 border-t border-slate-100">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setEditing(viewing); setViewing(null); }}>編輯</Button>
                <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => deleteOne(viewing)}>刪除</Button>
              </div>
              {viewing.status !== "已完成" && (
                <Button variant="success" icon={<Check size={14} />} onClick={() => markDone(viewing.id)}>標記為已完成</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <DecisionFormModal
        open={creating || !!editing}
        onClose={() => { setCreating(false); setEditing(null); }}
        existing={editing}
        departments={departments.filter((d) => d.active).map((d) => d.name)}
        onSave={(form) => {
          if (editing) {
            setDecisions((prev) => prev.map((x) => x.id === editing.id ? { ...x, ...form } : x));
          } else {
            const newD: Decision = { id: "d" + Date.now(), decidedAt: today(), status: "執行中", linkedCases: [], ...form };
            setDecisions((prev) => [newD, ...prev]);
          }
          setCreating(false); setEditing(null);
        }}
        userProfile={userProfile}
      />
    </div>
  );
}

function BigStatCard({ label, count, status, active, onClick }: {
  label: string; count: number; status: keyof typeof STATUS_STYLE; active?: boolean; onClick?: () => void;
}) {
  const s = STATUS_STYLE[status];
  return (
    <button
      onClick={onClick}
      className={cn(
        "text-left p-6 bg-white rounded-2xl border transition-all min-h-[180px] flex flex-col",
        active ? `${s.border} ring-2 ${s.ring} shadow-md` : "border-slate-200/60 hover:border-slate-300 hover:shadow-sm",
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-2 h-2 rounded-full", s.dot)} />
        <div className="text-xs text-slate-500 font-bold tracking-wide">{label}</div>
      </div>
      <div className={cn("text-6xl font-black tracking-tighter mt-auto", s.text)}>{count}</div>
    </button>
  );
}

function Legend({ dot, label, value }: { dot: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-2">
      <span className={cn("w-2 h-2 rounded-full", dot)} />
      <span className="text-slate-500 w-10">{label}</span>
      <span className="font-bold text-slate-900">{value}</span>
    </div>
  );
}

function DecisionRow({ d, onClick }: { d: Decision; onClick: () => void; key?: any }) {
  const s = STATUS_STYLE[d.status];
  return (
    <motion.button whileHover={{ x: 2 }} onClick={onClick}
      className="w-full text-left p-4 bg-white rounded-xl border border-slate-200/60 hover:border-slate-300 hover:shadow-sm transition-all">
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full shrink-0", s.dot)} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-slate-900 truncate">{d.title}</div>
          <div className="text-[11px] text-slate-500 mt-0.5 truncate">
            {d.decidedBy} · 指派 {d.assignedDept} · 期限 {d.dueDate}
          </div>
        </div>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0", s.bg, s.text)}>{d.status}</span>
      </div>
    </motion.button>
  );
}

function KV({ label, value, status }: { label: string; value: string; status?: keyof typeof STATUS_STYLE }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-[10px] text-slate-400 font-bold tracking-wide mb-1">{label}</div>
      <div className={cn("font-bold text-slate-900", status && STATUS_STYLE[status].text)}>{value}</div>
    </div>
  );
}

function DecisionFormModal({ open, onClose, existing, departments, onSave }: {
  open: boolean; onClose: () => void; existing: Decision | null; departments: string[];
  onSave: (data: Omit<Decision, "id">) => void; userProfile: UserProfile | null;
}) {
  const [form, setForm] = useState({
    title: existing?.title || "",
    content: existing?.content || "",
    decidedBy: existing?.decidedBy || "董事會",
    assignedDept: existing?.assignedDept || departments[0] || "",
    dueDate: existing?.dueDate || "",
    notes: existing?.notes || "",
  });
  const valid = form.title.trim() && form.content.trim() && form.dueDate.trim();

  return (
    <Modal open={open} onClose={onClose} title={existing ? "編輯決策" : "新增決策"} maxWidth={560}>
      <div className="space-y-4">
        <Field label="決策標題 *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="例：田宮電機 Pre-A 輪投資金額上限" />
        <Field label="決議內容 *" value={form.content} onChange={(v) => setForm({ ...form, content: v })} placeholder="具體決議內容與條件" rows={3} />
        <div className="grid grid-cols-2 gap-3">
          <Select label="決議單位" value={form.decidedBy} onChange={(v) => setForm({ ...form, decidedBy: v })} options={["董事會", "投資委員會", "營運會議"]} />
          <Select label="指派執行" value={form.assignedDept} onChange={(v) => setForm({ ...form, assignedDept: v })} options={departments} />
        </div>
        <Field label="預期完成日 *" type="date" value={form.dueDate} onChange={(v) => setForm({ ...form, dueDate: v })} />
        <Field label="備註" value={form.notes} onChange={(v) => setForm({ ...form, notes: v })} placeholder="(選填)" rows={2} />
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" disabled={!valid}
            onClick={() => onSave({
              ...form,
              decidedAt: existing?.decidedAt || today(),
              status: existing?.status || "執行中",
              linkedCases: existing?.linkedCases || [],
            })}>
            {existing ? "更新" : "記錄決策"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", rows }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; rows?: number;
}) {
  const Tag = rows ? "textarea" : "input";
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 tracking-wide">{label}</label>
      <Tag
        // @ts-ignore
        type={type} value={value} rows={rows}
        onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
      />
    </div>
  );
}

function Select({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 tracking-wide">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer">
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
