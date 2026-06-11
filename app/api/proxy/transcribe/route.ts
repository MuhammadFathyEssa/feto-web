import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

const BACKEND_URL = "https://feto-agent-production.up.railway.app";
const API_KEY = process.env.BACKEND_API_KEY || "";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
  if (!API_KEY) return NextResponse.json({ success: false, error: "Service misconfigured" }, { status: 503 });

  try {
    const form = await req.formData();
    const audio = form.get("file") || form.get("audio");
    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ success: false, error: "No audio in request" }, { status: 400 });
    }
    if (audio.size > 25 * 1024 * 1024) {
      return NextResponse.json({ success: false, error: "Audio too large (max 25MB)" }, { status: 413 });
    }

    const upstream = new FormData();
    upstream.append("file", audio, (audio as File).name || "audio.webm");
    upstream.append("userId", session.id);

    const res = await fetch(`${BACKEND_URL}/api/transcribe`, {
      method: "POST",
      headers: { "X-API-Key": API_KEY },
      body: upstream,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ success: false, error: "Transcription failed" }, { status: 502 });
  }
}
