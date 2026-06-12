import { NextRequest, NextResponse } from "next/server";
import { verifyToken, refreshActivity, COOKIE_NAME } from "@/lib/auth";

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return NextResponse.next();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifyToken(token);
  if (!session) {
    // Idle timeout or invalid/expired token — force re-login
    const res = NextResponse.redirect(new URL("/login?reason=expired", req.url));
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  }

  // Attach user info to headers for server components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", session.id);
  requestHeaders.set("x-user-email", session.email);
  requestHeaders.set("x-user-role", session.role);

  const res = NextResponse.next({ request: { headers: requestHeaders } });

  // Sliding session — F-08: only re-issue the cookie when enough time has
  // elapsed since last activity (avoids signing a JWT on every request).
  const REFRESH_THROTTLE_MS = 2 * 60 * 1000;
  const lastActivity = session.lastActivity || 0;
  if (Date.now() - lastActivity > REFRESH_THROTTLE_MS) {
    const freshToken = await refreshActivity(session);
    res.cookies.set(COOKIE_NAME, freshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
  }
  return res;
}

export const config = {
  // F-08: exclude static assets and common public files from the matcher
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
