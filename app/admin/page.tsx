"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Users, Activity, Lock, AlertTriangle } from "lucide-react";

const users = [
  { id: "web-user-1", name: "Dr. Muhammad Fathy", role: "owner", messages: 1284, lastActive: "2m ago" },
  { id: "tg-admin-1", name: "Telegram Admin", role: "admin", messages: 342, lastActive: "1h ago" },
  { id: "wa-user-1", name: "WhatsApp User", role: "user", messages: 87, lastActive: "3h ago" },
];

const auditLog = [
  { time: "22:48", user: "web-user-1", action: "chat", agent: "cybersecurity", msg: "Zero Trust architecture query" },
  { time: "22:31", user: "web-user-1", action: "chat", agent: "dfir", msg: "Ransomware IR playbook" },
  { time: "21:55", user: "tg-admin-1", action: "command", agent: "—", msg: "/scan feto-agent-production.up.railway.app" },
  { time: "21:12", user: "web-user-1", action: "chat", agent: "banking", msg: "T24 go-live checklist" },
  { time: "20:44", user: "wa-user-1", action: "chat", agent: "technology", msg: "Nutanix vs VMware comparison" },
];

const roleColors: Record<string, string> = {
  owner: "text-[#d4a843] bg-[#d4a843]/10 border-[#d4a843]/30",
  admin: "text-blue-400 bg-blue-900/20 border-blue-800/30",
  user: "text-slate-400 bg-[#0d2144] border-[#1a2235]",
};

export default function AdminPage() {
  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <header className="border-b border-[#0d2144] bg-[#071428] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#d4a843]" />
          <span className="font-semibold text-sm">Admin Portal</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[#d4a843]">
          <Lock size={11} />
          Owner only
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: "3", icon: Users },
            { label: "Total Messages", value: "1,713", icon: Activity },
            { label: "Active Agents", value: "10", icon: Shield },
            { label: "Security Flags", value: "0", icon: AlertTriangle },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="bg-[#071428] border border-[#0d2144] rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500">{label}</span>
                <Icon size={13} className="text-slate-600" />
              </div>
              <p className="text-xl font-semibold text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        {/* Users */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0d2144]">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Users size={14} className="text-[#d4a843]" /> Users
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0d2144]">
                  {["User ID", "Name", "Role", "Messages", "Last Active"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#0d2144]/50 last:border-0 hover:bg-[#0d2144]/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{u.id}</td>
                    <td className="px-5 py-3 text-slate-300">{u.name}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs border font-mono ${roleColors[u.role]}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-400 font-mono text-xs">{u.messages.toLocaleString()}</td>
                    <td className="px-5 py-3 text-slate-500 text-xs">{u.lastActive}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0d2144]">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Activity size={14} className="text-[#d4a843]" /> Audit Log
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#0d2144]">
                  {["Time", "User", "Action", "Agent", "Message"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs text-slate-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {auditLog.map((row, i) => (
                  <tr key={i} className="border-b border-[#0d2144]/50 last:border-0 hover:bg-[#0d2144]/30 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.time}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{row.user}</td>
                    <td className="px-5 py-3">
                      <span className="px-2 py-0.5 rounded text-xs bg-[#0d2144] text-slate-400 font-mono">{row.action}</span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#d4a843]">{row.agent}</td>
                    <td className="px-5 py-3 text-slate-400 text-xs truncate max-w-xs">{row.msg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
