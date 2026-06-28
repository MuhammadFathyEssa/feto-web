// Reads agent-evaluation telemetry from Supabase (ai_audit_log) and aggregates
// it for the admin observability dashboard. Server-only (uses the service key).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const MONTHLY_TOKEN_CAP = Number(process.env.MONTHLY_TOKEN_HARD_CAP || 3_000_000);

export interface AuditRow {
  agent_type: string | null;
  engine: string | null;
  latency_ms: number | null;
  tokens_used: number | null;
  created_at: string;
}

export interface AgentStat { agent: string; count: number; avgLatencyMs: number }
export interface EngineStat { engine: string; count: number }
export interface TimeBucket { label: string; count: number }

export interface ObservabilityMetrics {
  windowHours: number;
  totalMessages: number;
  totalTokens: number;
  monthlyTokenCap: number;
  projectedMonthlyTokens: number;
  onPaceToExceed: boolean;
  avgLatencyMs: number;
  byAgent: AgentStat[];
  byEngine: EngineStat[];
  timeline: TimeBucket[];
  generatedAt: string;
  schemaOk: boolean;
}

async function fetchRows(sinceISO: string): Promise<AuditRow[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase not configured.");
  }
  const select = "select=agent_type,engine,latency_ms,tokens_used,created_at";
  const q = `${select}&created_at=gte.${encodeURIComponent(sinceISO)}&order=created_at.desc&limit=10000`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/ai_audit_log?${q}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    cache: "no-store",
  });
  if (!res.ok) {
    // Most likely schema drift (missing v5 columns) or RLS — surface, don't crash.
    throw new Error(`ai_audit_log query failed: ${res.status}`);
  }
  return (await res.json()) as AuditRow[];
}

function round(n: number): number {
  return Math.round(n);
}

export async function getObservabilityMetrics(windowHours = 24): Promise<ObservabilityMetrics> {
  const since = new Date(Date.now() - windowHours * 3600_000).toISOString();
  let rows: AuditRow[] = [];
  let schemaOk = true;
  try {
    rows = await fetchRows(since);
  } catch {
    schemaOk = false;
  }

  const totalMessages = rows.length;
  const totalTokens = rows.reduce((s, r) => s + (r.tokens_used || 0), 0);

  // Extrapolate this window's token rate to a 30-day month (FAST_MODE=0 cost watch).
  const projectedMonthlyTokens = windowHours > 0
    ? Math.round((totalTokens / windowHours) * 24 * 30)
    : 0;
  const onPaceToExceed = MONTHLY_TOKEN_CAP > 0 && projectedMonthlyTokens > MONTHLY_TOKEN_CAP;
  const latencies = rows.map((r) => r.latency_ms || 0).filter((n) => n > 0);
  const avgLatencyMs = latencies.length ? round(latencies.reduce((a, b) => a + b, 0) / latencies.length) : 0;

  // By agent
  const agentMap = new Map<string, { count: number; latSum: number; latN: number }>();
  for (const r of rows) {
    const a = r.agent_type || "unknown";
    const e = agentMap.get(a) || { count: 0, latSum: 0, latN: 0 };
    e.count++;
    if (r.latency_ms && r.latency_ms > 0) { e.latSum += r.latency_ms; e.latN++; }
    agentMap.set(a, e);
  }
  const byAgent: AgentStat[] = [...agentMap.entries()]
    .map(([agent, v]) => ({ agent, count: v.count, avgLatencyMs: v.latN ? round(v.latSum / v.latN) : 0 }))
    .sort((a, b) => b.count - a.count);

  // By engine (surfaces dual vs single vs fallback vs council)
  const engineMap = new Map<string, number>();
  for (const r of rows) {
    const e = r.engine || "unknown";
    engineMap.set(e, (engineMap.get(e) || 0) + 1);
  }
  const byEngine: EngineStat[] = [...engineMap.entries()]
    .map(([engine, count]) => ({ engine, count }))
    .sort((a, b) => b.count - a.count);

  // Timeline: hourly buckets if <=48h, else daily
  const daily = windowHours > 48;
  const buckets = new Map<string, number>();
  for (const r of rows) {
    const d = new Date(r.created_at);
    const key = daily
      ? d.toISOString().slice(0, 10)
      : `${d.toISOString().slice(11, 13)}:00`;
    buckets.set(key, (buckets.get(key) || 0) + 1);
  }
  const timeline: TimeBucket[] = [...buckets.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, count]) => ({ label, count }));

  return {
    windowHours,
    totalMessages,
    totalTokens,
    monthlyTokenCap: MONTHLY_TOKEN_CAP,
    projectedMonthlyTokens,
    onPaceToExceed,
    avgLatencyMs,
    byAgent,
    byEngine,
    timeline,
    generatedAt: new Date().toISOString(),
    schemaOk,
  };
}
