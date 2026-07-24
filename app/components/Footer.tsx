// Copyright / legal footer — shown on every page via app/layout.tsx.
// Matches the site's dark theme (bg #040d1a, slate text).

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-16 border-t border-slate-800/60 px-5 py-6 text-center text-xs text-slate-500">
      <p className="m-0">
        © {year} Muhammad Fathy. All Rights Reserved. · FeTo™ &amp; Resilience-First
        Doctrine™ are trademarks of the Owner.
      </p>
      <p className="mt-1.5">
        <a href="/terms" className="text-slate-400 underline hover:text-slate-300">
          شروط الاستخدام · Terms
        </a>
      </p>
      <p className="mt-1.5 text-[0.7rem] text-slate-600">
        محتوى خاص ومحمي. النسخ أو إعادة الاستخدام غير المصرّح به محظور بموجب القانون
        المصري رقم ٨٢ لسنة ٢٠٠٢.
      </p>
    </footer>
  );
}
