import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Public World Cup matches with live scores (football-data.org via backend).
export async function GET() {
  if (!API_KEY || !BACKEND_URL) {
    return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  }
  try {
    const res = await fetch(`${BACKEND_URL}/api/worldcup-matches`, {
      headers: { "X-API-Key": API_KEY },
      next: { revalidate: 60 },
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Matches fetch failed" }, { status: 502 });
  }
}
