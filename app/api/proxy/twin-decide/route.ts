import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Records a decision into executive memory.
// Admin-only: enforced by middleware (ADMIN_PATHS includes /api/proxy/twin).
export async function POST(request: Request) {
  if (!API_KEY || !BACKEND_URL) {
    return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/twin/decide`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Decide request failed" }, { status: 502 });
  }
}
