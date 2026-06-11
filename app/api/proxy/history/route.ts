import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = "https://feto-agent-production.up.railway.app";
const API_KEY = process.env.BACKEND_API_KEY || "";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  try {
    // userId from session — a user can only ever read their own history
    const res = await fetch(`${BACKEND_URL}/api/history?userId=${encodeURIComponent(session.id)}`, {
      headers: { "X-API-Key": API_KEY },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "History fetch failed" }, { status: 502 });
  }
}
