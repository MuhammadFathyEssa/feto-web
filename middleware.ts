import { NextRequest, NextResponse } from "next/server";
import { verifyToken, refreshActivity, COOKIE_NAME } from "@/lib/auth";

// Public marketing routes — reachable without authentication
const PUBLIC_EXACT = ["/"];
const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password", "/request-access", "/api/access-request", "/api/auth/login", "/api/auth/forgot-password", "/api/auth/reset-password"];
// Pages + APIs only owner/admin may reach
const ADMIN_PATHS = ["/admin", "/dashboard", "/api/users", "/twin", "/api/proxy/twin", "/decisions", "/api/proxy/decisions", "/planner", "/api/proxy/planner"];
// Authenticated tool pages: any logged-in user, no admin role required. These are
// NOT public — the default token gate below redirects tokenless requests to /login,
// and each page also runs a client-side useAuthGuard as defense-in-depth.
const AUTHED_TOOL_PATHS = ["/correspondence", "/memo", "/learn"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // F-01: per-request nonce CSP. script-src uses nonce + strict-dynamic and does NOT
  // include 'unsafe-inline' (ignored by browsers when a nonce is present anyway).
  // strict-dynamic lets the nonced Next.js bootstrap load its chunks. The nonce is set
  // on the REQUEST header so the layout (headers()) and framework stamp it on script tags;
  // dynamic rendering is forced in app/layout.tsx so prerendered HTML is not served nonceless.
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https:`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "media-src 'self' blob:",
    "object-src 'none'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
  const reqHeadersWithNonce = () => {
    const h = new Headers(req.headers);
    h.set("x-nonce", nonce);
    return h;
  };
  const applyCsp = (res: NextResponse): NextResponse => {
    res.headers.set("Content-Security-Policy", csp);
    return res;
  };
  const nextWithNonce = () =>
    applyCsp(NextResponse.next({ request: { headers: reqHeadersWithNonce() } }));

  // Allow public marketing routes (exact match for landing root)
  if (PUBLIC_EXACT.includes(pathname)) {
    return nextWithNonce();
  }
  // Allow public paths (prefix match)
  // CWE-285: match exact path or a true sub-path (prefix + "/"), never a bare prefix.
  // "/login" must not match "/login-backdoor"; only "/login" or "/login/...".
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return nextWithNonce();
  }

  // Allow Next.js internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/favicon")) {
    return nextWithNonce();
  }

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return applyCsp(NextResponse.redirect(new URL("/login", req.url)));
  }

  // Authenticated tool pages require a valid token (handled by the check above);
  // this reference makes the requirement explicit and auditable.
  void AUTHED_TOOL_PATHS;

  const session = await verifyToken(token);
  if (!session) {
    // Idle timeout or invalid/expired token — force re-login
    const res = applyCsp(NextResponse.redirect(new URL("/login?reason=expired", req.url)));
    res.cookies.set(COOKIE_NAME, "", { maxAge: 0, path: "/" });
    return res;
  }

  // Attach user info to headers for server components
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", session.id);
  requestHeaders.set("x-user-email", session.email);
  requestHeaders.set("x-user-role", session.role);
  requestHeaders.set("x-nonce", nonce);

  // Admin-only gating: non-admins are bounced. Pages → redirect home, APIs → 403.
  const isAdmin = session.role === "owner" || session.role === "admin";
  if (!isAdmin && ADMIN_PATHS.some((p) => pathname.startsWith(p))) {
    if (pathname.startsWith("/api/")) {
      return applyCsp(NextResponse.json({ success: false, error: "Forbidden — admin only" }, { status: 403 }));
    }
    return applyCsp(NextResponse.redirect(new URL("/", req.url)));
  }

  const res = applyCsp(NextResponse.next({ request: { headers: requestHeaders } }));

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
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)"],
};
