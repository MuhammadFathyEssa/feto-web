import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = process.env.BACKEND_URL || "";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY || !BACKEND_URL) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  try {
    const form = await req.formData();
    const file = form.get("file");
    const message = String(form.get("message") || "Analyze this document");
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "No file in request" }, { status: 400 });
    }
    // 20MB cap enforced server-side
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large (max 20MB)" }, { status: 413 });
    }

    const upstream = new FormData();
    upstream.append("file", file, (file as File).name || "upload");
    upstream.append("userId", session.id); // session-derived
    upstream.append("message", message);

    const res = await fetch(`${BACKEND_URL}/api/upload`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY },
      body: upstream,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 502 });
  }
}
