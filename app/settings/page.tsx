"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Shield, Save, CheckCircle, KeyRound, Loader2, LogOut } from "lucide-react";

export default function SettingsPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [apiUrl] = useState(
    "(configured server-side)"
  );

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwSuccess("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwError("All fields required"); return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("New passwords do not match"); return;
    }
    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters"); return;
    }
    setPwLoading(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!data.success) { setPwError(data.error || "Failed"); }
      else {
        setPwSuccess("Password changed successfully");
        setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
      }
    } catch { setPwError("Connection error"); }
    finally { setPwLoading(false); }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <header className="border-b border-[#0d2144] bg-[#071428] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#d4a843]" />
          <span className="font-semibold text-sm">Settings</span>
        </div>
        <button onClick={handleLogout} className="ml-auto flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors">
          <LogOut size={13} /> Sign out
        </button>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* API Config */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">API Configuration</h3>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Railway API URL</label>
            <input
              value={apiUrl}
              readOnly
              className="w-full px-3 py-2.5 rounded-lg bg-[#0d2144] border border-[#1a2235] text-sm text-slate-400 outline-none font-mono"
            />
            <p className="text-xs text-slate-600 mt-1">Configured via BACKEND_URL on Vercel (server-side only).</p>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <KeyRound size={14} className="text-[#d4a843]" /> Change Password
          </h3>
          <form onSubmit={handleChangePassword} className="space-y-4">
            {[
              { label: "Current Password", value: currentPassword, set: setCurrentPassword, auto: "current-password" },
              { label: "New Password", value: newPassword, set: setNewPassword, auto: "new-password" },
              { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword, auto: "new-password" },
            ].map(({ label, value, set, auto }) => (
              <div key={label}>
                <label className="block text-xs text-slate-400 mb-1.5">{label}</label>
                <input
                  type="password"
                  value={value}
                  onChange={(e) => set(e.target.value)}
                  autoComplete={auto}
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#0d2144] border border-[#1a2235] focus:border-[#d4a843]/50 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
                />
              </div>
            ))}
            {pwError && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{pwError}</p>}
            {pwSuccess && <p className="text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 rounded-lg px-3 py-2">{pwSuccess}</p>}
            <button
              type="submit"
              disabled={pwLoading}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4a843] hover:bg-[#c49a2a] disabled:opacity-50 text-[#040d1a] text-sm font-semibold transition-colors"
            >
              {pwLoading ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
              {pwLoading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>

        {/* About */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">About</h3>
          <div className="space-y-2 text-xs text-slate-500 font-mono">
            {[
              ["Platform", "FeTo Executive Intelligence Platform"],
              ["Backend Build", "v4.0-AZ"],
              ["Agents", "13"],
              ["Commands", "90"],
              ["CBE Framework", "Embedded"],
              ["Auth", "JWT + Supabase"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span>{k}</span><span className="text-slate-400">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0d2144] border border-[#1a2235] hover:border-[#d4a843]/30 text-slate-300 text-sm font-medium transition-colors"
        >
          {saved ? <CheckCircle size={14} className="text-emerald-400" /> : <Save size={14} />}
          {saved ? "Saved" : "Save Settings"}
        </button>

        <div className="mt-8 pt-6 border-t border-[#0d2144]">
          <div className="flex items-start gap-3 text-xs text-slate-500 leading-relaxed">
            <Shield size={14} className="text-[#d4a843] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-slate-400 font-medium mb-1">الأمان والخصوصية</p>
              <p>اتصالك مع فيتو مُشفّر بالكامل. الوصول مُتحكَّم فيه بالأدوار (RBAC)، وكل بياناتك معزولة عن باقي المستخدمين. الإجراءات الإدارية مُسجّلة للمساءلة.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
