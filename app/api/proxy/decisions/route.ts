import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function guard() {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 }) };
  if (session.role !== "owner" && session.role !== "admin") {
    return { error: NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 }) };
  }
  if (!API_KEY || !BACKEND_URL) return { error: NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 }) };
  return { session };
}

// GET /api/proxy/decisions — list the signed-in user's decisions
export async function GET() {
  const g = await guard();
  if (g.error) return g.error;
  try {
    const res = await fetch(`${BACKEND_URL}/api/decisions?ownerUserId=${encodeURIComponent(g.session!.id)}`, {
      headers: { "X-API-Key": API_KEY },
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "List request failed" }, { status: 502 });
  }
}

// POST /api/proxy/decisions — create a decision (draft from text, or structured)
export async function POST(request: NextRequest) {
  const g = await guard();
  if (g.error) return g.error;
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/decisions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ ...body, ownerUserId: g.session!.id }),
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Create request failed" }, { status: 502 });
  }
}
