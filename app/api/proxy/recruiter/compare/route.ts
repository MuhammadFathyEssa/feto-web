import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 }); }
  try {
    const res = await fetch(`${BACKEND_URL}/api/recruiter/compare`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: res.status >= 500 ? "Server error" : "Request failed" }, { status: res.status }); }
  } catch { return NextResponse.json({ success: false, error: "Upstream failed" }, { status: 502 }); }
}
