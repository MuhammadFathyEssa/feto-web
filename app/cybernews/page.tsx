"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Newspaper, Loader2, ArrowLeft, RefreshCw, AlertTriangle, ExternalLink } from "lucide-react";

const GOLD = "#e0a955";

interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  ts: number;
}

interface NewsResponse {
  success: boolean;
  items?: NewsItem[];
  generatedAt?: string;
  error?: string;
}

const SOURCE_COLORS: Record<string, string> = {
  "The Hacker News": "#e0a955",
  "BleepingComputer": "#5b7fb0",
  "SecurityWeek": "#c0532e",
  "Dark Reading": "#7c5bb0",
};

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function CyberNewsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<NewsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60000);
    try {
      const res = await fetch(`/api/proxy/security-news?limit=15`, { cache: "no-store", signal: controller.signal });
      const json: NewsResponse = await res.json();
      if (!json.success) { setError(json.error || "Failed to load news"); setData(null); }
      else setData(json);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") setError("Request timed out. Please try again.");
      else setError("Network error — try again");
    } finally {
      clearTimeout(timer);
      setLoading(false);
    }
  }, []);

  // Auto-load on first visit.
  useEffect(() => { load(); }, [load]);

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-5">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <Newspaper size={26} style={{ color: GOLD }} />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "Playfair Display, serif" }}>Cybersecurity News</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Latest headlines from the leading security outlets — The Hacker News, BleepingComputer, SecurityWeek, Dark Reading. Updated continuously.
        </p>

        <div className="flex items-center mb-6">
          <button
            onClick={load}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-[#2a1410] border border-[#c0532e]/40 text-[#e8a08a] text-sm mb-5">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {data?.items && data.items.length > 0 && (
          <div className="grid gap-2.5">
            {data.items.map((it, i) => {
              const color = SOURCE_COLORS[it.source] || GOLD;
              return (
                <a
                  key={`${it.link}-${i}`}
                  href={it.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-4 rounded-lg bg-[#0a1830] border border-[#1a3f7c]/40 hover:border-[#e0a955]/50 transition-colors"
                >
                  <span className="text-xs font-mono mt-0.5 px-2 py-1 rounded whitespace-nowrap" style={{ background: color + "22", color }}>
                    {it.source}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-100 leading-snug group-hover:text-white">{it.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{timeAgo(it.ts)}</div>
                  </div>
                  <ExternalLink size={14} className="text-slate-600 group-hover:text-[#e0a955] mt-1 shrink-0" />
                </a>
              );
            })}
            {data.generatedAt && (
              <div className="text-xs text-slate-600 text-center mt-3">
                Updated {data.generatedAt.slice(0, 19).replace("T", " ")} UTC
              </div>
            )}
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-16 text-slate-500 text-sm">
            <Loader2 size={20} className="animate-spin mx-auto mb-3" />
            Fetching the latest security headlines…
          </div>
        )}

        {!loading && data?.items && data.items.length === 0 && (
          <div className="text-center py-16 text-slate-500 text-sm">
            No headlines available right now. Try refreshing.
          </div>
        )}
      </div>
    </div>
  );
}
