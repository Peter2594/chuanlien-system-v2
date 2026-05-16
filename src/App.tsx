/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { useState } from "react";
import { Loader2 } from "lucide-react";
import Login from "./components/Login";
import { Sidebar, type TabId, NAV } from "./components/Shell/Sidebar";
import { Header } from "./components/Shell/Header";
import Dashboard from "./pages/Dashboard";
import WeeklyReport from "./pages/WeeklyReport";
import Handoff from "./pages/Handoff";
import Decisions from "./pages/Decisions";
import EmployeeLoad from "./pages/EmployeeLoad";
import History from "./pages/History";
import BlockerAnalytics from "./pages/BlockerAnalytics";
import OrgAnalytics from "./pages/OrgAnalytics";
import MeetingPrep from "./pages/MeetingPrep";
import LineBot from "./pages/LineBot";
import { useAppData } from "./hooks/useAppData";

export default function App() {
  const data = useAppData();
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 載入中
  if (data.authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 size={28} className="animate-spin text-slate-400" />
      </div>
    );
  }

  // 未登入 → Login
  if (!data.authUser) {
    return <Login />;
  }

  // 已登入 → 主畫面
  const navItem = NAV.find((n) => n.id === activeTab);
  const userRole = data.userProfile?.role || "member";

  // 角色權限：不在允許清單則自動跳回 dashboard
  if (navItem && !navItem.roles.includes(userRole)) {
    setActiveTab("dashboard");
  }

  const titleMap: Record<TabId, string> = {
    dashboard:  data.userProfile?.role === "admin" ? "管理層摘要" : "本週進度",
    report:     "週報填寫",
    handoff:    "案件交接",
    decisions:  "決策追蹤",
    employees:  "員工負載",
    history:    "歷史搜尋",
    analytics:  "卡點分析",
    orgnetwork: "組織分析",
    meetings:   "會議準備",
    linebot:    "LINE Bot 推播",
  };
  const subtitleMap: Record<TabId, string> = {
    dashboard:  "Admin Overview",
    report:     "Weekly Report",
    handoff:    "Handoff Tracker",
    decisions:  "Decision Log",
    employees:  "Load Analytics",
    history:    "Case Search",
    analytics:  "Blocker Statistics",
    orgnetwork: "Organization Analytics",
    meetings:   "Meeting Prep",
    linebot:    "Push Notifications",
  };

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans">
      <Sidebar
        active={activeTab}
        onSelect={setActiveTab}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        role={userRole}
        syncStatus={data.syncStatus}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Header
          title={titleMap[activeTab]}
          subtitle={subtitleMap[activeTab]}
          userProfile={data.userProfile}
          authEmail={data.authUser?.email}
          onLogout={data.logout}
          decisions={data.decisions}
          handoffs={data.handoffs}
          blockers={data.blockers}
          reports={data.reports}
          history={data.history}
          departments={data.departments}
          onNavigate={setActiveTab}
        />

        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
          {activeTab === "dashboard" && (
            <Dashboard
              reports={data.reports}
              handoffs={data.handoffs}
              decisions={data.decisions}
              blockers={data.blockers}
              employees={data.employees}
              departments={data.departments}
              history={data.history}
              userProfile={data.userProfile}
              onNav={setActiveTab}
            />
          )}
          {activeTab === "report"     && (
            <WeeklyReport
              reports={data.reports}
              setReports={data.setReports}
              departments={data.departments}
              userProfile={data.userProfile}
            />
          )}
          {activeTab === "handoff"    && (
            <Handoff
              handoffs={data.handoffs}
              setHandoffs={data.setHandoffs}
              departments={data.departments}
              history={data.history}
            />
          )}
          {activeTab === "decisions"  && (
            <Decisions
              decisions={data.decisions}
              setDecisions={data.setDecisions}
              departments={data.departments}
              userProfile={data.userProfile}
            />
          )}
          {activeTab === "employees"  && (
            <EmployeeLoad
              reports={data.reports}
              handoffs={data.handoffs}
              employees={data.employees}
            />
          )}
          {activeTab === "history"    && (
            <History history={data.history} />
          )}
          {activeTab === "analytics"  && (
            <BlockerAnalytics
              blockers={data.blockers}
              history={data.history}
            />
          )}
          {activeTab === "orgnetwork" && (
            <OrgAnalytics
              reports={data.reports}
              handoffs={data.handoffs}
              departments={data.departments}
            />
          )}
          {activeTab === "meetings"   && (
            <MeetingPrep
              meetingHistory={data.meetingHistory}
              decisions={data.decisions}
              handoffs={data.handoffs}
              blockers={data.blockers}
            />
          )}
          {activeTab === "linebot"    && (
            <LineBot
              reports={data.reports}
              handoffs={data.handoffs}
            />
          )}
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
}
