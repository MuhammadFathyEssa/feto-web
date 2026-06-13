// Lightweight in-memory sliding-window rate limiter.
// Suitable for single-instance / serverless warm starts. For multi-region
// horizontal scale, swap the Map for Upstash Redis (same interface).

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_HITS = 5; // attempts per window

// Periodic cleanup to bound memory
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < WINDOW_MS) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    b.hits = b.hits.filter((t) => now - t < WINDOW_MS);
    if (b.hits.length === 0) buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  max = MAX_HITS,
  windowMs = WINDOW_MS
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key) || { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  if (b.hits.length >= max) {
    const oldest = b.hits[0];
    const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);
    buckets.set(key, b);
    return { ok: false, retryAfterSec };
  }
  b.hits.push(now);
  buckets.set(key, b);
  return { ok: true, retryAfterSec: 0 };
}

// Check the limit WITHOUT consuming an attempt (read-only).
export function peekRateLimit(
  key: string,
  max = MAX_HITS,
  windowMs = WINDOW_MS
): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  sweep(now);
  const b = buckets.get(key);
  if (!b) return { ok: true, retryAfterSec: 0 };
  const hits = b.hits.filter((t) => now - t < windowMs);
  if (hits.length >= max) {
    const retryAfterSec = Math.ceil((windowMs - (now - hits[0])) / 1000);
    return { ok: false, retryAfterSec };
  }
  return { ok: true, retryAfterSec: 0 };
}

// Record a single failed attempt (consume one slot).
export function recordFailedAttempt(key: string, max = MAX_HITS, windowMs = WINDOW_MS): void {
  const now = Date.now();
  const b = buckets.get(key) || { hits: [] };
  b.hits = b.hits.filter((t) => now - t < windowMs);
  b.hits.push(now);
  buckets.set(key, b);
}

export function resetRateLimit(key: string) {
  buckets.delete(key);
}
