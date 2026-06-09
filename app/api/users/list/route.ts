import { NextResponse } from "next/server";
import { getSession, getAllUsers } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }
    const users = await getAllUsers();
    return NextResponse.json({ success: true, users });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch users";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
