export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { getUserByEmail, createPasswordReset } from "@/lib/auth";
import { sendEmail, passwordResetEmail } from "@/lib/email";
import { peekRateLimit, recordFailedAttempt } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const key = `forgot:${ip}`;
  // 5 requests / 15 min per IP
  const rl = peekRateLimit(key, 5, 15 * 60 * 1000);
  if (!rl.ok) {
    return NextResponse.json(
      { success: false, error: `Too many requests. Try again in ${Math.ceil(rl.retryAfterSec / 60)} min.` },
      { status: 429 }
    );
  }

  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ success: false, error: "Email required" }, { status: 400 });
    }
    recordFailedAttempt(key, 5, 15 * 60 * 1000);

    const normalized = String(email).toLowerCase().trim();
    const user = await getUserByEmail(normalized);

    // Always respond success — never reveal whether an account exists (enumeration guard).
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
      await createPasswordReset(user.id, normalized, token, expiresAt);

      const origin = req.nextUrl.origin;
      const resetUrl = `${origin}/reset-password?token=${token}`;
      const tmpl = passwordResetEmail(user.name || "there", resetUrl);
      await sendEmail(normalized, tmpl.subject, tmpl.body).catch(() => {});
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 500 });
  }
}
