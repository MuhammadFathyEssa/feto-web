"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Brain, Loader2, ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";

const GOLD = "#e0a955";

type Lang = "en" | "ar";
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
  message?: string;
}

const T = {
  en: {
    title: "Personality Assessment",
    intro: "A structured diagnostic interview that maps your motivational structure, leadership pattern, trust model, and executive profile. Answer honestly — there are no right answers.",
    chooseLang: "Choose your language",
    beforeTitle: "Before you begin",
    before: "This is a high-resolution diagnostic — one question at a time, each shaped by your previous answer. It runs through 8 stages and ends with a sharp, unsentimental executive profile. Expect 25+ questions.",
    begin: "Begin assessment",
    stage: "Stage", of: "of", next: "Next",
    preparing: "Preparing your assessment…",
    profile: "Your Executive Profile",
    again: "Take it again",
    retry: "retry",
    back: "Back",
    formatRetry: "Preparing the next question — tap Next.",
  },
  ar: {
    title: "تحليل الشخصية",
    intro: "مقابلة تشخيصية منظّمة تكشف بنيتك الدافعية، نمط قيادتك، نموذج الثقة لديك، وملفك التنفيذي. أجب بصدق — لا توجد إجابات صحيحة أو خاطئة.",
    chooseLang: "اختر لغتك",
    beforeTitle: "قبل أن تبدأ",
    before: "هذا تشخيص عالي الدقة — سؤال واحد في كل مرة، كل سؤال يُبنى على إجابتك السابقة. يمر عبر 8 مراحل وينتهي بملف تنفيذي حاد وصريح. توقّع أكثر من 25 سؤالاً.",
    begin: "ابدأ التحليل",
    stage: "المرحلة", of: "من", next: "التالي",
    preparing: "جاري تحضير التحليل…",
    profile: "ملفك التنفيذي",
    again: "أعد الاختبار",
    retry: "إعادة",
    back: "رجوع",
    formatRetry: "جاري تحضير السؤال التالي — اضغط التالي.",
  },
};

export default function PersonalityPage() {
  const [lang, setLang] = useState<Lang>("en");
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

  const t = T[lang];
  const isRTL = lang === "ar";

  const fetchStep = useCallback(async (history: QA[], language: Lang) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/personality", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: history, lang: language }),
      });
      const data: StepResponse = await res.json();

      // Engine returned a malformed step (no options). Keep the previous question
      // on screen and let the user tap Next to retry — never show an empty question.
      if (!data.success && data.error === "engine_format") {
        setError(T[language].formatRetry);
        return;
      }
      if (!data.success) { setError(data.error || "Something went wrong."); return; }

      if (data.done && data.report) {
        setReport(data.report);
        setQuestion("");
        setOptions([]);
        setProgress(100);
      } else if (Array.isArray(data.options) && data.options.length > 0) {
        setQuestion(data.question || "");
        setOptions(data.options);
        setSelected("");
        if (typeof data.stage === "number") setStage(data.stage);
        if (typeof data.progress === "number") setProgress(data.progress);
      } else {
        // Defensive: options missing despite success — prompt a retry.
        setError(T[language].formatRetry);
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
    fetchStep([], lang);
  }, [fetchStep, lang]);

  const submitAnswer = useCallback(() => {
    if (!selected || !question) return;
    const next = [...answers, { q: question, a: selected }];
    setAnswers(next);
    fetchStep(next, lang);
  }, [selected, question, answers, fetchStep, lang]);

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
    <div className="min-h-screen bg-[#040d1a] text-slate-200" dir={isRTL ? "rtl" : "ltr"}>
      <div className="max-w-2xl mx-auto px-5 py-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-5">
          <ArrowLeft size={16} className={isRTL ? "rotate-180" : ""} /> {t.back}
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <Brain size={26} style={{ color: GOLD }} />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "Playfair Display, serif" }}>{t.title}</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">{t.intro}</p>

        {/* Intro / Language choice / Start */}
        {!started && (
          <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-6">
            {/* Language toggle */}
            <p className="text-xs text-slate-500 mb-2">{t.chooseLang}</p>
            <div className="flex gap-2 mb-5">
              {(["en", "ar"] as Lang[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-5 py-2 rounded-lg border text-sm transition-colors ${
                    lang === l ? "bg-[#e0a955]/12 border-[#e0a955]/60 text-[#e0a955] font-semibold" : "bg-[#040d1a] border-[#1a3f7c]/30 text-slate-300"
                  }`}
                >
                  {l === "en" ? "English" : "العربية"}
                </button>
              ))}
            </div>

            <h2 className="text-lg text-slate-100 mb-2" style={{ fontFamily: "Playfair Display, serif" }}>{t.beforeTitle}</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-4">{t.before}</p>
            <button onClick={start} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-[#e0a955] text-black font-semibold text-sm">
              {t.begin} <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
            </button>
          </div>
        )}

        {/* Progress */}
        {started && !report && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
              <span>{t.stage} {stage} {t.of} 8</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#0a1830] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progress}%`, background: GOLD }} />
            </div>
          </div>
        )}

        {/* Question + radios */}
        {started && !report && question && (
          <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-6">
            <p className="text-base text-slate-100 mb-5 leading-relaxed">{question}</p>
            <div className="grid gap-2.5">
              {options.map((opt, i) => {
                const isSel = selected === opt;
                return (
                  <button key={i} onClick={() => setSelected(opt)}
                    className={`flex items-center gap-3 text-start px-4 py-3 rounded-lg border transition-colors ${
                      isSel ? "bg-[#e0a955]/12 border-[#e0a955]/60" : "bg-[#040d1a] border-[#1a3f7c]/30 hover:border-[#1a3f7c]/60"
                    }`}>
                    <span className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSel ? "border-[#e0a955]" : "border-slate-600"}`}>
                      {isSel && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
                    </span>
                    <span className={`text-sm ${isSel ? "text-[#e0a955]" : "text-slate-300"}`}>{opt}</span>
                  </button>
                );
              })}
            </div>
            <button onClick={submitAnswer} disabled={!selected || loading}
              className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>{t.next} <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} /></>}
            </button>
          </div>
        )}

        {/* Loading first question */}
        {started && !report && !question && loading && (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Loader2 size={20} className="animate-spin mx-auto mb-3" /> {t.preparing}
          </div>
        )}

        {/* Error / format-retry */}
        {error && (
          <div className="mt-4 p-4 rounded-lg bg-[#1e2233] border border-[#e0a955]/30 text-slate-300 text-sm flex items-center gap-2">
            {error}
            <button onClick={() => fetchStep(answers, lang)} className="underline text-[#e0a955]">{t.retry}</button>
          </div>
        )}

        {/* Final report */}
        {report && (
          <div className="rounded-xl bg-[#0a1830] border border-[#e0a955]/30 p-6">
            <h2 className="text-xl mb-4" style={{ fontFamily: "Playfair Display, serif", color: GOLD }}>{t.profile}</h2>
            <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">{report}</div>
            <button onClick={restart} className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-[#1a3f7c]/50 text-slate-300 hover:border-[#e0a955]/50 text-sm">
              <RotateCcw size={15} /> {t.again}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
