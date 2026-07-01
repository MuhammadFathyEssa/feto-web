export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, signToken, updateLastLogin, COOKIE_NAME } from "@/lib/auth";
import { peekRateLimit, recordFailedAttempt, resetRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Identify client IP for rate-limit bookkeeping
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const key = `login:${ip}`;

  // IP-keyed check WITHOUT consuming — only failed logins are penalized below.
  // 10 attempts / 10 minutes: fat-finger tolerance, still blocks single-IP brute force.
  const rl = await peekRateLimit(key, 10, 10 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: `Too many attempts. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }

    const normEmail = email.toLowerCase().trim();
    // Per-account lockout, IP-independent: defends the distributed case where an
    // attacker rotates source IPs against one account. Tighter budget than the IP key.
    const emailKey = `login:email:${normEmail}`;
    const erl = await peekRateLimit(emailKey, 20, 30 * 60 * 1000);
    if (!erl.ok) {
      return NextResponse.json(
        { success: false, error: `Too many attempts on this account. Try again in ${Math.ceil(erl.retryAfterSec / 60)} min.` },
        { status: 429, headers: { "Retry-After": String(erl.retryAfterSec) } }
      );
    }

    const user = await getUserByEmail(normEmail);

    if (!user) {
      await recordFailedAttempt(key, 10, 10 * 60 * 1000);
      await recordFailedAttempt(emailKey, 20, 30 * 60 * 1000);
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      await recordFailedAttempt(key, 10, 10 * 60 * 1000);
      await recordFailedAttempt(emailKey, 20, 30 * 60 * 1000);
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const sessionUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };

    const token = await signToken(sessionUser);
    await updateLastLogin(user.id);
    await resetRateLimit(key); // clear on success
    await resetRateLimit(emailKey);

    const res = NextResponse.json({ success: true, user: sessionUser });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days (idle timeout is the real gate)
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
