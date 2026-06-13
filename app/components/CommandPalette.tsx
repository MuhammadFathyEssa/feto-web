"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search, MessageSquare, LayoutDashboard, Users, Settings,
  Plus, LogOut, CornerDownLeft,
} from "lucide-react";

type Command = {
  id: string;
  label: string;
  hint?: string;
  icon: React.ElementType;
  action: () => void;
  keywords?: string;
};

export default function CommandPalette({ onNewChat }: { onNewChat?: () => void }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Toggle on ⌘K / Ctrl+K; close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const go = useCallback((href: string) => { setOpen(false); router.push(href); }, [router]);

  const commands: Command[] = [
    { id: "new", label: "محادثة جديدة", hint: "New chat", icon: Plus, keywords: "new chat جديد", action: () => { setOpen(false); onNewChat?.(); } },
    { id: "home", label: "المحادثة", hint: "Chat", icon: MessageSquare, keywords: "chat home محادثة", action: () => go("/") },
    { id: "dashboard", label: "لوحة التحكم", hint: "Dashboard", icon: LayoutDashboard, keywords: "dashboard لوحة", action: () => go("/dashboard") },
    { id: "recruiter", label: "التوظيف", hint: "Recruiter", icon: Users, keywords: "recruiter cv توظيف", action: () => go("/recruiter") },
    { id: "admin", label: "الإدارة", hint: "Admin", icon: Users, keywords: "admin users إدارة", action: () => go("/admin") },
    { id: "settings", label: "الإعدادات", hint: "Settings", icon: Settings, keywords: "settings إعدادات", action: () => go("/settings") },
    { id: "logout", label: "تسجيل الخروج", hint: "Logout", icon: LogOut, keywords: "logout signout خروج", action: () => go("/login") },
  ];

  const q = query.trim().toLowerCase();
  const filtered = q
    ? commands.filter((c) => (c.label + " " + (c.hint || "") + " " + (c.keywords || "")).toLowerCase().includes(q))
    : commands;

  useEffect(() => { if (active >= filtered.length) setActive(0); }, [filtered.length, active]);

  if (!open) return null;

  return (
    <div
      className="anim-fade fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="لوحة الأوامر">
      <div
        className="anim-scale w-full max-w-lg mx-4 bg-[#071428] border border-[#1a3f7c]/50 rounded-2xl shadow-elev-3 overflow-hidden"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#0d2144]">
          <Search size={16} className="text-slate-500" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, filtered.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter") { e.preventDefault(); filtered[active]?.action(); }
            }}
            placeholder="ابحث عن أمر أو صفحة..."
            aria-label="ابحث عن أمر"
            className="flex-1 bg-transparent text-sm text-slate-200 placeholder-slate-600 outline-none" />
          <kbd className="text-[10px] text-slate-600 border border-[#1a2235] rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-600">لا توجد نتائج</div>
          ) : (
            filtered.map((c, i) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={c.action}
                  onMouseEnter={() => setActive(i)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                    i === active ? "bg-[#d4a843]/15 text-[#d4a843]" : "text-slate-300 hover:bg-[#0d2144]"
                  }`}>
                  <Icon size={15} className={i === active ? "text-[#d4a843]" : "text-slate-500"} />
                  <span className="flex-1 text-right">{c.label}</span>
                  {c.hint && <span className="text-xs text-slate-600">{c.hint}</span>}
                  {i === active && <CornerDownLeft size={13} className="text-[#d4a843]" />}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
