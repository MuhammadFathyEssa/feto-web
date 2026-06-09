"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true);
    setError("");
    // Simulate auth — replace with real auth when ready
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#040d1a] px-4">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(20,48,96,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(20,48,96,0.15)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />

      <div className="w-full max-w-sm relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#d4a843]/10 border border-[#d4a843]/30 flex items-center justify-center mb-4">
            <Shield size={28} className="text-[#d4a843]" />
          </div>
          <h1 className="text-xl font-semibold text-slate-100">FeTo Enterprise</h1>
          <p className="text-sm text-slate-500 mt-1">AI Assistant Platform</p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="bg-[#071428] border border-[#0d2144] rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@bank.com"
              className="w-full px-3 py-2.5 rounded-lg bg-[#0d2144] border border-[#1a2235] focus:border-[#d4a843]/50 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2.5 pr-10 rounded-lg bg-[#0d2144] border border-[#1a2235] focus:border-[#d4a843]/50 text-sm text-slate-200 placeholder-slate-600 outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#d4a843] hover:bg-[#c49a2a] disabled:opacity-50 text-[#040d1a] text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-6">
          Banque Du Caire · Technology Services &amp; IT Operations
        </p>
      </div>
    </div>
  );
}
