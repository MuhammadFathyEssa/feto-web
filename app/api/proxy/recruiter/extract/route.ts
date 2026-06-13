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
    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ success: false, error: "No file in request" }, { status: 400 });
    }
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "File too large (max 20MB)" }, { status: 413 });
    }
    const upstream = new FormData();
    upstream.append("file", file, (file as File).name || "upload");

    const res = await fetch(`${BACKEND_URL}/api/recruiter/extract`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY },
      body: upstream,
    });
    const raw = await res.text();
    try {
      return NextResponse.json(JSON.parse(raw), { status: res.status });
    } catch {
      return NextResponse.json({ success: false, error: "Extraction failed" }, { status: res.status });
    }
  } catch {
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 502 });
  }
}
