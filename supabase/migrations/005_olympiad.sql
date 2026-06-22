-- 005_olympiad.sql — olympiad practice catalog + per-child progress + uploads
-- Catalog sets are shared read-mostly content; progress and user uploads are
-- per-account (RLS-isolated). Community sharing = is_shared on user_resources.

-- ── shared catalog of practice sets ──────────────────────────────────────────
create table if not exists public.catalog_olympiad_sets (
  id        uuid primary key default gen_random_uuid(),
  subject   text not null check (subject in ('maths','science','english','gk','cs','sst')),
  category  text not null check (category in ('basic','intermediate','pro','sample')),
  grade     text not null,
  title     text not null,
  kind      text not null check (kind in ('worksheet','sample_paper')),
  payload   jsonb,                          -- questions for worksheets
  asset_url text                            -- sample-paper file
);

alter table public.catalog_olympiad_sets enable row level security;
create policy catalog_oly_read on public.catalog_olympiad_sets for select using (true);

-- ── per-child progress on a set ──────────────────────────────────────────────
create table if not exists public.olympiad_progress (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  child_id    uuid not null references public.children(id) on delete cascade,
  set_id      text not null,                -- catalog set id or custom id
  status      text not null check (status in ('not_started','in_progress','done')),
  score       integer,
  updated_at  timestamptz not null default now(),
  unique (child_id, set_id)
);

alter table public.olympiad_progress enable row level security;
create policy oly_progress_owner_all on public.olympiad_progress
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ── parent-uploaded resources (shareable to community) ───────────────────────
create table if not exists public.user_resources (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  child_id    uuid references public.children(id) on delete set null,
  module      text not null default 'olympiad',   -- which module the upload belongs to
  subject     text,
  grade       text,
  category    text,
  title       text not null,
  media_url   text,
  payload     jsonb,
  is_shared   boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.user_resources enable row level security;

-- Owner reads/writes own; everyone reads ones shared to the community.
create policy user_resources_owner_all on public.user_resources
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy user_resources_community_read on public.user_resources
  for select using (is_shared = true);
