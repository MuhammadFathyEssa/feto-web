"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Shield, Save, CheckCircle } from "lucide-react";

export default function SettingsPage() {
  const [saved, setSaved] = useState(false);
  const [apiUrl, setApiUrl] = useState(
    process.env.NEXT_PUBLIC_API_URL || "https://feto-agent-production.up.railway.app"
  );
  const [userId, setUserId] = useState("web-user-1");
  const [name, setName] = useState("Dr. Muhammad Fathy");

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <header className="border-b border-[#0d2144] bg-[#071428] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#d4a843]" />
          <span className="font-semibold text-sm">Settings</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Profile */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Profile</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Display Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d2144] border border-[#1a2235] focus:border-[#d4a843]/50 text-sm text-slate-200 outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">User ID</label>
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg bg-[#0d2144] border border-[#1a2235] focus:border-[#d4a843]/50 text-sm text-slate-200 outline-none transition-colors font-mono"
              />
              <p className="text-xs text-slate-600 mt-1">Used as userId in API calls. Change to match your Telegram ID for history sync.</p>
            </div>
          </div>
        </div>

        {/* API */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">API Configuration</h3>
          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Railway API URL</label>
            <input
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg bg-[#0d2144] border border-[#1a2235] focus:border-[#d4a843]/50 text-sm text-slate-200 outline-none transition-colors font-mono"
            />
            <p className="text-xs text-slate-600 mt-1">
              Set via NEXT_PUBLIC_API_URL environment variable on Vercel for persistence.
            </p>
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Appearance</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-300">Dark mode</p>
              <p className="text-xs text-slate-500">Banking-grade dark theme</p>
            </div>
            <div className="w-9 h-5 bg-[#d4a843] rounded-full relative cursor-not-allowed">
              <div className="w-3.5 h-3.5 bg-[#040d1a] rounded-full absolute right-0.5 top-0.5" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-3">About</h3>
          <div className="space-y-2 text-xs text-slate-500 font-mono">
            <div className="flex justify-between">
              <span>Platform</span><span className="text-slate-400">FeTo Enterprise</span>
            </div>
            <div className="flex justify-between">
              <span>Backend Build</span><span className="text-slate-400">v3.0-AD</span>
            </div>
            <div className="flex justify-between">
              <span>Agents</span><span className="text-slate-400">10</span>
            </div>
            <div className="flex justify-between">
              <span>Commands</span><span className="text-slate-400">87</span>
            </div>
            <div className="flex justify-between">
              <span>CBE Framework</span><span className="text-slate-400">Embedded</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#d4a843] hover:bg-[#c49a2a] text-[#040d1a] text-sm font-semibold transition-colors"
        >
          {saved ? <CheckCircle size={14} /> : <Save size={14} />}
          {saved ? "Saved" : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
