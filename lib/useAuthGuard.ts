"use client";

import { useEffect, useState } from "react";

// Client-side auth guard for tool pages. Middleware already redirects tokenless
// requests server-side; this is defense-in-depth so the page shell never renders
// (not even a flash) before the session is confirmed, and it holds even if the
// deployment's middleware is misconfigured for a given route.
//
// Returns "checking" until /api/auth/me resolves. On failure it redirects to
// /login and stays "checking" (caller renders nothing). On success: "authed".
export function useAuthGuard(): "checking" | "authed" {
  const [state, setState] = useState<"checking" | "authed">("checking");

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!alive) return;
        if (d?.success) {
          setState("authed");
        } else {
          window.location.href = "/login";
        }
      })
      .catch(() => {
        if (alive) window.location.href = "/login";
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
