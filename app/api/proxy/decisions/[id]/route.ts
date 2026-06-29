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

// GET /api/proxy/decisions/:id — fetch one decision (+ related)
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await ctx.params;
  try {
    const res = await fetch(`${BACKEND_URL}/api/decisions/${encodeURIComponent(id)}?userId=${encodeURIComponent(g.session!.id)}`, {
      headers: { "X-API-Key": API_KEY },
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Get request failed" }, { status: 502 });
  }
}

// PATCH /api/proxy/decisions/:id — fill / edit fields
export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const g = await guard();
  if (g.error) return g.error;
  const { id } = await ctx.params;
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/decisions/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ userId: g.session!.id, patch: body.patch || {} }),
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Update request failed" }, { status: 502 });
  }
}
