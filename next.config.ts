import type { NextConfig } from "next";

const SITE_ORIGIN = "https://feto.live";

const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), geolocation=(), microphone=(self)" },
  // Obfuscate the hosting platform (passive-scan LOW finding: server reveals "Vercel").
  { key: "X-Powered-By", value: "" },
  { key: "Server", value: "FeTo" },
  // Explicit same-origin CORS on EVERY response (not just /api). Setting an exact
  // origin here overrides Vercel's permissive "ACAO: *" default that the passive
  // scan flags on the root document. Vary:Origin keeps caches correct.
  { key: "Access-Control-Allow-Origin", value: SITE_ORIGIN },
  { key: "Vary", value: "Origin" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Content-Security-Policy is set per-request in middleware.ts (nonce + strict-dynamic).
];

// API routes also advertise allowed methods/headers for preflight requests.
const apiCorsHeaders = [
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
