import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

export const dynamic = 'force-dynamic';

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  try {
    const res = await fetch(`${BACKEND_URL}/api/agents`, {
      headers: { "X-API-Key": API_KEY },
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ success: false, error: `Backend error ${res.status}`, detail: text.slice(0, 200) }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.json({ success: false, error: "Agents fetch failed", detail: msg }, { status: 502 });
  }
}