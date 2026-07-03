# FeTo Executive Intelligence — Web

The feto-web dashboard at **feto.live**. A Next.js (App Router) frontend that
authenticates executives, proxies their requests to the FeTo backend brain
(Railway), and provides agent chat, the recruiter suite, personality assessment,
the adaptive tutor (علمني), and an admin console. Deployed on Vercel.

## Stack

- Next.js (App Router) · React · TypeScript · Tailwind CSS
- Auth: `jose` JWT in an httpOnly cookie; users in Supabase (`feto_users`)
- No direct LLM calls from the browser — every request is proxied server-side
  through `/api/proxy/*` to the backend, which holds the model keys.

## Structure

```
app/
  page.tsx                landing page (self-contained, navy/gold theme)
  login / request-access / forgot-password / reset-password
  app/                    main agent chat
  recruiter / personality / learn / cyber / worldcup / dashboard / settings
  observability/          admin telemetry dashboard  ← reads ai_audit_log
  admin/                  user & access-request management
  api/
    auth/*                login, logout, me, password reset
    proxy/*               server-side proxy to the backend (chat, recruiter, learn, …)
    admin/observability   aggregated metrics (owner/admin only)
    users/*  admin/*      user CRUD, access requests
lib/
  auth.ts                 sessions, roles, Supabase REST helpers
  observability.ts        aggregates ai_audit_log for the admin dashboard
  api.ts  rateLimit.ts  email.ts  auditLog.ts
middleware.ts             route protection
```

## Roles

`owner` · `admin` · `user` · `readonly` (in the JWT session). Admin APIs and the
`/observability` and `/admin` pages require `owner` or `admin`.

## Observability dashboard

`/observability` (linked from `/admin`) shows, for a 24h / 7d / 30d window:
message volume, per-agent routing + average latency, engine distribution
(dual vs single vs council vs fallback), and token usage vs the monthly cap.
It reads the backend's `ai_audit_log` table directly via Supabase REST. If that
table is missing the v5 columns, the page shows a banner pointing to
`migrations/002_ai_audit_log_columns.sql` (in the backend repo) instead of failing.

## Environment

Server-only (never `NEXT_PUBLIC` except where noted):

| Var | Purpose |
|-----|---------|
| `JWT_SECRET` | session signing (≥ 32 chars) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (server only) |
| `BACKEND_URL` | Railway backend base URL |
| `BACKEND_API_KEY` | shared key sent as `X-API-Key` to the backend |
| `MONTHLY_TOKEN_HARD_CAP` | (optional) cap shown on the observability dashboard |
| `IDLE_TIMEOUT_MINUTES` | (optional) session idle timeout |

## Local dev

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # next build — must pass before deploy
npm run start    # production server
npm run lint
```

Copy `.env.example` to `.env.local` and fill the values above.

## Security notes

- API routes derive `userId` from the authenticated session, never from the client.
- All `/api/proxy/*` routes set `export const dynamic = "force-dynamic"` so they are
  always evaluated per-request (not statically cached).
- The backend API key is server-only; it is never exposed to the browser.
- CSP: per-request nonce + `strict-dynamic` set in `middleware.ts`; `unsafe-inline` removed
  from `script-src`. `app/layout.tsx` sets `export const dynamic = "force-dynamic"` and reads
  the nonce via `headers()` so it reaches server-rendered script tags (a statically prerendered
  landing page cannot carry a per-request nonce — this is why all routes render dynamically).
  Verified live: zero CSP violations, page renders styled.
- E2E: Playwright specs in `e2e/` (`csp-regression`, `login`, `chat-workflow`) run against the
  preview URL via `.github/workflows/e2e.yml`, gated on the `BASE_URL` repo variable. The
  csp-regression spec guards against the blank-render class by asserting visible content and
  zero CSP violations.
- Header hardening: `poweredByHeader: false` (no `X-Powered-By: Next.js` disclosure); full
  security-header set (HSTS preload, X-Frame-Options DENY, nosniff, Referrer-Policy,
  Permissions-Policy) applied via `next.config.ts`. `Permissions-Policy` keeps `microphone=(self)`
  because the agent chat uses `getUserMedia` for voice input. `Server: Vercel` is platform-injected
  and cannot be suppressed (accepted residual).
- Discovery/standards files: `public/.well-known/security.txt` (contact Eng.mfathy@gmail.com),
  `public/robots.txt`, `app/icon.svg` favicon.
- TLS (testssl.sh, feto.live edge): TLS 1.2 + 1.3, AEAD forward-secrecy only, no weak ciphers,
  no known CVE exposure. `Server: Vercel` and absent extended-master-secret are Vercel edge
  platform artifacts, not source-controllable.

## Deploy (Vercel)

Set the env vars above in the Vercel project, connect the repo, and deploy. All routes are
server-rendered on demand (required for the per-request CSP nonce); static optimization is
traded for nonce enforcement.
