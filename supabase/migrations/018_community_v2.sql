-- 018_community_v2.sql — M7 Community: moderation + safety (spec §3)

-- ── moderation state on posts + comments ─────────────────────────────────────
alter table public.posts
  add column if not exists status text not null default 'visible'
    check (status in ('visible','flagged','hidden','removed'));
alter table public.post_comments
  add column if not exists status text not null default 'visible'
    check (status in ('visible','flagged','hidden','removed'));

-- Tighten read policies: others see only 'visible'; authors also see their own
-- flagged/hidden items (with an "under review" chip in UI).
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (
  (visibility = 'community' and status = 'visible')
  or account_id = auth.uid()
);

drop policy if exists comments_read on public.post_comments;
create policy comments_read on public.post_comments for select using (
  status = 'visible' or account_id = auth.uid()
);

-- ── consent gate at the DB level (spec §3.2): posting ABOUT a child requires
--    current community_visibility consent. UI checks are not enough.
drop policy if exists posts_owner_write on public.posts;
create policy posts_owner_write on public.posts for insert with check (
  account_id = auth.uid()
  and (
    child_id is null
    or exists (
      select 1 from public.consents_current cc
       where cc.child_id = posts.child_id
         and cc.kind = 'community_visibility'
         and cc.granted = true
    )
  )
);

-- ── reports ──────────────────────────────────────────────────────────────────
create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid not null references public.accounts(id) on delete cascade,
  target_kind  text not null check (target_kind in ('post','comment','listing')),
  target_id    uuid not null,
  reason       text not null,
  status       text not null default 'pending'
                 check (status in ('pending','actioned','dismissed')),
  created_at   timestamptz not null default now(),
  unique (reporter_id, target_kind, target_id)      -- one report per user per target
);
alter table public.reports enable row level security;
create policy reports_insert_own on public.reports
  for insert with check (reporter_id = auth.uid());
create policy reports_select_own on public.reports
  for select using (reporter_id = auth.uid());
-- resolution: service role via admin gateway only.

-- ── looking-for listings (parent seeks tutor / coach seeks students) ─────────
create table if not exists public.looking_for_listings (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  kind        text not null check (kind in ('seeking_tutor','seeking_students')),
  subjects    text[] not null default '{}',
  grade       text,
  city        text,
  mode        text check (mode in ('online','offline','hybrid')),
  body        text,
  status      text not null default 'open'
                check (status in ('open','closed','flagged','removed')),
  created_at  timestamptz not null default now()
);
create index if not exists lf_browse_idx on public.looking_for_listings(kind, status, created_at desc);

alter table public.looking_for_listings enable row level security;
create policy lf_read on public.looking_for_listings
  for select using (status in ('open','closed') or account_id = auth.uid());
create policy lf_owner_all on public.looking_for_listings
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ── express interest: zero PII revealed pre-accept (spec §3.4) ───────────────
create table if not exists public.listing_interests (
  id           uuid primary key default gen_random_uuid(),
  listing_id   uuid not null references public.looking_for_listings(id) on delete cascade,
  interested_id uuid not null references public.accounts(id) on delete cascade,
  status       text not null default 'pending'
                 check (status in ('pending','accepted','declined')),
  created_at   timestamptz not null default now(),
  unique (listing_id, interested_id)                -- no retry spam
);
alter table public.listing_interests enable row level security;
-- Interested party sees their own interest rows:
create policy li_own_select on public.listing_interests
  for select using (interested_id = auth.uid());
create policy li_own_insert on public.listing_interests
  for insert with check (interested_id = auth.uid());
-- Listing owner sees interests on their listings — but PII stays hidden because
-- this table exposes only account UUIDs; profile reveal happens post-accept in app flow:
create policy li_owner_select on public.listing_interests
  for select using (exists (
    select 1 from public.looking_for_listings l
     where l.id = listing_id and l.account_id = auth.uid()));
create policy li_owner_update on public.listing_interests
  for update using (exists (
    select 1 from public.looking_for_listings l
     where l.id = listing_id and l.account_id = auth.uid()));
