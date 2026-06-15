"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import Constellation from "@/app/components/Constellation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Enter your email"); return; }
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.success) { setError(data.error || "Request failed"); setLoading(false); return; }
      setSent(true);
    } catch {
      setError("Connection error. Try again."); setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#040d1a]">
      <div className="relative lg:w-1/2 h-56 lg:h-auto overflow-hidden">
        <div className="absolute inset-0" style={{ background: "radial-gradient(120% 120% at 0% 0%, #1b2552 0%, #0c1430 40%, #040d1a 70%), radial-gradient(120% 120% at 100% 0%, #3a2917 0%, rgba(58,41,23,0) 45%)" }} />
        <Constellation className="absolute inset-0" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-[#040d1a] lg:hidden" />
        <div className="relative z-10 h-full flex flex-col justify-center px-8 lg:px-16">
          <div className="w-11 h-11 rounded-full border border-[#e0a955]/40 flex items-center justify-center mb-5">
            <span className="block w-2 h-2 rounded-full bg-[#e0a955] shadow-[0_0_12px_3px_rgba(224,169,85,0.6)]" />
          </div>
          <h1 className="text-5xl lg:text-6xl italic text-[#f0ebe0] leading-none" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>FeTo</h1>
          <p className="mt-3 text-sm tracking-[0.2em] uppercase text-slate-400">Executive Intelligence</p>
        </div>
      </div>

      <div className="lg:w-1/2 flex items-center justify-center px-6 py-10 lg:py-0">
        <div className="w-full max-w-sm">
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300 mb-8 transition-colors">
            <ArrowLeft size={15} /> Back to sign in
          </Link>

          {sent ? (
            <div>
              <div className="w-11 h-11 rounded-xl bg-[#e0a955]/10 border border-[#e0a955]/30 flex items-center justify-center mb-6">
                <MailCheck size={22} className="text-[#e0a955]" />
              </div>
              <h2 className="text-3xl text-[#f0ebe0]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Check your inbox</h2>
              <p className="text-slate-500 mt-3 text-[15px] leading-relaxed">
                If an account exists for <span className="text-slate-300">{email}</span>, we&rsquo;ve sent a link to reset your password. The link expires in one hour.
              </p>
              <Link href="/login" className="inline-block mt-8 text-sm text-[#e0a955] hover:text-[#f0bd6e]">Return to sign in</Link>
            </div>
          ) : (
            <>
              <h2 className="text-3xl text-[#f0ebe0]" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>Reset password</h2>
              <p className="text-slate-500 mt-2 text-[15px]">Enter your email and we&rsquo;ll send you a reset link.</p>
              <form onSubmit={submit} className="mt-8 space-y-5">
                <div>
                  <label className="block text-[11px] tracking-[0.15em] uppercase text-slate-500 mb-2 font-medium">Email</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email"
                    className="w-full px-4 py-3 rounded-xl bg-[#0c1430]/60 border border-[#1a2550] focus:border-[#e0a955]/60 text-[15px] text-slate-100 placeholder-slate-600 outline-none transition-colors" />
                </div>
                {error && <p className="text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#e0a955] hover:bg-[#eab667] disabled:opacity-50 text-[#040d1a] text-[15px] font-semibold transition-colors flex items-center justify-center gap-2 shadow-[0_8px_24px_-8px_rgba(224,169,85,0.5)]">
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {loading ? "Sending..." : "Send reset link"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
