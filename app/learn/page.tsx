"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
<<<<<<< HEAD
=======
import ReactMarkdown from "react-markdown";
>>>>>>> 0e6d388db66aeff77c905af95f6b4c1ffd90aaad
import {
  ArrowLeft, GraduationCap, Loader2, Send,
  CheckCircle2, ChevronRight, RotateCcw, BookOpen,
  Save, XCircle, PlayCircle
} from "lucide-react";

const GOLD = "#e0a955";
type Lang = "ar" | "en";
type Phase = "topic" | "discovery" | "lesson" | "done";
interface Turn { role: "user" | "assistant"; content: string; }

const T = {
  ar: {
    title: "علمني", chooseLang: "اختر لغتك",
    topicTitle: "ايه اللي عايز تتعلّمه؟",
    topicSub: "أكتب الموضوع — هيعلّمك خطوة بخطوة ويختبرك.",
    topicPlaceholder: "مثال: TCP/IP، quantum encryption، neural networks",
    topicBtn: "التالي",
    qOf: (n: number, t: number) => `سؤال ${n} من ${t}`,
    startBtn: "ابدأ التعلّم", nextQ: "التالي",
    readyBtn: "جاهز للاختبار",
    continueBtn: "استمر", saveBtn: "حفظ", endBtn: "انهاء",
    submitBtn: "أرسل الإجابات",
    inputPlaceholder: "اسأل أي سؤال…",
    back: "رجوع", loadingTest: "جاري تحضير الاختبار…",
    testError: "حصل خطأ في تحضير الاختبار.",
    answerAll: "أجب على كل الأسئلة أولاً",
    savedMsg: "✓ تم حفظ الجلسة — يمكنك الاستئناف لاحقاً",
    resumeBtn: "استأنف الجلسة السابقة",
    resumeLabel: (topic: string) => `موضوع: ${topic}`,
    noResume: "بدء جلسة جديدة",
  },
  en: {
    title: "Learn", chooseLang: "Choose your language",
    topicTitle: "What do you want to learn?",
    topicSub: "Enter a topic — you'll be taught step by step and tested.",
    topicPlaceholder: "e.g. TCP/IP, quantum encryption, neural networks",
    topicBtn: "Next",
    qOf: (n: number, t: number) => `Question ${n} of ${t}`,
    startBtn: "Start Learning", nextQ: "Next",
    readyBtn: "I'm ready to be tested",
    continueBtn: "Continue", saveBtn: "Save", endBtn: "End",
    submitBtn: "Submit answers",
    inputPlaceholder: "Ask a question…",
    back: "Back", loadingTest: "Preparing your test…",
    testError: "Could not generate test questions.",
    answerAll: "Please answer all questions first",
    savedMsg: "✓ Session saved — you can resume later",
    resumeBtn: "Resume previous session",
    resumeLabel: (topic: string) => `Topic: ${topic}`,
    noResume: "Start a new session",
  },
};

const DISCOVERY: Record<Lang, { id: string; q: string; options: string[] }[]> = {
  ar: [
    { id: "level", q: "مستواك الحالي في الموضوع؟", options: ["مبتدئ — من الصفر", "متوسط — عندي خلفية أساسية", "متقدم — فاهم الأساسيات"] },
    { id: "goal",  q: "هدفك من التعلم؟", options: ["فهم نظري — المبادئ والمفاهيم", "تطبيق عملي — أبني حاجة", "أساس رياضي عميق", "بحث أكاديمي أو تقني"] },
    { id: "style", q: "أسلوب التعلم المفضل؟", options: ["Intuition-first — تشبيهات وصور ذهنية أولاً", "Math-first — معادلات ونظريات أولاً", "Code-first — كود وأمثلة عملية أولاً", "Mixed — مزيج متوازن"] },
    { id: "time",  q: "وقتك لكل خطوة؟", options: ["20-30 دقيقة", "45-60 دقيقة", "أكتر من ساعة"] },
    { id: "tools", q: "أدواتك المتاحة؟", options: ["متصفح — أقدر أشغّل كود", "Python محلي", "Google Colab", "مافيش — نظري فقط"] },
  ],
  en: [
    { id: "level", q: "Your current level?", options: ["Beginner — starting from scratch", "Intermediate — I have some background", "Advanced — I know the basics"] },
    { id: "goal",  q: "Your learning goal?", options: ["Conceptual understanding", "Practical application — build something", "Deep mathematical foundation", "Academic or technical research"] },
    { id: "style", q: "Preferred learning style?", options: ["Intuition-first — analogies and mental models", "Math-first — equations and theory", "Code-first — code and examples", "Mixed — balanced combination"] },
    { id: "time",  q: "Time per step?", options: ["20-30 minutes", "45-60 minutes", "More than an hour"] },
    { id: "tools", q: "Available tools?", options: ["Browser (can run interactive code)", "Local Python", "Google Colab", "None — theory only"] },
  ],
};

function MDContent({ content, dir }: { content: string; dir?: "ltr" | "rtl" | "auto" }) {
<<<<<<< HEAD
  // Simple markdown-like rendering without external dependency
  const lines = content.split("\n");
  return (
    <div dir={dir ?? "auto"} className="text-sm text-slate-300 leading-relaxed space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith("### ")) return <h3 key={i} className="text-slate-100 font-semibold mt-3 mb-1">{line.slice(4)}</h3>;
        if (line.startsWith("## ")) return <h2 key={i} className="text-slate-100 font-bold mt-3 mb-1 text-base">{line.slice(3)}</h2>;
        if (line.startsWith("# ")) return <h1 key={i} className="text-slate-100 font-bold mt-3 mb-2 text-lg">{line.slice(2)}</h1>;
        if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
          return <div key={i} className="flex gap-2"><span style={{color:"#e0a955"}}>▸</span><span>{line.slice(2)}</span></div>;
        }
        if (/^\d+\./.test(line)) return <div key={i} className="ps-2">{line}</div>;
        if (line.startsWith("---")) return <hr key={i} className="border-[#1a3f7c]/40 my-2" />;
        if (line.startsWith("> ")) return <blockquote key={i} className="border-s-2 border-[#e0a955]/40 ps-3 text-slate-400 italic">{line.slice(2)}</blockquote>;
        if (line.trim() === "") return <div key={i} className="h-1" />;
        // Bold **text**
        const parts = line.split(/(\*\*[^*]+\*\*)/g);
        return (
          <p key={i}>
            {parts.map((part, j) =>
              part.startsWith("**") && part.endsWith("**")
                ? <strong key={j} className="text-slate-100">{part.slice(2,-2)}</strong>
                : <span key={j}>{part}</span>
            )}
          </p>
        );
      })}
=======
  return (
    <div dir={dir ?? "auto"}
      className="prose prose-invert prose-sm max-w-none
        prose-headings:text-slate-100 prose-headings:font-semibold prose-headings:mt-3 prose-headings:mb-1
        prose-p:text-slate-300 prose-p:leading-relaxed prose-p:my-1.5
        prose-code:text-[#e0a955] prose-code:bg-[#0a1830] prose-code:px-1 prose-code:rounded prose-code:text-xs
        prose-pre:bg-[#040d1a] prose-pre:border prose-pre:border-[#1a3f7c]/40 prose-pre:rounded-lg prose-pre:text-xs
        prose-strong:text-slate-100 prose-ul:text-slate-300 prose-ol:text-slate-300
        prose-li:marker:text-[#e0a955] prose-li:my-0.5
        prose-blockquote:border-[#e0a955]/40 prose-blockquote:text-slate-400">
      <ReactMarkdown>{content}</ReactMarkdown>
>>>>>>> 0e6d388db66aeff77c905af95f6b4c1ffd90aaad
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

export default function LearnPage() {
  const [lang, setLang]           = useState<Lang>("ar");
  const [phase, setPhase]         = useState<Phase>("topic");
  const [topic, setTopic]         = useState("");
  const [dStep, setDStep]         = useState(0);
  const [dAnswers, setDAnswers]   = useState<Record<string, string>>({});
  const [turns, setTurns]         = useState<Turn[]>([]);
  const [pendingMsg, setPendingMsg] = useState<string>("");  // initial tutor message to send
  const [input, setInput]         = useState("");
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState("");
  const [toast, setToast]         = useState("");
  const [savedSession, setSavedSession] = useState<{topic:string;lang:Lang;turns:Turn[]} | null>(null);

  // Load saved session from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem("feto_learn_session");
      if (raw) {
        const s = JSON.parse(raw);
        if (s?.topic && s?.turns?.length) setSavedSession(s);
      }
    } catch {}
  }, []);
  const bottomRef = useRef<HTMLDivElement>(null);
  const t = T[lang];
  const isRTL = lang === "ar";
  const questions = DISCOVERY[lang];

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [turns, loading, dStep, testQs]);

  // Fire the initial tutor call only after phase=lesson is committed to DOM.
  useEffect(() => {
    if (phase === "lesson" && pendingMsg && turns.length === 1 && !loading) {
      const ut = turns[0];
      setPendingMsg("");
      callTutor(pendingMsg, [ut]);
    }
  }, [phase, pendingMsg]);  // eslint-disable-line

  const lastAssistant = [...turns].reverse().find(x => x.role === "assistant")?.content ?? "";
  const assistantCount = turns.filter(x => x.role === "assistant").length;
  // Profile summary = first assistant message containing "ملفك التعليمي" or "فهمت:"
  const isProfileSummary = assistantCount === 1 &&
    /ملفك التعليمي|فهمت:|learning profile|your profile/i.test(lastAssistant);
  // Lesson step = has ready signal but NOT the profile summary
  const hasReadySignal = /خد وقتك|ولما تكون جاهز|when you('| a)re ready|say\s*ready/i.test(lastAssistant);
  const isLesson = hasReadySignal && !isProfileSummary;
  const isEval   = /score:|الدرجة:|تقييم|الدرس الجاي|next step|استمر/i.test(lastAssistant);

  async function callTutor(message: string, _history: Turn[]) {
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/proxy/learn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, lang }),
      });
      const data = await res.json();
      if (!data.reply && !data.response) {
        // Backend returned an error — show retry, don't put error string in chat
        setError(lang === "ar" ? "حصل خطأ في الاتصال — اضغط على زرار للمحاولة مرة أخرى." : "Connection error — please try again.");
        return;
      }
      const reply = data.reply || data.response;
      setTurns([...history, { role: "assistant", content: reply }]);
    } catch { setError("Network error — please try again."); }
    finally { setLoading(false); }
  }

  function requestTest() {
    // Simply send the "ready" message through the regular tutor channel
    const msg = lang === "ar" ? "جاهز للاختبار — ابدأ الأسئلة." : "I am ready to be tested. Please give me the questions.";
    const ut: Turn = { role: "user", content: msg };
    const nt = [...turns, ut];
    setTurns(nt);
    callTutor(msg, nt);
  }

  // submitTestAnswers removed — answers sent via regular text input

  function saveLesson() {
    // Save session to localStorage for later resumption
    try {
      const session = { topic, lang, turns, phase };
      localStorage.setItem("feto_learn_session", JSON.stringify(session));
    } catch {}
    setToast(t.savedMsg);
    setTimeout(() => setToast(""), 2500);
  }

  function resumeSession() {
    if (!savedSession) return;
    setTopic(savedSession.topic);
    setLang(savedSession.lang);
    setTurns(savedSession.turns);
    setPhase("lesson");
    setSavedSession(null);
  }

  function clearSavedSession() {
    localStorage.removeItem("feto_learn_session");
    setSavedSession(null);
  }

  async function endSession() {
    const msg = lang === "ar" ? "انهاء الجلسة — عطيني ملخص سريع لما تعلّمناه." : "End the session — give me a quick summary of what we covered.";
    const ut: Turn = { role: "user", content: msg };
    const nt = [...turns, ut];
    setTurns(nt); setPhase("done");
    await callTutor(msg, nt);
  }

  function startDiscovery() { if (topic.trim()) { setPhase("lesson"); setDStep(0); } }
  // actually discovery first
  function goDiscovery() { if (topic.trim()) { setPhase("discovery" as Phase); setDStep(0); } }

  function selectD(id: string, opt: string) { setDAnswers(p => ({ ...p, [id]: opt })); }

  function nextD() {
    if (dStep < questions.length - 1) { setDStep(s => s + 1); return; }
    const lines = questions.map((q, i) => `${i+1}. ${q.q} → ${dAnswers[q.id]}`).join("\n");
    const msg = lang === "ar"
      ? `علمني "${topic}" خطوة بخطوة وامتحني.\n\nإجاباتي على الاكتشاف:\n${lines}\n\nالرجاء الرد باللغة العربية.`
      : `Teach me "${topic}" step by step and test me.\n\nMy discovery answers:\n${lines}\n\nPlease respond in English.`;
    const ut: Turn = { role: "user", content: msg };
    setPendingMsg(msg);
    setTurns([ut]);
    setPhase("lesson");  // useEffect will fire callTutor after commit
  }

  async function sendMsg() {
    if (!input.trim() || loading) return;
    const ut: Turn = { role: "user", content: input };
    const nt = [...turns, ut];
    setTurns(nt); setInput("");
    await callTutor(input, nt);
  }

  function restart() {
    setPhase("topic"); setTopic(""); setDStep(0); setDAnswers({});
    setTurns([]); setInput(""); setError("");
    // Reload saved session check
    try {
      const raw = localStorage.getItem("feto_learn_session");
      if (raw) { const s = JSON.parse(raw); if (s?.topic) setSavedSession(s); }
    } catch {}
  }

  const curQ = questions[dStep];
  const curAns = dAnswers[curQ?.id ?? ""] ?? "";
  // Show the phase labels for the action bar
  const inLesson = (phase === "lesson" || phase === "done");

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200 flex flex-col" dir={isRTL ? "rtl" : "ltr"}>

      {/* Toast */}
      {toast && <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-[#0a1830] border border-[#e0a955]/40 text-[#e0a955] text-sm px-4 py-2 rounded-lg z-50">{toast}</div>}

      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a3f7c]/30 flex-shrink-0">
        <Link href="/app" className="text-slate-400 hover:text-slate-200"><ArrowLeft size={18} className={isRTL ? "rotate-180" : ""} /></Link>
        <GraduationCap size={22} style={{ color: GOLD }} />
        <h1 className="text-lg font-semibold" style={{ fontFamily: "Playfair Display, serif" }}>{t.title}</h1>
        {topic && phase !== "topic" && <span className="mx-2 text-xs text-slate-500 truncate max-w-[100px]">{topic}</span>}
        {phase !== "topic" && (
          <button onClick={restart} className="ms-auto text-slate-500 hover:text-slate-300"><RotateCcw size={15} /></button>
        )}
      </div>

      {/* TOPIC */}
      {phase === "topic" && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-10">
          <div className="w-full max-w-lg">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#e0a955]/10 border border-[#e0a955]/30 flex items-center justify-center mx-auto mb-4">
                <GraduationCap size={28} style={{ color: GOLD }} />
              </div>
              <h2 className="text-2xl font-semibold mb-2" style={{ fontFamily: "Playfair Display, serif" }}>{t.topicTitle}</h2>
              <p className="text-slate-400 text-sm">{t.topicSub}</p>
            </div>
            <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5">
              <p className="text-xs text-slate-500 mb-2">{t.chooseLang}</p>
              <div className="flex gap-2 mb-5">
                {(["ar", "en"] as Lang[]).map(l => (
                  <button key={l} onClick={() => setLang(l)}
                    className={`px-5 py-2 rounded-lg border text-sm transition-colors ${lang === l ? "bg-[#e0a955]/12 border-[#e0a955]/60 text-[#e0a955] font-semibold" : "bg-[#040d1a] border-[#1a3f7c]/30 text-slate-300"}`}>
                    {l === "ar" ? "العربية" : "English"}
                  </button>
                ))}
              </div>
              {/* Resume saved session */}
              {savedSession && (
                <div className="mb-4 p-3 rounded-lg bg-[#e0a955]/8 border border-[#e0a955]/30">
                  <p className="text-xs text-[#e0a955] mb-2">📌 {t.resumeBtn}</p>
                  <p className="text-xs text-slate-400 mb-3">{t.resumeLabel(savedSession.topic)}</p>
                  <div className="flex gap-2">
                    <button onClick={resumeSession}
                      className="flex-1 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                      {t.resumeBtn}
                    </button>
                    <button onClick={clearSavedSession}
                      className="px-3 py-2 rounded-lg border border-[#1a3f7c]/40 text-slate-400 text-xs">
                      ✕
                    </button>
                  </div>
                </div>
              )}
              <input value={topic} onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === "Enter" && goDiscovery()}
                placeholder={t.topicPlaceholder} dir="auto"
                className="w-full bg-transparent text-slate-200 placeholder:text-slate-600 text-sm outline-none mb-4" autoFocus />
              <button onClick={goDiscovery} disabled={!topic.trim()}
                className="w-full py-3 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {t.topicBtn} <ChevronRight size={16} className={isRTL ? "rotate-180" : ""} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVERY */}
      {(phase as string) === "discovery" && curQ && (
        <div className="flex-1 flex flex-col items-center justify-center px-5 py-8">
          <div className="w-full max-w-lg">
            <div className="mb-6">
              <div className="flex justify-between text-xs text-slate-500 mb-2">
                <span>{t.qOf(dStep + 1, questions.length)}</span>
                <span>{Math.round((dStep / questions.length) * 100)}%</span>
              </div>
              <div className="h-1 rounded-full bg-[#0a1830]">
                <div className="h-full rounded-full transition-all" style={{ width: `${(dStep / questions.length) * 100}%`, background: GOLD }} />
              </div>
            </div>
            <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5">
              <p className="text-slate-100 font-medium mb-4">{curQ.q}</p>
              <div className="grid gap-2.5 mb-5">
                {curQ.options.map(opt => (
                  <RadioOpt key={opt} label={opt} selected={curAns === opt} onClick={() => selectD(curQ.id, opt)} />
                ))}
              </div>
              <button onClick={nextD} disabled={!curAns}
                className="w-full py-2.5 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
                {dStep < questions.length - 1 ? <>{t.nextQ} <ChevronRight size={15} className={isRTL ? "rotate-180" : ""} /></> : <>{t.startBtn} <BookOpen size={15} /></>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LESSON / DONE */}
      {inLesson && (
        <>
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {turns.filter(x => x.role === "assistant").map((turn, i) => (
              <div key={i} className="flex justify-start">
                <div className="max-w-[92%] rounded-2xl rounded-tl-sm bg-[#0a1830] border border-[#1a3f7c]/40 px-5 py-4">
                  <MDContent content={turn.content} dir="auto" />
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
            {error && <p className="text-xs text-red-400 px-2">{error}</p>}
            <div ref={bottomRef} />
          </div>

          {/* Action bar */}
          {!loading && lastAssistant && phase !== "done" && (
            <div className={`px-4 pb-2 flex gap-2 flex-wrap ${isRTL ? "flex-row-reverse" : ""}`}>
                {/* After profile summary — show "كمل" to start first lesson */}
              {isProfileSummary && (
                <button onClick={() => { const msg = lang === "ar" ? "كمل — ابدأ الدرس الأول" : "Continue — start the first lesson"; const ut: Turn = { role:"user", content: msg }; const nt=[...turns,ut]; setTurns(nt); callTutor(msg,nt); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                  <PlayCircle size={14} /> {lang === "ar" ? "كمل" : "Continue"}
                </button>
              )}
              {/* After a lesson step — ready for test */}
              {isLesson && (
                <button onClick={requestTest}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                  <CheckCircle2 size={14} /> {t.readyBtn}
                </button>
              )}
              {/* After evaluation — continue to next step */}
              {isEval && !isLesson && (
                <button onClick={() => { const msg = lang === "ar" ? "استمر — الخطوة الجاية" : "Continue — next step"; const ut: Turn = { role:"user", content: msg }; const nt=[...turns,ut]; setTurns(nt); callTutor(msg,nt); }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#e0a955] text-black text-sm font-semibold">
                  <PlayCircle size={14} /> {t.continueBtn}
                </button>
              )}
              <button onClick={saveLesson}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1a3f7c]/50 text-slate-300 hover:border-[#e0a955]/40 text-sm">
                <Save size={14} /> {t.saveBtn}
              </button>
              <button onClick={endSession}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-[#1a3f7c]/50 text-slate-400 hover:border-red-500/40 hover:text-red-400 text-sm">
                <XCircle size={14} /> {t.endBtn}
              </button>
            </div>
          )}

          {/* After session ends — offer to start new topic */}
          {phase === "done" && !loading && (
            <div className="px-4 pb-3 pt-1">
              <button onClick={restart}
                className="w-full py-2.5 rounded-lg border border-[#e0a955]/40 text-[#e0a955] text-sm font-medium hover:bg-[#e0a955]/10 flex items-center justify-center gap-2">
                <RotateCcw size={15} /> {lang === "ar" ? "ابدأ موضوع جديد" : "Start a new topic"}
              </button>
            </div>
          )}
          {/* Input */}
          {phase !== "done" && (
            <div className="px-4 pb-5 pt-2 border-t border-[#1a3f7c]/20 flex-shrink-0">
              <div className={`flex gap-2 items-end rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 px-4 py-3 ${isRTL ? "flex-row-reverse" : ""}`}>
                <textarea value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder={t.inputPlaceholder} rows={2} dir="auto"
                  className="flex-1 bg-transparent text-sm text-slate-200 placeholder:text-slate-600 resize-none outline-none" />
                <button onClick={sendMsg} disabled={!input.trim() || loading}
                  className="p-2 rounded-lg bg-[#e0a955] text-black disabled:opacity-40">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          )}
        </>
      )}


    </div>
  );
}
