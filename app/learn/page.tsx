"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, GraduationCap, Loader2, Send,
  CheckCircle2, ChevronRight, RotateCcw, BookOpen
} from "lucide-react";

const GOLD = "#e0a955";

type Phase = "topic" | "discovery" | "learning" | "done";
interface Turn { role: "user" | "assistant"; content: string; }

const DISCOVERY_QUESTIONS = [
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
    options: ["Intuition-first — تشبيهات وصور ذهنية أولاً", "Math-first — معادلات ونظريات أولاً", "Code-first — كود وأمثلة عملية أولاً", "Mixed — مزيج متوازن"],
  },
  {
    id: "time",
    q: "وقتك لكل خطوة؟",
    options: ["20-30 دقيقة", "45-60 دقيقة", "أكتر من ساعة"],
  },
  {
    id: "tools",
    q: "أدواتك المتاحة؟",
    options: ["متصفح (أقدر أشغّل كود تفاعلي)", "Python محلي", "Google Colab", "مافيش — نظري فقط"],
  },
];

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

function RadioOption({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 text-start px-4 py-3 rounded-lg border transition-colors ${
        selected
          ? "bg-[#e0a955]/12 border-[#e0a955]/60"
          : "bg-[#040d1a] border-[#1a3f7c]/30 hover:border-[#1a3f7c]/60"
      }`}
    >
      <span className={`shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${selected ? "border-[#e0a955]" : "border-slate-600"}`}>
        {selected && <span className="w-2 h-2 rounded-full" style={{ background: GOLD }} />}
      </span>
      <span className={`text-sm ${selected ? "text-[#e0a955]" : "text-slate-300"}`}>{label}</span>
    </button>
  );
}

export default function LearnPage() {
  const [phase, setPhase]     = useState<Phase>("topic");
  const [topic, setTopic]     = useState("");
  const [step, setStep]       = useState(0); // discovery question index
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [turns, setTurns]     = useState<Turn[]>([]);
  const [input, setInput]     = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, loading, step]);

  const lastAssistant = [...turns].reverse().find(t => t.role === "assistant")?.content ?? "";
  const isLesson = /خد وقتك|ولما تكون جاهز|when you('| a)re ready|say\s*ready/i.test(lastAssistant);
  const isEval = /score:|الدرجة:|تقييم|الدرس الجاي|next step/i.test(lastAssistant);

  async function sendToTutor(message: string, history: Turn[]) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/proxy/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      const reply: string = data.reply || data.response || data.error || "No response";
      setTurns([...history, { role: "assistant", content: reply }]);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startDiscovery() {
    if (!topic.trim()) return;
    setPhase("discovery");
    setStep(0);
  }

  function selectAnswer(qid: string, option: string) {
    setAnswers(prev => ({ ...prev, [qid]: option }));
  }

  function nextQuestion() {
    if (step < DISCOVERY_QUESTIONS.length - 1) {
      setStep(s => s + 1);
    } else {
      // All answered — build message and send
      const lines = DISCOVERY_QUESTIONS.map((q, i) => `${i + 1}. ${q.q} → ${answers[q.id]}`).join("\n");
      const message = `علمني "${topic}" خطوة بخطوة وامتحني.\n\nإجاباتي على أسئلة الاكتشاف:\n${lines}`;
      const userTurn: Turn = { role: "user", content: message };
      setTurns([userTurn]);
      setPhase("learning");
      sendToTutor(message, [userTurn]);
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return;
    const userTurn: Turn = { role: "user", content: input };
    const newTurns = [...turns, userTurn];
    setTurns(newTurns);
    setInput("");
    await sendToTutor(input, newTurns);
  }

  function restart() {
    setPhase("topic"); setTopic(""); setStep(0); setAnswers({});
    setTurns([]); setInput(""); setError("");
  }

  const currentQ = DISCOVERY_QUESTIONS[step];
  const currentAnswer = answers[currentQ?.id ?? ""] ?? "";

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a3f7c]/30 flex-shrink-0">
        <Link href="/app" className="text-slate-400 hover:text-slate-200"><ArrowLeft size={18} /></Link>
        <GraduationCap size={22} style={{ color: GOLD }} />
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>علمني</h1>
        {topic && <span className="ml-2 text-xs text-slate-500 truncate max-w-[140px]">{topic}</span>}
        {phase !== "topic" && (
          <button onClick={restart} className="ml-auto text-slate-500 hover:text-slate-300">
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* PHASE: topic input */}
      {phase === "topic" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#e0a955]/10 border border-[#e0a955]/30 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>ايه اللي عايز تتعلّمه؟</h2>
              <p className="text-slate-400 text-sm">أكتب الموضوع — هيعلّمك خطوة بخطوة ويختبرك.</p>
            </div>
            <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5">
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && startDiscovery()}
                placeholder="مثال: quantum encryption، neural networks، TCP/IP"
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 text-sm outline-none mb-4"
                dir="auto"
                autoFocus
              />
              <button onClick={startDiscovery} disabled={!topic.trim()}
                className="w-full py-3 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                التالي <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE: discovery (radio buttons) */}
      {phase === "discovery" && currentQ && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
          <div className="w-full max-w-lg">
            {/* Progress */}
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>سؤال {step + 1} من {DISCOVERY_QUESTIONS.length}</span>
                <span>{Math.round(((step) / DISCOVERY_QUESTIONS.length) * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#0a1830]">
                <div className="h-full rounded-full transition-all duration-300" style={{ width: `${(step / DISCOVERY_QUESTIONS.length) * 100}%`, background: GOLD }} />
              </div>
            </div>

            <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5">
              <p className="text-slate-100 font-medium mb-4">{currentQ.q}</p>
              <div className="grid gap-2.5 mb-5">
                {currentQ.options.map(opt => (
                  <RadioOption key={opt} label={opt} selected={currentAnswer === opt}
                    onClick={() => selectAnswer(currentQ.id, opt)} />
                ))}
              </div>
              <button onClick={nextQuestion} disabled={!currentAnswer}
                className="w-full py-2.5 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {step < DISCOVERY_QUESTIONS.length - 1 ? <>التالي <ChevronRight size={15} /></> : <>ابدأ التعلّم <BookOpen size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE: learning (chat) */}
      {phase === "learning" && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {turns.filter(t => t.role === "assistant").map((t, i) => (
              <div key={i} className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-[#0a1830] border border-[#1a3f7c]/40 px-5 py-4">
                  <MDContent content={t.content} />
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
            {error && <p className="text-xs text-red-400 px-2">{error} <button onClick={() => sendToTutor(input || "retry", turns)} className="underline">retry</button></p>}
            <div ref={bottomRef} />
          </div>

          {/* Phase-aware action buttons */}
          {!loading && lastAssistant && (
            <div className="px-4 pb-2 flex gap-2">
              {isLesson && (
                <button onClick={() => { const t: Turn = { role: "user", content: "جاهز للاختبار" }; const nt = [...turns, t]; setTurns(nt); sendToTutor("جاهز للاختبار", nt); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                  <CheckCircle2 size={14} /> جاهز للاختبار
                </button>
              )}
              {isEval && (
                <button onClick={() => { const t: Turn = { role: "user", content: "الخطوة اللي جاية" }; const nt = [...turns, t]; setTurns(nt); sendToTutor("الخطوة اللي جاية", nt); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                  <BookOpen size={14} /> الدرس الجاي
                </button>
              )}
            </div>
          )}

          {/* Input */}
          <div className="px-4 pb-5 pt-2 border-t border-[#1a3f7c]/20 flex-shrink-0">
            <div className="flex gap-2 items-end rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 px-4 py-3">
              <textarea value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                placeholder="اسأل أي سؤال أو اكتب إجابتك…"
                rows={2} dir="auto"
                className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none" />
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
