"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ShieldAlert, Loader2, ArrowLeft, RefreshCw, AlertTriangle } from "lucide-react";

const GOLD = "#e0a955";

interface BriefingItem {
  cve: string;
  vendor: string;
  product: string;
  cvss: number | null;
  severity: string | null;
  dateAdded: string;
  dueDate: string;
  ransomware: boolean;
}

interface BriefingResponse {
  success: boolean;
  briefing?: string;
  items?: BriefingItem[];
  generatedAt?: string;
  cairoTime?: string;
  source?: string;
  error?: string;
}

function sevColor(sev: string | null, cvss: number | null): string {
  const s = (sev || "").toLowerCase();
  if (s === "critical" || (cvss != null && cvss >= 9)) return "#c0532e";
  if (s === "high" || (cvss != null && cvss >= 7)) return GOLD;
  return "#5b7fb0";
}

export default function CyberPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BriefingResponse | null>(null);
  const [scope, setScope] = useState<"vendors" | "all">("vendors");
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/proxy/threat-briefing?scope=${scope}&days=7`, { cache: "no-store" });
      const json: BriefingResponse = await res.json();
      if (!json.success) { setError(json.error || "Generation failed"); setData(null); }
      else setData(json);
    } catch {
      setError("Network error — try again");
    } finally {
      setLoading(false);
    }
  }, [scope]);

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <div className="max-w-3xl mx-auto px-5 py-6">
        <Link href="/app" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-5">
          <ArrowLeft size={16} /> Back
        </Link>

        <div className="flex items-center gap-3 mb-1">
          <ShieldAlert size={26} style={{ color: GOLD }} />
          <h1 className="text-2xl font-serif" style={{ fontFamily: "Playfair Display, serif" }}>Threat Intelligence</h1>
        </div>
        <p className="text-slate-400 text-sm mb-6">
          Executive cyber briefing — actively-exploited vulnerabilities confirmed by CISA KEV, enriched with NVD CVSS. Banking-sector priority.
        </p>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex rounded-lg overflow-hidden border border-[#1a3f7c]/50">
            <button
              onClick={() => setScope("vendors")}
              className={`px-4 py-2 text-sm ${scope === "vendors" ? "bg-[#e0a955] text-black font-semibold" : "bg-transparent text-slate-300"}`}
            >Watched Vendors</button>
            <button
              onClick={() => setScope("all")}
              className={`px-4 py-2 text-sm ${scope === "all" ? "bg-[#e0a955] text-black font-semibold" : "bg-transparent text-slate-300"}`}
            >All (7 days)</button>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="ml-auto inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-[#e0a955] text-black font-semibold text-sm disabled:opacity-50"
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? "Generating…" : "Generate Briefing"}
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-4 rounded-lg bg-[#2a1410] border border-[#c0532e]/40 text-[#e8a08a] text-sm mb-5">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {data?.items && data.items.length > 0 && (
          <div className="mb-6">
            <div className="grid gap-2">
              {data.items.map((it) => (
                <div key={it.cve} className="flex items-center gap-3 p-3 rounded-lg bg-[#0a1830] border border-[#1a3f7c]/40">
                  <span className="font-mono text-xs px-2 py-1 rounded" style={{ background: sevColor(it.severity, it.cvss) + "22", color: sevColor(it.severity, it.cvss) }}>
                    {it.cvss != null ? it.cvss.toFixed(1) : "—"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-slate-100 truncate">{it.cve} · {it.vendor} {it.product}</div>
                    <div className="text-xs text-slate-500">added {it.dateAdded} · due {it.dueDate}</div>
                  </div>
                  {it.ransomware && (
                    <span className="text-xs px-2 py-0.5 rounded bg-[#c0532e]/20 text-[#e8a08a]">Ransomware</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {data?.briefing && (
          <div className="p-5 rounded-xl bg-[#0a1830] border border-[#1a3f7c]/40">
            <pre className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed" style={{ fontFamily: "inherit" }}>
              {data.briefing}
            </pre>
            <div className="mt-4 pt-3 border-t border-[#1a3f7c]/30 text-xs text-slate-500">
              {data.source} · UTC {data.generatedAt?.slice(0, 19).replace("T", " ")} · Cairo {data.cairoTime}
            </div>
          </div>
        )}

        {!data && !loading && !error && (
          <div className="text-center py-16 text-slate-500 text-sm">
            Select a scope and generate your first briefing.
          </div>
        )}
      </div>
    </div>
  );
}
