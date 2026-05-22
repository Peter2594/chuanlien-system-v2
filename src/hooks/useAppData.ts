import { useEffect, useState, useCallback, useRef } from "react";
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
      if (!u) syncEnabled.current = false; // logout 時重置，防下次登入初始載入觸發 sync
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

        // 偵測「明顯壞掉的舊版格式」才重置。
        // 之前的「少於 10 筆 → 換 SEED」會把小團隊的真實資料整批蓋掉，
        // 而 syncCollection 又會把 SEED 寫回 Firestore — 等同資料災難。
        // 現在改為：只有「完全空」才補 SEED，「有資料但少」尊重使用者輸入。
        const hasOldFormat = (r || []).some((x: any) => /第\s*\d+\s*週/.test(String(x.week || "")));
        const reportsEmpty = (r || []).length === 0;
        const handoffsEmpty = (h || []).length === 0;
        const finalReports   = (hasOldFormat || reportsEmpty) ? SEED_REPORTS : r;
        const finalHandoffs  = handoffsEmpty ? SEED_HANDOFFS : h;
        const finalBlockers  = (b || []).length === 0  ? SEED_BLOCKERS : b;
        const finalHistory   = (hist || []).length === 0 ? SEED_HISTORY  : hist;
        const finalMeetings  = (mh || []).length === 0   ? SEED_MEETING_HISTORY : mh;

        // 員工 / 決策只在「空」時補進 SEED (避免覆蓋使用者編輯)
        const finalEmployees = (emp || []).length === 0 ? SEED_EMPLOYEES : emp;
        const finalDecisions = (d || []).length === 0 ? SEED_DECISIONS : d;
        // departments / users 也要保護：Firestore 抓到空陣列時 fallback 到 SEED
        // 否則整個 app 會崩潰（很多頁面用 departments.filter(d => d.active)）
        const finalDepts = (deptRows || []).length === 0 ? (SEED_DEPARTMENTS as Department[]) : deptRows;
        const finalUsers = (userRows || []).length === 0 ? (SEED_USERS as SystemUser[]) : userRows;

        setReports(finalReports);
        setHandoffs(finalHandoffs);
        setDecisions(finalDecisions);
        setBlockers(finalBlockers);
        setEmployees(finalEmployees);
        setDepartments(finalDepts);
        setUsers(finalUsers);
        setMeetingHistory(finalMeetings);
        setHistory(finalHistory);
        setSyncStatus("idle");
        // 載入成功後，用 setTimeout 確保所有 React effects 跑完再開放 sync，
        // 避免初始載入 → SEED 資料被 sync 回 Firestore。
        setTimeout(() => { syncEnabled.current = true; }, 0);
      } catch (err) {
        console.error("Firebase load failed:", err);
        setSyncStatus("error");
      } finally {
        setDataLoaded(true);
      }
    })();
  }, [authUser]);

  // 防止初始載入時把 SEED 資料寫回 Firestore：
  // dataLoaded 從 false→true 時，syncCollection ref 改變 → 觸發所有 sync useEffect。
  // 用 syncEnabled ref（setTimeout 在 effects 之後才設 true）擋住這一輪。
  const syncEnabled = useRef(false);

  const syncCollection = useCallback(async <T extends { id?: string }>(name: string, value: T[]) => {
    if (!syncEnabled.current || !authUser) return;
    setSyncStatus("syncing");
    const ok = await saveDocumentCollection(name, value);
    setSyncStatus(ok ? "idle" : "error");
  }, [authUser]);

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
