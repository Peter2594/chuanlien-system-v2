/**
 * Firebase 連線設定 + 認證 + Firestore CRUD
 */
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  deleteDoc,
  setDoc,
  collection,
  getDocs,
  writeBatch,
} from "firebase/firestore";

// 從 Vite 環境變數讀 — 拿不到就快速失敗，不再 fallback 到真實 project
// 防止公開 repo 自動連到生產資料庫
function requireEnv(key: string): string {
  const v = import.meta.env[key];
  if (!v) {
    throw new Error(
      `[firebase] Missing env: ${key}. ` +
      `請在 .env 或部署平台設定 VITE_FIREBASE_* 變數。` +
      `參考 .env.example。`,
    );
  }
  return v as string;
}

const firebaseConfig = {
  apiKey:            requireEnv("VITE_FIREBASE_API_KEY"),
  authDomain:        requireEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId:         requireEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket:     requireEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: requireEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId:             requireEnv("VITE_FIREBASE_APP_ID"),
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// ===== 認證 =====
export const login = (email: string, password: string) =>
  signInWithEmailAndPassword(auth, email, password);

export const register = (email: string, password: string) =>
  createUserWithEmailAndPassword(auth, email, password);

export const logout = () => signOut(auth);

export const watchAuth = (callback: (user: User | null) => void) =>
  onAuthStateChanged(auth, callback);

// ===== Firestore =====
const COMPANY_ID = "chuanlien";

const makeStableDocId = (collectionName: string, item: any, index: number): string => {
  const raw = item.id || item.employeeId || item.userId || item.email || item.name || `${collectionName}-${index}`;
  return (
    String(raw)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9一-龥_-]+/g, "-")
      .replace(/^-+|-+$/g, "") || `${collectionName}-${index}`
  );
};

export async function fetchDocumentCollection<T = any>(
  collectionName: string,
  fallback: T[] = [],
): Promise<T[]> {
  try {
    const ref = collection(db, "companies", COMPANY_ID, collectionName);
    const snap = await getDocs(ref);
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() } as T));
    return items.length ? items : fallback;
  } catch (err) {
    console.error(`fetchDocumentCollection(${collectionName}) failed:`, err);
    return fallback;
  }
}

export async function saveDocumentCollection<T extends { id?: string }>(
  collectionName: string,
  value: T[],
): Promise<boolean> {
  try {
    const ref = collection(db, "companies", COMPANY_ID, collectionName);
    const snap = await getDocs(ref);
    const batch = writeBatch(db);
    const normalized = value.map((item, i) => ({
      ...item,
      id: makeStableDocId(collectionName, item, i),
    }));
    const nextIds = new Set(normalized.map((item) => item.id).filter(Boolean));
    snap.docs.forEach((d) => {
      if (!nextIds.has(d.id)) batch.delete(d.ref);
    });
    normalized.forEach((item) => {
      const itemRef = doc(db, "companies", COMPANY_ID, collectionName, item.id);
      batch.set(itemRef, item, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (err) {
    console.error(`saveDocumentCollection(${collectionName}) failed:`, err);
    return false;
  }
}

export async function deleteDocument(collectionName: string, documentId: string): Promise<boolean> {
  try {
    if (!documentId) return false;
    const itemRef = doc(db, "companies", COMPANY_ID, collectionName, documentId);
    await deleteDoc(itemRef);
    return true;
  } catch (err) {
    console.error(`deleteDocument(${collectionName}) failed:`, err);
    return false;
  }
}

// ===== 角色 =====
export const ROLES = {
  ADMIN: "admin",
  MANAGER: "manager",
  MEMBER: "member",
} as const;

export const ROLE_LABELS: Record<string, string> = {
  admin: "管理層",
  manager: "部門主管",
  member: "一般員工",
};

export interface UserProfile {
  role: string;
  dept: string;
  displayName?: string;
  email?: string;
}

export const inferUserProfile = (email: string): UserProfile => {
  if (!email) return { role: ROLES.MEMBER, dept: "未知" };
  const lower = email.toLowerCase();

  let role: string = ROLES.MEMBER;
  let dept = "未指定";

  if (lower === "admin@test.com") {
    role = ROLES.ADMIN;
    dept = "營運與管理層";
  } else if (lower === "manager-research@test.com") {
    role = ROLES.MANAGER;
    dept = "投資研究部";
  } else if (lower === "manager-biz@test.com") {
    role = ROLES.MANAGER;
    dept = "業務開發部";
  } else if (lower === "manager-asset@test.com") {
    role = ROLES.MANAGER;
    dept = "資產管理部";
  } else if (lower === "member@test.com") {
    role = ROLES.MEMBER;
    dept = "業務開發部";
  }

  const localPart = email.split("@")[0];
  const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
  return { role, dept, displayName };
};
