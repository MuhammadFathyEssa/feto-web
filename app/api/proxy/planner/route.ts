import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// POST /api/proxy/planner — generate a grounded execution plan from an intent.
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/planner/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ intent: body.intent, ownerUserId: session.id }),
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Plan request failed" }, { status: 502 });
  }
}
