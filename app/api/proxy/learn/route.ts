import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY     = process.env.BACKEND_API_KEY || "";
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });
  try {
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/api/tutor-test`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-API-Key": API_KEY },
      body: JSON.stringify({ ...body, userId: session.id }),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Test generation failed" }, { status: 502 });
  }
}
