import { useState, type FormEvent } from "react";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { login } from "../lib/firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: any) {
      const code = err?.code || "";
      const fullMsg = err?.message || String(err);
      console.error("[Login Error]", code, fullMsg, err);
      let msg = `登入失敗：${code || "未知錯誤"}`;
      if (code === "auth/user-not-found")           msg = "找不到此帳號";
      else if (code === "auth/wrong-password")      msg = "密碼錯誤";
      else if (code === "auth/invalid-email")       msg = "電子郵件格式不正確";
      else if (code === "auth/invalid-credential")  msg = "帳號或密碼錯誤";
      else if (code === "auth/too-many-requests")   msg = "嘗試次數過多，請稍後再試";
      else if (code === "auth/network-request-failed") msg = "網路連線異常";
      else if (code === "auth/api-key-not-valid")   msg = "Firebase 設定錯誤：API key 無效（請在 Vercel 設定 VITE_FIREBASE_* 環境變數）";
      else if (code === "auth/unauthorized-domain") msg = "此網域未授權（Firebase Console 加入網域）";
      else if (code === "auth/operation-not-allowed") msg = "Email/密碼登入未啟用（Firebase Console 啟用）";
      else if (code === "auth/configuration-not-found") msg = "Firebase Auth 未設定（請先啟用 Email/Password 登入方式）";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 p-5">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200/60 overflow-hidden"
      >
        {/* 頂部紅條 */}
        <div className="h-1 bg-red-500" />

        <div className="p-10">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-slate-900 text-white text-2xl font-bold rounded-2xl mb-4">
              串
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              串連股份有限公司
            </h1>
            <div className="text-[11px] text-slate-400 mt-2 tracking-[0.2em] font-semibold uppercase">
              Decision Support System
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 tracking-wide">
                電子郵件
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.name@company.com"
                autoComplete="email"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-2 tracking-wide">
                密碼
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/10 transition"
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
                <AlertCircle size={14} />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold tracking-wider hover:bg-slate-800 transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  登入中…
                </>
              ) : (
                <>
                  <LogIn size={15} />
                  登入
                </>
              )}
            </button>
          </form>

          <div className="mt-6 px-4 py-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 leading-relaxed">
            <div className="font-semibold text-slate-700 mb-1">🔒 內部系統存取限制</div>
            僅限串連股份有限公司員工使用。如需開通帳號，請洽資訊部門。
          </div>

          <div className="mt-5 text-center text-[10px] text-slate-400 tracking-wider">
            資管導論 第 13 組 · v2.0
          </div>
        </div>
      </motion.div>
    </div>
  );
}
