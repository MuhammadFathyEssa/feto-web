"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Brain, Loader2, ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";

const GOLD = "#e0a955";

interface QA { q: string; a: string; }
interface StepResponse {
  success: boolean;
  done?: boolean;
  question?: string;
  options?: string[];
  stage?: number;
  progress?: number;
  report?: string;
  error?: string;
}

export default function PersonalityPage() {
  const [answers, setAnswers] = useState<QA[]>([]);
  const [question, setQuestion] = useState<string>("");
  const [options, setOptions] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [stage, setStage] = useState<number>(1);
  const [progress, setProgress] = useState<number>(0);
  const [report, setReport] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [started, setStarted] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Fetch the next step from the engine given the running answer history.
  const fetchStep = useCallback(async (history: QA[]) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: history }),
      });
      const data: StepResponse = await res.json();
      if (!data.success) { setError(data.error || "Something went wrong."); return; }

      if (data.done && data.report) {
        setReport(data.report);
        setQuestion("");
        setOptions([]);
        setProgress(100);
      } else {
        setQuestion(data.question || "");
        setOptions(data.options || []);
        setSelected("");
        if (typeof data.stage === "number") setStage(data.stage);
        if (typeof data.progress === "number") setProgress(data.progress);
      }
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    setAnswers([]);
    setReport("");
    fetchStep([]);
  }, [fetchStep]);

  const submitAnswer = useCallback(() => {
    if (!selected || !question) return;
    const next = [...answers, { q: question, a: selected }];
    setAnswers(next);
    fetchStep(next);
  }, [selected, question, answers, fetchStep]);

  const restart = useCallback(() => {
    setStarted(false);
    setAnswers([]);
    setQuestion("");
    setOptions([]);
    setSelected("");
    setReport("");
    setProgress(0);
    setStage(1);
    setError("");
  }, []);

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <div className="max-w-2xl mx-auto px-5 py-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-5">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <Brain size={26} style={{ color: GOLD }} />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "Playfair Display, serif" }}>Personality Assessment</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          A structured diagnostic interview that maps your motivational structure, leadership pattern, trust model, and executive profile. Answer honestly — there are no right answers.
        </p>

        {/* Intro / Start */}
        {!started && (
          <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-6">
            <h2 className="text-lg text-slate-100 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>Before you begin</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">
              This is a high-resolution diagnostic — one question at a time, each shaped by your previous answer. It runs through 8 stages and ends with a sharp, unsentimental executive profile. Expect 25+ questions. Be direct; the engine reads contradiction as data.
            </p>
            <button
              onClick={start}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#e0a955] text-black font-semibold text-sm"
            >
              Begin assessment <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Progress bar */}
        {started && !report && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>Stage {stage} of 8</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#0a1830] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: GOLD }} />
            </div>
          </div>
        )}

        {/* Question + radio options */}
        {started && !report && question && (
          <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-6">
            <p className="text-base text-slate-100 mb-5 leading-relaxed">{question}</p>
            <div className="grid gap-2.5">
              {options.map((opt, i) => {
                const isSel = selected === opt;
                return (
                  <button
                    key={i}
                    onClick={() => setSelected(opt)}
                    className={`flex items-center gap-3 text-left px-4 py-3 rounded-lg border transition-colors ${
                      isSel
                        ? "bg-[#e0a955]/12 border-[#e0a955]/60"
                        : "bg-[#040d1a] border-[#1a3f7c]/30 hover:border-[#1a3f7c]/60"
                    }`}
                  >
                    <span
                      className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        isSel ? "border-[#e0a955]" : "border-slate-600"
                      }`}
                    >
                      {isSel && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                    </span>
                    <span className={`text-sm ${isSel ? "text-[#e0a955]" : "text-slate-300"}`}>{opt}</span>
                  </button>
                );
              })}
            </div>

            {options.length === 0 && (
              <p className="text-xs text-slate-500 mt-3">This question is open-ended — the engine will continue once you respond in the app.</p>
            )}

            <button
              onClick={submitAnswer}
              disabled={!selected || loading}
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>Next <ChevronRight size={16} /></>}
            </button>
          </div>
        )}

        {/* Loading first question */}
        {started && !report && !question && loading && (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Loader2 size={20} className="animate-spin mx-auto mb-3" /> Preparing your assessment…
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-[#1e2233] border border-red-500/30 text-slate-300 text-sm">
            {error}
            <button onClick={() => fetchStep(answers)} className="ml-2 underline text-[#e0a955]">retry</button>
          </div>
        )}

        {/* Final report */}
        {report && (
          <div className="rounded-xl bg-[#0a1830] border border-[#e0a955]/30 p-6">
            <h2 className="text-xl mb-4" style={{ fontFamily: "Playfair Display, serif", color: GOLD }}>Your Executive Profile</h2>
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{report}</div>
            <button
              onClick={restart}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1a3f7c]/50 text-slate-300 hover:border-[#e0a955]/50 text-sm"
            >
              <RotateCcw size={15} /> Take it again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
