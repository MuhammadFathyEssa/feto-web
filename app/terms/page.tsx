import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "شروط الاستخدام — FeTo",
  description: "شروط الاستخدام وإشعار الملكية الفكرية لمنصة FeTo.",
};

export default function TermsPage() {
  return (
    <main dir="rtl" className="mx-auto max-w-3xl px-5 py-12 leading-8 text-slate-300">
      <h1 className="mb-2 text-2xl font-bold text-slate-100">
        شروط الاستخدام وإشعار الملكية الفكرية
      </h1>
      <p className="mb-8 text-sm text-slate-500">آخر تحديث: 2026</p>

      <section className="space-y-6">
        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-100">١. الملكية</h2>
          <p>
            إن منصة FeTo، وموقع feto.live، وكل محتوياتهما — بما في ذلك النصوص والتقارير
            والتصاميم والشيفرة البرمجية والشعارات و«دكترينة المرونة أولاً»
            (Resilience-First Doctrine) وجميع المواد الأخرى («المحتوى») — مملوكة حصرياً
            لمحمد فتحي («المالك»)، ومحمية بموجب قانون حماية الملكية الفكرية المصري رقم
            ٨٢ لسنة ٢٠٠٢ والاتفاقيات الدولية (اتفاقية بيرن).
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-100">٢. القيود</h2>
          <p>بدون إذن كتابي مسبق من المالك، لا يجوز لك:</p>
          <ul className="mt-2 list-disc space-y-1 pr-6">
            <li>نسخ أو إعادة إنتاج أو إعادة نشر أي جزء من المحتوى؛</li>
            <li>اقتباس أو سحب (scraping) المحتوى لأي استخدام تجاري أو عام؛</li>
            <li>إنشاء أعمال مشتقة من المحتوى؛</li>
            <li>استخدام المحتوى لتدريب أو تقييم أي نموذج ذكاء اصطناعي؛</li>
            <li>إزالة أو تعديل أي إشعار حقوق نشر أو علامة تجارية؛</li>
            <li>استخدام اسمَي «FeTo» أو «Resilience-First Doctrine».</li>
          </ul>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-100">٣. الاستخدام المسموح</h2>
          <p>
            يجوز لك تصفّح هذا الموقع لأغراضك الشخصية غير التجارية فقط. أي استخدام آخر
            يتطلب ترخيصاً كتابياً منفصلاً من المالك.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-100">٤. إخلاء المسؤولية</h2>
          <p>
            يُقدَّم المحتوى «كما هو» دون أي ضمان. ولا يُعد استشارة مهنية أو قانونية أو
            مالية أو أمنية.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-100">
            ٥. الإنفاذ والقانون الحاكم
          </h2>
          <p>
            قد يترتب على الاستخدام غير المصرّح به مساءلة مدنية وجنائية بموجب القانون
            المصري رقم ٨٢ لسنة ٢٠٠٢، وسيُلاحَق إلى أقصى حد ممكن. تخضع هذه الشروط لقوانين
            جمهورية مصر العربية.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-lg font-semibold text-slate-100">٦. التواصل</h2>
          <p>
            للاستفسارات أو التراخيص:{" "}
            <a
              href="mailto:Eng.mfathy@gmail.com"
              className="text-slate-100 underline hover:text-white"
            >
              Eng.mfathy@gmail.com
            </a>
          </p>
        </div>
      </section>

      <hr className="my-8 border-slate-800" />

      <p dir="ltr" lang="en" className="text-sm text-slate-500">
        <strong>English summary:</strong> All contents of the FeTo platform and feto.live
        are the exclusive property of Muhammad Fathy, protected under Egyptian Law No. 82
        of 2002. Copying, excerpting, republishing, or using the content to train AI
        models without prior written permission is prohibited. Unauthorized use may result
        in civil and criminal liability.
      </p>
    </main>
  );
}
