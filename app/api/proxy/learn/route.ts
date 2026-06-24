import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY     = process.env.BACKEND_API_KEY || "";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY || !BACKEND_URL)
    return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  
  let body: { message?: string; lang?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ success: false, error: "Invalid request" }, { status: 400 }); }

  const message = String(body.message || "").trim();
  if (!message)
    return NextResponse.json({ success: false, error: "message is required" }, { status: 400 });

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({
        userId: session.id,
        userName: session.name,
        message,
        agentType: "tutor",   // forces tutor agent, bypasses coordinator
      }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Request failed" }, { status: 502 });
  }
}
