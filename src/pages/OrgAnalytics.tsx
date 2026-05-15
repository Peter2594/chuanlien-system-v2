import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Card } from "../components/ui/Card";
import { Pill } from "../components/ui/Pill";
import { analyzeDeptNetwork } from "../lib/algorithms";
import { displayWeek } from "../lib/dateUtils";
import type { Report, Handoff, Department } from "../lib/types";

interface Props {
  reports: Report[];
  handoffs: Handoff[];
  departments: Department[];
}

export default function OrgAnalyticsPage({ reports, handoffs, departments }: Props) {
  const network = useMemo(() => analyzeDeptNetwork(reports, departments, handoffs), [reports, handoffs, departments]);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);

  // 該部門相關的真實資料
  const deptDetails = useMemo(() => {
    if (!selectedDept) return null;
    const deptObj = departments.find((d) => d.name === selectedDept);
    const aliases = [selectedDept, deptObj?.shortName].filter(Boolean) as string[];

    // 該部門發出 / 接收的交接
    const out = handoffs.filter((h) => aliases.includes(h.from)).slice(0, 6);
    const inc = handoffs.filter((h) => aliases.includes(h.to)).slice(0, 6);

    // 該部門最近的週報
    const deptReports = reports
      .filter((r) => r.dept === selectedDept)
      .sort((a, b) => String(b.week).localeCompare(String(a.week)))
      .slice(0, 4);

    return { out, inc, deptReports };
  }, [selectedDept, handoffs, reports, departments]);

  // 部門位置（等距）
  const W = 600, H = 380;
  const cx = W / 2, cy = H / 2 + 10;
  const R = 130;
  const positions: Record<string, { x: number; y: number }> = {};
  network.depts.forEach((d, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI / network.depts.length);
    positions[d] = { x: cx + R * Math.cos(angle), y: cy + R * Math.sin(angle) };
  });
  const maxWeight = Math.max(...network.edges.map((e) => e.weight), 1);

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="mb-8">
        <div className="text-[11px] text-violet-500 tracking-[0.25em] font-bold mb-2">ORG NETWORK</div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          部門互動網絡
        </h1>
        <p className="text-sm text-slate-500">
          從週報文字（+1）和交接單（+2）累計每對部門的協作次數。線越粗 = 互動越多。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* SVG 網絡圖 */}
        <Card className="lg:col-span-2 p-5">
          <div className="text-xs font-bold text-slate-700 mb-3">協作網絡圖</div>
          <div className="bg-slate-50 rounded-xl p-3">
            <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
              <defs>
                <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#8b5cf6" />
                </marker>
              </defs>

              {/* 連線 */}
              {network.edges.map((e, i) => {
                const from = positions[e.from], to = positions[e.to];
                if (!from || !to) return null;
                const dx = to.x - from.x, dy = to.y - from.y;
                const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                const offset = 42 / dist;
                const reverse = network.edges.find((re) => re.from === e.to && re.to === e.from);
                const curve = reverse ? 18 : 0;
                const mx = (from.x + to.x) / 2 + (dy / dist) * curve;
                const my = (from.y + to.y) / 2 - (dx / dist) * curve;
                const sx = from.x + dx * offset, sy = from.y + dy * offset;
                const ex = to.x - dx * offset, ey = to.y - dy * offset;
                const sw = 1 + (e.weight / maxWeight) * 5;
                const op = 0.35 + (e.weight / maxWeight) * 0.55;
                return (
                  <motion.g key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <path d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`}
                      fill="none" stroke="#8b5cf6" strokeWidth={sw} strokeOpacity={op}
                      markerEnd="url(#arrow)" />
                    <text x={mx} y={my} fill="#7c3aed" fontSize="11" fontWeight="700"
                      textAnchor="middle" dominantBaseline="middle" style={{ pointerEvents: "none" }}>
                      <tspan style={{ paintOrder: "stroke", stroke: "white", strokeWidth: 4, strokeLinejoin: "round" }}>
                        {e.weight}
                      </tspan>
                    </text>
                  </motion.g>
                );
              })}

              {/* 節點 */}
              {network.depts.map((d, i) => {
                const p = positions[d];
                const s = network.stats[d];
                const total = s.outgoing + s.incoming;
                const r = 38 + Math.min(15, total * 1.2);
                const isSelected = selectedDept === d;
                return (
                  <motion.g key={d} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => setSelectedDept(isSelected ? null : d)}
                    style={{ cursor: "pointer" }}>
                    {isSelected && (
                      <circle cx={p.x} cy={p.y} r={r + 7} fill="none" stroke="#8b5cf6" strokeWidth="3" strokeDasharray="6 3" opacity="0.8" />
                    )}
                    <circle cx={p.x} cy={p.y} r={r}
                      fill={isSelected ? "#8b5cf6" : "#1e293b"}
                      fillOpacity="0.92" stroke="white" strokeWidth="3" />
                    <text x={p.x} y={p.y - 4} fill="white" fontSize="13" fontWeight="700"
                      textAnchor="middle" style={{ pointerEvents: "none" }}>
                      {d.replace("部", "")}
                    </text>
                    <text x={p.x} y={p.y + 12} fill="white" fontSize="10" fontWeight="400"
                      textAnchor="middle" opacity="0.8" style={{ pointerEvents: "none" }}>
                      ↑{s.outgoing} ↓{s.incoming}
                    </text>
                  </motion.g>
                );
              })}
            </svg>
            <div className="text-[10px] text-center text-slate-400 mt-2">
              節點大小 = 協作熱度 · 線條粗細 = 互動次數 · <strong>點節點看實際週報與交接</strong>
            </div>
          </div>
        </Card>

        {/* 部門列表 */}
        <Card className="p-5">
          <div className="text-xs font-bold text-slate-700 mb-3">各部門協作熱度</div>
          <div className="space-y-2">
            {network.depts.map((d) => {
              const s = network.stats[d];
              const total = s.outgoing + s.incoming;
              const tone = total >= 12 ? "bg-red-50 text-red-700"
                         : total >= 6  ? "bg-amber-50 text-amber-700"
                         : "bg-emerald-50 text-emerald-700";
              return (
                <div key={d} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-bold text-slate-900">{d}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${tone}`}>{total} 次</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    主動請求 {s.outgoing} 次 · 被請求 {s.incoming} 次
                  </div>
                </div>
              );
            })}
          </div>
          {network.depts.length > 0 && (
            <div className="mt-4 p-3 bg-violet-50 rounded-lg text-[11px] text-violet-700 leading-relaxed">
              <strong>💡 解讀：</strong>
              {(() => {
                const sorted = [...network.depts].sort((a, b) =>
                  (network.stats[b].outgoing + network.stats[b].incoming) -
                  (network.stats[a].outgoing + network.stats[a].incoming),
                );
                return `${sorted[0]} 是最活躍的協作節點。`;
              })()}
            </div>
          )}
        </Card>
      </div>

      {/* === 選中部門的詳細資料 === */}
      <AnimatePresence>
        {selectedDept && deptDetails && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-6"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[10px] text-violet-500 font-bold tracking-wider mb-1">SELECTED DEPT</div>
                  <h3 className="text-lg font-bold text-slate-900">{selectedDept} · 協作詳情</h3>
                </div>
                <button onClick={() => setSelectedDept(null)} className="text-slate-400 hover:text-slate-700 text-xl">✕</button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 主動發出的交接 */}
                <div>
                  <div className="text-[10px] text-blue-600 font-bold tracking-wider mb-3">
                    ↑ 主動發出的交接（{deptDetails.out.length}）
                  </div>
                  {deptDetails.out.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">無記錄</div>
                  ) : (
                    <div className="space-y-2">
                      {deptDetails.out.map((h) => (
                        <div key={h.id} className="bg-slate-50 rounded-lg p-2.5 text-xs border-l-2 border-blue-400">
                          <div className="font-bold text-slate-800 mb-1 truncate">{h.title}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Pill tone="blue">→ {h.to}</Pill>
                            <span>{h.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 被請求的交接 */}
                <div>
                  <div className="text-[10px] text-emerald-600 font-bold tracking-wider mb-3">
                    ↓ 被其他部門請求（{deptDetails.inc.length}）
                  </div>
                  {deptDetails.inc.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">無記錄</div>
                  ) : (
                    <div className="space-y-2">
                      {deptDetails.inc.map((h) => (
                        <div key={h.id} className="bg-slate-50 rounded-lg p-2.5 text-xs border-l-2 border-emerald-400">
                          <div className="font-bold text-slate-800 mb-1 truncate">{h.title}</div>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <Pill tone="teal">← {h.from}</Pill>
                            <span>{h.createdAt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 最近週報 */}
                <div>
                  <div className="text-[10px] text-violet-600 font-bold tracking-wider mb-3">
                    📝 最近週報摘要（{deptDetails.deptReports.length}）
                  </div>
                  {deptDetails.deptReports.length === 0 ? (
                    <div className="text-xs text-slate-400 py-2">無記錄</div>
                  ) : (
                    <div className="space-y-2">
                      {deptDetails.deptReports.map((r) => (
                        <div key={r.id} className="bg-slate-50 rounded-lg p-2.5 text-xs border-l-2 border-violet-400">
                          <div className="font-bold text-slate-800 mb-1 text-[11px]">
                            {displayWeek(r.week)} · {r.author}
                          </div>
                          <div className="text-[10px] text-slate-600 line-clamp-2 leading-relaxed">
                            {(r.cases || "").split("\n")[0].replace(/^[•\-\s]+/, "")}
                          </div>
                          {(r.keywords || []).length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {r.keywords.slice(0, 3).map((k) => <Pill key={k} tone="purple">{k}</Pill>)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
