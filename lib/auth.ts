import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const _jwtSecret = process.env.JWT_SECRET;
if (!_jwtSecret || _jwtSecret.length < 32) {
  throw new Error(
    "JWT_SECRET environment variable is required and must be at least 32 characters."
  );
}
const JWT_SECRET = new TextEncoder().encode(_jwtSecret);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
const COOKIE_NAME = "feto_session";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: "owner" | "admin" | "user" | "readonly";
  lastActivity?: number;
}

// Idle timeout: re-login required after this many minutes of inactivity.
// Default 12h — an executive copilot should survive meetings, tab closes,
// and a full working day without forcing re-login. Override via env if stricter posture needed.
export const IDLE_TIMEOUT_MINUTES = Number(process.env.IDLE_TIMEOUT_MINUTES || 720);
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

// ── JWT ──────────────────────────────────────────────────────

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user, lastActivity: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d") // absolute cap; idle timeout (12h) is the practical gate
    .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const user = payload as unknown as SessionUser;
    // Enforce idle timeout — reject if inactive too long
    if (user.lastActivity && Date.now() - user.lastActivity > IDLE_TIMEOUT_MS) {
      return null;
    }
    return user;
  } catch {
    return null;
  }
}

// Re-issue a token with refreshed activity timestamp (sliding session)
export async function refreshActivity(user: SessionUser): Promise<string> {
  const { lastActivity: _drop, ...rest } = user;
  return signToken(rest as SessionUser);
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

// ── Supabase direct REST calls ────────────────────────────────

async function supabaseQuery(path: string, options: RequestInit = {}) {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error("Supabase not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_KEY.");
  }
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
      ...(options.headers || {}),
    },
  });
  return res;
}

export async function getUserByEmail(email: string) {
  const res = await supabaseQuery(
    `feto_users?email=eq.${encodeURIComponent(email)}&select=*&limit=1`,
    { method: "GET" }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export async function getUserById(id: string) {
  const res = await supabaseQuery(
    `feto_users?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
    { method: "GET" }
  );
  if (!res.ok) return null;
  const rows = await res.json();
  return rows[0] || null;
}

export async function getAllUsers() {
  const res = await supabaseQuery(
    `feto_users?select=id,email,name,role,created_at,last_login,last_active&order=created_at.desc`,
    { method: "GET" }
  );
  if (!res.ok) return [];
  return res.json();
}

export async function createUser(
  email: string,
  name: string,
  passwordHash: string,
  role: string
) {
  const res = await supabaseQuery("feto_users", {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({ email, name, password_hash: passwordHash, role }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err);
  }
  const rows = await res.json();
  return rows[0];
}

export async function updatePassword(userId: string, passwordHash: string) {
  const res = await supabaseQuery(
    `feto_users?id=eq.${encodeURIComponent(userId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ password_hash: passwordHash, updated_at: new Date().toISOString() }),
    }
  );
  return res.ok;
}

export async function updateLastLogin(userId: string) {
  await supabaseQuery(`feto_users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    body: JSON.stringify({ last_login: new Date().toISOString() }),
  }).catch(() => {});
}

// Update a user's role (admin action)
export async function updateUserRole(userId: string, role: string): Promise<boolean> {
  const res = await supabaseQuery(`feto_users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ role }),
  });
  return res.ok;
}

// Update a user's password (admin reset). Caller passes the bcrypt hash.
export async function updateUserPasswordHash(userId: string, passwordHash: string): Promise<boolean> {
  const res = await supabaseQuery(`feto_users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ password_hash: passwordHash }),
  });
  return res.ok;
}

// Delete a user (admin action)
export async function deleteUser(userId: string): Promise<boolean> {
  const res = await supabaseQuery(`feto_users?id=eq.${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: { Prefer: "return=minimal" },
  });
  return res.ok;
}

// Record user activity timestamp (for admin "active users" view).
// Best-effort: silently no-ops if the column is absent.
export async function touchLastActive(userId: string): Promise<void> {
  await supabaseQuery(`feto_users?id=eq.${encodeURIComponent(userId)}`, {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ last_active: new Date().toISOString() }),
  }).catch(() => {});
}

export { COOKIE_NAME };
