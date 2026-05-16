import * as React from "react";
import { useState, useMemo } from "react";
import { Plus, Check, Trash2, Clock, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Modal } from "../components/ui/Modal";
import { Pill } from "../components/ui/Pill";
import { cn } from "../lib/utils";
import { NOW } from "../lib/dateUtils";
import type { Handoff, HistoryCase } from "../lib/types";
import { SimilarCases } from "../components/SimilarCases";

interface Props {
  handoffs: Handoff[];
  setHandoffs: (h: Handoff[] | ((p: Handoff[]) => Handoff[])) => void;
  departments: { name: string; active: boolean }[];
  history: HistoryCase[];
}

type Filter = null | "待簽收" | "已簽收";
const today = () => NOW.toISOString().slice(0, 10);

export default function HandoffPage({ handoffs, setHandoffs, departments, history }: Props) {
  const [viewing, setViewing] = useState<Handoff | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<Filter>(null);

  const pending = useMemo(() =>
    handoffs.filter((h) => h.status === "待簽收").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  [handoffs]);
  const done = useMemo(() =>
    handoffs.filter((h) => h.status === "已簽收").sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
  [handoffs]);

  const filteredHandoffs =
    filter === "待簽收" ? pending
    : filter === "已簽收" ? done
    : null;

  const signOff = (id: string) => {
    setHandoffs((prev) => prev.map((h) => h.id === id ? { ...h, status: "已簽收" } : h));
    setViewing(null);
  };
  const deleteOne = (h: Handoff) => {
    if (!confirm(`確認刪除交接單「${h.title}」？`)) return;
    setHandoffs((prev) => prev.filter((x) => x.id !== h.id));
    setViewing(null);
  };

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-[11px] text-slate-400 tracking-[0.25em] font-bold mb-2">HANDOFF</div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            <span className="text-red-500">{pending.length}</span> 件交接待簽收
          </h1>
          <p className="text-sm text-slate-500 mt-1">點下方卡片查看詳細列表。</p>
        </div>
        <Button variant="primary" icon={<Plus size={14} />} onClick={() => setCreating(true)}>
          新增交接
        </Button>
      </div>

      {/* 兩大狀態卡 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <BigStat
          icon={<Clock size={18} className="text-red-500" />}
          label="待簽收"
          count={pending.length}
          color="red"
          active={filter === "待簽收"}
          onClick={() => setFilter(filter === "待簽收" ? null : "待簽收")}
        />
        <BigStat
          icon={<Check size={18} className="text-emerald-500" />}
          label="已簽收"
          count={done.length}
          color="emerald"
          active={filter === "已簽收"}
          onClick={() => setFilter(filter === "已簽收" ? null : "已簽收")}
        />
      </div>

      {/* 列表 */}
      <AnimatePresence>
        {filter && filteredHandoffs && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                {filter}（{filteredHandoffs.length} 件）
              </h3>
              <button onClick={() => setFilter(null)} className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1">
                <X size={14} /> 取消篩選
              </button>
            </div>
            {filteredHandoffs.length === 0 ? (
              <Card className="p-12 text-center text-slate-400 text-sm">沒有交接單</Card>
            ) : (
              <div className="space-y-2">
                {filteredHandoffs.slice(0, 30).map((h) =>
                  <HandoffRow key={h.id} h={h} onClick={() => setViewing(h)} pending={filter === "待簽收"} />,
                )}
                {filteredHandoffs.length > 30 && (
                  <div className="text-center text-xs text-slate-400 py-3">顯示前 30 筆，共 {filteredHandoffs.length} 筆</div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!filter && (
        <Card className="p-12 text-center bg-slate-50/50 border-dashed">
          <div className="text-slate-400 text-sm mb-1">尚未選擇分類</div>
          <div className="text-slate-400 text-xs">點上方「待簽收」或「已簽收」卡片查看交接單</div>
        </Card>
      )}

      {handoffs.length === 0 && (
        <Card className="p-12 text-center text-slate-400 mt-4">尚無交接單</Card>
      )}

      {/* 詳情 Modal */}
      <Modal open={!!viewing} onClose={() => setViewing(null)} title={viewing?.title}
        subtitle={viewing && `${viewing.from} → ${viewing.to} · 建立於 ${viewing.createdAt}`} maxWidth={580}>
        {viewing && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs">
              <Pill tone="blue">{viewing.from}</Pill>
              <span className="text-slate-400">→</span>
              <Pill tone="teal">{viewing.to}</Pill>
              <span className="ml-auto text-slate-400">{viewing.caseId}</span>
            </div>
            <DetailBlock label="案件背景" value={viewing.background} />
            <DetailBlock label="目前進度" value={viewing.progress} />
            <DetailBlock label="待辦事項" value={viewing.todo} />
            {viewing.attachments?.length > 0 && (
              <div>
                <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-2">附件</div>
                <div className="flex flex-wrap gap-2">
                  {viewing.attachments.map((a) => (
                    <span key={a} className="px-3 py-1.5 bg-slate-100 rounded-lg text-xs font-mono">{a}</span>
                  ))}
                </div>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <KV label="交接人" value={viewing.sender} />
              <KV label="接手人" value={viewing.receiver} />
            </div>

            {/* 智能案件推薦 */}
            <SimilarCases
              query={`${viewing.title} ${viewing.background || ""} ${viewing.caseId || ""}`}
              history={history}
              limit={3}
            />

            <div className="flex justify-between pt-3 border-t border-slate-100">
              <Button variant="ghost" size="sm" icon={<Trash2 size={12} />} onClick={() => deleteOne(viewing)}>刪除</Button>
              {viewing.status === "待簽收" && (
                <Button variant="success" icon={<Check size={14} />} onClick={() => signOff(viewing.id)}>簽收確認</Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      <HandoffFormModal open={creating} onClose={() => setCreating(false)}
        departments={departments.filter((d) => d.active && d.name !== "營運與管理層").map((d) => d.name)}
        onSave={(form) => {
          const newH: Handoff = {
            id: "h" + Date.now(),
            caseId: `C-${NOW.getFullYear()}-${Math.floor(Math.random() * 900) + 100}`,
            attachments: [],
            status: "待簽收",
            createdAt: today(),
            ...form,
          };
          setHandoffs((prev) => [newH, ...prev]);
          setCreating(false);
        }}
      />
    </div>
  );
}

function BigStat({ icon, label, count, color, active, onClick }: {
  icon: React.ReactNode; label: string; count: number; color: "red" | "emerald"; active?: boolean; onClick?: () => void;
}) {
  const styles = {
    red:     { border: "border-red-300",     ring: "ring-red-200",     text: "text-red-600" },
    emerald: { border: "border-emerald-300", ring: "ring-emerald-200", text: "text-emerald-600" },
  };
  const s = styles[color];
  return (
    <button onClick={onClick}
      className={cn(
        "p-8 bg-white rounded-2xl border transition-all text-left min-h-[180px] flex flex-col",
        active ? `${s.border} ring-2 ${s.ring} shadow-md` : "border-slate-200/60 hover:border-slate-300 hover:shadow-sm",
      )}>
      <div className="flex items-center gap-2 mb-4">
        {icon}
        <span className="text-sm font-bold text-slate-700">{label}</span>
      </div>
      <div className={cn("text-7xl font-black tracking-tighter mt-auto", s.text)}>{count}</div>
    </button>
  );
}

function HandoffRow({ h, onClick, pending }: { h: Handoff; onClick: () => void; pending?: boolean; key?: any }) {
  return (
    <motion.button whileHover={{ x: 2 }} onClick={onClick}
      className={cn(
        "w-full text-left p-4 bg-white rounded-xl border transition-all",
        pending ? "border-red-200 hover:border-red-300 hover:shadow-md" : "border-slate-200/60 hover:border-slate-300 hover:shadow-sm",
      )}>
      <div className="flex items-center gap-3">
        <div className={cn("w-2 h-2 rounded-full shrink-0", pending ? "bg-red-500" : "bg-emerald-500")} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-900 truncate">
            <Pill tone="blue">{h.from}</Pill>
            <span className="text-slate-300">→</span>
            <Pill tone="teal">{h.to}</Pill>
            <span className="truncate">{h.title}</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {h.sender} → {h.receiver} · {h.createdAt}
            {h.hoursOverdue && <span className="text-red-500 font-bold ml-2">逾期 {h.hoursOverdue} 小時</span>}
          </div>
        </div>
        <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
          pending ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-600")}>
          {h.status}
        </span>
      </div>
    </motion.button>
  );
}

function DetailBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-slate-400 font-bold tracking-wider mb-1.5">{label}</div>
      <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-700 leading-relaxed">{value}</div>
    </div>
  );
}

function KV({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-[10px] text-slate-400 font-bold mb-1">{label}</div>
      <div className="font-bold text-slate-900">{value}</div>
    </div>
  );
}

function HandoffFormModal({ open, onClose, departments, onSave }: {
  open: boolean; onClose: () => void; departments: string[];
  onSave: (data: Omit<Handoff, "id" | "caseId" | "attachments" | "status" | "createdAt">) => void;
}) {
  const [form, setForm] = useState({
    from: departments[0] || "", to: departments[1] || "",
    title: "", background: "", progress: "", todo: "", sender: "", receiver: "",
  });
  const valid = form.from && form.to && form.from !== form.to && form.title && form.background && form.todo && form.sender && form.receiver;

  return (
    <Modal open={open} onClose={onClose} title="新增交接單" maxWidth={580}>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Sel label="交接部門 (from)" value={form.from} onChange={(v) => setForm({ ...form, from: v })} options={departments} />
          <Sel label="接手部門 (to)"   value={form.to}   onChange={(v) => setForm({ ...form, to: v })}   options={departments} />
        </div>
        <Inp label="交接標題 *" value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="例：田宮電機 Pre-A 輪產業分析委託" />
        <Inp label="案件背景 *" value={form.background} onChange={(v) => setForm({ ...form, background: v })} rows={3} />
        <Inp label="目前進度 *" value={form.progress}   onChange={(v) => setForm({ ...form, progress: v })}   rows={2} />
        <Inp label="待辦事項 *" value={form.todo}       onChange={(v) => setForm({ ...form, todo: v })}       rows={2} />
        <div className="grid grid-cols-2 gap-3">
          <Inp label="交接人 *" value={form.sender}   onChange={(v) => setForm({ ...form, sender: v })} />
          <Inp label="接手人 *" value={form.receiver} onChange={(v) => setForm({ ...form, receiver: v })} />
        </div>
        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <Button variant="secondary" onClick={onClose}>取消</Button>
          <Button variant="primary" disabled={!valid} onClick={() => onSave(form as any)}>送出交接</Button>
        </div>
      </div>
    </Modal>
  );
}

function Inp({ label, value, onChange, placeholder, rows }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  const T = rows ? "textarea" : "input";
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 tracking-wide">{label}</label>
      {/* @ts-ignore */}
      <T value={value} rows={rows} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10" />
    </div>
  );
}

function Sel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-[11px] font-bold text-slate-600 mb-1.5 tracking-wide">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 cursor-pointer">
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
    </div>
  );
}
