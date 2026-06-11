import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getUserByEmail, signToken, updateLastLogin, COOKIE_NAME } from "@/lib/auth";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Rate limit by client IP — 5 attempts / 15 min
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";
  const rl = checkRateLimit(`login:${ip}`);
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } }
    );
  }

  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password required" }, { status: 400 });
    }

    const user = await getUserByEmail(email.toLowerCase().trim());

    if (!user) {
      return NextResponse.json({ success: false, error: "Invalid email or password" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
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
    resetRateLimit(`login:${ip}`);

    const res = NextResponse.json({ success: true, user: sessionUser });
    res.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 4, // 4 hours
      path: "/",
    });

    return res;
  } catch {
    return NextResponse.json({ success: false, error: "Login failed" }, { status: 500 });
  }
}
