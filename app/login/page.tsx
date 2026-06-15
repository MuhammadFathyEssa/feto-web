"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock } from "lucide-react";
import Constellation from "@/app/components/Constellation";

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const reason = searchParams.get("reason");
    if (reason === "idle") setNotice("Your session expired due to inactivity. Please sign in again.");
    else if (reason === "expired") setNotice("Your session has expired. Please sign in again.");
  }, [searchParams]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Enter email and password"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || "Login failed");
        setLoading(false);
        return;
      }
      router.push("/app");
      router.refresh();
    } catch {
      setError("Connection error. Try again.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#040d1a]">
      {/* ── Hero panel — animated constellation + wordmark ── */}
      <div className="relative lg:w-1/2 h-56 lg:h-auto overflow-hidden">
        {/* duotone gradient: cool indigo (top-left) → warm bronze (top-right) */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(120% 120% at 0% 0%, #1b2552 0%, #0c1430 40%, #040d1a 70%), radial-gradient(120% 120% at 100% 0%, #3a2917 0%, rgba(58,41,23,0) 45%)",
          }}
        />
        <Constellation className="absolute inset-0" />
        {/* fade into the form on small screens */}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#040d1a] lg:hidden" />

        <div className="relative z-10 h-full flex flex-col justify-center px-8 lg:px-16">
          <div className="w-11 h-11 rounded-full border border-[#e0a955]/40 flex items-center justify-center mb-5">
            <span className="block w-2 h-2 rounded-full bg-[#e0a955] shadow-[0_0_12px_3px_rgba(224,169,85,0.6)]" />
          </div>
          <h1
            className="text-5xl lg:text-6xl italic text-[#f0ebe0] leading-none"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            FeTo
          </h1>
          <p className="mt-3 text-sm tracking-[0.2em] uppercase text-slate-400">
            Executive Intelligence
          </p>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="lg:w-1/2 flex items-center justify-center px-6 py-10 lg:py-0">
        <div className="w-full max-w-sm">
          <div className="w-9 h-9 rounded-full border border-[#e0a955]/40 flex items-center justify-center mb-8">
            <span className="block w-1.5 h-1.5 rounded-full bg-[#e0a955] shadow-[0_0_10px_2px_rgba(224,169,85,0.6)]" />
          </div>

          <h2
            className="text-3xl text-[#f0ebe0]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Sign in
          </h2>
          <p className="text-slate-500 mt-2 text-[15px]">
            Welcome back. Pick up where you left off.
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <label className="block text-[11px] tracking-[0.15em] uppercase text-slate-500 mb-2 font-medium">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-4 py-3 rounded-xl bg-[#0c1430]/60 border border-[#1a2550] focus:border-[#e0a955]/60 text-[15px] text-slate-100 placeholder-slate-600 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-[11px] tracking-[0.15em] uppercase text-slate-500 mb-2 font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-4 py-3 pr-11 rounded-xl bg-[#0c1430]/60 border border-[#1a2550] focus:border-[#e0a955]/60 text-[15px] text-slate-100 placeholder-slate-600 outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="sr-only peer"
                />
                <span className="w-4 h-4 rounded border border-[#2a3556] bg-[#0c1430] peer-checked:bg-[#e0a955] peer-checked:border-[#e0a955] transition-colors flex items-center justify-center">
                  <svg
                    className="w-2.5 h-2.5 text-[#040d1a] opacity-0 peer-checked:opacity-100 transition-opacity"
                    viewBox="0 0 12 12" fill="none"
                  >
                    <path d="M2 6l2.5 2.5L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="text-sm text-slate-400 group-hover:text-slate-300">Remember me</span>
              </label>
              <a href="/forgot-password" className="text-sm text-[#e0a955] hover:text-[#f0bd6e] transition-colors">
                Forgot password?
              </a>
            </div>

            {notice && (
              <p className="text-xs text-amber-300 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2">
                {notice}
              </p>
            )}
            {error && (
              <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-[#e0a955] hover:bg-[#eab667] disabled:opacity-50 text-[#040d1a] text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(224,169,85,0.5)]"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="mt-8 flex items-center justify-center gap-2 text-[11px] text-slate-600">
            <Lock size={11} />
            <span>اتصال مُشفّر · وصول مُتحكَّم فيه بالأدوار</span>
          </div>
          <p className="text-center text-xs text-slate-700 mt-4">
            FeTo Executive Intelligence Platform
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}
