import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';
// Long-form agents (cybersecurity 4000, memo/board 8000 tokens) generate for
// 60-120s. Without this, Vercel aborts the function at the platform default
// (~15s) and returns 502 before the backend responds.
export const maxDuration = 120;

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || ""; // server-only — never NEXT_PUBLIC

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  let body: { message?: string; agentType?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  const message = String(body.message || "").trim();
  if (!message) {
    return NextResponse.json({ success: false, error: "message is required" }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ success: false, error: "Message too long (max 4000)" }, { status: 400 });
  }
  // Optional: pin the request to a specific agent (used by dedicated skill pages).
  const agentType = body.agentType ? String(body.agentType).slice(0, 40) : undefined;

  try {
    const res = await fetch(`${BACKEND_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      // userId derived from the authenticated session — NOT from the client
      body: JSON.stringify({ userId: session.id, message, userName: session.name, ...(agentType ? { agentType } : {}) }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Upstream request failed" }, { status: 502 });
  }
}
