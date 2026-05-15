import * as React from "react";
import { Clock, Send } from "lucide-react";
import { Card } from "../components/ui/Card";
import { CURRENT_WEEK_LABEL } from "../lib/dateUtils";
import type { Report, Handoff } from "../lib/types";

interface Props {
  reports: Report[];
  handoffs: Handoff[];
}

export default function LineBotPage({ reports, handoffs }: Props) {
  const unsigned = handoffs.filter((h) => h.status === "待簽收");
  const thisWeekReports = reports.filter((r) => r.week === CURRENT_WEEK_LABEL);
  const missing = ["投資研究部", "業務開發部", "資產管理部"].filter(
    (d) => !thisWeekReports.find((r) => r.dept === d),
  );

  return (
    <div className="max-w-5xl mx-auto pb-8">
      <div className="mb-8">
        <div className="text-[11px] text-emerald-500 tracking-[0.25em] font-bold mb-2">LINE BOT</div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight mb-2">
          LINE Bot 推播預覽
        </h1>
        <p className="text-sm text-slate-500">
          系統將自動推播訊息給對應使用者（預覽根據當下系統狀態動態生成）
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
        {/* 手機畫面 */}
        <div className="bg-[#8CA8C4] rounded-3xl overflow-hidden shadow-xl">
          <div className="bg-[#5A7894] px-4 py-3 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
              串
            </div>
            <div>
              <div className="text-white text-sm font-bold">串連 · 跨部門小幫手</div>
              <div className="text-white/70 text-[10px]">官方帳號 · 在線中</div>
            </div>
          </div>

          <div className="p-3 space-y-2.5 min-h-[400px]">
            {missing.length > 0 && (
              <>
                <div className="text-center text-[10px] text-white/90">週五 15:00</div>
                <BotMsg>
                  📝 提醒：<strong>{missing.join("、")}</strong>尚未繳交本週週報，請於週日下班前完成。
                  <BotAction>→ 點此快速填寫</BotAction>
                </BotMsg>
              </>
            )}

            <div className="text-center text-[10px] text-white/90 mt-2">週一 09:00</div>
            <BotMsg>
              <div className="font-bold mb-1 text-xs">📊 吳董事長 早安</div>
              <div className="text-[11px] text-slate-600 leading-relaxed">
                本週三部門摘要：<br />
                • 共同議題：根據週報自動彙整<br />
                • 卡點警示：{thisWeekReports.filter((r) => r.blockers.trim()).length} 項<br />
                • 未閉環交接：{unsigned.length} 筆
              </div>
              <BotAction>→ 打開管理儀表板</BotAction>
            </BotMsg>

            {unsigned.length > 0 && (
              <>
                <div className="text-center text-[10px] text-white/90 mt-2">剛剛</div>
                <BotMsg danger>
                  ⚠️ 提醒：<strong>{unsigned[0].title}</strong>交接單已超過{" "}
                  {unsigned[0].hoursOverdue || 0} 小時未簽收。
                </BotMsg>
              </>
            )}
          </div>
        </div>

        {/* 排程說明 */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-4">
              <Clock size={16} className="text-emerald-500" />
              推播排程
            </div>
            <div className="space-y-3">
              {[
                { time: "每週五 15:00", who: "三部門主管", what: "提醒填寫本週週報" },
                { time: "每週一 09:00", who: "董事、COO",   what: "本週跨部門摘要與 Dashboard 連結" },
                { time: "即時觸發",     who: "接手方",     what: "交接單超過 24 小時未簽收時提醒" },
              ].map((s, i) => (
                <div key={i} className="p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Send size={11} className="text-emerald-500" />
                    <span className="text-xs font-bold text-slate-900">{s.time}</span>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    推播給 <strong className="text-slate-700">{s.who}</strong>：{s.what}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 bg-amber-50 border-amber-200">
            <div className="text-xs text-amber-800 leading-relaxed">
              <strong>為何此功能至關重要？</strong><br />
              在以 LINE 為主要溝通管道的台灣公司，推播讓使用者不用另外登入系統，
              也能完成 80% 日常互動。這是專案能否被實際採用的關鍵。
            </div>
          </Card>

          <Card className="p-5 bg-blue-50 border-blue-200">
            <div className="text-xs text-blue-800 leading-relaxed">
              <strong>📌 上線需要：</strong><br />
              1. 申請 LINE Messaging API Channel<br />
              2. 設定 Firebase Cloud Functions 接收 webhook<br />
              3. 推播訊息透過 LINE SDK 發送
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function BotMsg({ children, danger }: { children: React.ReactNode; danger?: boolean }) {
  return (
    <div className={`bg-white rounded-2xl rounded-tl-sm p-3 text-xs text-slate-800 max-w-[85%] shadow-sm ${danger ? "border-l-4 border-red-400" : ""}`}>
      {children}
    </div>
  );
}

function BotAction({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 pt-2 border-t border-slate-200 text-[10px] text-blue-600 font-bold">
      {children}
    </div>
  );
}
