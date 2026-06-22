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
create policy coach_profiles_read on public.coach_profiles for select using (true);
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
create policy courses_read on public.courses for select using (true);
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
create policy messages_via_enrollment on public.messages
  for all using (exists (
    select 1 from public.enrollments e where e.id = enrollment_id
      and (e.account_id = auth.uid() or e.coach_id = auth.uid())
  ));
