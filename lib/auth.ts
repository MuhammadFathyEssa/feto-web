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

// Idle timeout: re-login required after this many minutes of inactivity
export const IDLE_TIMEOUT_MINUTES = Number(process.env.IDLE_TIMEOUT_MINUTES || 15);
const IDLE_TIMEOUT_MS = IDLE_TIMEOUT_MINUTES * 60 * 1000;

// ── JWT ──────────────────────────────────────────────────────

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user, lastActivity: Date.now() })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h") // absolute cap; idle timeout enforced separately
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
    `feto_users?select=id,email,name,role,created_at,last_login&order=created_at.desc`,
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

export { COOKIE_NAME };
