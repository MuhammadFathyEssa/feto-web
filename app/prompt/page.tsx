"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, Sparkles, Loader2, Copy, Check, Wand2,
} from "lucide-react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { extractReply } from "@/lib/api";

// Depth presets — how elaborate the generated prompt template should be.
type Depth = "quick" | "standard" | "master";

const DEPTH_META: { key: Depth; label: string; hint: string }[] = [
  { key: "quick",    label: "Quick",    hint: "Compact, fill-in-the-blanks prompt" },
  { key: "standard", label: "Standard", hint: "Full structured prompt, ready to use" },
  { key: "master",   label: "Master",   hint: "Master template + short + fill-in + examples" },
];

// The prompt-architect instruction. The user's statement is the objective; the
// model returns a world-class, structured prompt built around it.
function buildArchitectMessage(statement: string, depth: Depth): string {
  const base = [
    "Act as a world-class prompt architect and domain expert.",
    "Convert the user's statement below into a professional, high-performance, reusable prompt that will make any capable AI model produce a clear, accurate, detailed, and well-structured result.",
    "",
    `USER STATEMENT (the objective to build a prompt for):\n"""\n${statement.trim()}\n"""`,
    "",
    "Build the prompt with these sections, adapted to the statement (omit a section only if it genuinely does not apply):",
    "- Role / Persona: the exact expert role the AI should assume",
    "- Objective: precisely what is to be achieved",
    "- Context: background, audience, constraints, situation, relevant facts",
    "- Inputs: the information/documents/data the user will supply",
    "- Scope: what to include and what to exclude",
    "- Output Format: structure, sections, tables/bullets, tone, length",
    "- Quality Standards: how a strong answer is judged",
    "- Reasoning Requirements: structured, evidence-based thinking (without exposing hidden chain-of-thought)",
    "- Assumptions: instruct the AI to state assumptions when information is missing",
    "- Constraints: accuracy, citations, confidentiality, tone, limitations",
    "- Review Layer: instruct the AI to self-check for completeness, consistency, risk, ambiguity, usefulness",
    "",
    "Rules: be direct and practical, no fluff, no generic filler. Make the prompt immediately usable. Design it to reduce hallucinations and improve structure, depth, and accuracy. Infer a sensible expert role and output format from the statement rather than leaving placeholders vague.",
  ];

  if (depth === "quick") {
    base.push("", "DELIVERABLE: a single compact fill-in-the-blanks version of the prompt only. Keep it short and immediately usable.");
  } else if (depth === "standard") {
    base.push("", "DELIVERABLE: one complete, polished prompt built for this specific statement, fully written out (not a template with blanks). Ready to paste into any AI model.");
  } else {
    base.push(
      "",
      "DELIVERABLES (label each clearly):",
      "1. Master prompt — the full structured prompt for this statement",
      "2. Short version — a compact version for quick use",
      "3. Fill-in-the-blanks version — with clearly marked [PLACEHOLDERS]",
      "4. Customisation guidance — 3-5 lines on adapting it",
    );
  }

  base.push("", "Output the prompt(s) in clean Markdown. Do not add commentary before or after — return only the prompt deliverable(s).");
  return base.join("\n");
}

export default function PromptStudioPage() {
  const authState = useAuthGuard();
  const [statement, setStatement] = useState("");
  const [depth, setDepth] = useState<Depth>("standard");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const ready = statement.trim().length >= 5;

  async function generate() {
    if (!ready || loading) return;
    setLoading(true); setNote(""); setOutput("");
    try {
      const r = await fetch("/api/proxy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // content agent = strong long-form writer; the architect instruction carries the task
        body: JSON.stringify({ message: buildArchitectMessage(statement, depth), agentType: "content" }),
      });
      const d = await r.json();
      if (r.status === 401) { setNote("Sign in to generate prompts."); return; }
      if (d.success === false) { setNote(d.error || "Generation failed."); return; }
      setOutput(extractReply(d) || "No response.");
    } catch { setNote("Network error — please retry."); }
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
        <Link href="/app" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
          <ArrowLeft className="h-4 w-4" /> Back to FeTo
        </Link>

        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-xl bg-[#0d2144] p-2.5"><Sparkles className="h-5 w-5 text-[#e0a955]" /></div>
          <div>
            <h1 className="text-xl font-semibold text-slate-100">Prompt Studio</h1>
            <p className="text-sm text-slate-500">Turn any statement into a world-class, structured prompt.</p>
          </div>
        </div>

        {/* Input */}
        <label className="mb-2 block text-sm font-medium text-slate-300">Your statement or goal</label>
        <textarea
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          rows={5}
          placeholder="e.g. I need to write a board memo recommending we migrate core banking from VMware to Nutanix. / Analyze a vendor's SLA for gaps. / Draft a cold outreach email to a fintech CEO."
          className="w-full resize-y rounded-lg border border-[#0d2144] bg-[#071b34] px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 focus:border-[#e0a955]/50 focus:outline-none"
        />

        {/* Depth selector */}
        <div className="mt-4 flex flex-wrap gap-2">
          {DEPTH_META.map(({ key, label, hint }) => (
            <button
              key={key}
              onClick={() => setDepth(key)}
              title={hint}
              className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                depth === key
                  ? "border-[#e0a955]/60 bg-[#e0a955]/10 text-[#e0a955]"
                  : "border-[#0d2144] bg-[#071b34] text-slate-400 hover:text-slate-200"
              }`}
            >
              <span className="font-medium">{label}</span>
              <span className="ml-2 hidden text-xs text-slate-500 sm:inline">{hint}</span>
            </button>
          ))}
        </div>

        {/* Generate */}
        <button
          onClick={generate}
          disabled={!ready || loading}
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2.5 text-sm font-semibold text-[#071428] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          {loading ? "Architecting…" : "Generate prompt"}
        </button>

        {note && <p className="mt-3 text-sm text-amber-400/80">{note}</p>}

        {/* Output */}
        {output && (
          <div className="mt-6 rounded-xl border border-[#0d2144] bg-[#071b34]">
            <div className="flex items-center justify-between border-b border-[#0d2144] px-4 py-2.5">
              <span className="text-sm font-medium text-slate-300">Generated prompt</span>
              <button onClick={copyOut} className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-[#0d2144] hover:text-slate-200">
                {copied ? <><Check className="h-3.5 w-3.5" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
              </button>
            </div>
            <pre className="whitespace-pre-wrap px-4 py-4 text-sm leading-relaxed text-slate-300">{output}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
