-- 010_children_sync.sql — cross-device child profiles + platform activity log
--
-- Fixes: a child profile created on one device was stored only in that
-- browser's localStorage. The web client now writes every kid profile into
-- public.children (RLS: owner only), so any device signed in with the same
-- account sees the same children.
--
-- Apply: supabase db push  (or paste into the SQL editor).

-- The client keeps richer per-kid data (avatar, colors, school, onboarding
-- answers, XP/streak) than the normalized columns — store it as one jsonb blob.
alter table public.children add column if not exists profile jsonb not null default '{}'::jsonb;

-- ── activity_events ──────────────────────────────────────────────────────────
-- Every meaningful user action (login, child added, onboarding done, worksheet
-- submitted, …) is recorded here for the Admin Console's activity monitor.
create table if not exists public.activity_events (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  child_id    uuid,
  event       text not null,          -- e.g. 'login', 'kid_added', 'worksheet_submitted'
  detail      text,
  created_at  timestamptz not null default now()
);

create index if not exists activity_events_account_idx on public.activity_events(account_id, created_at desc);

alter table public.activity_events enable row level security;

-- Users can write their own events and read back their own history.
-- The admin console reads ALL events via the service role (SWA Function).
create policy activity_events_self_insert on public.activity_events
  for insert with check (account_id = auth.uid());
create policy activity_events_self_select on public.activity_events
  for select using (account_id = auth.uid());
