import { NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Proxies the personality assessment interview to the backend.
export async function POST(request: Request) {
  if (!API_KEY || !BACKEND_URL) {
    return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  }
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/api/personality`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify(body),
    });
    const raw = await res.text();
    try { return NextResponse.json(JSON.parse(raw), { status: res.status }); }
    catch { return NextResponse.json({ success: false, error: "Request failed" }, { status: res.status }); }
  } catch {
    return NextResponse.json({ success: false, error: "Assessment request failed" }, { status: 502 });
  }
}
