"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import {
  FileSearch, FileText, MessagesSquare, GitCompare,
  Upload, Loader2, ArrowLeft, Download, X, CheckCircle2, AlertCircle, Trophy,
} from "lucide-react";

type Tab = "evaluate" | "jd" | "interview" | "compare";

const GOLD = "#d4a843";

// ── shared bits ──────────────────────────────────────────────────
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[#d4a843] font-semibold text-sm mb-2 uppercase tracking-wide">{title}</h3>
      <div className="text-slate-200 text-sm leading-relaxed">{children}</div>
    </div>
  );
}
function Pills({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((s, i) => (
        <span key={i} className="px-2.5 py-1 rounded-md bg-[#0d2144] border border-[#1a3f7c]/50 text-slate-300 text-xs">{s}</span>
      ))}
    </div>
  );
}
function Bullets({ items, color = "text-slate-200" }: { items: string[]; color?: string }) {
  return (
    <ul className="space-y-1.5">
      {items.map((s, i) => (
        <li key={i} className={`flex gap-2 ${color}`}><span className="text-[#d4a843] mt-0.5">•</span><span>{s}</span></li>
      ))}
    </ul>
  );
}
function ScoreRing({ score, label }: { score: number; label: string }) {
  const color = score >= 80 ? "#2E9E5B" : score >= 60 ? "#d4a843" : "#c0532e";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20">
        <svg viewBox="0 0 80 80" className="w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r="34" fill="none" stroke="#1a2235" strokeWidth="7" />
          <circle cx="40" cy="40" r="34" fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={`${(score / 100) * 213.6} 213.6`} strokeLinecap="round" />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-lg font-bold" style={{ color }}>{score}</span>
      </div>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}

async function postJSON(url: string, body: unknown) {
  const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const raw = await res.text();
  try { return JSON.parse(raw); } catch { return { success: false, error: `Request failed (${res.status})` }; }
}

// ── 1. CV Evaluation ─────────────────────────────────────────────
function EvaluateCV() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [evaluation, setEvaluation] = useState<Record<string, unknown> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const run = useCallback(async (file: File) => {
    setErr(""); setEvaluation(null); setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const exRes = await fetch("/api/proxy/recruiter/extract", { method: "POST", body: fd });
      const exRaw = await exRes.text();
      const ex = JSON.parse(exRaw);
      if (!ex.success) { setErr(ex.error || "Could not read file"); return; }
      const data = await postJSON("/api/proxy/recruiter/evaluate", { cvText: ex.text, fileName: ex.fileName });
      if (!data.success) { setErr(data.error || "Evaluation failed"); return; }
      setEvaluation(data.evaluation);
    } catch { setErr("Something went wrong. Try again."); }
    finally { setLoading(false); }
  }, []);

  const e = evaluation as {
    overallScore: number; atsScore: number; summary: string; skillsAnalysis: string[];
    experienceEvaluation: string; educationReview: string; strengths: string[]; weaknesses: string[];
    missingSkills: string[]; improvements: string[]; recommendation: string;
  } | null;

  return (
    <div>
      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt,.csv,.md"
        onChange={(ev) => { const f = ev.target.files?.[0]; if (f) run(f); if (fileRef.current) fileRef.current.value = ""; }} />
      {!e && !loading && (
        <button onClick={() => fileRef.current?.click()}
          className="w-full border-2 border-dashed border-[#1a3f7c] rounded-xl py-12 flex flex-col items-center gap-3 text-slate-400 hover:border-[#d4a843]/50 hover:text-slate-300 transition-colors">
          <Upload size={28} className="text-[#d4a843]" />
          <span className="text-sm">ارفع السيرة الذاتية (PDF / Word / TXT)</span>
          <span className="text-xs text-slate-600">سيتم تحليلها وإنشاء تقرير تقييم شامل</span>
        </button>
      )}
      {loading && (
        <div className="py-6">
          <div className="flex items-center gap-2 text-slate-400 mb-5">
            <Loader2 className="animate-spin text-[#d4a843]" size={18} />
            <span className="text-sm">بحلّل السيرة الذاتية...</span>
          </div>
          <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-8 mb-6 pb-6 border-b border-[#0d2144]">
              <div className="w-20 h-20 rounded-full bg-[#0d2144]" />
              <div className="w-20 h-20 rounded-full bg-[#0d2144]" />
            </div>
            <div className="space-y-3">
              <div className="h-3 bg-[#0d2144] rounded w-1/3" />
              <div className="h-2.5 bg-[#0d2144]/70 rounded w-full" />
              <div className="h-2.5 bg-[#0d2144]/70 rounded w-5/6" />
              <div className="h-3 bg-[#0d2144] rounded w-1/4 mt-5" />
              <div className="h-2.5 bg-[#0d2144]/70 rounded w-full" />
              <div className="h-2.5 bg-[#0d2144]/70 rounded w-4/6" />
            </div>
          </div>
        </div>
      )}
      {err && <div className="mt-3 flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3"><AlertCircle size={16} />{err}</div>}
      {e && (
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-6">
          <div className="flex items-center gap-8 mb-6 pb-6 border-b border-[#0d2144]">
            <ScoreRing score={e.overallScore} label="Overall Score" />
            <ScoreRing score={e.atsScore} label="ATS Compatibility" />
            <button onClick={() => { setEvaluation(null); }} className="ml-auto text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1"><X size={14} /> تقييم جديد</button>
          </div>
          <Section title="Professional Summary">{e.summary}</Section>
          <Section title="Skills Analysis"><Bullets items={e.skillsAnalysis} /></Section>
          <Section title="Experience">{e.experienceEvaluation}</Section>
          <Section title="Education">{e.educationReview}</Section>
          <div className="grid md:grid-cols-2 gap-5">
            <Section title="✓ Strengths"><Bullets items={e.strengths} color="text-green-300" /></Section>
            <Section title="⚠ Weaknesses"><Bullets items={e.weaknesses} color="text-amber-300" /></Section>
          </div>
          <Section title="Missing Skills"><Pills items={e.missingSkills} /></Section>
          <Section title="Improvement Suggestions"><Bullets items={e.improvements} /></Section>
          <div className="mt-4 bg-[#0d2144]/50 border border-[#1a3f7c]/40 rounded-lg p-4">
            <span className="text-[#d4a843] text-xs font-semibold uppercase">Recommendation</span>
            <p className="text-slate-200 text-sm mt-1">{e.recommendation}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2. JD Generator ──────────────────────────────────────────────
function GenerateJD() {
  const [title, setTitle] = useState("");
  const [req, setReq] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [jd, setJd] = useState<Record<string, unknown> | null>(null);

  const run = async () => {
    if (!title.trim()) return;
    setErr(""); setJd(null); setLoading(true);
    const data = await postJSON("/api/proxy/recruiter/jd", { title, requirements: req });
    if (!data.success) setErr(data.error || "Generation failed"); else setJd(data.jd);
    setLoading(false);
  };

  const j = jd as {
    title: string; overview: string; responsibilities: string[]; requiredQualifications: string[];
    preferredQualifications: string[]; technicalSkills: string[]; softSkills: string[];
    experienceRequirements: string; benefits: string[]; companyOverview: string;
  } | null;

  const copyAll = () => {
    if (!j) return;
    const text = `${j.title}\n\n${j.overview}\n\nResponsibilities:\n${j.responsibilities.map(r => `• ${r}`).join("\n")}\n\nRequired:\n${j.requiredQualifications.map(r => `• ${r}`).join("\n")}\n\nPreferred:\n${j.preferredQualifications.map(r => `• ${r}`).join("\n")}\n\nTechnical: ${j.technicalSkills.join(", ")}\nSoft skills: ${j.softSkills.join(", ")}\n\nExperience: ${j.experienceRequirements}\n\nBenefits:\n${j.benefits.map(r => `• ${r}`).join("\n")}\n\n${j.companyOverview}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div>
      <div className="space-y-3 mb-5">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="المسمى الوظيفي (e.g. Senior Core Banking Engineer)"
          className="w-full bg-[#071428] border border-[#1a2235] rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-[#d4a843]/50 outline-none" />
        <textarea value={req} onChange={(e) => setReq(e.target.value)} placeholder="متطلبات إضافية (اختياري) — seniority, tech stack, domain..."
          rows={3} className="w-full bg-[#071428] border border-[#1a2235] rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-[#d4a843]/50 outline-none resize-none" />
        <button onClick={run} disabled={loading || !title.trim()}
          className="w-full bg-[#d4a843] hover:bg-[#c49a2a] disabled:opacity-40 text-[#040d1a] font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 transition-colors">
          {loading ? <><Loader2 className="animate-spin" size={16} /> بنشئ الوصف...</> : <><FileText size={16} /> Generate JD</>}
        </button>
      </div>
      {err && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3"><AlertCircle size={16} />{err}</div>}
      {j && (
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#0d2144]">
            <h2 className="text-lg font-bold text-slate-100">{j.title}</h2>
            <button onClick={copyAll} className="text-[#d4a843] text-xs flex items-center gap-1 hover:text-[#c49a2a]"><Download size={13} /> Copy</button>
          </div>
          <Section title="Overview">{j.overview}</Section>
          <Section title="Key Responsibilities"><Bullets items={j.responsibilities} /></Section>
          <div className="grid md:grid-cols-2 gap-5">
            <Section title="Required Qualifications"><Bullets items={j.requiredQualifications} /></Section>
            <Section title="Preferred Qualifications"><Bullets items={j.preferredQualifications} /></Section>
          </div>
          <Section title="Technical Skills"><Pills items={j.technicalSkills} /></Section>
          <Section title="Soft Skills"><Pills items={j.softSkills} /></Section>
          <Section title="Experience">{j.experienceRequirements}</Section>
          <Section title="Benefits & Perks"><Bullets items={j.benefits} /></Section>
          <Section title="Company Overview">{j.companyOverview}</Section>
        </div>
      )}
    </div>
  );
}

// ── 3. Interview Package ─────────────────────────────────────────
function InterviewPrep() {
  const [role, setRole] = useState("");
  const [ctx, setCtx] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [pkg, setPkg] = useState<Record<string, unknown> | null>(null);

  const run = async () => {
    if (!role.trim()) return;
    setErr(""); setPkg(null); setLoading(true);
    const data = await postJSON("/api/proxy/recruiter/interview", { role, context: ctx });
    if (!data.success) setErr(data.error || "Generation failed"); else setPkg(data.package);
    setLoading(false);
  };

  type Q = { question: string; modelAnswer: string; evaluationCriteria: string };
  const p = pkg as { role: string; technical: Q[]; behavioral: Q[]; situational: Q[]; scoringFramework: string[]; summary: string } | null;

  const QBlock = ({ title, qs }: { title: string; qs: Q[] }) => (
    <Section title={title}>
      <div className="space-y-3">
        {qs.map((q, i) => (
          <details key={i} className="bg-[#0d2144]/40 border border-[#1a2235] rounded-lg p-3 group">
            <summary className="cursor-pointer text-slate-200 text-sm font-medium list-none flex gap-2"><span className="text-[#d4a843]">{i + 1}.</span>{q.question}</summary>
            <div className="mt-2 pt-2 border-t border-[#1a2235] space-y-1.5 text-xs">
              <p className="text-slate-400"><span className="text-green-400">نموذج الإجابة: </span>{q.modelAnswer}</p>
              <p className="text-slate-400"><span className="text-[#d4a843]">معايير التقييم: </span>{q.evaluationCriteria}</p>
            </div>
          </details>
        ))}
      </div>
    </Section>
  );

  return (
    <div>
      <div className="space-y-3 mb-5">
        <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="المنصب (e.g. CISO, T24 Consultant, Data Engineer)"
          className="w-full bg-[#071428] border border-[#1a2235] rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-[#d4a843]/50 outline-none" />
        <textarea value={ctx} onChange={(e) => setCtx(e.target.value)} placeholder="سياق إضافي (اختياري) — seniority level, focus areas..."
          rows={2} className="w-full bg-[#071428] border border-[#1a2235] rounded-lg px-4 py-3 text-sm text-slate-200 placeholder-slate-600 focus:border-[#d4a843]/50 outline-none resize-none" />
        <button onClick={run} disabled={loading || !role.trim()}
          className="w-full bg-[#d4a843] hover:bg-[#c49a2a] disabled:opacity-40 text-[#040d1a] font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 transition-colors">
          {loading ? <><Loader2 className="animate-spin" size={16} /> بجهّز الأسئلة...</> : <><MessagesSquare size={16} /> Generate Interview Package</>}
        </button>
      </div>
      {err && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3"><AlertCircle size={16} />{err}</div>}
      {p && (
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-100 mb-4 pb-4 border-b border-[#0d2144]">{p.role}</h2>
          <QBlock title="Technical Questions" qs={p.technical} />
          <QBlock title="Behavioral Questions" qs={p.behavioral} />
          <QBlock title="Situational Questions" qs={p.situational} />
          <Section title="Scoring Framework"><Bullets items={p.scoringFramework} /></Section>
          <div className="mt-4 bg-[#0d2144]/50 border border-[#1a3f7c]/40 rounded-lg p-4">
            <span className="text-[#d4a843] text-xs font-semibold uppercase">How to Run It</span>
            <p className="text-slate-200 text-sm mt-1">{p.summary}</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 4. Candidate Comparison ──────────────────────────────────────
function CompareCandidates() {
  const [cvs, setCvs] = useState<{ fileName: string; text: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [ranking, setRanking] = useState(false);
  const [err, setErr] = useState("");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addFile = useCallback(async (file: File) => {
    setErr(""); setLoading(true);
    try {
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/proxy/recruiter/extract", { method: "POST", body: fd });
      const data = JSON.parse(await res.text());
      if (!data.success) { setErr(data.error || "Could not read file"); return; }
      setCvs((prev) => [...prev, { fileName: data.fileName, text: data.text }]);
    } catch { setErr("Upload failed"); }
    finally { setLoading(false); }
  }, []);

  const runRank = async () => {
    if (cvs.length < 2) return;
    setErr(""); setRanking(true); setResult(null);
    const data = await postJSON("/api/proxy/recruiter/compare", { cvs });
    if (!data.success) setErr(data.error || "Comparison failed"); else setResult(data.comparison);
    setRanking(false);
  };

  const r = result as {
    candidates: { rank: number; name: string; score: number; bestFit: string; topStrength: string; mainGap: string; recommendation: string }[];
    interviewQuestions: string[]; summary: string;
  } | null;

  return (
    <div>
      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.docx,.doc,.txt,.csv,.md"
        onChange={(ev) => { const f = ev.target.files?.[0]; if (f) addFile(f); if (fileRef.current) fileRef.current.value = ""; }} />
      {!r && (
        <div className="mb-5">
          <button onClick={() => fileRef.current?.click()} disabled={loading}
            className="w-full border-2 border-dashed border-[#1a3f7c] rounded-xl py-8 flex flex-col items-center gap-2 text-slate-400 hover:border-[#d4a843]/50 transition-colors disabled:opacity-50">
            {loading ? <Loader2 className="animate-spin text-[#d4a843]" size={24} /> : <Upload size={24} className="text-[#d4a843]" />}
            <span className="text-sm">{loading ? "بحمّل..." : "ارفع سيرة ذاتية (واحدة في كل مرة)"}</span>
          </button>
          {cvs.length > 0 && (
            <div className="mt-3 space-y-2">
              {cvs.map((c, i) => (
                <div key={i} className="flex items-center gap-2 bg-[#0d2144]/40 border border-[#1a2235] rounded-lg px-3 py-2 text-sm text-slate-300">
                  <CheckCircle2 size={14} className="text-green-400" /> <span className="flex-1 truncate">{c.fileName}</span>
                  <button onClick={() => setCvs(cvs.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400"><X size={14} /></button>
                </div>
              ))}
              <button onClick={runRank} disabled={cvs.length < 2 || ranking}
                className="w-full bg-[#d4a843] hover:bg-[#c49a2a] disabled:opacity-40 text-[#040d1a] font-semibold rounded-lg py-3 text-sm flex items-center justify-center gap-2 transition-colors">
                {ranking ? <><Loader2 className="animate-spin" size={16} /> بقارن وأرتّب...</> : <><GitCompare size={16} /> قارن ({cvs.length}) مرشحين</>}
              </button>
              {cvs.length < 2 && <p className="text-xs text-slate-600 text-center">محتاج سيرتين على الأقل</p>}
            </div>
          )}
        </div>
      )}
      {err && <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/40 rounded-lg px-4 py-3 mb-4"><AlertCircle size={16} />{err}</div>}
      {r && (
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-6">
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#0d2144]">
            <div className="flex items-center gap-2"><Trophy size={18} className="text-[#d4a843]" /><h2 className="text-lg font-bold text-slate-100">ترتيب المرشحين</h2></div>
            <button onClick={() => { setResult(null); setCvs([]); }} className="text-slate-500 hover:text-slate-300 text-sm flex items-center gap-1"><X size={14} /> مقارنة جديدة</button>
          </div>
          <p className="text-slate-300 text-sm mb-4 bg-[#0d2144]/50 rounded-lg p-3">{r.summary}</p>
          <div className="overflow-x-auto mb-5">
            <table className="w-full text-sm">
              <thead><tr className="text-slate-500 text-xs border-b border-[#1a2235]">
                <th className="text-right py-2 px-2">#</th><th className="text-right py-2 px-2">الاسم</th>
                <th className="text-right py-2 px-2">الدرجة</th><th className="text-right py-2 px-2">الأنسب لـ</th><th className="text-right py-2 px-2">التوصية</th>
              </tr></thead>
              <tbody>
                {r.candidates.map((c) => (
                  <tr key={c.rank} className={`border-b border-[#1a2235]/50 ${c.rank === 1 ? "bg-green-900/15" : ""}`}>
                    <td className="py-2.5 px-2 font-bold" style={{ color: c.rank === 1 ? "#2E9E5B" : "#94a3b8" }}>{c.rank}</td>
                    <td className="py-2.5 px-2 text-slate-200">{c.name}</td>
                    <td className="py-2.5 px-2 font-semibold" style={{ color: c.score >= 80 ? "#2E9E5B" : c.score >= 60 ? GOLD : "#c0532e" }}>{c.score}</td>
                    <td className="py-2.5 px-2 text-slate-400">{c.bestFit}</td>
                    <td className="py-2.5 px-2 text-slate-400">{c.recommendation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Section title="تفاصيل المرشحين">
            <div className="space-y-3">
              {r.candidates.map((c) => (
                <div key={c.rank} className="bg-[#0d2144]/40 border border-[#1a2235] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1"><span className="text-[#d4a843] font-semibold">{c.rank}. {c.name}</span><span className="text-slate-500 text-xs">— {c.score}/100</span></div>
                  <p className="text-xs text-green-300">قوة: {c.topStrength}</p>
                  <p className="text-xs text-amber-300">فجوة: {c.mainGap}</p>
                </div>
              ))}
            </div>
          </Section>
          <Section title="أسئلة الإنترفيو (20)"><Bullets items={r.interviewQuestions} /></Section>
        </div>
      )}
    </div>
  );
}

// ── Page shell ───────────────────────────────────────────────────
const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "evaluate", label: "Evaluate CV", icon: FileSearch },
  { id: "jd", label: "Generate JD", icon: FileText },
  { id: "interview", label: "Interview", icon: MessagesSquare },
  { id: "compare", label: "Compare Candidates", icon: GitCompare },
];

export default function RecruiterPage() {
  const [tab, setTab] = useState<Tab>("evaluate");
  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/" aria-label="رجوع للرئيسية" className="text-slate-500 hover:text-slate-300"><ArrowLeft size={18} /></Link>
          <div>
            <h1 className="text-xl font-bold text-slate-100">Recruiter</h1>
            <p className="text-xs text-slate-500">مساعد التوظيف الذكي — تقييم، أوصاف وظيفية، إنترفيو، ومقارنة</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex flex-col items-center gap-2 py-4 rounded-xl border text-xs font-medium transition-colors ${
                tab === id ? "bg-[#d4a843]/15 border-[#d4a843]/50 text-[#d4a843]" : "bg-[#071428] border-[#0d2144] text-slate-400 hover:border-[#1a3f7c]"
              }`}>
              <Icon size={20} /> {label}
            </button>
          ))}
        </div>

        {tab === "evaluate" && <EvaluateCV />}
        {tab === "jd" && <GenerateJD />}
        {tab === "interview" && <InterviewPrep />}
        {tab === "compare" && <CompareCandidates />}
      </div>
    </div>
  );
}
