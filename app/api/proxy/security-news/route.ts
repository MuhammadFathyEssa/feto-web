import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  const limit = req.nextUrl.searchParams.get("limit") || "15";

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/security-news?limit=${encodeURIComponent(limit)}`,
      { headers: { "X-API-Key": API_KEY }, cache: "no-store" }
    );
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: res.status >= 500 ? "Server error" : "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "News fetch failed" }, { status: 502 });
  }
}
