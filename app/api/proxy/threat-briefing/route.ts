import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  const scope = req.nextUrl.searchParams.get("scope") || "vendors";
  const days = req.nextUrl.searchParams.get("days") || "7";

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/threat-briefing?scope=${encodeURIComponent(scope)}&days=${encodeURIComponent(days)}`,
      { headers: { "X-API-Key": API_KEY }, cache: "no-store" }
    );
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: res.status >= 500 ? "Server error" : "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Briefing fetch failed" }, { status: 502 });
  }
}
