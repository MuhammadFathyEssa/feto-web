import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, getUserById, updatePassword } from "@/lib/auth";
import { logAdminAction, clientIp } from "@/lib/auditLog";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: "currentPassword and newPassword required" }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ success: false, error: "New password must be at least 8 characters" }, { status: 400 });
    }
    const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!strongPw.test(newPassword)) {
      return NextResponse.json({ success: false, error: "Password must contain uppercase, lowercase, and a number" }, { status: 400 });
    }

    const user = await getUserById(session.id);
    if (!user) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) return NextResponse.json({ success: false, error: "Current password is incorrect" }, { status: 401 });

    const newHash = await bcrypt.hash(newPassword, 12);
    const ok = await updatePassword(session.id, newHash);
    if (!ok) return NextResponse.json({ success: false, error: "Failed to update password" }, { status: 500 });

    await logAdminAction({
      action: "user.password_reset",
      actor_id: session.id,
      actor_email: session.email,
      ip_address: clientIp(req),
    });

    return NextResponse.json({ success: true, message: "Password updated successfully" });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to change password" }, { status: 500 });
  }
}
