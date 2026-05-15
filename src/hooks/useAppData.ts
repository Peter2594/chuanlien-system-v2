import { useEffect, useState, useCallback } from "react";
import {
  fetchDocumentCollection,
  saveDocumentCollection,
  watchAuth,
  logout as fbLogout,
  inferUserProfile,
  type UserProfile,
} from "../lib/firebase";
import type { User } from "firebase/auth";
import {
  SEED_REPORTS, SEED_HANDOFFS, SEED_DECISIONS, SEED_BLOCKERS,
  SEED_HISTORY, SEED_EMPLOYEES, SEED_MEETING_HISTORY,
} from "../lib/seedData";
import { SEED_DEPARTMENTS, SEED_USERS } from "../lib/constants";
import type {
  Report, Handoff, Decision, Blocker, HistoryCase, Employee, Department,
  SystemUser, MeetingHistory,
} from "../lib/types";

export type SyncStatus = "idle" | "syncing" | "error";

export function useAppData() {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("idle");

  const [reports, setReports]               = useState<Report[]>(SEED_REPORTS);
  const [handoffs, setHandoffs]             = useState<Handoff[]>(SEED_HANDOFFS);
  const [decisions, setDecisions]           = useState<Decision[]>(SEED_DECISIONS);
  const [blockers, setBlockers]             = useState<Blocker[]>(SEED_BLOCKERS);
  const [history, setHistory]               = useState<HistoryCase[]>(SEED_HISTORY);
  const [employees, setEmployees]           = useState<Employee[]>(SEED_EMPLOYEES);
  const [departments, setDepartments]       = useState<Department[]>(SEED_DEPARTMENTS as Department[]);
  const [users, setUsers]                   = useState<SystemUser[]>(SEED_USERS as SystemUser[]);
  const [meetingHistory, setMeetingHistory] = useState<MeetingHistory[]>(SEED_MEETING_HISTORY);

  // 監聽 auth
  useEffect(() => {
    const unsub = watchAuth((u) => {
      setAuthUser(u);
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  // 登入後載入
  useEffect(() => {
    if (!authUser) {
      setDataLoaded(false);
      return;
    }
    (async () => {
      setSyncStatus("syncing");
      try {
        const [r, h, d, b, emp, deptRows, userRows, mh, hist] = await Promise.all([
          fetchDocumentCollection<Report>("reports", SEED_REPORTS),
          fetchDocumentCollection<Handoff>("handoffs", SEED_HANDOFFS),
          fetchDocumentCollection<Decision>("decisions", SEED_DECISIONS),
          fetchDocumentCollection<Blocker>("blockers", []),
          fetchDocumentCollection<Employee>("employees", SEED_EMPLOYEES),
          fetchDocumentCollection<Department>("departments", SEED_DEPARTMENTS as Department[]),
          fetchDocumentCollection<SystemUser>("users", SEED_USERS as SystemUser[]),
          fetchDocumentCollection<MeetingHistory>("meetingHistory", SEED_MEETING_HISTORY),
          fetchDocumentCollection<HistoryCase>("history", SEED_HISTORY),
        ]);

        // 偵測舊資料：若雲端 reports 含「第 N 週」字樣 → 重置
        const hasOldFormat = (r || []).some((x: any) => /第\s*\d+\s*週/.test(String(x.week || "")));
        const tooFew = (r || []).length < 30;
        const finalReports   = (hasOldFormat || tooFew) ? SEED_REPORTS : r;
        const finalHandoffs  = (h || []).length < 30   ? SEED_HANDOFFS : h;
        const finalBlockers  = (b || []).length === 0  ? SEED_BLOCKERS : b;
        const finalHistory   = (hist || []).length < 5 ? SEED_HISTORY  : hist;
        const finalMeetings  = (mh || []).length < 5   ? SEED_MEETING_HISTORY : mh;

        setReports(finalReports);
        setHandoffs(finalHandoffs);
        setDecisions(d);
        setBlockers(finalBlockers);
        setEmployees(emp);
        setDepartments(deptRows);
        setUsers(userRows);
        setMeetingHistory(finalMeetings);
        setHistory(finalHistory);
        setSyncStatus("idle");
      } catch (err) {
        console.error("Firebase load failed:", err);
        setSyncStatus("error");
      } finally {
        setDataLoaded(true);
      }
    })();
  }, [authUser]);

  // 自動同步 helper
  const syncCollection = useCallback(async <T extends { id?: string }>(name: string, value: T[]) => {
    if (!dataLoaded || !authUser) return;
    setSyncStatus("syncing");
    const ok = await saveDocumentCollection(name, value);
    setSyncStatus(ok ? "idle" : "error");
  }, [dataLoaded, authUser]);

  useEffect(() => { syncCollection("reports", reports);     }, [reports, syncCollection]);
  useEffect(() => { syncCollection("handoffs", handoffs);   }, [handoffs, syncCollection]);
  useEffect(() => { syncCollection("decisions", decisions); }, [decisions, syncCollection]);
  useEffect(() => { syncCollection("blockers", blockers);   }, [blockers, syncCollection]);
  useEffect(() => { syncCollection("history", history);     }, [history, syncCollection]);

  // userProfile
  const userProfile: UserProfile | null = authUser
    ? (() => {
        const email = authUser.email || "";
        const userRecord = users.find(
          (u) => (u.email || "").toLowerCase() === email.toLowerCase() && u.active !== false,
        );
        if (userRecord) return { ...inferUserProfile(email), ...userRecord, email };
        return { ...inferUserProfile(email), email };
      })()
    : null;

  return {
    authUser, authLoading, userProfile, syncStatus, dataLoaded,
    reports, setReports,
    handoffs, setHandoffs,
    decisions, setDecisions,
    blockers, setBlockers,
    history, setHistory,
    employees,
    departments,
    users,
    meetingHistory, setMeetingHistory,
    logout: fbLogout,
  };
}
