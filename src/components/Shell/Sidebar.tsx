import {
  LayoutDashboard, FileText, ArrowLeftRight, Gavel,
  Users, Search, AlertCircle, Network, Calendar, MessageSquare,
  Menu, X,
  type LucideIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { cn } from "../../lib/utils";

export type TabId =
  | "dashboard" | "report" | "handoff" | "decisions" | "employees"
  | "history" | "analytics" | "orgnetwork" | "meetings" | "linebot";

interface NavConfig {
  id: TabId;
  icon: LucideIcon;
  label: string;
  roles: string[];
}

export const NAV: NavConfig[] = [
  { id: "dashboard",  icon: LayoutDashboard, label: "Dashboard 儀表板",   roles: ["admin", "manager", "member"] },
  { id: "report",     icon: FileText,        label: "WeeklyReport 週報",   roles: ["admin", "manager", "member"] },
  { id: "handoff",    icon: ArrowLeftRight,  label: "Handoff 案件交接",    roles: ["admin", "manager", "member"] },
  { id: "decisions",  icon: Gavel,           label: "Decisions 決策追蹤",  roles: ["admin", "manager"] },
  { id: "employees",  icon: Users,           label: "EmployeeLoad 負載",   roles: ["admin"] },
  { id: "history",    icon: Search,          label: "History 歷史搜尋",    roles: ["admin", "manager"] },
  { id: "analytics",  icon: AlertCircle,     label: "Blocker 卡點分析",    roles: ["admin", "manager"] },
  { id: "orgnetwork", icon: Network,         label: "OrgAnalytics 組織",   roles: ["admin"] },
  { id: "meetings",   icon: Calendar,        label: "MeetingPrep 會議",    roles: ["admin"] },
  { id: "linebot",    icon: MessageSquare,   label: "LineBot 推播",        roles: ["admin", "manager", "member"] },
];

interface SidebarProps {
  active: TabId;
  onSelect: (id: TabId) => void;
  isOpen: boolean;
  onToggle: () => void;
  role: string;
  syncStatus?: "idle" | "syncing" | "error";
}

export function Sidebar({ active, onSelect, isOpen, onToggle, role, syncStatus = "idle" }: SidebarProps) {
  const items = NAV.filter((n) => n.roles.includes(role || "member"));

  return (
    <aside
      className={cn(
        "bg-slate-900 text-slate-300 flex flex-col transition-all duration-300 z-50 shrink-0",
        isOpen ? "w-72" : "w-20",
      )}
    >
      <div className="p-6 flex items-center justify-between">
        <div className={cn("flex flex-col transition-opacity", !isOpen && "opacity-0 invisible w-0 overflow-hidden")}>
          <h1 className="text-xl font-bold text-white flex items-center gap-1">
            <span className="text-red-500">串連</span>
            <span>系統</span>
            <span className="text-[10px] text-slate-500 ml-1">v2.0</span>
          </h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase font-semibold mt-0.5">
            Decision Support System
          </p>
        </div>
        <button
          onClick={onToggle}
          className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white shrink-0"
        >
          {isOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              className={cn(
                "w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all relative group overflow-hidden",
                isActive
                  ? "bg-red-500 text-white shadow-lg shadow-red-500/20"
                  : "hover:bg-slate-800 text-slate-400 hover:text-white",
              )}
            >
              <div className="shrink-0 transition-transform group-hover:scale-110 duration-300">
                <Icon size={20} />
              </div>
              <AnimatePresence>
                {isOpen && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-xs font-bold whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {!isOpen && (
                <div className="absolute left-16 bg-slate-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity font-bold uppercase tracking-tighter z-50 whitespace-nowrap border border-slate-700">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 bg-slate-950/50 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              syncStatus === "error"
                ? "bg-red-500"
                : syncStatus === "syncing"
                ? "bg-amber-400 animate-pulse"
                : "bg-emerald-500 animate-pulse",
            )}
            title="System Online"
          />
          {isOpen && (
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-400">Firebase Synchronization</span>
              <span className="text-xs text-white font-medium">
                Status: {syncStatus === "error" ? "Error" : syncStatus === "syncing" ? "Syncing" : "Idle"}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
