"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  ArrowLeft, GraduationCap, Loader2, Send,
  BookOpen, CheckCircle2, ChevronRight, RotateCcw
} from "lucide-react";

const GOLD = "#e0a955";

type Phase = "idle" | "discovery" | "lesson" | "discussion" | "test" | "eval" | "done";
interface Turn { role: "user" | "assistant"; content: string; }

const PHASE_LABELS: Record<Phase, string> = {
  idle: "", discovery: "Discovery", lesson: "Lesson",
  discussion: "Discussion", test: "Test", eval: "Evaluation", done: "Complete",
};

function MDContent({ content }: { content: string }) {
  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:text-slate-100 prose-headings:font-semibold
      prose-p:text-slate-300 prose-p:leading-relaxed
      prose-code:text-[#e0a955] prose-code:bg-[#0a1830] prose-code:px-1 prose-code:rounded prose-code:text-xs
      prose-pre:bg-[#040d1a] prose-pre:border prose-pre:border-[#1a3f7c]/40 prose-pre:rounded-lg prose-pre:text-xs
      prose-strong:text-slate-100
      prose-ul:text-slate-300 prose-ol:text-slate-300
      prose-li:marker:text-[#e0a955]
      prose-blockquote:border-[#e0a955]/40 prose-blockquote:text-slate-400">
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

export default function LearnPage() {
  const [topic, setTopic]     = useState("");
  const [input, setInput]     = useState("");
  const [turns, setTurns]     = useState<Turn[]>([]);
  const [phase, setPhase]     = useState<Phase>("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, loading]);

  const lastAssistant = [...turns].reverse().find(t => t.role === "assistant")?.content ?? "";

  // Detect phase from last assistant message
  function detectPhase(content: string): Phase {
    const l = content.toLowerCase();
    if (/التحدي الختامي|capstone/i.test(l)) return "done";
    if (/score:|الدرجة:|تقييم|evaluation complete/i.test(l)) return "eval";
    if (/q\d+[:.)]|السؤال \d+|question \d+/i.test(l) &&
        /answer|أجب|اكتب إجابتك/i.test(l)) return "test";
    if (/say\s*['"]?ready|قول\s*['"]?ready|when you('| a)re ready|لما تكون جاهز/i.test(l)) return "lesson";
    if (/step\s*\d+|الخطوة\s*\d+/i.test(l)) return "lesson";
    if (/goal|topic|level|style|مستواك|أسلوبك|وقتك|هدفك|discovery/i.test(l) && turns.length < 4) return "discovery";
    return "discussion";
  }

  async function send(messageText: string) {
    if (!messageText.trim() || loading) return;
    setError("");
    const userTurn: Turn = { role: "user", content: messageText };
    const newTurns = [...turns, userTurn];
    setTurns(newTurns);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/proxy/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageText,
          agentType: "tutor",
          history: newTurns.slice(-30).map(t => ({ role: t.role, content: t.content })),
        }),
      });
      const data = await res.json();
      const reply: string = data.reply || data.response || data.error || "No response";
      const asstTurn: Turn = { role: "assistant", content: reply };
      const finalTurns = [...newTurns, asstTurn];
      setTurns(finalTurns);
      setPhase(detectPhase(reply));
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function startLesson() {
    if (!topic.trim()) return;
    const msg = `علمني ${topic} خطوة بخطوة وامتحني. ابدأ بأسئلة discovery.`;
    setPhase("discovery");
    send(msg);
  }

  function restart() {
    setTurns([]); setPhase("idle"); setTopic(""); setInput(""); setError("");
  }

  const isLesson = phase === "lesson";
  const isTest   = phase === "test" || phase === "eval";
  const showReadyBtn   = isLesson && !loading;
  const showSubmitBtn  = isTest && !loading;
  const showNextBtn    = phase === "eval" && !loading;

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a3f7c]/30 flex-shrink-0">
        <Link href="/app" className="text-slate-400 hover:text-slate-200">
          <ArrowLeft size={18} />
        </Link>
        <GraduationCap size={22} style={{ color: GOLD }} />
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>علمني</h1>
        {phase !== "idle" && (
          <span className="ml-auto text-xs px-2 py-0.5 rounded border border-[#e0a955]/40 text-[#e0a955]">
            {PHASE_LABELS[phase]}
          </span>
        )}
        {phase !== "idle" && (
          <button onClick={restart} className="text-slate-500 hover:text-slate-300 ml-2">
            <RotateCcw size={15} />
          </button>
        )}
      </div>

      {/* Idle / topic input */}
      {phase === "idle" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#e0a955]/10 border border-[#e0a955]/30 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>
                ايه اللي عايز تتعلّمه؟
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                أكتب الموضوع — هيعلّمك خطوة بخطوة، يناقشك، ويختبرك قبل ما يكمّل.
              </p>
            </div>
            <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5">
              <input
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && startLesson()}
                placeholder="مثال: أساسيات neural networks، distributed consensus، LLM training"
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 text-sm outline-none mb-4"
                dir="auto"
              />
              <button
                onClick={startLesson}
                disabled={!topic.trim()}
                className="w-full py-3 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                ابدأ <ChevronRight size={16} />
              </button>
            </div>
            <p className="text-center text-xs text-slate-600 mt-4">
              التدريس تكيّفي — كل خطوة مبنية على إجابتك السابقة
            </p>
          </div>
        </div>
      )}

      {/* Conversation */}
      {phase !== "idle" && (
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {turns.map((t, i) => (
            <div key={i} className={`flex ${t.role === "user" ? "justify-end" : "justify-start"}`}>
              {t.role === "assistant" ? (
                <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-[#0a1830] border border-[#1a3f7c]/40 px-5 py-4">
                  <MDContent content={t.content} />
                </div>
              ) : (
                <div className="max-w-[80%] px-4 py-3 rounded-2xl rounded-tr-sm bg-[#143060] border border-[#1a3f7c] text-sm text-slate-100">
                  {t.content}
                </div>
              )}
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
            <div className="text-xs text-red-400 px-2">
              {error} <button onClick={() => send(input || "retry")} className="underline">retry</button>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Action buttons (phase-sensitive) */}
      {phase !== "idle" && !loading && lastAssistant && (
        <div className="px-4 pb-2 flex gap-2 flex-wrap">
          {showReadyBtn && (
            <button
              onClick={() => send("جاهز للاختبار")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold"
            >
              <CheckCircle2 size={14} /> جاهز للاختبار
            </button>
          )}
          {showNextBtn && (
            <button
              onClick={() => send("الخطوة اللي جاية")}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold"
            >
              <BookOpen size={14} /> الدرس الجاي
            </button>
          )}
        </div>
      )}

      {/* Input */}
      {phase !== "idle" && (
        <div className="px-4 pb-5 pt-2 border-t border-[#1a3f7c]/20 flex-shrink-0">
          <div className="flex gap-2 items-end rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 px-4 py-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); } }}
              placeholder={
                phase === "test" ? "اكتب إجابتك هنا…" :
                phase === "lesson" ? "اسأل أي سؤال، أو اضغط 'جاهز للاختبار'…" :
                "اكتب هنا…"
              }
              rows={2}
              dir="auto"
              className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none"
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              className="p-2 rounded-lg bg-[#e0a955] text-black disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          {isTest && (
            <p className="text-xs text-slate-600 text-center mt-2">
              أجب على كل الأسئلة ثم أرسل، أو اضغط Enter بعد كل إجابة
            </p>
          )}
        </div>
      )}
    </div>
  );
}
