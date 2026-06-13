"use client";

import { useState, useEffect } from "react";
import { Shield, MessageSquare, Users, Mic, Command, ArrowRight, X } from "lucide-react";

const STORAGE_KEY = "feto:onboarded:v1";

const STEPS = [
  {
    icon: Shield,
    title: "أهلاً بك في فيتو",
    body: "مساعدك التنفيذي الذكي — 19 خبيراً متخصصاً، إطار CBE للأمن السيبراني، ودعم للملفات والصوت. كل ذلك في مكان واحد.",
  },
  {
    icon: MessageSquare,
    title: "اسأل أي شيء",
    body: "اكتب سؤالك وسيوجّهك فيتو تلقائياً للخبير المناسب — تقنية، أمن سيبراني، مصرفي، أبحاث، وأكثر. الردود تظهر فوراً.",
  },
  {
    icon: Users,
    title: "أدوات متخصصة",
    body: "التوظيف (تقييم السير، مقارنة المرشحين)، فحص الأمان، والنشرات الذكية — كلها جاهزة في القائمة الجانبية.",
  },
  {
    icon: Command,
    title: "تنقّل سريع",
    body: "اضغط ⌘K (أو Ctrl+K) في أي وقت للوصول السريع لأي صفحة أو أمر. استخدم الميكروفون للإدخال الصوتي.",
  },
];

export default function Onboarding() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
    } catch { /* localStorage unavailable */ }
  }, []);

  const finish = () => {
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
    setShow(false);
  };

  if (!show) return null;
  const s = STEPS[step];
  const Icon = s.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <div className="anim-fade fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" role="dialog" aria-modal="true" aria-label="جولة تعريفية">
      <div className="anim-scale w-full max-w-md bg-[#071428] border border-[#1a3f7c]/50 rounded-2xl shadow-elev-3 overflow-hidden">
        <div className="flex justify-end p-3 pb-0">
          <button aria-label="تخطّي" onClick={finish} className="text-slate-600 hover:text-slate-400 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-8 pb-8 pt-2 text-center">
          <div className="relative w-16 h-16 mx-auto mb-5">
            <div className="absolute inset-0 rounded-2xl bg-[#d4a843]/20 blur-xl" />
            <div className="relative w-16 h-16 rounded-2xl bg-[#d4a843]/10 border border-[#d4a843]/30 flex items-center justify-center">
              <Icon size={28} className="text-[#d4a843]" />
            </div>
          </div>
          <h2 className="text-lg font-semibold text-slate-100 mb-2">{s.title}</h2>
          <p className="text-sm text-slate-400 leading-relaxed">{s.body}</p>

          <div className="flex items-center justify-center gap-1.5 mt-6 mb-5">
            {STEPS.map((_, i) => (
              <span key={i} className={`h-1.5 rounded-full transition-all duration-200 ${i === step ? "w-6 bg-[#d4a843]" : "w-1.5 bg-[#1a3f7c]"}`} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={() => setStep((s) => s - 1)}
                className="flex-1 py-2.5 rounded-xl text-sm text-slate-400 border border-[#1a2235] hover:border-[#d4a843]/30 transition-colors">
                السابق
              </button>
            )}
            <button
              onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-[#d4a843] hover:bg-[#c49a2a] text-[#040d1a] flex items-center justify-center gap-1.5 transition-colors">
              {isLast ? "ابدأ الآن" : "التالي"}
              {!isLast && <ArrowRight size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
