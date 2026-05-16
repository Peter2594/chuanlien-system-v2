import { ShieldCheck, LogOut } from "lucide-react";
import type { UserProfile } from "../../lib/firebase";
import { ROLE_LABELS } from "../../lib/firebase";
import { NotificationPanel } from "./NotificationPanel";
import type { TabId } from "./Sidebar";
import type { Decision, Handoff, Blocker, Report, HistoryCase, Department } from "../../lib/types";

interface HeaderProps {
  title: string;
  subtitle?: string;
  userProfile?: UserProfile | null;
  authEmail?: string | null;
  onLogout: () => void;
  decisions: Decision[];
  handoffs: Handoff[];
  blockers: Blocker[];
  reports: Report[];
  history: HistoryCase[];
  departments: Department[];
  onNavigate: (tab: TabId) => void;
}

export function Header({
  title, subtitle, userProfile, authEmail, onLogout,
  decisions, handoffs, blockers, reports, history, departments, onNavigate,
}: HeaderProps) {
  const initials = (userProfile?.displayName || authEmail || "?")
    .charAt(0)
    .toUpperCase();
  const roleLabel = ROLE_LABELS[userProfile?.role || "member"] || "—";

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <h2 className="text-lg font-bold text-slate-800 truncate">
          {title}
          {subtitle && (
            <span className="font-normal text-slate-400 text-sm ml-2">/ {subtitle}</span>
          )}
        </h2>
      </div>

      <div className="flex items-center gap-6">
        <div className="hidden md:flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
          <ShieldCheck size={14} className="text-blue-600" />
          <span className="text-xs font-semibold text-slate-600">資管導論 第 13 組</span>
        </div>

        <div className="flex items-center gap-4">
          <NotificationPanel
            decisions={decisions}
            handoffs={handoffs}
            blockers={blockers}
            reports={reports}
            history={history}
            departments={departments}
            onNavigate={onNavigate}
          />

          <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900 leading-none">
                {userProfile?.displayName || authEmail?.split("@")[0] || "—"}
              </p>
              <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-tighter font-medium">
                {roleLabel}
              </p>
            </div>
            <div className="w-8 h-8 bg-gradient-to-tr from-slate-200 to-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-[10px]">
              {initials}
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
              title="登出"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
