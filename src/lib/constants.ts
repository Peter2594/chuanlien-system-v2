/**
 * 系統常數：卡點類別、部門配置
 */

export interface BlockerCategory {
  key: string;
  label: string;
  keywords: string[];
  color: string;
}

export const BLOCKER_CATEGORIES: BlockerCategory[] = [
  { key: "法遵/合約", label: "法遵/合約", keywords: ["法遵", "合規", "法律", "法務", "合約", "契約", "審核", "NDA", "條款"], color: "#A32D2D" },
  { key: "資金/募資", label: "資金/募資", keywords: ["資金", "募資", "配置", "分潤", "預算", "撥款", "現金流"], color: "#534AB7" },
  { key: "資料/補件", label: "資料/補件", keywords: ["財務", "財報", "資料", "補件", "盡調", "訪談", "缺漏", "收齊"], color: "#B36B00" },
  { key: "跨部門/窗口", label: "跨部門/窗口", keywords: ["聯繫", "協助", "對接", "溝通", "窗口", "協調", "同步"], color: "#0F6E56" },
  { key: "決策/簽核", label: "決策/簽核", keywords: ["決議", "決策", "簽核", "委員會", "董事會", "拍板", "核准"], color: "#1F4E79" },
  { key: "時程/聯繫", label: "時程/聯繫", keywords: ["行程", "排程", "時程", "延遲", "未通", "難安排", "等待", "催促"], color: "#7A5A22" },
  { key: "其他", label: "其他", keywords: [], color: "#6E6862" },
];

export const SEED_DEPARTMENTS = [
  { id: "ops", name: "營運與管理層", shortName: "管理層", active: true },
  { id: "research", name: "投資研究部", shortName: "投研部", active: true },
  { id: "biz", name: "業務開發部", shortName: "業開部", active: true },
  { id: "asset", name: "資產管理部", shortName: "資管部", active: true },
];

export const SEED_USERS = [
  { id: "admin-test", email: "admin@test.com", role: "admin", dept: "營運與管理層", displayName: "Admin", active: true },
  { id: "manager-research", email: "manager-research@test.com", role: "manager", dept: "投資研究部", displayName: "Research Manager", active: true },
  { id: "manager-biz", email: "manager-biz@test.com", role: "manager", dept: "業務開發部", displayName: "Biz Manager", active: true },
  { id: "manager-asset", email: "manager-asset@test.com", role: "manager", dept: "資產管理部", displayName: "Asset Manager", active: true },
  { id: "member-test", email: "member@test.com", role: "member", dept: "業務開發部", displayName: "Member", active: true },
];
