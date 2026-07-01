"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Surface for monitoring; avoids a silent white screen on render failure.
    console.error("Unhandled render error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#071428] text-slate-200 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold text-slate-100">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-400">An unexpected error occurred. You can retry, or return to the home page.</p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <button onClick={reset} className="rounded-lg bg-[#e0a955] px-4 py-2 text-sm font-medium text-[#071428]">Retry</button>
          <a href="/" className="rounded-lg border border-[#1a2235] px-4 py-2 text-sm text-slate-300">Home</a>
        </div>
      </div>
    </div>
  );
}
