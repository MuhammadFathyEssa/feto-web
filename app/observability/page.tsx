"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Activity, Clock, Cpu, Zap, AlertTriangle, Loader2, RefreshCw } from "lucide-react";

interface AgentStat { agent: string; count: number; avgLatencyMs: number }
interface EngineStat { engine: string; count: number }
interface TimeBucket { label: string; count: number }
interface Metrics {
  windowHours: number;
  totalMessages: number;
  totalTokens: number;
  monthlyTokenCap: number;
  avgLatencyMs: number;
  byAgent: AgentStat[];
  byEngine: EngineStat[];
  timeline: TimeBucket[];
  generatedAt: string;
  schemaOk: boolean;
}

const WINDOWS = [
  { label: "24h", hours: 24 },
  { label: "7d", hours: 168 },
  { label: "30d", hours: 720 },
];

// Engine label coloring: dual/council = healthy gold; fallback = amber warning.
function engineTone(engine: string): string {
  if (/fallback|general/i.test(engine)) return "bg-amber-500/70";
  if (/council/i.test(engine)) return "bg-emerald-500/70";
  if (/dual/i.test(engine)) return "bg-[#e0a955]";
  return "bg-blue-500/70";
}

export default function ObservabilityPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hours, setHours] = useState(24);

  const load = useCallback((h: number) => {
    setLoading(true);
    setError("");
    fetch(`/api/admin/observability?hours=${h}`)
      .then((r) => r.json().then((d) => ({ status: r.status, d })))
      .then(({ status, d }) => {
        if (status === 403) { setError("Admin access required."); return; }
        if (!d.success) { setError(d.error || "Failed to load metrics."); return; }
        setMetrics(d.metrics);
      })
      .catch(() => setError("Network error."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(hours); }, [hours, load]);

  const tokenPct = metrics && metrics.monthlyTokenCap
    ? Math.min(100, (metrics.totalTokens / metrics.monthlyTokenCap) * 100)
    : 0;
  const maxAgent = metrics ? Math.max(1, ...metrics.byAgent.map((a) => a.count)) : 1;
  const maxEngine = metrics ? Math.max(1, ...metrics.byEngine.map((e) => e.count)) : 1;
  const maxTl = metrics ? Math.max(1, ...metrics.timeline.map((t) => t.count)) : 1;

  return (
    <div className="min-h-screen bg-[#050d1a] text-slate-200 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="text-slate-400 hover:text-[#e0a955]">
              <ArrowLeft className="h-5 w-5" />
            </Link>
            <h1 className="flex items-center gap-2 text-xl font-semibold text-[#e0a955]">
              <Activity className="h-5 w-5" /> Observability
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg border border-[#1a2235] bg-[#0d2144] p-0.5">
              {WINDOWS.map((w) => (
                <button
                  key={w.hours}
                  onClick={() => setHours(w.hours)}
                  className={`px-3 py-1 text-sm rounded-md transition ${
                    hours === w.hours ? "bg-[#e0a955] text-[#071428] font-medium" : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {w.label}
                </button>
              ))}
            </div>
            <button onClick={() => load(hours)} className="rounded-lg border border-[#1a2235] bg-[#0d2144] p-2 text-slate-400 hover:text-[#e0a955]">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-red-900/40 bg-red-950/30 px-4 py-3 text-red-300">
            <AlertTriangle className="h-4 w-4" /> {error}
          </div>
        )}

        {loading && !metrics && (
          <div className="flex items-center justify-center py-20 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        )}

        {metrics && (
          <>
            {!metrics.schemaOk && (
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-amber-300">
                <AlertTriangle className="h-4 w-4" />
                <span>ai_audit_log unavailable or missing v5 columns — run migrations/002_ai_audit_log_columns.sql in Supabase.</span>
              </div>
            )}

            {/* Summary cards */}
            <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Card icon={<Activity className="h-4 w-4" />} label="Messages" value={metrics.totalMessages.toLocaleString()} />
              <Card icon={<Clock className="h-4 w-4" />} label="Avg latency" value={`${metrics.avgLatencyMs} ms`} />
              <Card icon={<Cpu className="h-4 w-4" />} label="Agents used" value={String(metrics.byAgent.length)} />
              <Card icon={<Zap className="h-4 w-4" />} label="Tokens" value={metrics.totalTokens.toLocaleString()} />
            </div>

            {/* Token usage vs monthly cap */}
            <Panel title="Token usage vs monthly cap">
              <div className="mb-1 flex justify-between text-xs text-slate-400">
                <span>{metrics.totalTokens.toLocaleString()} used (this window)</span>
                <span>cap {metrics.monthlyTokenCap.toLocaleString()}/mo · {tokenPct.toFixed(1)}%</span>
              </div>
              <div className="h-3 w-full overflow-hidden rounded-full bg-[#071428]">
                <div
                  className={`h-full rounded-full ${tokenPct > 80 ? "bg-red-500" : tokenPct > 50 ? "bg-amber-500" : "bg-[#e0a955]"}`}
                  style={{ width: `${tokenPct}%` }}
                />
              </div>
            </Panel>

            {/* Engine distribution */}
            <Panel title="Engine distribution (dual vs single vs council vs fallback)">
              <div className="space-y-2">
                {metrics.byEngine.map((e) => (
                  <Bar key={e.engine} label={e.engine} count={e.count} max={maxEngine} tone={engineTone(e.engine)} />
                ))}
                {!metrics.byEngine.length && <Empty />}
              </div>
            </Panel>

            {/* Agent breakdown */}
            <Panel title="Routing by agent (count · avg latency)">
              <div className="space-y-2">
                {metrics.byAgent.map((a) => (
                  <div key={a.agent}>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="text-slate-300">{a.agent}</span>
                      <span className="text-slate-500">{a.count} · {a.avgLatencyMs} ms</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-[#071428]">
                      <div className="h-full rounded-full bg-[#e0a955]" style={{ width: `${(a.count / maxAgent) * 100}%` }} />
                    </div>
                  </div>
                ))}
                {!metrics.byAgent.length && <Empty />}
              </div>
            </Panel>

            {/* Timeline */}
            <Panel title={metrics.windowHours > 48 ? "Messages per day" : "Messages per hour"}>
              <div className="flex items-end gap-1 h-32">
                {metrics.timeline.map((t) => (
                  <div key={t.label} className="flex flex-1 flex-col items-center justify-end" title={`${t.label}: ${t.count}`}>
                    <div className="w-full rounded-t bg-[#e0a955]/80" style={{ height: `${(t.count / maxTl) * 100}%` }} />
                    <span className="mt-1 truncate text-[9px] text-slate-500">{t.label}</span>
                  </div>
                ))}
                {!metrics.timeline.length && <Empty />}
              </div>
            </Panel>

            <p className="mt-4 text-right text-xs text-slate-600">
              updated {new Date(metrics.generatedAt).toLocaleString()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#1a2235] bg-[#0d2144] px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">{icon}{label}</div>
      <div className="text-lg font-semibold text-slate-100">{value}</div>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-4 rounded-xl border border-[#1a2235] bg-[#0a1830] p-4">
      <h2 className="mb-3 text-sm font-medium text-slate-300">{title}</h2>
      {children}
    </div>
  );
}

function Bar({ label, count, max, tone }: { label: string; count: number; max: number; tone: string }) {
  return (
    <div>
      <div className="mb-0.5 flex justify-between text-xs">
        <span className="text-slate-300">{label}</span>
        <span className="text-slate-500">{count}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[#071428]">
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${(count / max) * 100}%` }} />
      </div>
    </div>
  );
}

function Empty() {
  return <p className="py-4 text-center text-sm text-slate-600">No data in this window.</p>;
}
