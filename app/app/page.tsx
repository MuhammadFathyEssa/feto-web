"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, defaultAgents, extractReply } from "@/lib/api";
import CommandPalette from "@/app/components/CommandPalette";
import Onboarding from "@/app/components/Onboarding";
import type { Message, Conversation } from "@/types";
import {
  Send, Plus, MessageSquare, LayoutDashboard, Settings,
  Shield, ChevronDown, Bot, User, AlertCircle, Loader2,
  Menu, X, LogOut, Users, Zap, Paperclip, Mic, MicOff,
  FileText, Image, StopCircle, Download, Copy, RotateCcw, Newspaper, Trophy, Brain, GraduationCap, Mail
} from "lucide-react";
import Link from "next/link";

// userId, API key, and backend URL are all handled server-side in /api/proxy/*

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
    recruiter:  "bg-teal-900/40 text-teal-300 border-teal-800/50",
    journalist: "bg-sky-900/40 text-sky-300 border-sky-800/50",
    sports:     "bg-green-900/40 text-green-300 border-green-800/50",
    political:  "bg-violet-900/40 text-violet-300 border-violet-800/50",
    general:    "bg-slate-800/40 text-slate-400 border-slate-700/50",
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
      <div className="w-7 h-7 rounded-full bg-[#e0a955]/20 border border-[#e0a955]/40 flex items-center justify-center flex-shrink-0">
        <Bot size={14} className="text-[#e0a955]" />
      </div>
      <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#111827] border border-[#1a2235]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#e0a955] animate-bounce [animation-delay:-0.3s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#e0a955] animate-bounce [animation-delay:-0.15s]" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#e0a955] animate-bounce" />
      </div>
    </div>
  );
}

function MessageBubble({ message, onRegenerate, isLastAssistant }: { message: Message; onRegenerate?: () => void; isLastAssistant?: boolean }) {
  const isUser = message.role === "user";
  return (
    <div className={`anim-message flex gap-3 px-4 py-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 ${
        isUser ? "bg-[#1a3f7c] border border-[#143060]" : "bg-[#e0a955]/20 border border-[#e0a955]/40"
      }`}>
        {isUser ? <User size={13} className="text-blue-300" /> : <Bot size={13} className="text-[#e0a955]" />}
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
        {message.downloadUrl && !isUser && (
          <a href={message.downloadUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-[#e0a955]/15 border border-[#e0a955]/40 text-[#e0a955] hover:bg-[#e0a955]/25 transition-colors">
            <Download size={14} /> تحميل تقرير الترتيب (PDF)
          </a>
        )}
        {message.agentType && !isUser && <AgentBadge agentType={message.agentType} />}
        <div className="flex items-center gap-2">
          {!isUser && !message.error && message.content && (
            <button
              aria-label="نسخ الرد"
              onClick={() => navigator.clipboard.writeText(message.content)}
              className="text-slate-600 hover:text-[#e0a955] transition-colors"
              title="نسخ">
              <Copy size={13} />
            </button>
          )}
          {!isUser && !message.error && message.content && isLastAssistant && onRegenerate && (
            <button
              aria-label="إعادة توليد الرد"
              onClick={onRegenerate}
              className="text-slate-600 hover:text-[#e0a955] transition-colors"
              title="إعادة التوليد">
              <RotateCcw size={13} />
            </button>
          )}
          <span className="text-xs text-slate-600">
            {(message.timestamp instanceof Date ? message.timestamp : new Date(message.timestamp)).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>
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
  const [userRole, setUserRole] = useState<string>("user");
  const [selectedAgent, setSelectedAgent] = useState("auto");
  const [agentDropdown, setAgentDropdown] = useState(false);

  // File upload state
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeConv = conversations.find((c) => c.id === activeId)!;

  // Resolve role for conditional admin navigation
  useEffect(() => {
    fetch("/api/auth/me").then(r => r.ok ? r.json() : null).then(d => {
      if (d?.success && d.user?.role) setUserRole(d.user.role);
    }).catch(() => {});
  }, []);

  // Personalization: restore the last-used agent on load
  useEffect(() => {
    try {
      const saved = localStorage.getItem("feto:lastAgent");
      if (saved) setSelectedAgent(saved);
    } catch { /* localStorage unavailable */ }
  }, []);

  // Persist conversations across navigation — load once on mount
  const loadedRef = useRef(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("feto:conversations");
      const savedActive = localStorage.getItem("feto:activeId");
      if (raw) {
        const parsed = JSON.parse(raw) as Conversation[];
        if (Array.isArray(parsed) && parsed.length) {
          const revived = parsed.map((c) => ({
            ...c,
            timestamp: new Date(c.timestamp),
            messages: (c.messages || []).map((m) => ({ ...m, timestamp: new Date(m.timestamp) })),
          }));
          setConversations(revived);
          if (savedActive && revived.some((c) => c.id === savedActive)) setActiveId(savedActive);
          else setActiveId(revived[0].id);
        }
      }
    } catch { /* corrupt/unavailable — keep default */ }
    loadedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save conversations whenever they change (only after initial load)
  useEffect(() => {
    if (!loadedRef.current) return;
    try { localStorage.setItem("feto:conversations", JSON.stringify(conversations)); } catch { /* ignore */ }
  }, [conversations]);

  // Save the active conversation id (only after initial load)
  useEffect(() => {
    if (!loadedRef.current) return;
    try { localStorage.setItem("feto:activeId", activeId); } catch { /* ignore */ }
  }, [activeId]);

  // Persist agent choice whenever it changes
  useEffect(() => {
    try { localStorage.setItem("feto:lastAgent", selectedAgent); } catch { /* ignore */ }
  }, [selectedAgent]);

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

  const addMessage = useCallback((msg: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? {
              ...c,
              title: c.messages.length === 0 ? (msg.content.slice(0, 40) || c.title) : c.title,
              lastMessage: msg.content.slice(0, 60),
              messages: [...c.messages, msg],
            }
          : c
      )
    );
  }, [activeId]);

  // Update an existing message's content in place (used for progressive reveal)
  const updateMessageContent = useCallback((id: string, content: string) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeId
          ? { ...c, messages: c.messages.map((m) => (m.id === id ? { ...m, content } : m)) }
          : c
      )
    );
  }, [activeId]);

  // Reveal assistant text word-by-word for a streaming-like feel (no backend change).
  const revealCancelRef = useRef(false);
  const revealMessage = useCallback(async (id: string, full: string) => {
    revealCancelRef.current = false;
    const words = full.split(" ");
    let acc = "";
    const step = words.length > 120 ? 3 : 1; // longer answers reveal faster
    for (let i = 0; i < words.length; i += step) {
      if (revealCancelRef.current) break; // stop requested → show full text now
      acc = words.slice(0, i + step).join(" ");
      updateMessageContent(id, acc);
      await new Promise((r) => setTimeout(r, 16));
    }
    updateMessageContent(id, full);
  }, [updateMessageContent]);

  // ── File upload handler ─────────────────────────────────────
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword", "text/plain", "text/csv", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|docx|doc|txt|csv|jpg|jpeg|png|webp|gif|md)$/i)) {
      alert("Unsupported file type. Supported: PDF, Word, TXT, CSV, images");
      return;
    }
    if (file.size > 20 * 1024 * 1024) { alert("File too large. Max 20MB"); return; }
    setAttachedFile(file);
  };

  const sendWithFile = useCallback(async (file: File, message: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("message", message || `Analyze this file: ${file.name}`);

    const res = await fetch(`/api/proxy/upload`, { method: "POST", body: formData });
    const raw = await res.text();
    try {
      return raw ? JSON.parse(raw) : {};
    } catch {
      return { success: false, error: res.status === 504 || res.status === 502
        ? "الملف أخد وقت طويل في التحليل. جرّب ملف أصغر."
        : `Upload failed (${res.status}).` };
    }
  }, []);

  // ── Voice recording handler ──────────────────────────────────
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.start(100);
      setIsRecording(true);
    } catch {
      alert("Microphone access denied. Please allow microphone access.");
    }
  }, []);

  const stopRecording = useCallback(async () => {
    if (!mediaRecorderRef.current) return;
    setIsRecording(false);
    setIsTranscribing(true);

    await new Promise<void>((resolve) => {
      mediaRecorderRef.current!.onstop = () => resolve();
      mediaRecorderRef.current!.stop();
      mediaRecorderRef.current!.stream.getTracks().forEach(t => t.stop());
    });

    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
      const formData = new FormData();
      formData.append("audio", audioBlob, "recording.webm");

      const res = await fetch(`/api/proxy/transcribe`, { method: "POST", body: formData });
      const data = await res.json();

      if (data.success && data.text) {
        setInput((prev) => prev ? prev + " " + data.text : data.text);
        inputRef.current?.focus();
      } else {
        alert("Transcription failed: " + (data.error || "Unknown error"));
      }
    } catch (e) {
      alert("Voice transcription error: " + (e instanceof Error ? e.message : "Unknown"));
    } finally {
      setIsTranscribing(false);
    }
  }, []);

  // ── Main send handler ────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const text = input.trim();
    const file = attachedFile;
    if (!text && !file) return;
    if (loading) return;

    const displayContent = file
      ? `📎 ${file.name}${text ? `\n${text}` : ""}`
      : text;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: displayContent,
      timestamp: new Date(),
    };

    addMessage(userMsg);
    setInput("");
    setAttachedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setLoading(true);

    try {
      let data;
      if (file) {
        data = await sendWithFile(file, text);
      } else {
        data = await sendMessage(text);
      }

      const d = data as { success?: boolean; reply?: string; response?: string; error?: string; agent?: string; agentType?: string; downloadUrl?: string };
      const fullContent = d.success ? (extractReply(d) || "No response") : (d.error || "Request failed");
      const assistantId = (Date.now() + 1).toString();
      const assistantMsg: Message = {
        id: assistantId,
        role: "assistant",
        content: "",
        agentType: d.agent || d.agentType || "general",
        timestamp: new Date(),
        error: !d.success,
        downloadUrl: d.downloadUrl,
      };
      addMessage(assistantMsg);
      // Progressive reveal (perceived streaming). Errors show instantly.
      if (d.success) await revealMessage(assistantId, fullContent);
      else updateMessageContent(assistantId, fullContent);
    } catch (err) {
      addMessage({
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: err instanceof Error ? err.message : "Connection failed",
        timestamp: new Date(),
        error: true,
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, attachedFile, loading, addMessage, sendWithFile, revealMessage, updateMessageContent]);

  // Regenerate: resend the most recent user text message and append a new reply
  const regenerate = useCallback(async () => {
    if (loading) return;
    const conv = conversations.find((c) => c.id === activeId);
    const msgs = conv?.messages || [];
    const lastUser = [...msgs].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    const text = lastUser.content.replace(/^📎[^\n]*\n?/, "").trim();
    if (!text) return;
    setLoading(true);
    try {
      const data = await sendMessage(text);
      const d = data as { success?: boolean; reply?: string; response?: string; error?: string; agent?: string; agentType?: string; downloadUrl?: string };
      const fullContent = d.success ? (extractReply(d) || "No response") : (d.error || "Request failed");
      const assistantId = (Date.now() + 1).toString();
      addMessage({
        id: assistantId, role: "assistant", content: "",
        agentType: d.agent || d.agentType || "general", timestamp: new Date(),
        error: !d.success, downloadUrl: d.downloadUrl,
      });
      if (d.success) await revealMessage(assistantId, fullContent);
      else updateMessageContent(assistantId, fullContent);
    } catch (err) {
      addMessage({ id: (Date.now() + 1).toString(), role: "assistant", content: err instanceof Error ? err.message : "Connection failed", timestamp: new Date(), error: true });
    } finally {
      setLoading(false);
    }
  }, [loading, conversations, activeId, addMessage, revealMessage, updateMessageContent]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const agentOptions = [{ id: "auto", name: "Auto (Coordinator)" }, ...defaultAgents];

  return (
    <div className="flex h-screen bg-[#040d1a] overflow-hidden">
      <CommandPalette onNewChat={newConversation} />
      <Onboarding />
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:bg-[#e0a955] focus:text-[#040d1a] focus:px-3 focus:py-2 focus:rounded-lg focus:text-sm focus:font-medium">تخطّي إلى المحتوى</a>
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:relative z-30 md:z-auto w-64 h-full flex flex-col bg-[#071428] border-r border-[#0d2144] transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#0d2144]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-[#e0a955]/20 border border-[#e0a955]/40 flex items-center justify-center">
              <Shield size={14} className="text-[#e0a955]" />
            </div>
            <span className="font-semibold text-sm text-slate-100">FeTo Enterprise</span>
          </div>
          <button aria-label="إغلاق القائمة" onClick={() => setSidebarOpen(false)} className="md:hidden text-slate-500 hover:text-slate-300"><X size={16} /></button>
        </div>
        <div className="p-3">
          <button onClick={newConversation} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-300 hover:bg-[#0d2144] border border-[#1a2235] hover:border-[#e0a955]/30 transition-colors">
            <Plus size={14} className="text-[#e0a955]" /> New conversation
            <kbd className="ml-auto text-[10px] text-slate-600 border border-[#1a2235] rounded px-1.5 py-0.5">⌘K</kbd>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
          {conversations.map((conv) => (
            <button key={conv.id} onClick={() => { setActiveId(conv.id); setSidebarOpen(false); }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${conv.id === activeId ? "bg-[#0d2144] border border-[#1a3f7c]/50 text-slate-100" : "text-slate-400 hover:bg-[#0d2144]/50 hover:text-slate-300"}`}>
              <div className="flex items-center gap-2">
                <MessageSquare size={12} className="flex-shrink-0 opacity-50" />
                <span className="truncate">{conv.title}</span>
              </div>
              {conv.lastMessage && <p className="text-xs text-slate-600 truncate mt-0.5 pl-5">{conv.lastMessage}</p>}
            </button>
          ))}
        </div>
        <div className="border-t border-[#0d2144] p-3 space-y-1">
          {[
            { href: "/correspondence", icon: Mail, label: "Correspondence", adminOnly: false },
            { href: "/cybernews", icon: Newspaper, label: "Cyber News", adminOnly: false },
            { href: "/memo", icon: FileText, label: "Memos", adminOnly: false },
            { href: "/personality", icon: Brain, label: "Personality", adminOnly: false },
            { href: "/recruiter", icon: Users, label: "Recruiter", adminOnly: false },
            { href: "/cyber", icon: Shield, label: "Threat Intel", adminOnly: false },
            { href: "/learn", icon: GraduationCap, label: "Tutor", adminOnly: false },
            { href: "/worldcup", icon: Trophy, label: "World Cup", adminOnly: false },
            { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard", adminOnly: true },
            { href: "/admin", icon: Users, label: "Admin", adminOnly: true },
            { href: "/settings", icon: Settings, label: "Settings", adminOnly: false },
          ].filter(item => !item.adminOnly || userRole === "admin" || userRole === "owner")
            .map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-400 hover:bg-[#0d2144] hover:text-slate-300 transition-colors">
              <Icon size={14} />{label}
            </Link>
          ))}
          <button onClick={async()=>{await fetch("/api/auth/logout",{method:"POST"});window.location.href="/";}} className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-slate-500 hover:text-slate-300 transition-colors w-full text-left">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main id="main-content" className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center gap-3 px-4 py-3 border-b border-[#0d2144] bg-[#071428]/80 backdrop-blur-sm">
          <button aria-label="فتح القائمة" onClick={() => setSidebarOpen(true)} className="md:hidden text-slate-400 hover:text-slate-200">
            <Menu size={18} />
          </button>
          <div className="relative">
            <button aria-label="اختيار الوكيل" aria-haspopup="listbox" aria-expanded={agentDropdown} onClick={() => setAgentDropdown(!agentDropdown)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm bg-[#0d2144] border border-[#1a2235] hover:border-[#e0a955]/40 text-slate-300 transition-colors">
              <Bot size={13} className="text-[#e0a955]" />
              {agentOptions.find((a) => a.id === selectedAgent)?.name || "Auto"}
              <ChevronDown size={12} className="text-slate-500" />
            </button>
            {agentDropdown && (
              <div className="anim-scale absolute top-full left-0 mt-1 w-56 bg-[#0d2144] border border-[#1a2235] rounded-xl shadow-elev-2 z-10 py-1 max-h-72 overflow-y-auto">
                {agentOptions.map((a) => (
                  <button key={a.id} onClick={() => { setSelectedAgent(a.id); setAgentDropdown(false); }}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[#143060] ${selectedAgent === a.id ? "text-[#e0a955]" : "text-slate-300"}`}>
                    {a.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-slate-600 font-mono hidden sm:block">{activeConv.messages.length} messages</span>
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto">
          {activeConv.messages.length === 0 ? (
            <div className="anim-fade flex flex-col items-center justify-center h-full gap-6 px-4">
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 rounded-2xl bg-[#e0a955]/25 blur-2xl animate-pulse" />
                <div className="relative w-14 h-14 rounded-2xl bg-[#e0a955]/10 border border-[#e0a955]/30 flex items-center justify-center">
                  <Shield size={24} className="text-[#e0a955]" />
                </div>
              </div>
              <div className="text-center">
                <h2 className="text-lg font-semibold text-slate-200">FeTo Enterprise AI</h2>
                <p className="text-sm text-slate-500 mt-1">21 agents · 100+ commands · CBE framework · File & voice support</p>
              </div>
              <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                {["What is Zero Trust Architecture?", "Explain CBE cybersecurity framework", "Ransomware response playbook", "T24 core banking best practices"].map((q) => (
                  <button key={q} onClick={() => setInput(q)}
                    className="text-left px-3 py-2.5 rounded-xl text-xs text-slate-400 bg-[#071428] border border-[#0d2144] hover:border-[#e0a955]/30 hover:text-slate-300 hover:-translate-y-0.5 transition-all duration-150 leading-relaxed">
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-2">
              {activeConv.messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  onRegenerate={regenerate}
                  isLastAssistant={msg.role === "assistant" && i === activeConv.messages.length - 1 && !loading}
                />
              ))}
              {loading && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="px-4 py-3 border-t border-[#0d2144] bg-[#071428]/80 backdrop-blur-sm">
          {/* Attached file preview */}
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-lg bg-[#0d2144] border border-[#1a3f7c]/50 text-xs text-slate-300">
              {attachedFile.type.startsWith("image/") ? <Image size={12} className="text-[#e0a955]" /> : <FileText size={12} className="text-[#e0a955]" />}
              <span className="truncate flex-1">{attachedFile.name}</span>
              <span className="text-slate-600">{(attachedFile.size / 1024).toFixed(0)}KB</span>
              <button aria-label="إزالة الملف المرفق" onClick={() => { setAttachedFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="text-slate-500 hover:text-red-400 transition-colors"><X size={12} /></button>
            </div>
          )}

          <div className="flex items-end gap-2 max-w-4xl mx-auto">
            {/* File attach button */}
            <input ref={fileInputRef} type="file" className="hidden"
              accept=".pdf,.docx,.doc,.txt,.csv,.md,.jpg,.jpeg,.png,.webp,.gif"
              onChange={handleFileSelect} />
            <button aria-label="إرفاق ملف" onClick={() => fileInputRef.current?.click()} disabled={loading}
              className="w-9 h-9 rounded-xl bg-[#0d2144] border border-[#1a2235] hover:border-[#e0a955]/40 flex items-center justify-center text-slate-400 hover:text-[#e0a955] transition-colors flex-shrink-0 disabled:opacity-30"
              title="Attach file (PDF, Word, image, text)">
              <Paperclip size={15} />
            </button>

            {/* Voice button */}
            <button
              aria-label={isRecording ? "إيقاف التسجيل" : isTranscribing ? "جارٍ التفريغ" : "تسجيل رسالة صوتية"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading || isTranscribing}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 disabled:opacity-30 ${
                isRecording
                  ? "bg-red-600 hover:bg-red-700 border border-red-500 text-white animate-pulse"
                  : isTranscribing
                  ? "bg-[#0d2144] border border-[#e0a955]/40 text-[#e0a955]"
                  : "bg-[#0d2144] border border-[#1a2235] hover:border-[#e0a955]/40 text-slate-400 hover:text-[#e0a955]"
              }`}
              title={isRecording ? "Stop recording" : isTranscribing ? "Transcribing..." : "Record voice message"}>
              {isTranscribing ? <Loader2 size={15} className="animate-spin" /> : isRecording ? <StopCircle size={15} /> : <Mic size={15} />}
            </button>

            {/* Text input */}
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Recording... tap stop when done" : attachedFile ? "Add a message about the file (optional)..." : "Ask FeTo anything..."}
                rows={1}
                disabled={loading || isRecording}
                className="w-full resize-none rounded-xl bg-[#0d2144] border border-[#1a2235] focus:border-[#e0a955]/50 text-sm text-slate-200 placeholder-slate-600 px-4 py-3 outline-none transition-colors leading-relaxed disabled:opacity-60"
                style={{ maxHeight: "160px" }}
                onInput={(e) => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 160) + "px";
                }}
              />
            </div>

            {/* Send button */}
            <button
              aria-label={loading ? "إيقاف" : "إرسال الرسالة"}
              onClick={loading ? () => { revealCancelRef.current = true; } : handleSend}
              disabled={(!input.trim() && !attachedFile) && !loading || isRecording}
              className="w-10 h-10 rounded-xl bg-[#e0a955] hover:bg-[#eab667] disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors flex-shrink-0">
              {loading ? <StopCircle size={16} className="text-[#040d1a]" /> : <Send size={16} className="text-[#040d1a]" />}
            </button>
          </div>

          {/* Recording indicator */}
          {isRecording && (
            <div className="flex items-center justify-center gap-2 mt-2 text-xs text-red-400">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              Recording — tap the stop button when done
            </div>
          )}

          <p className="text-center text-xs text-slate-700 mt-2">
            FeTo may make mistakes — verify critical financial and security information
          </p>
        </div>
      </main>
    </div>
  );
}
