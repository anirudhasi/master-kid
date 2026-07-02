-- Master-Kids — full schema (IDEMPOTENT: safe to re-run any number of times).
-- Paste into Supabase SQL Editor and Run.

-- ============================================================
-- migrations/001_tenancy.sql
-- ============================================================
-- 001_tenancy.sql — identity + tenancy foundation (Auth increment)
-- Backs the Supabase phone-OTP auth. Every per-account table downstream
-- references accounts(id); RLS isolates each account's data.
--
-- Apply: supabase db push  (or paste into the SQL editor).

-- ── accounts ─────────────────────────────────────────────────────────────────
-- One row per Supabase auth user (one phone = one login). id == auth.uid().
create table if not exists public.accounts (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text unique,
  name        text,
  email       text,
  role        text not null default 'parent' check (role in ('parent','coach','admin')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.accounts enable row level security;

-- A user can see and edit only their own account row.
drop policy if exists accounts_self_select on public.accounts;
create policy accounts_self_select on public.accounts
  for select using (id = auth.uid());
drop policy if exists accounts_self_upsert on public.accounts;
create policy accounts_self_upsert on public.accounts
  for insert with check (id = auth.uid());
drop policy if exists accounts_self_update on public.accounts;
create policy accounts_self_update on public.accounts
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-provision an accounts row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.accounts (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── children ─────────────────────────────────────────────────────────────────
create table if not exists public.children (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.accounts(id) on delete cascade,
  name                text not null,
  dob                 date,
  photo_url           text,
  enrolled_grade      text not null,                 -- 'NUR','LKG','UKG','1'..'12'
  academic_year_start date not null default date_trunc('year', now())::date,
  board               text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists children_account_idx on public.children(account_id);

alter table public.children enable row level security;

-- A parent can manage only their own children. (Coach read access is granted
-- later, scoped to active enrollments — see 007_coach.sql.)
drop policy if exists children_owner_all on public.children;
create policy children_owner_all on public.children
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());


-- ============================================================
-- migrations/002_subscriptions.sql
-- ============================================================
-- 002_subscriptions.sql — per-child subscription + payment ledger (Parent module)
-- One subscription row per child (₹99/mo · ₹999/yr · 1-month free trial).
-- Real settlement is deferred; the app records intent + a test-skip path.

-- ── subscriptions ────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  account_id         uuid not null references public.accounts(id) on delete cascade,
  child_id           uuid not null references public.children(id) on delete cascade,
  plan               text not null check (plan in ('free_trial','monthly','yearly')),
  status             text not null check (status in
                       ('trialing','active','past_due','canceled','expired','skipped_test')),
  amount_inr         integer,                 -- 99 monthly / 999 yearly / 0 trial
  trial_ends_at      timestamptz,
  current_period_end timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists subscriptions_child_idx on public.subscriptions(child_id);

alter table public.subscriptions enable row level security;

-- Parent manages subscriptions for their own children only.
drop policy if exists subscriptions_owner_all on public.subscriptions;
create policy subscriptions_owner_all on public.subscriptions
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ── payments (audit ledger) ──────────────────────────────────────────────────
create table if not exists public.payments (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references public.accounts(id) on delete cascade,
  target_type  text not null check (target_type in ('child_subscription','coach_course')),
  target_id    uuid,                          -- child_id or enrollment_id
  amount_inr   integer not null,
  provider     text,                          -- 'razorpay' | 'upi' | 'test_skip'
  provider_ref text,
  status       text not null check (status in ('created','paid','failed','skipped_test')),
  created_at   timestamptz not null default now()
);

create index if not exists payments_account_idx on public.payments(account_id);

alter table public.payments enable row level security;

drop policy if exists payments_owner_all on public.payments;
create policy payments_owner_all on public.payments
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());


-- ============================================================
-- migrations/003_storyboard.sql
-- ============================================================
-- 003_storyboard.sql — per-child, per-class storyboard (flagship module)
-- One row per achievement / result / certificate / photo / scribble note,
-- tagged to a class tile (grade). Photos carry a postcard "flip-side" note.

create table if not exists public.storyboard_entries (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.accounts(id) on delete cascade,
  child_id      uuid not null references public.children(id) on delete cascade,
  grade         text not null,                 -- class tile key e.g. 'Class 4'
  kind          text not null check (kind in ('achievement','result','certificate','photo','note')),
  title         text,
  body          text,                          -- description / scribble note
  postcard_note text,                          -- flip-side note for a photo
  media_url     text,                          -- Supabase Storage key (photo/cert/result scan)
  occurred_on   date not null default current_date,   -- powers the timeline
  created_at    timestamptz not null default now()
);

create index if not exists storyboard_child_grade_idx
  on public.storyboard_entries(child_id, grade);

alter table public.storyboard_entries enable row level security;

drop policy if exists storyboard_owner_all on public.storyboard_entries;
create policy storyboard_owner_all on public.storyboard_entries
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Enforce the "max 10 photos per (child, grade)" rule at the DB level.
create or replace function public.enforce_photo_cap()
returns trigger language plpgsql as $$
begin
  if new.kind = 'photo' and (
    select count(*) from public.storyboard_entries
    where child_id = new.child_id and grade = new.grade and kind = 'photo'
  ) >= 10 then
    raise exception 'Photo limit reached (max 10 per class)';
  end if;
  return new;
end; $$;

drop trigger if exists storyboard_photo_cap on public.storyboard_entries;
create trigger storyboard_photo_cap
  before insert on public.storyboard_entries
  for each row execute function public.enforce_photo_cap();


-- ============================================================
-- migrations/004_academic_catalog.sql
-- ============================================================
-- 004_academic_catalog.sql — per-child subject selection + shared content catalog
-- (Academic module). Per-child rows are RLS-isolated; catalog_* tables are
-- read-mostly shared content (public read, writes via service role only).

-- ── per-child chosen subjects ────────────────────────────────────────────────
create table if not exists public.child_subjects (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  child_id    uuid not null references public.children(id) on delete cascade,
  grade       text not null,
  subject_key text not null,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  unique (child_id, grade, subject_key)
);

alter table public.child_subjects enable row level security;
drop policy if exists child_subjects_owner_all on public.child_subjects;
create policy child_subjects_owner_all on public.child_subjects
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ── shared content catalog (read-mostly; CDN/Redis cacheable) ─────────────────
create table if not exists public.catalog_subjects (
  subject_key text primary key,
  name        text not null,
  icon        text,
  color       text
);

create table if not exists public.catalog_lessons (
  id           uuid primary key default gen_random_uuid(),
  subject_key  text not null references public.catalog_subjects(subject_key),
  grade        text not null,
  ordinal      integer not null default 0,
  title        text not null,
  summary      text,
  further_study jsonb default '[]'::jsonb     -- [{title, url}]
);

create table if not exists public.catalog_qa (
  id        uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.catalog_lessons(id) on delete cascade,
  ordinal   integer not null default 0,
  question  text not null,
  answer    text not null
);

create table if not exists public.catalog_book_pages (
  id        uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.catalog_lessons(id) on delete cascade,
  page_no   integer not null,
  heading   text,
  body      text,
  image_url text
);

-- Catalog is world-readable to signed-in users; writes go through service role.
alter table public.catalog_subjects   enable row level security;
alter table public.catalog_lessons     enable row level security;
alter table public.catalog_qa          enable row level security;
alter table public.catalog_book_pages  enable row level security;

drop policy if exists catalog_subjects_read on public.catalog_subjects;
create policy catalog_subjects_read   on public.catalog_subjects   for select using (true);
drop policy if exists catalog_lessons_read on public.catalog_lessons;
create policy catalog_lessons_read    on public.catalog_lessons     for select using (true);
drop policy if exists catalog_qa_read on public.catalog_qa;
create policy catalog_qa_read         on public.catalog_qa          for select using (true);
drop policy if exists catalog_book_pages_read on public.catalog_book_pages;
create policy catalog_book_pages_read on public.catalog_book_pages  for select using (true);


-- ============================================================
-- migrations/005_olympiad.sql
-- ============================================================
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
drop policy if exists catalog_oly_read on public.catalog_olympiad_sets;
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
drop policy if exists oly_progress_owner_all on public.olympiad_progress;
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
drop policy if exists user_resources_owner_all on public.user_resources;
create policy user_resources_owner_all on public.user_resources
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
drop policy if exists user_resources_community_read on public.user_resources;
create policy user_resources_community_read on public.user_resources
  for select using (is_shared = true);


-- ============================================================
-- migrations/006_social.sql
-- ============================================================
-- 006_social.sql — community social feed (posts / reactions / comments)
-- Posts are community-visible by default; authors own their rows. External
-- Instagram/Facebook posting is a client share-intent only (no tables).

create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  child_id    uuid references public.children(id) on delete set null,
  source_kind text not null check (source_kind in ('achievement','resource','freeform')),
  source_id   uuid,
  body        text,
  media_url   text,
  visibility  text not null default 'community' check (visibility in ('community','private')),
  created_at  timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts(created_at desc);

create table if not exists public.post_reactions (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  kind       text not null,
  unique (post_id, account_id, kind)
);

create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  body       text not null,
  created_at timestamptz not null default now()
);

alter table public.posts          enable row level security;
alter table public.post_reactions enable row level security;
alter table public.post_comments  enable row level security;

-- Read community content; write/modify only your own rows.
drop policy if exists posts_read on public.posts;
create policy posts_read on public.posts for select using (visibility = 'community' or account_id = auth.uid());
drop policy if exists posts_owner_write on public.posts;
create policy posts_owner_write on public.posts for insert with check (account_id = auth.uid());
drop policy if exists posts_owner_modify on public.posts;
create policy posts_owner_modify on public.posts for update using (account_id = auth.uid());
drop policy if exists posts_owner_delete on public.posts;
create policy posts_owner_delete on public.posts for delete using (account_id = auth.uid());

drop policy if exists reactions_read on public.post_reactions;
create policy reactions_read on public.post_reactions for select using (true);
drop policy if exists reactions_owner_all on public.post_reactions;
create policy reactions_owner_all on public.post_reactions for all using (account_id = auth.uid()) with check (account_id = auth.uid());

drop policy if exists comments_read on public.post_comments;
create policy comments_read on public.post_comments for select using (true);
drop policy if exists comments_owner_all on public.post_comments;
create policy comments_owner_all on public.post_comments for all using (account_id = auth.uid()) with check (account_id = auth.uid());


-- ============================================================
-- migrations/007_coach.sql
-- ============================================================
-- 007_coach.sql — extra-curricular + coach module schema (Modules 8 & 9)
-- Custom curricula and the parent↔coach handshake (enrollments), plus the coach
-- course/milestone/messaging tables used by the Coach module.

-- ── parent/coach custom curriculum + target ──────────────────────────────────
create table if not exists public.custom_curricula (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  child_id    uuid not null references public.children(id) on delete cascade,
  set_by      text not null check (set_by in ('parent','coach')),
  title       text not null,
  syllabus_md text,
  target_date date,
  created_at  timestamptz not null default now()
);
alter table public.custom_curricula enable row level security;
drop policy if exists curricula_owner_all on public.custom_curricula;
create policy curricula_owner_all on public.custom_curricula
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ── coach profile + courses + milestones ─────────────────────────────────────
create table if not exists public.coach_profiles (
  account_id     uuid primary key references public.accounts(id) on delete cascade,
  display_name   text,
  bio            text,
  disciplines    text[],
  experience_yrs integer,
  rating         numeric(3,2),
  is_top         boolean not null default false
);
alter table public.coach_profiles enable row level security;
drop policy if exists coach_profiles_read on public.coach_profiles;
create policy coach_profiles_read on public.coach_profiles for select using (true);
drop policy if exists coach_profiles_owner_write on public.coach_profiles;
create policy coach_profiles_owner_write on public.coach_profiles
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  coach_id    uuid not null references public.accounts(id) on delete cascade,
  title       text not null,
  discipline  text,
  description text,
  price_inr   integer,
  created_at  timestamptz not null default now()
);
alter table public.courses enable row level security;
drop policy if exists courses_read on public.courses;
create policy courses_read on public.courses for select using (true);
drop policy if exists courses_owner_write on public.courses;
create policy courses_owner_write on public.courses
  for all using (coach_id = auth.uid()) with check (coach_id = auth.uid());

create table if not exists public.course_milestones (
  id                     uuid primary key default gen_random_uuid(),
  course_id              uuid not null references public.courses(id) on delete cascade,
  cadence                text check (cadence in ('day','week','month')),
  ordinal                integer not null default 0,
  title                  text not null,
  deliverable            text,
  parent_visible_outcome text,
  target_date            date
);
alter table public.course_milestones enable row level security;
drop policy if exists milestones_read on public.course_milestones;
create policy milestones_read on public.course_milestones for select using (true);

-- ── enrollments (the handshake) + progress + messaging ───────────────────────
create table if not exists public.enrollments (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid references public.courses(id) on delete set null,
  child_id        uuid not null references public.children(id) on delete cascade,
  account_id      uuid not null references public.accounts(id) on delete cascade,  -- child's parent
  coach_id        uuid references public.accounts(id) on delete set null,
  handshake_token text,
  status          text not null default 'pending' check (status in ('pending','active','revoked')),
  created_at      timestamptz not null default now()
);
alter table public.enrollments enable row level security;
-- Both the parent (account_id) and the coach can see/manage an enrollment.
drop policy if exists enrollments_party_all on public.enrollments;
create policy enrollments_party_all on public.enrollments
  for all using (account_id = auth.uid() or coach_id = auth.uid())
  with check (account_id = auth.uid() or coach_id = auth.uid());

create table if not exists public.milestone_progress (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  milestone_id  uuid references public.course_milestones(id) on delete cascade,
  status        text not null default 'pending' check (status in ('pending','done')),
  achieved_on   date,
  coach_note    text
);
alter table public.milestone_progress enable row level security;
drop policy if exists mprogress_via_enrollment on public.milestone_progress;
create policy mprogress_via_enrollment on public.milestone_progress
  for all using (exists (
    select 1 from public.enrollments e where e.id = enrollment_id
      and (e.account_id = auth.uid() or e.coach_id = auth.uid())
  ));

create table if not exists public.messages (
  id            uuid primary key default gen_random_uuid(),
  enrollment_id uuid not null references public.enrollments(id) on delete cascade,
  sender_id     uuid not null references public.accounts(id) on delete cascade,
  kind          text not null default 'note' check (kind in ('note','progress','complaint','system')),
  body          text not null,
  created_at    timestamptz not null default now()
);
alter table public.messages enable row level security;
drop policy if exists messages_via_enrollment on public.messages;
create policy messages_via_enrollment on public.messages
  for all using (exists (
    select 1 from public.enrollments e where e.id = enrollment_id
      and (e.account_id = auth.uid() or e.coach_id = auth.uid())
  ));


-- ============================================================
-- migrations/008_knowledge_engagement.sql
-- ============================================================
-- 008_knowledge_engagement.sql — knowledge catalog + per-child progress, plus the
-- engagement layer (daily feed + quotes) used by the Daily/Weekend module.
-- Catalog/quotes are shared read-mostly content; progress/feed are per-child.

create table if not exists public.catalog_knowledge_items (
  id           uuid primary key default gen_random_uuid(),
  type         text not null check (type in
                 ('quiz','riddle','word_power','idiom','proverb','capital','tongue_twister','sudoku','puzzle')),
  level        text not null check (level in ('beginner','intermediate','advanced')),
  max_grade    text not null,             -- show at/below this class
  interest_tag text,                       -- 'maths','science','arts','commerce'
  payload      jsonb not null
);
alter table public.catalog_knowledge_items enable row level security;
drop policy if exists knowledge_read on public.catalog_knowledge_items;
create policy knowledge_read on public.catalog_knowledge_items for select using (true);

create table if not exists public.knowledge_progress (
  id         uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  child_id   uuid not null references public.children(id) on delete cascade,
  item_id    text not null,
  status     text not null default 'done',
  score      integer,
  updated_at timestamptz not null default now(),
  unique (child_id, item_id)
);
alter table public.knowledge_progress enable row level security;
drop policy if exists knowledge_progress_owner_all on public.knowledge_progress;
create policy knowledge_progress_owner_all on public.knowledge_progress
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- ── engagement: quote of the day + per-child daily feed (Module 12) ───────────
create table if not exists public.catalog_quotes (
  id       uuid primary key default gen_random_uuid(),
  text     text not null,
  author   text,
  audience text not null default 'parent'
);
alter table public.catalog_quotes enable row level security;
drop policy if exists quotes_read on public.catalog_quotes;
create policy quotes_read on public.catalog_quotes for select using (true);

create table if not exists public.daily_feed (
  id        uuid primary key default gen_random_uuid(),
  child_id  uuid not null references public.children(id) on delete cascade,
  for_date  date not null,
  payload   jsonb not null,
  unique (child_id, for_date)
);
alter table public.daily_feed enable row level security;
drop policy if exists daily_feed_owner_via_child on public.daily_feed;
create policy daily_feed_owner_via_child on public.daily_feed
  for all using (exists (select 1 from public.children c where c.id = child_id and c.account_id = auth.uid()));


-- ============================================================
-- migrations/009_admin_audit.sql
-- ============================================================
-- 009_admin_audit.sql — admin audit log
-- Admin acts through SWA Functions using the Supabase service-role key (bypasses
-- RLS); see docs/ARCHITECTURE.md §4. Enable/disable is modelled as children.is_active
-- and an account-level suspended flag; this table records who did what.

alter table public.accounts add column if not exists is_suspended boolean not null default false;

create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.accounts(id),
  action      text not null,
  target_type text,
  target_id   text,
  created_at  timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
-- No client policies: only the service role (admin Functions) reads/writes this.



-- ============================================================
-- migrations/010_children_sync.sql
-- ============================================================
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

-- ============================================================
-- migrations/011_wallet.sql
-- ============================================================
-- 011_wallet.sql — worksheet wallet (₹100 welcome credit, ₹1 per download)
--
-- Every account gets a wallet seeded with 100 credits. Opening a library
-- worksheet costs 1 credit the first time; owned sheets re-open free.
-- MVP note: balance is maintained by the client and mirrored here (payments
-- are simulated platform-wide); move debits into an SWA Function when real
-- money is involved.
--
-- Apply: supabase db push  (or paste into the SQL editor).

create table if not exists public.wallets (
  id          uuid primary key references public.accounts(id) on delete cascade,
  balance     integer not null default 100,
  updated_at  timestamptz not null default now()
);

create table if not exists public.wallet_transactions (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  amount      integer not null,      -- negative = spend (worksheet), positive = top-up
  reason      text,
  created_at  timestamptz not null default now()
);

create index if not exists wallet_tx_account_idx on public.wallet_transactions(account_id, created_at desc);

alter table public.wallets enable row level security;
alter table public.wallet_transactions enable row level security;

create policy wallets_self_all on public.wallets
  for all using (id = auth.uid()) with check (id = auth.uid());
create policy wallet_tx_self_insert on public.wallet_transactions
  for insert with check (account_id = auth.uid());
create policy wallet_tx_self_select on public.wallet_transactions
  for select using (account_id = auth.uid());
