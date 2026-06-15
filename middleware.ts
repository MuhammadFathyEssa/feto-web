import { NextRequest, NextResponse } from "next/server";
import { verifyToken, refreshActivity, COOKIE_NAME } from "@/lib/auth";

// Public marketing routes — reachable without authentication
const PUBLIC_EXACT = ["/"];
const PUBLIC_PATHS = ["/login", "/api/auth/login"];
// Pages + APIs only owner/admin may reach
const ADMIN_PATHS = ["/admin", "/dashboard", "/api/users"];

// Canonical domain — every other host (e.g. the *.vercel.app preview/default
// subdomain) is 301-redirected here so only feto.live is publicly reachable.
const CANONICAL_HOST = "feto.live";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

<<<<<<< HEAD
  // Allow public marketing routes (exact match for landing root)
  if (PUBLIC_EXACT.includes(pathname)) {
    return NextResponse.next();
  }
  // Allow public paths (prefix match)
=======
  // ── Canonical host enforcement ────────────────────────────────
  // Runs before auth so the vercel.app subdomain never serves content.
  const host = req.headers.get("host") || "";
  if (host !== CANONICAL_HOST && host.endsWith(".vercel.app")) {
    const url = new URL(req.url);
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 301);
  }

  // Allow public paths
>>>>>>> 6859be366fdff78fc90c582394828ec5a023d26e
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

  // Admin-only gating: non-admins are bounced. Pages → redirect home, APIs → 403.
  const isAdmin = session.role === "owner" || session.role === "admin";
  if (!isAdmin && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ success: false, error: "Forbidden — admin only" }, { status: 403 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

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
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  return res;
}

export const config = {
  // F-08: exclude static assets and common public files from the matcher
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
