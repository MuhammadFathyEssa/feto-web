import { NextResponse } from "next/server";
import { getSession, touchLastActive } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });
  // Record activity (fire-and-forget) for the admin "active users" view
  touchLastActive(session.id).catch(() => {});
  return NextResponse.json({
    success: true,
    user: { id: session.id, email: session.email, name: session.name, role: session.role },
  });
}
