"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

// Must match IDLE_TIMEOUT_MINUTES on the server (default 15)
const IDLE_MINUTES = Number(process.env.NEXT_PUBLIC_IDLE_TIMEOUT_MINUTES || 15);
const IDLE_MS = IDLE_MINUTES * 60 * 1000;
const WARN_MS = 60 * 1000; // warn 60s before logout

export default function IdleTimeout() {
  const router = useRouter();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      /* ignore */
    }
    router.push("/login?reason=idle");
  }, [router]);

  const reset = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    if (warnTimer.current) clearTimeout(warnTimer.current);
    warnTimer.current = setTimeout(() => {
      // Optional: could surface a toast here
    }, IDLE_MS - WARN_MS);
    timer.current = setTimeout(logout, IDLE_MS);
  }, [logout]);

  useEffect(() => {
    // Don't run idle logout on the login page itself
    if (window.location.pathname.startsWith("/login")) return;

    const events = ["mousemove", "mousedown", "keydown", "scroll", "touchstart", "click"];
    const handler = () => reset();
    events.forEach((e) => window.addEventListener(e, handler, { passive: true }));
    reset();

    // Also re-check on tab focus — if backgrounded past timeout, log out
    const onVisible = () => {
      if (document.visibilityState === "visible") reset();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      events.forEach((e) => window.removeEventListener(e, handler));
      document.removeEventListener("visibilitychange", onVisible);
      if (timer.current) clearTimeout(timer.current);
      if (warnTimer.current) clearTimeout(warnTimer.current);
    };
  }, [reset]);

  return null;
}
