"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Users, Activity, Lock, Plus, Loader2, CheckCircle, X, Trash2, Pencil, KeyRound } from "lucide-react";

interface User { id: string; email: string; name: string; role: string; last_login?: string; last_active?: string; created_at?: string; }
interface AccessRequest { id: string; name: string; email: string; organization?: string; reason?: string; created_at?: string; }

const roleColors: Record<string, string> = {
  owner: "text-[#e0a955] bg-[#e0a955]/10 border-[#e0a955]/30",
  admin: "text-blue-400 bg-blue-900/20 border-blue-800/30",
  user: "text-slate-400 bg-[#0d2144] border-[#1a2235]",
  readonly: "text-slate-500 bg-[#071428] border-[#0d2144]",
};

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  // Create user form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState("");
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [loadingReqs, setLoadingReqs] = useState(true);
  const [reqBusy, setReqBusy] = useState<string | null>(null);
  const [reqMsg, setReqMsg] = useState("");

  const loadUsers = () => {
    fetch("/api/users/list")
      .then((r) => r.json())
      .then((d) => { if (d.success) setUsers(d.users); })
      .catch(() => {})
      .finally(() => setLoadingUsers(false));
  };

  const loadRequests = () => {
    setLoadingReqs(true);
    fetch("/api/admin/access-requests")
      .then((r) => r.json())
      .then((d) => { if (d.success) setRequests(d.requests); })
      .catch(() => {})
      .finally(() => setLoadingReqs(false));
  };

  const decideRequest = async (id: string, decision: "accept" | "reject") => {
    setReqBusy(id); setReqMsg("");
    try {
      const res = await fetch("/api/admin/access-requests/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, decision }),
      });
      const d = await res.json();
      if (d.success) {
        setReqMsg(decision === "accept" ? "Approved — user created, email sent" : "Rejected — email sent");
        setRequests((prev) => prev.filter((r) => r.id !== id));
        if (decision === "accept") loadUsers();
      } else {
        setReqMsg(d.error || "Action failed");
      }
    } catch {
      setReqMsg("Connection error");
    } finally {
      setReqBusy(null);
    }
  };

  useEffect(() => { loadUsers(); loadRequests(); }, []);

  const changeRole = async (userId: string, role: string) => {
    setActionMsg("");
    const res = await fetch("/api/users/update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    const d = await res.json();
    if (!d.success) { setActionMsg(d.error || "Update failed"); return; }
    setEditingId(null); loadUsers();
  };

  const resetPassword = async (userId: string, email: string) => {
    const pw = window.prompt(`كلمة سر جديدة لـ ${email} (8+ حرف، حروف كبيرة وصغيرة ورقم):`);
    if (!pw) return;
    setActionMsg("");
    const res = await fetch("/api/users/update", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, password: pw }),
    });
    const d = await res.json();
    setActionMsg(d.success ? "تم تغيير كلمة السر." : (d.error || "Password reset failed"));
  };

  const removeUser = async (userId: string, email: string) => {
    if (!window.confirm(`متأكد إنك عايز تحذف ${email}؟ الإجراء ده نهائي.`)) return;
    setActionMsg("");
    const res = await fetch("/api/users/delete", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const d = await res.json();
    if (!d.success) { setActionMsg(d.error || "Delete failed"); return; }
    loadUsers();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(""); setCreateSuccess("");
    if (!newEmail || !newName || !newPassword) { setCreateError("All fields required"); return; }
    setCreateLoading(true);
    try {
      const res = await fetch("/api/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newEmail, name: newName, password: newPassword, role: newRole }),
      });
      const data = await res.json();
      if (!data.success) { setCreateError(data.error || "Failed"); }
      else {
        setCreateSuccess(`User ${data.user.name} created`);
        loadUsers();
        setNewEmail(""); setNewName(""); setNewPassword(""); setNewRole("user");
        setTimeout(() => { setShowCreate(false); setCreateSuccess(""); }, 2000);
      }
    } catch { setCreateError("Connection error"); }
    finally { setCreateLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#040d1a] text-slate-200">
      <header className="border-b border-[#0d2144] bg-[#071428] px-6 py-4 flex items-center gap-4">
        <Link href="/app" className="text-slate-400 hover:text-slate-200 transition-colors">
          <ArrowLeft size={18} aria-label="رجوع" />
        </Link>
        <div className="flex items-center gap-2">
          <span style={{width:22,height:22,borderRadius:"50%",border:"1px solid rgba(224,169,85,.45)",display:"inline-flex",alignItems:"center",justifyContent:"center",flex:"0 0 auto"}}><span style={{width:5,height:5,borderRadius:"50%",background:"#e0a955",boxShadow:"0 0 8px 2px rgba(224,169,85,.55)"}} /></span>
          <span className="font-semibold text-sm" style={{fontFamily:"'Playfair Display',Georgia,serif"}}>Admin Portal</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[#e0a955]">
          <Lock size={11} /> Owner / Admin only
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Users", value: users.length || "—" },
            { label: "Admins", value: users.filter(u => u.role === "admin" || u.role === "owner").length || "—" },
            { label: "Active Now", value: users.filter(u => u.last_active && (Date.now() - new Date(u.last_active).getTime()) < 15 * 60 * 1000).length || "0" },
            { label: "Security Flags", value: "0" },
          ].map(({ label, value }) => (
            <div key={label} className="bg-[#071428] border border-[#0d2144] rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-2">{label}</p>
              <p className="text-xl font-semibold text-slate-100">{value}</p>
            </div>
          ))}
        </div>

        {/* Access Requests */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-[#0d2144] flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Users size={14} className="text-[#e0a955]" /> Access Requests
              {requests.length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-[#e0a955]/15 text-[#e0a955] font-semibold">{requests.length} pending</span>
              )}
              {reqMsg && <span className="text-xs text-[#e0a955] font-normal">· {reqMsg}</span>}
            </h3>
          </div>
          {loadingReqs ? (
            <div className="px-5 py-8 text-center text-sm text-slate-500">Loading…</div>
          ) : requests.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-slate-600">No pending requests.</div>
          ) : (
            <div className="divide-y divide-[#0d2144]">
              {requests.map((r) => (
                <div key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-slate-200">{r.name}</span>
                      <span className="text-xs text-slate-500">{r.email}</span>
                    </div>
                    {r.organization && <div className="text-xs text-slate-500 mt-0.5">{r.organization}</div>}
                    {r.reason && <div className="text-xs text-slate-400 mt-1 line-clamp-2">{r.reason}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => decideRequest(r.id, "accept")}
                      disabled={reqBusy === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#e0a955] text-[#040d1a] font-semibold hover:bg-[#eab667] disabled:opacity-50 transition-colors"
                    >
                      {reqBusy === r.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />} Accept
                    </button>
                    <button
                      onClick={() => decideRequest(r.id, "reject")}
                      disabled={reqBusy === r.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-red-800/40 text-red-400 hover:bg-red-900/20 disabled:opacity-50 transition-colors"
                    >
                      <X size={12} /> Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Users */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0d2144] flex items-center justify-between">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Users size={14} className="text-[#e0a955]" /> Users
              {actionMsg && <span className="text-xs text-[#e0a955] font-normal">· {actionMsg}</span>}
            </h3>
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-[#e0a955] text-[#040d1a] font-semibold hover:bg-[#eab667] transition-colors"
            >
              <Plus size={12} /> New User
            </button>
          </div>

          {/* Create user form */}
          {showCreate && (
            <div className="border-b border-[#0d2144] bg-[#0d2144]/40 px-5 py-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-medium text-slate-300">Create New User</h4>
                <button aria-label="إغلاق" onClick={() => setShowCreate(false)} className="text-slate-500 hover:text-slate-300">
                  <X size={14} />
                </button>
              </div>
              <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Full Name</label>
                  <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Dr. Ahmed Hassan"
                    className="w-full px-3 py-2 rounded-lg bg-[#071428] border border-[#1a2235] focus:border-[#e0a955]/50 text-sm text-slate-200 placeholder-slate-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email</label>
                  <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="ahmed@bank.com"
                    className="w-full px-3 py-2 rounded-lg bg-[#071428] border border-[#1a2235] focus:border-[#e0a955]/50 text-sm text-slate-200 placeholder-slate-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Min 8 characters"
                    className="w-full px-3 py-2 rounded-lg bg-[#071428] border border-[#1a2235] focus:border-[#e0a955]/50 text-sm text-slate-200 placeholder-slate-600 outline-none" />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[#071428] border border-[#1a2235] focus:border-[#e0a955]/50 text-sm text-slate-200 outline-none">
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="readonly">Read Only</option>
                  </select>
                </div>
                {createError && <p className="sm:col-span-2 text-xs text-red-400 bg-red-900/20 border border-red-800/30 rounded-lg px-3 py-2">{createError}</p>}
                {createSuccess && <p className="sm:col-span-2 text-xs text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 rounded-lg px-3 py-2 flex items-center gap-1.5"><CheckCircle size={12} />{createSuccess}</p>}
                <div className="sm:col-span-2">
                  <button type="submit" disabled={createLoading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e0a955] hover:bg-[#eab667] disabled:opacity-50 text-[#040d1a] text-sm font-semibold transition-colors">
                    {createLoading ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                    {createLoading ? "Creating..." : "Create User"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="overflow-x-auto">
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8 text-slate-500 text-sm gap-2">
                <Loader2 size={14} className="animate-spin" /> Loading users...
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No users found. Create your first user above.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#0d2144]">
                    {["Name", "Email", "Role", "Last Login", "Created", "Actions"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs text-slate-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-[#0d2144]/50 last:border-0 hover:bg-[#0d2144]/30 transition-colors">
                      <td className="px-5 py-3 text-slate-300 font-medium">
                        <span className="flex items-center gap-2">
                          {u.last_active && (Date.now() - new Date(u.last_active).getTime()) < 15 * 60 * 1000 && (
                            <span className="w-2 h-2 rounded-full bg-green-400" title="نشط الآن" />
                          )}
                          {u.name}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slate-400 text-xs font-mono">{u.email}</td>
                      <td className="px-5 py-3">
                        {editingId === u.id ? (
                          <select defaultValue={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                            className="bg-[#0d2144] border border-[#1a3f7c] rounded px-2 py-1 text-xs text-slate-200">
                            <option value="admin">admin</option>
                            <option value="user">user</option>
                            <option value="readonly">readonly</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-xs border font-mono ${roleColors[u.role] || roleColors.user}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {u.last_login ? new Date(u.last_login).toLocaleDateString() : "Never"}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-xs">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <button onClick={() => setEditingId(editingId === u.id ? null : u.id)} aria-label="تغيير الدور" title="تغيير الدور"
                            className="text-slate-500 hover:text-[#e0a955] transition-colors"><Pencil size={14} /></button>
                          <button onClick={() => resetPassword(u.id, u.email)} aria-label="تغيير كلمة السر" title="تغيير كلمة السر"
                            className="text-slate-500 hover:text-blue-400 transition-colors"><KeyRound size={14} /></button>
                          <button onClick={() => removeUser(u.id, u.email)} aria-label="حذف المستخدم" title="حذف"
                            className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Audit log */}
        <div className="bg-[#071428] border border-[#0d2144] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#0d2144]">
            <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
              <Activity size={14} className="text-[#e0a955]" /> Recent Activity
            </h3>
          </div>
          <div className="px-5 py-4 text-sm text-slate-500 text-center">
            Live audit log — connect to Supabase ai_audit_log table
          </div>
        </div>
      </div>
    </div>
  );
}
