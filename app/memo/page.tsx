"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft, FileText, Loader2, Sparkles, AlertTriangle, Copy, Check,
  ListChecks, ShieldAlert, TrendingUp, Workflow,
} from "lucide-react";
import { useAuthGuard } from "@/lib/useAuthGuard";
import { extractReply } from "@/lib/api";

type Fields = {
  subject: string;      // الموضوع
  decision: string;     // القرار المطلوب / البنود
  background: string;   // الخلفية والوضع الحالي
  financials: string;   // الأرقام المالية
  risks: string;        // المخاطر
  benefits: string;     // العوائد والفوائد
  issuer: string;       // الجهة المُصدِرة
};

const EMPTY: Fields = { subject: "", decision: "", background: "", financials: "", risks: "", benefits: "", issuer: "" };

const FIELD_META: { key: keyof Fields; label: string; placeholder: string; rows: number; required: boolean }[] = [
  { key: "subject",     label: "الموضوع", placeholder: "تجديد دعم وصيانة البنية التحتية للشبكة وإحلال الأجهزة المنتهية الدعم", rows: 2, required: true },
  { key: "decision",    label: "القرار المطلوب / البنود", placeholder: "اعتماد العرض النهائي، اعتماد القيمة، اعتماد خطة الإحلال، إرجاء المناقصة القائمة…", rows: 3, required: true },
  { key: "background",  label: "الخلفية والوضع الحالي", placeholder: "عدد كبير من الأجهزة خارج الدعم الفني (EoS/EoL)، بيئة تشغيل حرجة معرّضة للمخاطر…", rows: 4, required: true },
  { key: "financials",  label: "الأرقام المالية", placeholder: "الإجمالي شامل ضريبة القيمة المضافة، موزّعًا على البنود: دعم وصيانة / توريد أجهزة / تراخيص برمجية…", rows: 3, required: true },
  { key: "risks",       label: "المخاطر", placeholder: "تشغيلية: انقطاع الخدمة، تعذر التصعيد للمصنّع. أمنية: توقف التحديثات. تقنية: عدم مواكبة SD-WAN…", rows: 3, required: false },
  { key: "benefits",    label: "العوائد والفوائد على البنك", placeholder: "تقنية: توحيد المنصة. توسعية: جاهزية النمو. أمنية: خفض المخاطر. مالية: وفر تفاوضي مقابل العروض الابتدائية…", rows: 3, required: false },
  { key: "issuer",      label: "الجهة المُصدِرة", placeholder: "قطاع تكنولوجيا المعلومات والخدمات التشغيلية", rows: 1, required: false },
];

export default function MemoPage() {
  const authState = useAuthGuard();
  const [f, setF] = useState<Fields>(EMPTY);
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState("");
  const [copied, setCopied] = useState(false);

  const ready = f.subject.trim() && f.decision.trim() && f.background.trim() && f.financials.trim();

  function buildMessage(): string {
    const parts = [
      `اكتب مذكرة تنفيذية عربية بمستوى مجلس الإدارة للرفع للإدارة العليا، بالبنية الإلزامية الكاملة (القرار المطلوب، الخلفية، المخاطر، المسار المقترح، العرض المالي، الرأي الفني، العوائد والفوائد، التوصية النهائية).`,
      `الموضوع: ${f.subject.trim()}`,
      `القرار المطلوب والبنود: ${f.decision.trim()}`,
      `الخلفية والوضع الحالي: ${f.background.trim()}`,
      `الأرقام المالية: ${f.financials.trim()}`,
      f.risks.trim() && `المخاطر: ${f.risks.trim()}`,
      f.benefits.trim() && `العوائد والفوائد على البنك: ${f.benefits.trim()}`,
      f.issuer.trim() && `الجهة المُصدِرة: ${f.issuer.trim()}`,
      `استوعب الجوانب الفنية والتقنية والمالية والعوائد والأهمية التقنية والتوسعية والأمنية. لا تخترع أرقامًا أو أسماء موردين غير المذكورة.`,
    ].filter(Boolean);
    return parts.join("\n\n");
  }

  async function generate() {
    if (!ready || loading) return;
    setLoading(true); setNote(""); setOutput("");
    try {
      const r = await fetch("/api/proxy/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: buildMessage(), agentType: "memo" }),
      });
      const d = await r.json();
      if (r.status === 401) { setNote("سجّل الدخول لتوليد المذكرة."); return; }
      if (d.success === false) { setNote(d.error || "تعذّر التوليد."); return; }
      setOutput(extractReply(d) || "لا يوجد رد.");
    } catch { setNote("خطأ في الشبكة — أعد المحاولة."); }
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
    <div className="min-h-screen bg-[#071428] text-slate-200 feto-atmosphere" dir="rtl">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <Link href="/app" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-300">
          <ArrowLeft className="h-4 w-4 rotate-180" /> العودة إلى FeTo
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <div className="rounded-xl border border-[#e0a955]/30 bg-[#e0a955]/10 p-3">
            <FileText className="h-6 w-6 text-[#e0a955]" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold text-slate-100">كاتب المذكرات التنفيذية</h1>
            <p className="mt-1 text-sm text-slate-400">
              مذكرات عربية بمستوى مجلس الإدارة تُرفع للإدارة العليا — مبنية على طلب قرار، مستوفاة للجوانب الفنية والمالية والأمنية والعوائد.
            </p>
          </div>
        </div>

        {/* Input form */}
        <section className="mb-8 rounded-2xl border border-[#1a2235] bg-[#0a1830]/60 p-5">
          <div className="mb-4 flex items-center gap-2 text-sm font-medium text-[#e0a955]">
            <ListChecks className="h-4 w-4" /> مدخلات المذكرة
          </div>
          <div className="space-y-4">
            {FIELD_META.map((m) => (
              <div key={m.key}>
                <label className="mb-1 block text-sm font-medium text-slate-300">
                  {m.label}{m.required && <span className="text-[#e0a955]"> *</span>}
                </label>
                <textarea
                  value={f[m.key]}
                  onChange={(e) => setF({ ...f, [m.key]: e.target.value })}
                  rows={m.rows}
                  placeholder={m.placeholder}
                  className="w-full resize-y rounded-xl border border-[#1a2235] bg-[#0a1830] p-3 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[#e0a955]/50"
                />
              </div>
            ))}
          </div>
          <button onClick={generate} disabled={loading || !ready}
            className="mt-4 flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} توليد المذكرة
          </button>
          {!ready && <p className="mt-2 text-xs text-slate-500">الحقول المعلَّمة بـ * مطلوبة: الموضوع، القرار، الخلفية، الأرقام المالية.</p>}

          {note && (
            <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
              <AlertTriangle className="h-4 w-4" /> {note}
            </div>
          )}
        </section>

        {output && (
          <section className="mb-8 rounded-2xl border border-[#1a2235] bg-[#0a1830] p-5">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-[#e0a955]">المذكرة</span>
              <button onClick={copyOut} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300">
                {copied ? <><Check className="h-3 w-3" /> تم النسخ</> : <><Copy className="h-3 w-3" /> نسخ</>}
              </button>
            </div>
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-slate-200">{output}</pre>
          </section>
        )}

        {/* Structure reference */}
        <section className="mb-6">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Workflow className="h-4 w-4 text-[#e0a955]" /> بنية المذكرة
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {[
              "القرار المطلوب من الإدارة العليا",
              "الخلفية الفنية ومبررات الطلب",
              "المخاطر المترتبة على الوضع الحالي",
              "المسار المقترح للمعالجة",
              "العرض المالي والفني",
              "الرأي الفني للقطاع",
              "العوائد والفوائد على البنك",
              "التوصية النهائية",
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-2 rounded-lg border border-[#1a2235] bg-[#0a1830]/50 px-3 py-2 text-sm text-slate-300">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e0a955]/15 text-[11px] text-[#e0a955]">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
        </section>

        {/* Coverage note */}
        <section className="mb-6 grid gap-3 sm:grid-cols-3">
          {[
            { icon: TrendingUp, t: "الجوانب الفنية والمالية", d: "الوضع الحالي بالأرقام، التوزيع المالي شامل الضريبة، الوفر التفاوضي" },
            { icon: ShieldAlert, t: "الأمنية والمخاطر", d: "المخاطر التشغيلية والأمنية والتقنية المصنّفة، وأثر التأجيل" },
            { icon: TrendingUp, t: "العوائد والتوسع", d: "الأثر على الكفاءة والنمو وخفض المخاطر والعائد مقابل التكلفة" },
          ].map((c, i) => (
            <div key={i} className="rounded-xl border border-[#1a2235] bg-[#0a1830]/50 p-4">
              <c.icon className="mb-2 h-4 w-4 text-[#e0a955]" />
              <div className="text-sm font-medium text-slate-200">{c.t}</div>
              <div className="mt-1 text-xs text-slate-500">{c.d}</div>
            </div>
          ))}
        </section>

        <section className="mb-6 rounded-xl border border-amber-900/40 bg-amber-950/20 p-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-300">
            <ShieldAlert className="h-4 w-4" /> حدود
          </div>
          <ul className="space-y-1.5 text-sm text-amber-200/90">
            <li>• لا تُخترع أرقام أو قيم مالية أو أسماء موردين — تُبنى المذكرة على مدخلاتك فقط.</li>
            <li>• الحقول المطلوبة ناقصة → لن تكتمل المذكرة بجودة القرار.</li>
            <li>• مخصّصة للمذكرات التنفيذية العربية، لا المراسلات أو المحتوى العام.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
