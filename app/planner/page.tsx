"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, GitBranch, Lock, Loader2, Sparkles, AlertTriangle, ShieldCheck, CornerDownRight } from "lucide-react";

type Phase = {
  id: string; name: string; tasks: string[]; dependsOn: string[]; humanApproval: boolean; risks: string[];
};
type Plan = {
  intent: string; phases: Phase[]; overallRisks: string[]; informedBy: string[]; grounded: boolean;
};

const dir = (s: string) => (/[\u0600-\u06FF]/.test(s) ? "rtl" : "ltr");

export default function PlannerPage() {
  const [intent, setIntent] = useState("");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");

  async function generate() {
    if (!intent.trim() || loading) return;
    setLoading(true); setNote(""); setPlan(null);
    try {
      const r = await fetch("/api/proxy/planner", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: intent.trim() }),
      });
      const d = await r.json();
      if (r.status === 403) { setNote("Admin access required."); return; }
      if (d.success) {
        setPlan(d.plan);
        if (!d.plan.phases.length) setNote("Could not generate a plan — try a clearer intent.");
      } else setNote(d.error || "Plan failed.");
    } catch { setNote("Network error — try again."); }
    finally { setLoading(false); }
  }

  return (
    <div className="min-h-screen bg-[#050d1a] text-slate-200 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-3">
          <Link href="/app" className="text-slate-400 hover:text-[#e0a955]"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-[#e0a955]"><GitBranch className="h-5 w-5" /> Planner <span className="rounded bg-[#1a2235] px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-slate-400">POC</span></h1>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[#e0a955]"><Lock size={11} /> Admin only</span>
        </div>
        <p className="mb-5 text-sm text-slate-500">
          Turns an intent into a phased execution plan with dependencies, approval gates, and risks —
          grounded in your past decisions. Generates a plan only (no execution yet).
        </p>

        <textarea value={intent} onChange={(e) => setIntent(e.target.value)} rows={3}
          placeholder="اكتب الهدف… مثال: نفّذ تطبيق Circular جديد للبنك متوافق مع متطلبات البنك المركزي."
          className="w-full resize-y rounded-xl border border-[#1a2235] bg-[#0a1830] p-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[#e0a955]/50" />
        <button onClick={generate} disabled={loading || !intent.trim()}
          className="mt-3 flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate plan
        </button>

        {note && (
          <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-amber-300">
            <AlertTriangle className="h-4 w-4" /> {note}
          </div>
        )}

        {plan && plan.phases.length > 0 && (
          <div className="mt-6 space-y-3">
            {plan.grounded && plan.informedBy.length > 0 && (
              <div className="rounded-lg border border-[#1a2235] bg-[#0d2144]/40 px-4 py-3 text-xs text-slate-400" dir={dir(plan.informedBy[0] || "")}>
                <span className="text-[#e0a955]">Grounded in past decisions:</span> {plan.informedBy.join(" · ")}
              </div>
            )}

            {plan.phases.map((p, i) => (
              <div key={p.id} className="rounded-xl border border-[#1a2235] bg-[#0a1830] p-4" dir={dir(p.name)}>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded bg-[#e0a955]/15 px-2 py-0.5 text-xs font-medium text-[#e0a955]">{p.id}</span>
                  <span className="text-sm font-medium text-slate-100">{p.name}</span>
                  {p.humanApproval && (
                    <span className="ml-auto flex items-center gap-1 rounded bg-[#7c6cff]/15 px-2 py-0.5 text-[11px] text-[#a99cff]">
                      <ShieldCheck size={11} /> approval gate
                    </span>
                  )}
                </div>
                {p.dependsOn.length > 0 && (
                  <div className="mb-2 text-xs text-slate-500">depends on: {p.dependsOn.join(", ")}</div>
                )}
                <ul className="space-y-1">
                  {p.tasks.map((t, j) => (
                    <li key={j} className="flex items-start gap-2 text-sm text-slate-300">
                      <CornerDownRight size={13} className="mt-0.5 shrink-0 text-slate-600" /> {t}
                    </li>
                  ))}
                </ul>
                {p.risks.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.risks.map((r, k) => (
                      <span key={k} className="rounded bg-amber-950/40 px-2 py-0.5 text-[11px] text-amber-300">{r}</span>
                    ))}
                  </div>
                )}
                {i < plan.phases.length - 1 && <div className="mt-3 ml-3 h-3 w-px bg-[#1a2235]" />}
              </div>
            ))}

            {plan.overallRisks.length > 0 && (
              <div className="rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-300"><AlertTriangle size={14} /> Overall risks</div>
                <ul className="list-inside list-disc text-sm text-amber-200/90">
                  {plan.overallRisks.map((r, i) => <li key={i}>{r}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
