"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Shield, ArrowLeft, RefreshCw, CalendarDays, Mail, ListChecks,
  Landmark, AlertTriangle, MessageSquare, Clock,
} from "lucide-react";

interface CommitmentItem { id: number; title: string; due: string | null; overdue: boolean }
interface DashboardData {
  generatedAt: string;
  commitments: { open: number; overdue: number; dueToday: number; items: CommitmentItem[] };
  decisions: Array<{ title: string; at: string; source: string }>;
  meetings: Array<{ summary: string; start: string; attendees: number }>;
  emails: { unread: number; top: Array<{ from: string; subject: string }> };
}

function timeOf(iso: string): string {
  try { return new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }); }
  catch { return iso.slice(11, 16); }
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/proxy/dashboard", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || `HTTP ${res.status}`);
      setData(json.dashboard as DashboardData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const c = data?.commitments;

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      {/* Header */}
      <header className="border-b border-[#0d2144] bg-[#071428] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#d4a843]" />
          <span className="font-semibold text-sm">FeTo — Command Center</span>
        </div>
        <div className="ml-auto flex items-center gap-3 text-xs">
          {data && (
            <span className="text-slate-600 hidden sm:inline">
              Updated {timeOf(data.generatedAt)}
            </span>
          )}
          <button
            onClick={load}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors"
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {error && (
          <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-4 flex items-center gap-3 text-sm text-red-300">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {/* Stat row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Open Commitments", icon: ListChecks, color: "text-[#d4a843]",
              value: c ? String(c.open) : "—",
              sub: c && c.overdue > 0 ? `${c.overdue} overdue` : c ? "on track" : "",
              alert: Boolean(c && c.overdue > 0),
            },
            {
              label: "Due Today", icon: Clock, color: "text-blue-400",
              value: c ? String(c.dueToday) : "—", sub: "commitments", alert: false,
            },
            {
              label: "Meetings (24h)", icon: CalendarDays, color: "text-emerald-400",
              value: data ? String(data.meetings.length) : "—", sub: "scheduled", alert: false,
            },
            {
              label: "Unread Emails", icon: Mail, color: "text-purple-400",
              value: data ? String(data.emails.unread) : "—", sub: "inbox", alert: false,
            },
          ].map(({ label, value, sub, icon: Icon, color, alert }) => (
            <div key={label} className="bg-[#071428] border border-[#0d2144] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">{label}</span>
                <Icon size={14} className={color} />
              </div>
              <p className="text-2xl font-semibold text-slate-100">{value}</p>
              <p className={`text-xs mt-1 ${alert ? "text-red-400 font-medium" : "text-slate-500"}`}>{sub}</p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Commitments */}
          <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <ListChecks size={15} className="text-[#d4a843]" /> Commitments
            </h3>
            {!c || c.items.length === 0 ? (
              <p className="text-xs text-slate-600">No open commitments. Use /commit in Telegram to track one.</p>
            ) : (
              <ul className="space-y-2.5">
                {c.items.map((it) => (
                  <li key={it.id} className="flex items-start justify-between gap-3 text-sm">
                    <span className={it.overdue ? "text-red-300" : "text-slate-300"}>
                      {it.overdue && <AlertTriangle size={12} className="inline mr-1.5 -mt-0.5" />}
                      {it.title}
                    </span>
                    <span className={`text-xs shrink-0 ${it.overdue ? "text-red-400 font-medium" : "text-slate-500"}`}>
                      {it.due || "no date"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Meetings */}
          <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <CalendarDays size={15} className="text-emerald-400" /> Next 24 Hours
            </h3>
            {!data || data.meetings.length === 0 ? (
              <p className="text-xs text-slate-600">No meetings in the next 24 hours.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.meetings.map((m, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-slate-300">{m.summary}</span>
                    <span className="text-xs text-slate-500 shrink-0">
                      {timeOf(m.start)}{m.attendees > 0 ? ` · ${m.attendees}p` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Emails */}
          <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Mail size={15} className="text-purple-400" /> Inbox Highlights
            </h3>
            {!data || data.emails.top.length === 0 ? (
              <p className="text-xs text-slate-600">Inbox clear — no unread emails.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.emails.top.map((m, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-slate-400">{m.from}</span>
                    <span className="text-slate-600 mx-1.5">—</span>
                    <span className="text-slate-300">{m.subject}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Decisions */}
          <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
              <Landmark size={15} className="text-[#d4a843]" /> Recent Decisions
            </h3>
            {!data || data.decisions.length === 0 ? (
              <p className="text-xs text-slate-600">No decisions recorded yet. Use /decide or /council.</p>
            ) : (
              <ul className="space-y-2.5">
                {data.decisions.map((d, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 text-sm">
                    <span className="text-slate-300">{d.title}</span>
                    <span className="text-xs text-slate-500 shrink-0">{d.at}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-wrap gap-3">
          <Link
            href="/chat"
            className="flex items-center gap-2 bg-[#d4a843] text-[#040d1a] text-sm font-medium px-4 py-2 rounded-lg hover:bg-[#e0b855] transition-colors"
          >
            <MessageSquare size={15} /> Open Chat
          </Link>
          <button
            onClick={load}
            className="flex items-center gap-2 bg-[#071428] border border-[#0d2144] text-slate-300 text-sm px-4 py-2 rounded-lg hover:border-[#1a3a6b] transition-colors"
          >
            <RefreshCw size={15} /> Reload Feed
          </button>
        </div>
      </div>
    </div>
  );
}
