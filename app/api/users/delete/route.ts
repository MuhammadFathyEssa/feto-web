import { NextRequest, NextResponse } from "next/server";
import { getSession, getUserById, deleteUser } from "@/lib/auth";
import { logAdminAction } from "@/lib/auditLog";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const { userId } = await req.json();
    if (!userId) return NextResponse.json({ success: false, error: "userId is required" }, { status: 400 });

    // Cannot delete yourself
    if (session.id === String(userId)) {
      return NextResponse.json({ success: false, error: "You cannot delete your own account" }, { status: 403 });
    }

    const target = await getUserById(String(userId));
    if (!target) return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });

    // Admins cannot delete owners
    if (target.role === "owner" && session.role !== "owner") {
      return NextResponse.json({ success: false, error: "Admins cannot delete owner accounts" }, { status: 403 });
    }

    const ok = await deleteUser(String(userId));
    if (!ok) return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });

    await logAdminAction({
      action: "user.delete",
      actor_id: session.id,
      actor_email: session.email,
      target_id: target.id,
      target_email: target.email,
    });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: "Delete failed" }, { status: 500 });
  }
}
