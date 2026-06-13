import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";

export async function GET(req: NextRequest, ctx: { params: Promise<{ token: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  const { token } = await ctx.params;
  try {
    const res = await fetch(`${BACKEND_URL}/api/rank-report/${encodeURIComponent(token)}`, {
      headers: { "X-API-Key": API_KEY },
    });
    if (!res.ok) {
      return NextResponse.json({ success: false, error: "Report not found or expired" }, { status: res.status });
    }
    const buffer = await res.arrayBuffer();
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="CV_Ranking.pdf"`,
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: "Upstream request failed" }, { status: 502 });
  }
}
