import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false }, { status: 401 });
  return NextResponse.json({
    success: true,
    user: { id: session.id, email: session.email, name: session.name, role: session.role },
  });
}
