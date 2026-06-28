"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Brain, Sparkles, Compass, Loader2, AlertTriangle, Lock, PlusCircle, CheckCircle2 } from "lucide-react";

// Detect Arabic to set direction per result block.
function dirOf(text: string): "rtl" | "ltr" {
  return /[\u0600-\u06FF]/.test(text) ? "rtl" : "ltr";
}

type Tab = "simulate" | "patterns" | "record";

export default function TwinPage() {
  const [tab, setTab] = useState<Tab>("simulate");

  // simulate
  const [scenario, setScenario] = useState("");
  const [simOut, setSimOut] = useState("");
  const [simNote, setSimNote] = useState("");
  const [simLoading, setSimLoading] = useState(false);

  // patterns
  const [patOut, setPatOut] = useState("");
  const [patNote, setPatNote] = useState("");
  const [patLoading, setPatLoading] = useState(false);

  // record
  const [decisionText, setDecisionText] = useState("");
  const [recNote, setRecNote] = useState("");
  const [recOk, setRecOk] = useState(false);
  const [recLoading, setRecLoading] = useState(false);

  async function runRecord() {
    if (!decisionText.trim() || recLoading) return;
    setRecLoading(true); setRecNote(""); setRecOk(false);
    try {
      const r = await fetch("/api/proxy/twin-decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: decisionText.trim() }),
      });
      const d = await r.json();
      if (r.status === 403) { setRecNote("Admin access required."); return; }
      if (d.success) { setRecOk(true); setRecNote(`✅ القرار اتسجل في الذاكرة (#${d.id})`); setDecisionText(""); }
      else setRecNote(d.error || "Failed to record decision.");
    } catch {
      setRecNote("Network error — try again.");
    } finally { setRecLoading(false); }
  }

  async function runSimulate() {
    if (!scenario.trim() || simLoading) return;
    setSimLoading(true); setSimOut(""); setSimNote("");
    try {
      const r = await fetch("/api/proxy/twin-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario: scenario.trim() }),
      });
      const d = await r.json();
      if (r.status === 403) { setSimNote("Admin access required."); return; }
      if (d.success) setSimOut(d.text);
      else setSimNote(d.message || d.error || "No prediction available.");
    } catch {
      setSimNote("Network error — try again.");
    } finally { setSimLoading(false); }
  }

  async function runPatterns() {
    if (patLoading) return;
    setPatLoading(true); setPatOut(""); setPatNote("");
    try {
      const r = await fetch("/api/proxy/twin-patterns");
      const d = await r.json();
      if (r.status === 403) { setPatNote("Admin access required."); return; }
      if (d.success) setPatOut(d.text);
      else setPatNote(d.message || d.error || "Not enough decisions yet.");
    } catch {
      setPatNote("Network error — try again.");
    } finally { setPatLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#050d1a] text-slate-200 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-3">
          <Link href="/app" className="text-slate-400 hover:text-[#e0a955]"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-[#e0a955]">
            <Brain className="h-5 w-5" /> Digital Twin
          </h1>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[#e0a955]"><Lock size={11} /> Admin only</span>
        </div>
        <p className="mb-5 text-sm text-slate-500">
          Predicts your likely decision from your recorded decisions, and surfaces your decision patterns.
          Quality scales with how many decisions you record — here, or via <code className="text-slate-400">/decide</code> on Telegram/WhatsApp.
        </p>

        {/* Tabs */}
        <div className="mb-5 flex rounded-lg border border-[#1a2235] bg-[#0d2144] p-0.5 text-sm">
          <button
            onClick={() => setTab("simulate")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition ${tab === "simulate" ? "bg-[#e0a955] text-[#071428] font-medium" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Sparkles size={14} /> Simulate a decision
          </button>
          <button
            onClick={() => setTab("patterns")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition ${tab === "patterns" ? "bg-[#e0a955] text-[#071428] font-medium" : "text-slate-400 hover:text-slate-200"}`}
          >
            <Compass size={14} /> Decision patterns
          </button>
          <button
            onClick={() => setTab("record")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 transition ${tab === "record" ? "bg-[#e0a955] text-[#071428] font-medium" : "text-slate-400 hover:text-slate-200"}`}
          >
            <PlusCircle size={14} /> Record a decision
          </button>
        </div>

        {tab === "simulate" && (
          <div>
            <textarea
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="اكتب السيناريو… مثال: هل أوافق على عرض المورّد بزيادة سنوية 12%؟"
              rows={4}
              className="w-full resize-y rounded-xl border border-[#1a2235] bg-[#0a1830] p-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[#e0a955]/50"
            />
            <button
              onClick={runSimulate}
              disabled={simLoading || !scenario.trim()}
              className="mt-3 flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50"
            >
              {simLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Predict
            </button>

            {simNote && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-amber-300">
                <AlertTriangle className="h-4 w-4" /> {simNote}
              </div>
            )}
            {simOut && (
              <div dir={dirOf(simOut)} className="mt-4 whitespace-pre-wrap rounded-xl border border-[#1a2235] bg-[#0a1830] p-4 text-sm leading-relaxed text-slate-200">
                {simOut}
              </div>
            )}
          </div>
        )}

        {tab === "patterns" && (
          <div>
            <button
              onClick={runPatterns}
              disabled={patLoading}
              className="flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50"
            >
              {patLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Compass className="h-4 w-4" />}
              Analyze my decisions
            </button>

            {patNote && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-amber-300">
                <AlertTriangle className="h-4 w-4" /> {patNote}
              </div>
            )}
            {patOut && (
              <div dir={dirOf(patOut)} className="mt-4 whitespace-pre-wrap rounded-xl border border-[#1a2235] bg-[#0a1830] p-4 text-sm leading-relaxed text-slate-200">
                {patOut}
              </div>
            )}
          </div>
        )}
        {tab === "record" && (
          <div>
            <textarea
              value={decisionText}
              onChange={(e) => setDecisionText(e.target.value)}
              placeholder="اكتب القرار + السبب… مثال: اعتمدنا Nutanix بدل VMware — التكلفة أقل والدعم المحلي أقوى"
              rows={4}
              className="w-full resize-y rounded-xl border border-[#1a2235] bg-[#0a1830] p-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[#e0a955]/50"
            />
            <button
              onClick={runRecord}
              disabled={recLoading || !decisionText.trim()}
              className="mt-3 flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50"
            >
              {recLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlusCircle className="h-4 w-4" />}
              Record decision
            </button>
            {recNote && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 ${recOk ? "border-emerald-900/40 bg-emerald-950/30 text-emerald-300" : "border-amber-900/40 bg-amber-950/30 text-amber-300"}`}>
                {recOk ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />} {recNote}
              </div>
            )}
            <p className="mt-3 text-xs text-slate-600">
              The more decisions you record, the sharper the simulation and pattern analysis become.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
