"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, GraduationCap, Loader2, Send,
  CheckCircle2, ChevronRight, RotateCcw, BookOpen
} from "lucide-react";

const GOLD = "#e0a955";
type Lang = "ar" | "en";
type Phase = "topic" | "discovery" | "learning";
interface Turn { role: "user" | "assistant"; content: string; }

// ── Translations ──────────────────────────────────────────────
const T = {
  ar: {
    title: "علمني",
    chooseLang: "اختر لغتك",
    topicTitle: "ايه اللي عايز تتعلّمه؟",
    topicSub: "أكتب الموضوع — هيعلّمك خطوة بخطوة ويختبرك.",
    topicPlaceholder: "مثال: quantum encryption، neural networks، TCP/IP",
    topicBtn: "التالي",
    qProgress: (n: number, t: number) => `سؤال ${n} من ${t}`,
    startBtn: "ابدأ التعلّم",
    nextBtn: "التالي",
    readyBtn: "جاهز للاختبار",
    nextLessonBtn: "الدرس الجاي",
    inputPlaceholder: "اسأل أي سؤال أو اكتب إجابتك…",
    back: "رجوع",
  },
  en: {
    title: "Learn",
    chooseLang: "Choose your language",
    topicTitle: "What do you want to learn?",
    topicSub: "Enter a topic — you'll be taught step by step and tested.",
    topicPlaceholder: "e.g. quantum encryption, neural networks, TCP/IP",
    topicBtn: "Next",
    qProgress: (n: number, t: number) => `Question ${n} of ${t}`,
    startBtn: "Start Learning",
    nextBtn: "Next",
    readyBtn: "I'm ready to be tested",
    nextLessonBtn: "Next lesson",
    inputPlaceholder: "Ask a question or write your answer…",
    back: "Back",
  },
};

const DISCOVERY: Record<Lang, { id: string; q: string; options: string[] }[]> = {
  ar: [
    {
      id: "level",
      q: "مستواك الحالي في الموضوع ده؟",
      options: ["مبتدئ — من الصفر", "متوسط — عندي خلفية أساسية", "متقدم — فاهم الأساسيات"],
    },
    {
      id: "goal",
      q: "هدفك من التعلم؟",
      options: ["فهم نظري — المبادئ والمفاهيم", "تطبيق عملي — أبني حاجة", "أساس رياضي عميق", "بحث أكاديمي أو تقني"],
    },
    {
      id: "style",
      q: "أسلوب التعلم المفضل عندك؟",
      options: [
        "Intuition-first — تشبيهات وصور ذهنية أولاً",
        "Math-first — معادلات ونظريات أولاً",
        "Code-first — كود وأمثلة عملية أولاً",
        "Mixed — مزيج متوازن",
      ],
    },
    {
      id: "time",
      q: "وقتك لكل خطوة؟",
      options: ["20-30 دقيقة", "45-60 دقيقة", "أكتر من ساعة"],
    },
    {
      id: "tools",
      q: "أدواتك المتاحة؟",
      options: [
        "متصفح (أقدر أشغّل كود تفاعلي)",
        "Python محلي",
        "Google Colab",
        "مافيش — نظري فقط",
      ],
    },
  ],
  en: [
    {
      id: "level",
      q: "What is your current level in this topic?",
      options: ["Beginner — starting from scratch", "Intermediate — I have some background", "Advanced — I know the basics"],
    },
    {
      id: "goal",
      q: "What is your learning goal?",
      options: ["Conceptual understanding — principles and ideas", "Practical application — I want to build something", "Deep mathematical foundation", "Academic or technical research"],
    },
    {
      id: "style",
      q: "What is your preferred learning style?",
      options: [
        "Intuition-first — analogies and mental models first",
        "Math-first — equations and theory first",
        "Code-first — code and practical examples first",
        "Mixed — a balanced combination",
      ],
    },
    {
      id: "time",
      q: "How much time per step?",
      options: ["20-30 minutes", "45-60 minutes", "More than an hour"],
    },
    {
      id: "tools",
      q: "What tools do you have available?",
      options: ["Browser (can run interactive code)", "Local Python", "Google Colab", "None — theory only"],
    },
  ],
};

// ── Sub-components ────────────────────────────────────────────
function MDContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-slate-100 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1.5
      prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-1.5
      prose-code:text-[#e0a955] prose-code:bg-[#0a1830] prose-code:px-1 prose-code:rounded prose-code:text-xs
      prose-pre:bg-[#040d1a] prose-pre:border prose-pre:border-[#1a3f7c]/40 prose-pre:rounded-lg
      prose-strong:text-slate-100
      prose-ul:text-slate-300 prose-ul:my-1.5 prose-ol:text-slate-300
      prose-li:marker:text-[#e0a955] prose-li:my-0.5
      prose-blockquote:border-[#e0a955]/40 prose-blockquote:text-slate-400 prose-blockquote:my-2">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

function RadioOpt({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 text-start px-4 py-3 rounded-lg border transition-colors ${
        selected ? "bg-[#e0a955]/12 border-[#e0a955]/60" : "bg-[#040d1a] border-[#1a3f7c]/30 hover:border-[#1a3f7c]/60"
      }`}>
      <span className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? "border-[#e0a955]" : "border-slate-600"}`}>
        {selected && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
      </span>
      <span className={`text-sm ${selected ? "text-[#e0a955]" : "text-slate-300"}`}>{label}</span>
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function LearnPage() {
  const [lang, setLang]       = useState<Lang>("ar");
  const [phase, setPhase]     = useState<Phase>("topic");
  const [topic, setTopic]     = useState("");
  const [step, setStep]       = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [turns, setTurns]     = useState<Turn[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const t = T[lang];
  const isRTL = lang === "ar";
  const questions = DISCOVERY[lang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [turns, loading, step]);

  const lastAssistant = [...turns].reverse().find(x => x.role === "assistant")?.content ?? "";
  const isLesson = /خد وقتك|ولما تكون جاهز|when you('| a)re ready|say\s*ready/i.test(lastAssistant);
  const isEval   = /score:|الدرجة:|تقييم|الدرس الجاي|next step|next lesson/i.test(lastAssistant);

  async function callTutor(message: string, history: Turn[]) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/proxy/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lang }),
      });
      const data = await res.json();
      const reply = data.reply || data.response || data.error || "No response";
      setTurns([...history, { role: "assistant", content: reply }]);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startDiscovery() {
    if (!topic.trim()) return;
    setPhase("discovery"); setStep(0);
  }

  function selectAnswer(qid: string, opt: string) {
    setAnswers(prev => ({ ...prev, [qid]: opt }));
  }

  function nextQuestion() {
    if (step < questions.length - 1) {
      setStep(s => s + 1);
    } else {
      // Build structured message for the tutor
      const lines = questions.map((q, i) => `${i + 1}. ${q.q} → ${answers[q.id]}`).join("\n");
      const msg = lang === "ar"
        ? `علمني "${topic}" خطوة بخطوة وامتحني.\n\nإجاباتي على أسئلة الاكتشاف:\n${lines}\n\nالرجاء الرد باللغة العربية.`
        : `Teach me "${topic}" step by step and test me.\n\nMy discovery answers:\n${lines}\n\nPlease respond in English.`;
      const userTurn: Turn = { role: "user", content: msg };
      setTurns([userTurn]);
      setPhase("learning");
      callTutor(msg, [userTurn]);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userTurn: Turn = { role: "user", content: input };
    const newTurns = [...turns, userTurn];
    setTurns(newTurns); setInput("");
    await callTutor(input, newTurns);
  }

  function restart() {
    setPhase("topic"); setTopic(""); setStep(0); setAnswers({});
    setTurns([]); setInput(""); setError("");
  }

  const curQ = questions[step];
  const curAns = answers[curQ?.id ?? ""] ?? "";

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200 flex flex-col" dir={isRTL ? "rtl" : "ltr"}>

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a3f7c]/30 flex-shrink-0">
        <Link href="/app" className="text-slate-400 hover:text-slate-200">
          <ArrowLeft size={18} className={isRTL ? "rotate-180" : ""} />
        </Link>
        <GraduationCap size={22} style={{ color: GOLD }} />
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>{t.title}</h1>
        {topic && phase !== "topic" && (
          <span className="mx-2 text-xs text-slate-500 truncate max-w-[120px]">{topic}</span>
        )}
        {phase !== "topic" && (
          <button onClick={restart} className="ms-auto text-slate-500 hover:text-slate-300">
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* ── TOPIC PHASE ── */}
      {phase === "topic" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#e0a955]/10 border border-[#e0a955]/30 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                {t.topicTitle}
              </h2>
              <p className="text-slate-400 text-sm">{t.topicSub}</p>
            </div>

            <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5">
              {/* Language toggle */}
              <p className="text-xs text-slate-500 mb-2">{t.chooseLang}</p>
              <div className="flex gap-2 mb-5">
                {(["ar", "en"] as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-5 py-2 rounded-lg border text-sm transition-colors ${
                      lang === l ? "bg-[#e0a955]/12 border-[#e0a955]/60 text-[#e0a955] font-semibold" : "bg-[#040d1a] border-[#1a3f7c]/30 text-slate-300"
                    }`}>
                    {l === "ar" ? "العربية" : "English"}
                  </button>
                ))}
              </div>

              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && startDiscovery()}
                placeholder={t.topicPlaceholder}
                dir="auto"
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 text-sm outline-none mb-4"
                autoFocus
              />
              <button onClick={startDiscovery} disabled={!topic.trim()}
                className="w-full py-3 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {t.topicBtn} <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DISCOVERY PHASE ── */}
      {phase === "discovery" && curQ && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
          <div className="w-full max-w-lg">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>{t.qProgress(step + 1, questions.length)}</span>
                <span>{Math.round((step / questions.length) * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#0a1830]">
                <div className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${(step / questions.length) * 100}%`, background: GOLD }} />
              </div>
            </div>

            <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5">
              <p className="text-slate-100 font-medium mb-4">{curQ.q}</p>
              <div className="grid gap-2.5 mb-5">
                {curQ.options.map(opt => (
                  <RadioOpt key={opt} label={opt} selected={curAns === opt}
                    onClick={() => selectAnswer(curQ.id, opt)} />
                ))}
              </div>
              <button onClick={nextQuestion} disabled={!curAns}
                className="w-full py-2.5 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {step < questions.length - 1
                  ? <>{t.nextBtn} <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} /></>
                  : <>{t.startBtn} <BookOpen size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── LEARNING PHASE ── */}
      {phase === "learning" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {turns.filter(x => x.role === "assistant").map((turn, i) => (
              <div key={i} className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-[#0a1830] border border-[#1a3f7c]/40 px-5 py-4">
                  <MDContent content={turn.content} />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="px-5 py-4 rounded-2xl rounded-tl-sm bg-[#0a1830] border border-[#1a3f7c]/40">
                  <Loader2 size={16} className="animate-spin text-[#e0a955]" />
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-400 px-2">
                {error} <button onClick={() => callTutor(input || "retry", turns)} className="underline ms-1">retry</button>
              </p>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Phase-aware buttons */}
          {!loading && lastAssistant && (
            <div className={`px-4 pb-2 flex gap-2 ${isRTL ? "flex-row-reverse" : ""}`}>
              {isLesson && (
                <button onClick={() => {
                  const msg = isRTL ? "جاهز للاختبار" : "I'm ready to be tested";
                  const ut: Turn = { role: "user", content: msg };
                  const nt = [...turns, ut]; setTurns(nt);
                  callTutor(msg, nt);
                }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                  <CheckCircle2 size={14} /> {t.readyBtn}
                </button>
              )}
              {isEval && (
                <button onClick={() => {
                  const msg = isRTL ? "الخطوة اللي جاية" : "Next lesson";
                  const ut: Turn = { role: "user", content: msg };
                  const nt = [...turns, ut]; setTurns(nt);
                  callTutor(msg, nt);
                }} className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                  <BookOpen size={14} /> {t.nextLessonBtn}
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-5 pt-2 border-t border-[#1a3f7c]/20 flex-shrink-0">
            <div className={`flex gap-2 items-end rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 px-4 py-3 ${isRTL ? "flex-row-reverse" : ""}`}>
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder={t.inputPlaceholder}
                rows={2} dir="auto"
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none"
              />
              <button onClick={sendMessage} disabled={!input.trim() || loading}
                className="p-2 rounded-lg bg-[#e0a955] text-black disabled:opacity-40">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
