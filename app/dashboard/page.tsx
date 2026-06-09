"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Shield, MessageSquare, Clock, Bot, AlertTriangle, ArrowLeft, TrendingUp, Activity } from "lucide-react";
import { healthCheck } from "@/lib/api";

const weeklyData = [
  { day: "Mon", value: 42 },
  { day: "Tue", value: 67 },
  { day: "Wed", value: 53 },
  { day: "Thu", value: 89 },
  { day: "Fri", value: 74 },
  { day: "Sat", value: 28 },
  { day: "Sun", value: 35 },
];

const maxVal = Math.max(...weeklyData.map((d) => d.value));

const agentUsage = [
  { name: "Cybersecurity", pct: 28, color: "bg-red-500" },
  { name: "Technology", pct: 22, color: "bg-blue-500" },
  { name: "Banking", pct: 18, color: "bg-emerald-500" },
  { name: "DFIR", pct: 14, color: "bg-purple-500" },
  { name: "Research", pct: 11, color: "bg-cyan-500" },
  { name: "Others", pct: 7, color: "bg-slate-500" },
];

export default function DashboardPage() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    healthCheck().then(setOnline);
  }, []);

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      {/* Header */}
      <header className="border-b border-[#0d2144] bg-[#071428] px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={18} />
        </Link>
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-[#d4a843]" />
          <span className="font-semibold text-sm">FeTo Dashboard</span>
        </div>
        <div className="ml-auto flex items-center gap-2 text-xs">
          <span className={`w-2 h-2 rounded-full ${online === null ? "bg-yellow-400" : online ? "bg-emerald-400" : "bg-red-400"}`} />
          <span className="text-slate-500">
            {online === null ? "Checking..." : online ? "API Online" : "API Offline"}
          </span>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Active Conversations", value: "1,284", delta: "+12%", icon: MessageSquare, color: "text-blue-400" },
            { label: "Messages Today", value: "3,847", delta: "+8%", icon: Activity, color: "text-emerald-400" },
            { label: "Avg Response Time", value: "1.8s", delta: "-0.3s", icon: Clock, color: "text-[#d4a843]" },
            { label: "Active Agents", value: "10", delta: "all", icon: Bot, color: "text-purple-400" },
          ].map(({ label, value, delta, icon: Icon, color }) => (
            <div key={label} className="bg-[#071428] border border-[#0d2144] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-slate-500">{label}</span>
                <Icon size={14} className={color} />
              </div>
              <p className="text-2xl font-semibold text-slate-100">{value}</p>
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <TrendingUp size={10} /> {delta}
              </p>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Weekly chart */}
          <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Weekly Message Volume</h3>
            <div className="flex items-end gap-2 h-32">
              {weeklyData.map(({ day, value }) => (
                <div key={day} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t bg-[#d4a843]/70 hover:bg-[#d4a843] transition-colors"
                    style={{ height: `${(value / maxVal) * 100}%` }}
                    title={`${value} messages`}
                  />
                  <span className="text-xs text-slate-600">{day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Agent usage */}
          <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
            <h3 className="text-sm font-medium text-slate-300 mb-4">Usage by Agent</h3>
            <div className="space-y-3">
              {agentUsage.map(({ name, pct, color }) => (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">{name}</span>
                    <span className="text-slate-500">{pct}%</span>
                  </div>
                  <div className="h-1.5 bg-[#0d2144] rounded-full overflow-hidden">
                    <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4">Recent Conversations</h3>
          <div className="space-y-1">
            {[
              { title: "Zero Trust Architecture review", agent: "technology", time: "2m ago" },
              { title: "CBE framework compliance gap analysis", agent: "cybersecurity", time: "18m ago" },
              { title: "Ransomware IR playbook", agent: "dfir", time: "1h ago" },
              { title: "T24 migration go-live checklist", agent: "banking", time: "2h ago" },
              { title: "LinkedIn post — AI in banking", agent: "content", time: "3h ago" },
            ].map(({ title, agent, time }) => (
              <div key={title} className="flex items-center justify-between py-2.5 border-b border-[#0d2144] last:border-0">
                <div className="flex items-center gap-3">
                  <MessageSquare size={13} className="text-slate-600" />
                  <span className="text-sm text-slate-300">{title}</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-xs text-slate-600 bg-[#0d2144] px-2 py-0.5 rounded font-mono">{agent}</span>
                  <span className="text-xs text-slate-600">{time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* API status */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl p-5">
          <h3 className="text-sm font-medium text-slate-300 mb-4 flex items-center gap-2">
            <AlertTriangle size={14} className="text-[#d4a843]" />
            System Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Railway API", status: online },
              { label: "Telegram Bot", status: true },
              { label: "WhatsApp", status: true },
              { label: "LinkedIn", status: true },
            ].map(({ label, status }) => (
              <div key={label} className="flex items-center gap-2 bg-[#0d2144] rounded-lg px-3 py-2">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  status === null ? "bg-yellow-400 animate-pulse" : status ? "bg-emerald-400" : "bg-red-400"
                }`} />
                <span className="text-xs text-slate-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
