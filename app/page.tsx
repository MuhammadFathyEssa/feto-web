"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, defaultAgents } from "@/lib/api";
import type { Message, Conversation } from "@/types";
import {
  Send, Plus, MessageSquare, LayoutDashboard, Settings,
  Shield, ChevronDown, Bot, User, AlertCircle, Loader2,
  Menu, X, LogOut, Users, Zap
} from "lucide-react";
import Link from "next/link";

const USER_ID = "web-user-1";

function AgentBadge({ agentType }: { agentType: string }) {
  const agent = defaultAgents.find((a) => a.id === agentType);
  const colors: Record<string, string> = {
    cybersecurity: "bg-red-900/40 text-red-300 border-red-800/50",
    pentester: "bg-orange-900/40 text-orange-300 border-orange-800/50",
    dfir: "bg-purple-900/40 text-purple-300 border-purple-800/50",
    technology: "bg-blue-900/40 text-blue-300 border-blue-800/50",
    banking: "bg-emerald-900/40 text-emerald-300 border-emerald-800/50",
    research: "bg-cyan-900/40 text-cyan-300 border-cyan-800/50",
    content: "bg-pink-900/40 text-pink-300 border-pink-800/50",
    assistant: "bg-yellow-900/40 text-yellow-300 border-yellow-800/50",
    incident: "bg-red-900/40 text-red-300 border-red-800/50",
    recruiter: "bg-teal-900/40 text-teal-300 border-teal-800/50",
    general: "bg-slate-800/40 text-slate-400 border-slate-700/50",
  };
  const colorClass = colors[agentType] || colors.general;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border font-mono ${colorClass}`}>
      <Zap size={10} />
      {agent?.name || agentType}
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex gap-3 px-4 py-3">
      <div className="w-7 h-7 rounded-full bg-[#d4a843]/20 border border-[#d4a843]/40 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-[#d4a843]" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#111827] border border-[#1a2235]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a843] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a843] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a843] animate-bounce" />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex gap-3 px-4 py-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser
          ? "bg-[#1a3f7c] border border-[#143060]"
          : "bg-[#d4a843]/20 border border-[#d4a843]/40"
      }`}>
        {isUser
          ? <User size={13} className="text-blue-300" />
          : <Bot size={13} className="text-[#d4a843]" />
        }
      </div>
      <div className={`max-w-[75%] flex flex-col gap-1.5 ${isUser ? "items-end" : "items-start"}`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
          isUser
            ? "bg-[#143060] border border-[#1a3f7c] text-slate-100 rounded-tr-sm"
            : message.error
            ? "bg-red-900/20 border border-red-800/40 text-red-300 rounded-tl-sm"
            : "bg-[#111827] border border-[#1a2235] text-slate-200 rounded-tl-sm"
        }`}>
          {message.error && (
            <span className="flex items-center gap-1.5 mb-1 text-red-400 text-xs">
              <AlertCircle size={12} /> Error
            </span>
          )}
          {message.content}
        </div>
        {message.agentType && !isUser && (
          <AgentBadge agentType={message.agentType} />
        )}
        <span className="text-xs text-slate-600">
          {message.timestamp.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
    </div>
  );
}

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: "1", title: "New conversation", lastMessage: "", timestamp: new Date(), messages: [] },
  ]);
  const [activeId, setActiveId] = useState("1");
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [agentDropdown, setAgentDropdown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeId)!;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv?.messages, loading]);

  const newConversation = useCallback(() => {
    const id = Date.now().toString();
    setConversations((prev) => [
      { id, title: "New conversation", lastMessage: "", timestamp: new Date(), messages: [] },
      ...prev,
    ]);
    setActiveId(id);
    setSidebarOpen(false);
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: c.messages.length === 0 ? text.slice(0, 40) : c.title,
              lastMessage: text,
              messages: [...c.messages, userMsg],
            }
          : c
      )
    );
    setInput("");
    setLoading(true);

    try {
      const data = await sendMessage(USER_ID, text);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.success ? data.response : (data.error || "Request failed"),
        agentType: data.agentType || "general",
        timestamp: new Date(),
        error: !data.success,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId
            ? { ...c, lastMessage: assistantMsg.content.slice(0, 60), messages: [...c.messages, assistantMsg] }
            : c
        )
      );
    } catch (err) {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err instanceof Error ? err.message : "Connection failed. Check Railway deployment.",
        timestamp: new Date(),
        error: true,
      };
      setConversations((prev) =>
        prev.map((c) =>
          c.id === activeId ? { ...c, messages: [...c.messages, errMsg] } : c
        )
      );
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading, activeId]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const agentOptions = [
    { id: "auto", name: "Auto (Coordinator)" },
    ...defaultAgents,
  ];

  return (
    <div className="flex h-screen bg-[#040d1a] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed md:relative z-30 md:z-auto
        w-64 h-full flex flex-col
        bg-[#071428] border-r border-[#0d2144]
        transition-transform duration-200
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#0d2144]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#d4a843]/20 border border-[#d4a843]/40 flex items-center justify-center">
              <Shield size={14} className="text-[#d4a843]" />
            </div>
            <span className="font-semibold text-sm text-slate-100">FeTo Enterprise</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* New Chat */}
        <div className="p-3">
          <button
            onClick={newConversation}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-[#0d2144] border border-[#1a2235] hover:border-[#d4a843]/30 transition-colors"
          >
            <Plus size={14} className="text-[#d4a843]" />
            New conversation
          </button>
        </div>

        {/* Conversations */}
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => { setActiveId(conv.id); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${
                conv.id === activeId
                  ? "bg-[#0d2144] border border-[#1a3f7c]/50 text-slate-100"
                  : "text-slate-400 hover:bg-[#0d2144]/50 hover:text-slate-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <MessageSquare size={12} className="flex-shrink-0 opacity-50" />
                <span className="truncate">{conv.title}</span>
              </div>
              {conv.lastMessage && (
                <p className="text-xs text-slate-600 truncate mt-0.5 pl-5">
                  {conv.lastMessage}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Bottom nav */}
        <div className="border-t border-[#0d2144] p-3 space-y-1">
          {[
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { href: "/admin", icon: Users, label: "Admin" },
            { href: "/settings", icon: Settings, label: "Settings" },
          ].map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-[#0d2144] hover:text-slate-300 transition-colors"
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
          <Link
            href="/login"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors"
          >
            <LogOut size={14} />
            Sign out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#0d2144] bg-[#071428]/80 backdrop-blur-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden text-slate-400 hover:text-slate-200"
          >
            <Menu size={18} />
          </button>

          {/* Agent selector */}
          <div className="relative">
            <button
              onClick={() => setAgentDropdown(!agentDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[#0d2144] border border-[#1a2235] hover:border-[#d4a843]/40 text-slate-300 transition-colors"
            >
              <Bot size={13} className="text-[#d4a843]" />
              {agentOptions.find((a) => a.id === selectedAgent)?.name || "Auto"}
              <ChevronDown size={12} className="text-slate-500" />
            </button>
            {agentDropdown && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-[#0d2144] border border-[#1a2235] rounded-xl shadow-2xl z-10 py-1 max-h-72 overflow-y-auto">
                {agentOptions.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => { setSelectedAgent(a.id); setAgentDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#143060] ${
                      selectedAgent === a.id ? "text-[#d4a843]" : "text-slate-300"
                    }`}
                  >
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-600 font-mono hidden sm:block">
              {activeConv.messages.length} messages
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {activeConv.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
              <div className="w-14 h-14 rounded-2xl bg-[#d4a843]/10 border border-[#d4a843]/30 flex items-center justify-center">
                <Shield size={24} className="text-[#d4a843]" />
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-200">FeTo Enterprise AI</h2>
                <p className="text-sm text-slate-500 mt-1">10 specialized agents · CBE framework · Banking intelligence</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {[
                  "What is Zero Trust Architecture?",
                  "Explain CBE cybersecurity framework",
                  "Ransomware response playbook",
                  "T24 core banking best practices",
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-left px-3 py-2.5 rounded-xl text-xs text-slate-400 bg-[#071428] border border-[#0d2144] hover:border-[#d4a843]/30 hover:text-slate-300 transition-colors leading-relaxed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2">
              {activeConv.messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-[#0d2144] bg-[#071428]/80 backdrop-blur-sm">
          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask FeTo anything..."
                rows={1}
                className="w-full resize-none rounded-xl bg-[#0d2144] border border-[#1a2235] focus:border-[#d4a843]/50 text-sm text-slate-200 placeholder-slate-600 px-4 py-3 pr-12 outline-none transition-colors leading-relaxed"
                style={{ maxHeight: "160px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 160) + "px";
                }}
                disabled={loading}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl bg-[#d4a843] hover:bg-[#c49a2a] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0"
            >
              {loading
                ? <Loader2 size={16} className="text-[#040d1a] animate-spin" />
                : <Send size={16} className="text-[#040d1a]" />
              }
            </button>
          </div>
          <p className="text-center text-xs text-slate-700 mt-2">
            FeTo may make mistakes — verify critical financial and security information
          </p>
        </div>
      </main>
    </div>
  );
}
