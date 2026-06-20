import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  // Obfuscate the hosting platform (passive-scan LOW finding: server reveals "Vercel").
  { key: "X-Powered-By", value: "" },
  { key: "Server", value: "FeTo" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "media-src 'self' blob:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
];

// Same-origin app: API routes are called by our own pages, so CORS must NOT be a
// wildcard. Scoping ACAO to the site's own origin closes the passive-scan MEDIUM
// finding (Wildcard CORS) and overrides Vercel's permissive default on /api/*.
const SITE_ORIGIN = "https://feto.live";
const apiCorsHeaders = [
  { key: "Access-Control-Allow-Origin", value: SITE_ORIGIN },
  { key: "Vary", value: "Origin" },
  { key: "Access-Control-Allow-Methods", value: "GET, POST, OPTIONS" },
  { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, X-API-Key" },
];

const nextConfig: NextConfig = {
  // eslint runs during builds — surfaces real errors instead of hiding them
  async headers() {
    return [
      { source: "/api/:path*", headers: [...securityHeaders, ...apiCorsHeaders] },
      { source: "/:path*", headers: securityHeaders },
    ];
  },
};

export default nextConfig;
