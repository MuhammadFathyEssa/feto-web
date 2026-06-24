export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from "next/server";
import { createAccessRequest, getUserByEmail } from "@/lib/auth";
import { peekRateLimit, recordFailedAttempt } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  const key = `accessreq:${ip}`;
  const rl = peekRateLimit(key, 5, 30 * 60 * 1000); // 5 / 30 min
  if (!rl.ok) {
    return NextResponse.json({ success: false, error: `Too many requests. Try again later.` }, { status: 429 });
  }

  try {
    const { name, email, organization, reason } = await req.json();
    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
      return NextResponse.json({ success: false, error: "Enter a valid email" }, { status: 400 });
    }
    recordFailedAttempt(key, 5, 30 * 60 * 1000);

    const normalized = String(email).toLowerCase().trim();

    // If already a user, don't create a request — tell them to sign in.
    const existing = await getUserByEmail(normalized);
    if (existing) {
      return NextResponse.json({ success: true, alreadyUser: true });
    }

    const ok = await createAccessRequest(
      String(name).trim(),
      normalized,
      String(organization || "").trim(),
      String(reason || "").trim()
    );
    // Unique-pending index may reject duplicates — treat as success (idempotent UX).
    if (!ok) {
      return NextResponse.json({ success: true, duplicate: true });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 500 });
  }
}
