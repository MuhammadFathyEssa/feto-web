import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies decision-pattern analysis to the backend.
// Admin-only: enforced by middleware (ADMIN_PATHS includes /api/proxy/twin).
export async function GET() {
  if (!API_KEY || !BACKEND_URL) {
    return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/twin/patterns`, {
      headers: { "X-API-Key": API_KEY },
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Patterns request failed" }, { status: 502 });
  }
}
