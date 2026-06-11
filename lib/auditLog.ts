// Frontend admin action audit log — writes to Supabase ai_audit_log
// Covers: user creation, deletion, role change, password reset

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

export type AdminAction =
  | "user.create"
  | "user.delete"
  | "user.role_change"
  | "user.password_reset"
  | "admin.login"
  | "admin.logout";

export interface AuditEntry {
  action: AdminAction;
  actor_id: string;
  actor_email: string;
  target_id?: string;
  target_email?: string;
  metadata?: Record<string, unknown>;
}

export async function logAdminAction(entry: AuditEntry): Promise<void> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return;
  try {
    await fetch(`${SUPABASE_URL}/rest/v1/ai_audit_log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        user_id: entry.actor_id,
        action: entry.action,
        prompt: JSON.stringify({
          actor_email: entry.actor_email,
          target_id: entry.target_id,
          target_email: entry.target_email,
          metadata: entry.metadata,
        }),
        engine: "admin_panel",
        model: "N/A",
        risk_score: 0,
        created_at: new Date().toISOString(),
      }),
    });
  } catch {
    // Audit log failure must never block the operation — silent fail
    console.error("[AuditLog] Failed to write admin action:", entry.action);
  }
}
