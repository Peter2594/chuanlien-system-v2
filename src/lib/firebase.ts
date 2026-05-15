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

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyCmpjx_6dPQtGfubTFcYZOpNpDVJD0-LwU",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "chuanlien-system.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "chuanlien-system",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "chuanlien-system.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "535615404579",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:535615404579:web:6df27827b85c7af65f0f96",
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

  if (lower === "admin@test.com" || lower.startsWith("admin@")) {
    role = ROLES.ADMIN;
    dept = "營運與管理層";
  } else if (lower.startsWith("manager")) {
    role = ROLES.MANAGER;
    if (lower.includes("research")) dept = "投資研究部";
    else if (lower.includes("biz")) dept = "業務開發部";
    else if (lower.includes("asset")) dept = "資產管理部";
    else dept = "未指定部門";
  } else if (lower.startsWith("member")) {
    role = ROLES.MEMBER;
    dept = "業務開發部";
  }

  const localPart = email.split("@")[0];
  const displayName = localPart.charAt(0).toUpperCase() + localPart.slice(1);
  return { role, dept, displayName };
};
