import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getObservabilityMetrics } from "@/lib/observability";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  }
  if (session.role !== "owner" && session.role !== "admin") {
    return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
  }

  const hoursParam = Number(req.nextUrl.searchParams.get("hours"));
  const windowHours = [24, 168, 720].includes(hoursParam) ? hoursParam : 24;

  try {
    const metrics = await getObservabilityMetrics(windowHours);
    return NextResponse.json({ success: true, metrics });
  } catch {
    return NextResponse.json({ success: false, error: "Failed to load metrics" }, { status: 500 });
  }
}
