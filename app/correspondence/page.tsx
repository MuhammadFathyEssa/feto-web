"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Mail, Loader2, Sparkles, AlertTriangle, Copy, Check,
  FileText, Workflow, Lightbulb, ShieldAlert, ArrowRight,
} from "lucide-react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { extractReply } from "@/lib/api";

const dir = (s: string) => (/[\u0600-\u06FF]/.test(s) ? "rtl" : "ltr");

const EXAMPLES = [
  "Draft an email to a vendor escalating a 3-week delivery delay on a system migration, firm but professional.",
  "اكتب إيميل رسمي بالإنجليزي للمجلس عن نتائج الربع الثالث مع طلب اجتماع للمناقشة.",
  "Rewrite this to sound more executive: 'hey, just checking if you got my last email about the budget thing?'",
  "Reply declining a meeting invitation politely while proposing an alternative time next week.",
];

export default function CorrespondencePage() {
  const authState = useAuthGuard();
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!input.trim() || loading) return;
    setLoading(true); setNote(""); setOutput("");
    try {
      const r = await fetch("/api/proxy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), agentType: "correspondence" }),
      });
      const d = await r.json();
      if (r.status === 401) { setNote("Sign in to try the live composer."); return; }
      if (d.success === false) { setNote(d.error || "Request failed."); return; }
      setOutput(extractReply(d) || "No response.");
    } catch { setNote("Network error — try again."); }
    finally { setLoading(false); }
  }

  async function copyOut() {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  }

  if (authState === "checking") {
    return <div className="min-h-screen bg-[#071428] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-[#e0a955]" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#071428] text-slate-200 feto-atmosphere">
      <div className="mx-auto max-w-4xl px-5 py-8">
        {/* Header */}
        <Link href="/app" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Back to FeTo
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-xl border border-[#e0a955]/30 bg-[#e0a955]/10 p-3">
            <Mail className="h-6 w-6 text-[#e0a955]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-100">Executive Correspondence</h1>
            <p className="mt-1 text-sm text-slate-400">
              English business email at C-suite standard — drafted, replied, or rewritten. Arabic in, executive Business English out.
            </p>
          </div>
        </div>

        {/* Live composer */}
        <section className="mb-10 rounded-2xl border border-[#1a2235] bg-[#0a1830]/60 p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[#e0a955]">
            <Sparkles className="h-4 w-4" /> Try it live
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            dir={dir(input)}
            rows={4}
            placeholder="Describe the email you need — the situation, the recipient, the tone. Arabic or English."
            className="w-full resize-y rounded-xl border border-[#1a2235] bg-[#0a1830] p-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[#e0a955]/50"
          />
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLES.map((ex, i) => (
              <button key={i} onClick={() => setInput(ex)}
                className="rounded-lg border border-[#1a2235] bg-[#0d2144]/40 px-2.5 py-1 text-left text-[11px] text-slate-400 hover:border-[#e0a955]/40 hover:text-slate-200"
                dir={dir(ex)}>
                {ex.length > 54 ? ex.slice(0, 54) + "…" : ex}
              </button>
            ))}
          </div>
          <button onClick={generate} disabled={loading || !input.trim()}
            className="mt-3 flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Compose
          </button>

          {note && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
              <AlertTriangle className="h-4 w-4" /> {note}
            </div>
          )}

          {output && (
            <div className="mt-4 rounded-xl border border-[#1a2235] bg-[#0a1830] p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs font-medium text-[#e0a955]">Draft</span>
                <button onClick={copyOut} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
                  {copied ? <><Check className="h-3 w-3" /> Copied</> : <><Copy className="h-3 w-3" /> Copy</>}
                </button>
              </div>
              <pre dir={dir(output)} className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">{output}</pre>
            </div>
          )}
        </section>

        {/* What it does */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
            <FileText className="h-4 w-4 text-[#e0a955]" /> What it does
          </div>
          <p className="text-sm leading-relaxed text-slate-400">
            Produces professional English business correspondence that reads as authored by a senior executive —
            precise, correctly toned, and natural, never literally translated and never native-casual. It drafts new
            email, replies to received email, forwards with framing, rewrites for tone, and converts an Arabic message
            into executive Business English. Every output follows a fixed structure and closes with Communication Notes
            explaining the tone, formality, and any idioms used.
          </p>
        </section>

        {/* When to use */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Lightbulb className="h-4 w-4 text-[#e0a955]" /> When to use it
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "Vendor escalations and follow-ups",
              "Board, committee, and regulator correspondence",
              "Apologies, confirmations, and status updates",
              "Declining or rescheduling professionally",
              "Turning a rough Arabic note into a polished English email",
              "Tone-shifting a casual draft to executive register",
            ].map((t, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border border-[#1a2235] bg-[#0a1830]/50 px-3 py-2 text-sm text-slate-300">
                <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#e0a955]" /> {t}
              </div>
            ))}
          </div>
        </section>

        {/* How it works — workflow */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Workflow className="h-4 w-4 text-[#e0a955]" /> How it works
          </div>
          <div className="space-y-2">
            {[
              ["Analyze", "Fix the objective, audience, formality level, required action, and sensitivity."],
              ["Standardize terms", "Select the technical, managerial, HR, or legal vocabulary the message needs."],
              ["Compose", "Write in executive register — active voice, short sentences, no filler or literal translation."],
              ["Refine", "Add an idiom or proverb only if it sharpens the message; otherwise omit."],
              ["Quality pass", "Verify grammar, tone, clarity, brevity, and cultural fit."],
            ].map(([step, desc], i, arr) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[#e0a955]/40 bg-[#e0a955]/10 text-xs font-medium text-[#e0a955]">{i + 1}</span>
                  {i < arr.length - 1 && <div className="my-1 h-full w-px bg-[#1a2235]" />}
                </div>
                <div className="pb-3">
                  <div className="text-sm font-medium text-slate-200">{step}</div>
                  <div className="text-xs text-slate-500">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Inputs / Outputs */}
        <section className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-[#1a2235] bg-[#0a1830]/50 p-4">
            <div className="mb-2 text-sm font-medium text-[#e0a955]">Inputs</div>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li>• The situation or goal of the email</li>
              <li>• Recipient and relationship (vendor, board, peer)</li>
              <li>• Desired tone or formality (optional)</li>
              <li>• A received email to reply to, or a rough draft to rewrite</li>
              <li>• Arabic or English — either works</li>
            </ul>
          </div>
          <div className="rounded-xl border border-[#1a2235] bg-[#0a1830]/50 p-4">
            <div className="mb-2 text-sm font-medium text-[#e0a955]">Outputs</div>
            <ul className="space-y-1.5 text-sm text-slate-400">
              <li>• Subject line</li>
              <li>• Structured email: opening, body, closing</li>
              <li>• Communication Notes: tone, formality, vocabulary</li>
              <li>• More formal alternatives where relevant</li>
            </ul>
          </div>
        </section>

        {/* Best practices */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Sparkles className="h-4 w-4 text-[#e0a955]" /> Best practices
          </div>
          <div className="space-y-2 text-sm text-slate-400">
            <p>• Give the recipient and the stakes — "vendor, 3-week delay, firm" produces a sharper email than "write about the delay".</p>
            <p>• Paste the email you are replying to; the agent matches its register and answers its points.</p>
            <p>• State the tone if it matters: firm, warm, apologetic, neutral.</p>
            <p>• For Arabic proverbs, the agent renders the English equivalent — supply the proverb, not a literal translation.</p>
          </div>
        </section>

        {/* Limits */}
        <section className="mb-6 rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-300">
            <ShieldAlert className="h-4 w-4" /> Limits
          </div>
          <ul className="space-y-1.5 text-sm text-amber-200/90">
            <li>• Does not invent facts, figures, or citations — supply the numbers you want cited.</li>
            <li>• Does not draft binding legal text unsupported by the context you provide.</li>
            <li>• Not for stories, articles, marketing copy, or casual chat — email correspondence only.</li>
            <li>• American English by default; specify if you need British.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
