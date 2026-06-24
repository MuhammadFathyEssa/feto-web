export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getPasswordReset, markPasswordResetUsed, updatePassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json({ success: false, error: "Token and password required" }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const reset = await getPasswordReset(String(token));
    if (!reset || reset.used) {
      return NextResponse.json({ success: false, error: "Invalid or already-used reset link" }, { status: 400 });
    }
    if (new Date(reset.expires_at).getTime() < Date.now()) {
      return NextResponse.json({ success: false, error: "This reset link has expired" }, { status: 400 });
    }

    const hash = await bcrypt.hash(String(password), 10);
    const ok = await updatePassword(reset.user_id, hash);
    if (!ok) {
      return NextResponse.json({ success: false, error: "Could not update password" }, { status: 500 });
    }
    await markPasswordResetUsed(String(token));

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Reset failed" }, { status: 500 });
  }
}
