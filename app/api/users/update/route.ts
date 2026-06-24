import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, getUserById, updateUserRole, updateUserPasswordHash } from "@/lib/auth";
import { logAdminAction } from "@/lib/auditLog";

export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const { userId, role, password } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });

    const target = await getUserById(String(userId));
    if (!target) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Safeguards: admins cannot modify owner accounts; nobody can self-demote here
    if (target.role === "owner" && session.role !== "owner") {
      return NextResponse.json({ success: false, error: "Admins cannot modify owner accounts" }, { status: 403 });
    }

    // Role change
    if (role) {
      const allowedRoles = session.role === "owner"
        ? ["owner", "admin", "user", "readonly"]
        : ["admin", "user", "readonly"];
      if (!allowedRoles.includes(role)) {
        return NextResponse.json({ success: false, error: "Invalid role" }, { status: 400 });
      }
      if (session.id === String(userId) && role !== session.role) {
        return NextResponse.json({ success: false, error: "You cannot change your own role" }, { status: 403 });
      }
      const ok = await updateUserRole(String(userId), role);
      if (!ok) return NextResponse.json({ success: false, error: "Role update failed" }, { status: 500 });
      await logAdminAction({ action: "user.role_change", actor_id: session.id, actor_email: session.email, target_id: target.id, target_email: target.email, metadata: { newRole: role } });
    }

    // Password reset
    if (password) {
      const strongPw = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
      if (!strongPw.test(password)) {
        return NextResponse.json({ success: false, error: "Password must be 8+ chars with uppercase, lowercase, and a number" }, { status: 400 });
      }
      const hash = await bcrypt.hash(password, 12);
      const ok = await updateUserPasswordHash(String(userId), hash);
      if (!ok) return NextResponse.json({ success: false, error: "Password update failed" }, { status: 500 });
      await logAdminAction({ action: "user.password_reset", actor_id: session.id, actor_email: session.email, target_id: target.id, target_email: target.email });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Update failed" }, { status: 500 });
  }
}
