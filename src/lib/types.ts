/**
 * 資料模型 TypeScript 型別
 */

export interface Report {
  id: string;
  dept: string;
  week: string;       // "YYYY/MM/DD – MM/DD"
  author: string;
  submittedAt: string;
  cases: string;
  blockers: string;
  needHelp: string;
  nextWeek: string;
  keywords: string[];
}

export interface Handoff {
  id: string;
  from: string;
  to: string;
  caseId: string;
  title: string;
  background: string;
  progress: string;
  todo: string;
  attachments: string[];
  status: "待簽收" | "已簽收";
  sender: string;
  receiver: string;
  createdAt: string;
  hoursOverdue?: number;
}

export interface Decision {
  id: string;
  title: string;
  content: string;
  decidedBy: string;
  decidedAt: string;
  dueDate: string;
  assignedDept: string;
  status: "執行中" | "逾期" | "已完成";
  linkedCases?: string[];
  notes?: string;
  completedAt?: string;
}

export interface Blocker {
  id: string;
  title: string;
  description?: string;
  dept: string;
  owner: string;
  category: string;
  status: "open" | "resolved";
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string | null;
  weekId?: string;
  caseId?: string;
  relatedDepartments?: string[];
  daysToResolve?: number;
  weekNum?: number;
  caseSize?: string;
}

export interface HistoryCase {
  id: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
  owner: string;
  handoffs: number;
  outcome: string;
  detail?: {
    background?: string;
    process?: string;
    valuation?: string;
    keyInsights?: string[];
    result?: string;
    lessons?: string;
  };
}

export interface Employee {
  name: string;
  dept: string;
  role: string;
}

export interface Department {
  id: string;
  name: string;
  shortName: string;
  active: boolean;
}

export interface SystemUser {
  id: string;
  email: string;
  role: string;
  dept: string;
  displayName: string;
  active: boolean;
}

export interface MeetingHistory {
  id: string;
  title: string;
  schedule: string;
  audience: string;
  icon: string;
  archivedAt: string;
  archivedBy: string;
  agendaSnapshot: AgendaItem[];
  textSnapshot: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  priority?: "high" | "medium" | "low";
  notes?: string;
  bullets?: string[];
}
