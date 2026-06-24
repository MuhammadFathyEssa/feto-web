import { NextResponse } from "next/server";
import { getSession, getAccessRequests } from "@/lib/auth";

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }
  const requests = await getAccessRequests("pending");
  return NextResponse.json({ success: true, requests });
}
