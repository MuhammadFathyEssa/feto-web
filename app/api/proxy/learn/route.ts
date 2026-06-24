import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY     = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";

// Proxies the adaptive tutor to the dedicated /api/tutor-chat backend endpoint.
// Sends the full conversation history so the backend never needs to look up Redis.
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });

  if (!API_KEY || !BACKEND_URL)
    return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  let body: { message?: string; history?: unknown[]; lang?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }); }

  if (!body.message && (!body.history || !(body.history as unknown[]).length))
    return NextResponse.json({ success: false, error: "message or history is required" }, { status: 400 });

  // Build history: existing turns + new user message
  const existingHistory = Array.isArray(body.history) ? body.history : [];
  const history = body.message
    ? [...existingHistory, { role: "user", content: String(body.message) }]
    : existingHistory;

  try {
    const res = await fetch(`${BACKEND_URL}/api/tutor-chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ history, userId: session.id }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Upstream request failed" }, { status: 502 });
  }
}
