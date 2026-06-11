import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = "https://feto-agent-production.up.railway.app";
const API_KEY = process.env.BACKEND_API_KEY || "";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  try {
    const res = await fetch(`${BACKEND_URL}/api/agents`, {
      headers: API_KEY ? { "X-API-Key": API_KEY } : {},
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Agents fetch failed" }, { status: 502 });
  }
}
