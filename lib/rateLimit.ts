// Distributed sliding-window rate limiter backed by Supabase (login_rate table +
// peek_login / record_login_failure / reset_login RPCs). Shared across serverless
// instances and cold starts — the prior in-memory Map reset per instance, letting a
// distributed brute force bypass the limit. Consume-on-failure semantics: a successful
// login does not count against the window (peek reads, recordFailedAttempt increments,
// resetRateLimit clears on success).

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

const WINDOW_MS = 15 * 60 * 1000;
const MAX_HITS = 5;

function winArg(windowMs: number): string {
  return `${Math.ceil(windowMs / 60000)} minutes`;
}

async function rpc(fn: string, args: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) throw new Error(`rate-limit rpc ${fn} failed: ${res.status}`);
  return res.json();
}

// Read the current count without consuming a slot.
export async function peekRateLimit(
  key: string,
  max = MAX_HITS,
  windowMs = WINDOW_MS,
): Promise<{ ok: boolean; retryAfterSec: number }> {
  try {
    const count = (await rpc("peek_login", { k: key, win: winArg(windowMs) })) as number;
    if (count >= max) return { ok: false, retryAfterSec: Math.ceil(windowMs / 1000) };
    return { ok: true, retryAfterSec: 0 };
  } catch {
    // Fail open on limiter outage rather than locking out all logins.
    return { ok: true, retryAfterSec: 0 };
  }
}

// Consume one slot (call on a failed attempt).
export async function recordFailedAttempt(
  key: string,
  _max = MAX_HITS,
  windowMs = WINDOW_MS,
): Promise<void> {
  try {
    await rpc("record_login_failure", { k: key, win: winArg(windowMs) });
  } catch {
    // Non-fatal: a missed increment must not break the auth path.
  }
}

// Clear the window (call on a successful attempt).
export async function resetRateLimit(key: string): Promise<void> {
  try {
    await rpc("reset_login", { k: key });
  } catch {
    // Non-fatal.
  }
}
