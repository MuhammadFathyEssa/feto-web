// Frontend admin action audit log — dedicated admin_audit_log table (F-09 fix)
// Covers: user creation, deletion, role change, password reset

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export type AdminAction =
  | "user.create"
  | "user.delete"
  | "user.role_change"
  | "user.password_reset"
  | "admin.login"
  | "admin.logout"
  | "access_request.accept"
  | "access_request.reject";

export interface AuditEntry {
  action: AdminAction;
  actor_id: string;
  actor_email: string;
  target_id?: string;
  target_email?: string;
  metadata?: Record<string, unknown>;
  ip_address?: string;
}

// OWASP A09: capture the client IP for the audit trail. Vercel/proxies set
// x-forwarded-for (first hop is the client); fall back to x-real-ip.
export function clientIp(req: Request): string | undefined {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? undefined;
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("[AuditLog] CRITICAL: Supabase not configured — admin action NOT recorded:", entry.action);
    return;
  }
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/admin_audit_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        timestamp: new Date().toISOString(),
        actor_id: entry.actor_id,
        actor_email: entry.actor_email,
        action: entry.action,
        target_id: entry.target_id ?? null,
        target_email: entry.target_email ?? null,
        metadata: entry.metadata ?? {},
        ip_address: entry.ip_address ?? null,
        result: "success",
      }),
    });
    if (!res.ok) {
      // F-09 fix: audit write failure is loud, never silent
      console.error("[AuditLog] WRITE FAILED — admin action may not be recorded:", entry.action, res.status);
    }
  } catch (e) {
    console.error("[AuditLog] WRITE FAILED — admin action may not be recorded:", entry.action, e);
  }
}
