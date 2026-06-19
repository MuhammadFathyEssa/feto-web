"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { Trophy, Loader2, ArrowLeft, RefreshCw, AlertTriangle, ExternalLink, Calendar, Users, BarChart3 } from "lucide-react";

const GOLD = "#e0a955";

interface NewsItem { title: string; link: string; source: string; pubDate: string; ts: number; }
interface StandingTeam {
  position: number; team: string; tla: string; crest: string;
  played: number; won: number; draw: number; lost: number;
  goalsFor: number; goalsAgainst: number; goalDifference: number; points: number;
}
interface StandingGroup { group: string; table: StandingTeam[]; }
interface MatchInfo {
  id: number; utcDate: string; status: string; matchday: number | null; group: string | null;
  home: string; away: string; homeTla: string; awayTla: string;
  homeScore: number | null; awayScore: number | null; finished: boolean; live: boolean;
}

const SOURCE_COLORS: Record<string, string> = { BBC: "#c0532e", ESPN: "#5b7fb0", Guardian: "#e0a955" };

// Static fallback so the page is useful even before live data loads.
const GROUP = ["Egypt", "Belgium", "Iran", "New Zealand"];
const FALLBACK_FIXTURES = [
  { date: "Jun 15", home: "Belgium", away: "Egypt", note: "MD 1" },
  { date: "Jun 21", home: "New Zealand", away: "Egypt", note: "MD 2" },
  { date: "Jun 26", home: "Egypt", away: "Iran", note: "MD 3" },
];

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "just now";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function fmtMatchDate(utc: string): string {
  const d = new Date(utc);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) + " · " +
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Cairo" });
}

export default function WorldCupPage() {
  const [loading, setLoading] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [standings, setStandings] = useState<StandingGroup | null>(null);
  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [newsRes, standRes, matchRes] = await Promise.allSettled([
        fetch(`/api/proxy/worldcup-news?limit=20`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/proxy/worldcup-standings`, { cache: "no-store" }).then((r) => r.json()),
        fetch(`/api/proxy/worldcup-matches`, { cache: "no-store" }).then((r) => r.json()),
      ]);

      if (newsRes.status === "fulfilled" && newsRes.value?.success) {
        setNews(newsRes.value.items || []);
        setGeneratedAt(newsRes.value.generatedAt || null);
      }
      if (standRes.status === "fulfilled" && standRes.value?.success) {
        const groups: StandingGroup[] = standRes.value.groups || [];
        // Egypt's group (Group G); fall back to first group if labels differ.
        const g = groups.find((x) => /g/i.test(x.group) && x.table.some((t) => /egypt/i.test(t.team))) ||
                  groups.find((x) => x.table.some((t) => /egypt/i.test(t.team))) || null;
        setStandings(g);
      }
      if (matchRes.status === "fulfilled" && matchRes.value?.success) {
        const all: MatchInfo[] = matchRes.value.matches || [];
        const egypt = all.filter((m) => /egypt/i.test(m.home) || /egypt/i.test(m.away));
        setMatches(egypt.length ? egypt : all.slice(0, 6));
      }

      const allFailed = [newsRes, standRes, matchRes].every(
        (r) => r.status === "rejected" || !r.value?.success
      );
      if (allFailed) setError("Couldn't load live data — showing the confirmed group and schedule below.");
    } catch {
      setError("Network error — showing the confirmed group and schedule below.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const hasLiveStandings = standings && standings.table.length > 0;
  const hasLiveMatches = matches.length > 0;

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-5">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <Trophy size={26} style={{ color: GOLD }} />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "Playfair Display, serif" }}>World Cup 2026</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Egypt&apos;s campaign in Group G — live standings, results, and headlines. Hosted across the USA, Canada, and Mexico, Jun 11 – Jul 19, 2026.
        </p>

        {/* Refresh */}
        <div className="flex items-center justify-end mb-4">
          <button
            onClick={load}
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-4 rounded-lg bg-[#1e2233] border border-[#e0a955]/30 text-slate-300 text-sm mb-5">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" style={{ color: GOLD }} /> {error}
          </div>
        )}

        {/* Standings table (live) */}
        <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={18} style={{ color: GOLD }} />
            <h2 className="text-sm font-semibold tracking-wide text-slate-100">GROUP G — STANDINGS</h2>
          </div>

          {hasLiveStandings ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-500 text-xs">
                    <th className="text-left font-medium py-1.5 pr-2">#</th>
                    <th className="text-left font-medium py-1.5">Team</th>
                    <th className="text-center font-medium py-1.5 px-1.5">P</th>
                    <th className="text-center font-medium py-1.5 px-1.5">W</th>
                    <th className="text-center font-medium py-1.5 px-1.5">D</th>
                    <th className="text-center font-medium py-1.5 px-1.5">L</th>
                    <th className="text-center font-medium py-1.5 px-1.5">GD</th>
                    <th className="text-center font-semibold py-1.5 pl-1.5" style={{ color: GOLD }}>Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {standings!.table.map((t) => {
                    const isEgypt = /egypt/i.test(t.team);
                    return (
                      <tr key={t.position} className={`border-t border-[#1a3f7c]/20 ${isEgypt ? "bg-[#e0a955]/10" : ""}`}>
                        <td className={`py-2 pr-2 ${isEgypt ? "text-[#e0a955] font-semibold" : "text-slate-400"}`}>{t.position}</td>
                        <td className={`py-2 ${isEgypt ? "text-[#e0a955] font-semibold" : "text-slate-200"}`}>{t.team}</td>
                        <td className="text-center py-2 px-1.5 text-slate-300">{t.played}</td>
                        <td className="text-center py-2 px-1.5 text-slate-300">{t.won}</td>
                        <td className="text-center py-2 px-1.5 text-slate-300">{t.draw}</td>
                        <td className="text-center py-2 px-1.5 text-slate-300">{t.lost}</td>
                        <td className="text-center py-2 px-1.5 text-slate-400">{t.goalDifference >= 0 ? "+" : ""}{t.goalDifference}</td>
                        <td className={`text-center py-2 pl-1.5 font-semibold ${isEgypt ? "text-[#e0a955]" : "text-slate-100"}`}>{t.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {GROUP.map((team) => (
                <div key={team} className={`text-sm px-3 py-2 rounded-lg border ${
                  team === "Egypt" ? "bg-[#e0a955]/15 border-[#e0a955]/50 text-[#e0a955] font-semibold" : "bg-[#040d1a] border-[#1a3f7c]/30 text-slate-300"
                }`}>{team}</div>
              ))}
              <p className="col-span-2 text-xs text-slate-600 mt-1">Standings update once matches kick off.</p>
            </div>
          )}
        </div>

        {/* Matches / results (live) */}
        <div className="rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Calendar size={18} style={{ color: GOLD }} />
            <h2 className="text-sm font-semibold tracking-wide text-slate-100">EGYPT MATCHES</h2>
          </div>

          {hasLiveMatches ? (
            <div className="grid gap-2">
              {matches.map((m) => {
                const egyptHome = /egypt/i.test(m.home);
                const done = m.finished && m.homeScore !== null && m.awayScore !== null;
                const live = m.live && m.homeScore !== null && m.awayScore !== null;
                return (
                  <div key={m.id} className="flex items-center gap-3 text-sm py-2 border-b border-[#1a3f7c]/20 last:border-0">
                    <span className="text-xs text-slate-500 w-24 shrink-0">{done ? "FT" : live ? "LIVE" : fmtMatchDate(m.utcDate)}</span>
                    <span className="flex-1 flex items-center justify-center gap-2">
                      <span className={`text-right flex-1 ${egyptHome ? "text-[#e0a955] font-medium" : "text-slate-200"}`}>{m.home}</span>
                      {done || live ? (
                        <span className={`font-mono font-semibold px-2 ${live ? "text-red-400" : "text-slate-100"}`}>{m.homeScore} - {m.awayScore}</span>
                      ) : (
                        <span className="text-slate-600 px-2">vs</span>
                      )}
                      <span className={`text-left flex-1 ${!egyptHome ? "text-[#e0a955] font-medium" : "text-slate-200"}`}>{m.away}</span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="grid gap-2">
              {FALLBACK_FIXTURES.map((f, i) => (
                <div key={i} className="flex items-center gap-3 text-sm py-2 border-b border-[#1a3f7c]/20 last:border-0">
                  <span className="text-xs font-mono text-slate-500 w-14 shrink-0">{f.date}</span>
                  <span className="flex-1 text-slate-200">
                    <span className={f.home === "Egypt" ? "text-[#e0a955] font-medium" : ""}>{f.home}</span>
                    <span className="text-slate-600 mx-2">vs</span>
                    <span className={f.away === "Egypt" ? "text-[#e0a955] font-medium" : ""}>{f.away}</span>
                  </span>
                  <span className="text-xs text-slate-600 shrink-0">{f.note}</span>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-slate-600 mt-3">Times shown in Cairo time (EEST). Live scores update automatically.</p>
        </div>

        {/* Headlines */}
        <h2 className="text-sm font-semibold tracking-wide text-slate-100 mb-4">LATEST HEADLINES</h2>
        {news.length > 0 ? (
          <div className="grid gap-2.5">
            {news.map((it, i) => {
              const color = SOURCE_COLORS[it.source] || GOLD;
              return (
                <a key={`${it.link}-${i}`} href={it.link} target="_blank" rel="noopener noreferrer"
                  className="group flex items-start gap-3 p-4 rounded-lg bg-[#0a1830] border border-[#1a3f7c]/40 hover:border-[#e0a955]/50 transition-colors">
                  <span className="text-xs font-mono mt-0.5 px-2 py-1 rounded whitespace-nowrap" style={{ background: color + "22", color }}>{it.source}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-100 leading-snug group-hover:text-white">{it.title}</div>
                    <div className="text-xs text-slate-500 mt-1">{timeAgo(it.ts)}</div>
                  </div>
                  <ExternalLink size={14} className="text-slate-600 group-hover:text-[#e0a955] mt-1 shrink-0" />
                </a>
              );
            })}
            {generatedAt && (
              <div className="text-xs text-slate-600 text-center mt-3">Updated {generatedAt.slice(0, 19).replace("T", " ")} UTC</div>
            )}
          </div>
        ) : loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Loader2 size={20} className="animate-spin mx-auto mb-3" /> Loading World Cup data…
          </div>
        ) : (
          <div className="text-center py-10 text-slate-500 text-sm">No headlines right now — try refreshing.</div>
        )}
      </div>
    </div>
  );
}
