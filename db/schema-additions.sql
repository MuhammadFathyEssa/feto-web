-- ============================================================
-- FeTo — Schema additions for password reset + access requests
-- Run this in the Supabase SQL editor.
-- ============================================================

-- Password reset tokens
create table if not exists feto_password_resets (
  token       text primary key,
  user_id     uuid not null,
  email       text not null,
  expires_at  timestamptz not null,
  used        boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists idx_pwreset_email on feto_password_resets (email);
create index if not exists idx_pwreset_expires on feto_password_resets (expires_at);

-- Access requests (public sign-up requests awaiting admin approval)
create table if not exists feto_access_requests (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  organization text,
  reason       text,
  status       text not null default 'pending',  -- pending | accepted | rejected
  created_at   timestamptz not null default now()
);
create index if not exists idx_accessreq_status on feto_access_requests (status);
create unique index if not exists idx_accessreq_email_pending
  on feto_access_requests (email) where status = 'pending';
