import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getSession, createUser, getUserByEmail } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ success: false, error: "Not authenticated" }, { status: 401 });
    if (session.role !== "owner" && session.role !== "admin") {
      return NextResponse.json({ success: false, error: "Insufficient permissions" }, { status: 403 });
    }

    const { email, name, password, role } = await req.json();
    if (!email || !name || !password) {
      return NextResponse.json({ success: false, error: "email, name, and password are required" }, { status: 400 });
    }

    const allowedRoles = ["admin", "user", "readonly"];
    if (session.role === "admin" && role === "owner") {
      return NextResponse.json({ success: false, error: "Admins cannot create owner accounts" }, { status: 403 });
    }

    const existing = await getUserByEmail(email.toLowerCase().trim());
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already registered" }, { status: 409 });
    }

    if (password.length < 8) {
      return NextResponse.json({ success: false, error: "Password must be at least 8 characters" }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const finalRole = allowedRoles.includes(role) ? role : "user";
    const newUser = await createUser(email.toLowerCase().trim(), name, passwordHash, finalRole);

    return NextResponse.json({
      success: true,
      user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to create user";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
