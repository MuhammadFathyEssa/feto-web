import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import {
  getSession, getAccessRequestById, deleteAccessRequest, updateAccessRequestStatus,
  getUserByEmail, createUser, createPasswordReset,
} from "@/lib/auth";
import { sendEmail, accessApprovedEmail, accessRejectedEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/auditLog";

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    const { id, decision } = await req.json();
    if (!id || !["accept", "reject"].includes(decision)) {
      return NextResponse.json({ success: false, error: "id and decision (accept|reject) required" }, { status: 400 });
    }

    const reqRow = await getAccessRequestById(String(id));
    if (!reqRow) return NextResponse.json({ success: false, error: "Request not found" }, { status: 404 });

    const origin = req.nextUrl.origin;

    if (decision === "reject") {
      await deleteAccessRequest(String(id));
      const tmpl = accessRejectedEmail(reqRow.name || "there");
      await sendEmail(reqRow.email, tmpl.subject, tmpl.body).catch(() => {});
      await logAdminAction({
        action: "access_request.reject",
        actor_id: session.id, actor_email: session.email,
        target_email: reqRow.email, metadata: {},
      });
      return NextResponse.json({ success: true, decision: "rejected" });
    }

    // ── Accept ──
    // If a user already exists, just mark accepted and notify.
    const existing = await getUserByEmail(reqRow.email);
    if (!existing) {
      // Create the user with a random password they can't guess; they set their own via reset link.
      const tempPw = randomBytes(24).toString("hex");
      const hash = await bcrypt.hash(tempPw, 12);
      await createUser(reqRow.email, reqRow.name || reqRow.email, hash, "user");
    }
    await updateAccessRequestStatus(String(id), "accepted");

    // Issue a password-reset token so the new user sets their own password.
    const user = existing || (await getUserByEmail(reqRow.email));
    let loginLink = `${origin}/login`;
    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24h for first set-up
      await createPasswordReset(user.id, reqRow.email, token, expiresAt);
      loginLink = `${origin}/reset-password?token=${token}`;
    }

    const tmpl = accessApprovedEmail(reqRow.name || "there", loginLink);
    await sendEmail(reqRow.email, tmpl.subject, tmpl.body).catch(() => {});

    await logAdminAction({
      action: "access_request.accept",
      actor_id: session.id, actor_email: session.email,
      target_email: reqRow.email, metadata: {},
    });
    return NextResponse.json({ success: true, decision: "accepted" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ success: false, error: "Decision failed", detail: msg.slice(0, 200) }, { status: 500 });
  }
}
