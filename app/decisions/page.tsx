"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Network, Lock, Plus, Loader2, Save, Sparkles, AlertTriangle, CheckCircle2 } from "lucide-react";

type Decision = {
  id: string;
  status: string;
  objective: string | null;
  context: string | null;
  constraints: string[];
  alternatives: string[];
  selected_alternative: string | null;
  rationale: string | null;
  risks: string[];
  expected_outcome: string | null;
  stakeholders: string[];
  confidence_score: number | null;
  created_at: string;
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#9aa7bd", active: "#e0a955", executed: "#3fb37f", superseded: "#7c6cff", abandoned: "#c25b5b",
};

function lines(v: string): string[] { return v.split("\n").map((s) => s.trim()).filter(Boolean); }

export default function DecisionsPage() {
  const [list, setList] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState("");
  const [creating, setCreating] = useState(false);
  const [newText, setNewText] = useState("");
  const [selected, setSelected] = useState<Decision | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setNote("");
    try {
      const r = await fetch("/api/proxy/decisions");
      const d = await r.json();
      if (r.status === 403) { setNote("Admin access required."); return; }
      if (d.success) setList(d.decisions || []);
      else setNote(d.error || "Failed to load.");
    } catch { setNote("Network error — try again."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function createDraft() {
    if (!newText.trim() || creating) return;
    setCreating(true); setNote("");
    try {
      const r = await fetch("/api/proxy/decisions", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: newText.trim() }),
      });
      const d = await r.json();
      if (d.success) { setNewText(""); setSelected(d.decision); await load(); }
      else setNote(d.error || "Create failed.");
    } catch { setNote("Network error — try again."); }
    finally { setCreating(false); }
  }

  async function save() {
    if (!selected || saving) return;
    setSaving(true); setSavedFlash(false);
    const patch = {
      objective: selected.objective, context: selected.context,
      constraints: selected.constraints, alternatives: selected.alternatives,
      selected_alternative: selected.selected_alternative, rationale: selected.rationale,
      risks: selected.risks, expected_outcome: selected.expected_outcome,
      stakeholders: selected.stakeholders, confidence_score: selected.confidence_score,
      status: selected.status,
    };
    try {
      const r = await fetch(`/api/proxy/decisions/${selected.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patch }),
      });
      const d = await r.json();
      if (d.success) { setSavedFlash(true); await load(); }
      else setNote(d.error || "Save failed.");
    } catch { setNote("Network error — try again."); }
    finally { setSaving(false); }
  }

  const dir = (s: string | null) => (/[\u0600-\u06FF]/.test(s || "") ? "rtl" : "ltr");
  const missing = (v: unknown) => (Array.isArray(v) ? v.length === 0 : !v);

  function field(label: string, value: string, onChange: (v: string) => void, area = false) {
    const empty = !value;
    return (
      <label className="block">
        <span className="mb-1 flex items-center gap-1.5 text-xs text-slate-400">
          {label} {empty && <span className="text-amber-400">• needs input</span>}
        </span>
        {area ? (
          <textarea dir={dir(value)} value={value} onChange={(e) => onChange(e.target.value)} rows={3}
            className={`w-full resize-y rounded-lg border bg-[#0a1830] p-2.5 text-sm text-slate-200 outline-none focus:border-[#e0a955]/50 ${empty ? "border-amber-900/50" : "border-[#1a2235]"}`} />
        ) : (
          <input dir={dir(value)} value={value} onChange={(e) => onChange(e.target.value)}
            className={`w-full rounded-lg border bg-[#0a1830] p-2.5 text-sm text-slate-200 outline-none focus:border-[#e0a955]/50 ${empty ? "border-amber-900/50" : "border-[#1a2235]"}`} />
        )}
      </label>
    );
  }

  return (
    <div className="min-h-screen bg-[#050d1a] text-slate-200 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-5 flex items-center gap-3">
          <Link href="/app" className="text-slate-400 hover:text-[#e0a955]"><ArrowLeft className="h-5 w-5" /></Link>
          <h1 className="flex items-center gap-2 text-xl font-semibold text-[#e0a955]"><Network className="h-5 w-5" /> Decision Graph</h1>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-[#e0a955]"><Lock size={11} /> Admin only</span>
        </div>

        {note && (
          <div className="mb-4 flex items-center gap-2 rounded-lg border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-amber-300">
            <AlertTriangle className="h-4 w-4" /> {note}
          </div>
        )}

        {/* New decision from text → extraction → draft */}
        <div className="mb-6 rounded-xl border border-[#1a2235] bg-[#0d2144]/40 p-4">
          <div className="mb-2 text-sm font-medium text-slate-200">New decision</div>
          <textarea value={newText} onChange={(e) => setNewText(e.target.value)} rows={3}
            placeholder="اكتب القرار بجملة… والنظام هيستخرج الهدف والبدائل والمخاطر تلقائياً، وتكمّل الناقص."
            className="w-full resize-y rounded-lg border border-[#1a2235] bg-[#0a1830] p-2.5 text-sm text-slate-200 placeholder-slate-600 outline-none focus:border-[#e0a955]/50" />
          <button onClick={createDraft} disabled={creating || !newText.trim()}
            className="mt-2 flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Extract &amp; save draft
          </button>
        </div>

        {/* List */}
        <div className="mb-6">
          <div className="mb-2 text-xs uppercase tracking-wide text-slate-500">Decisions</div>
          {loading ? (
            <div className="flex items-center gap-2 text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> loading…</div>
          ) : list.length === 0 ? (
            <div className="text-sm text-slate-600">No decisions yet. Create one above.</div>
          ) : (
            <div className="space-y-2">
              {list.map((d) => (
                <button key={d.id} onClick={() => { setSelected(d); setSavedFlash(false); }}
                  dir={dir(d.objective)}
                  className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-start transition ${selected?.id === d.id ? "border-[#e0a955]/60 bg-[#0d2144]" : "border-[#1a2235] bg-[#0a1830] hover:border-[#e0a955]/30"}`}>
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_COLORS[d.status] || "#9aa7bd" }} />
                  <span className="flex-1 truncate text-sm text-slate-200">{d.objective || "(untitled)"}</span>
                  <span className="shrink-0 text-xs" style={{ color: STATUS_COLORS[d.status] || "#9aa7bd" }}>{d.status}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        {selected && (
          <div className="rounded-xl border border-[#1a2235] bg-[#0d2144]/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-slate-200">Review &amp; complete</span>
              <select value={selected.status} onChange={(e) => setSelected({ ...selected, status: e.target.value })}
                className="rounded-md border border-[#1a2235] bg-[#0a1830] px-2 py-1 text-xs text-slate-200">
                {["draft", "active", "executed", "superseded", "abandoned"].map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              {field("Objective", selected.objective || "", (v) => setSelected({ ...selected, objective: v }))}
              {field("Context", selected.context || "", (v) => setSelected({ ...selected, context: v }), true)}
              {field("Constraints (one per line)", selected.constraints.join("\n"), (v) => setSelected({ ...selected, constraints: lines(v) }), true)}
              {field("Alternatives (one per line)", selected.alternatives.join("\n"), (v) => setSelected({ ...selected, alternatives: lines(v) }), true)}
              {field("Selected alternative", selected.selected_alternative || "", (v) => setSelected({ ...selected, selected_alternative: v }))}
              {field("Rationale", selected.rationale || "", (v) => setSelected({ ...selected, rationale: v }), true)}
              {field("Risks (one per line)", selected.risks.join("\n"), (v) => setSelected({ ...selected, risks: lines(v) }), true)}
              {field("Expected outcome", selected.expected_outcome || "", (v) => setSelected({ ...selected, expected_outcome: v }), true)}
              {field("Stakeholders (one per line)", selected.stakeholders.join("\n"), (v) => setSelected({ ...selected, stakeholders: lines(v) }), true)}
              {field("Confidence (0–1)", selected.confidence_score == null ? "" : String(selected.confidence_score),
                (v) => setSelected({ ...selected, confidence_score: v.trim() === "" ? null : Number(v) }))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <button onClick={save} disabled={saving}
                className="flex items-center gap-2 rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428] disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Save
              </button>
              {savedFlash && <span className="flex items-center gap-1 text-sm text-emerald-400"><CheckCircle2 className="h-4 w-4" /> saved</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
