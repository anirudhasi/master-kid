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

create policy catalog_subjects_read   on public.catalog_subjects   for select using (true);
create policy catalog_lessons_read    on public.catalog_lessons     for select using (true);
create policy catalog_qa_read         on public.catalog_qa          for select using (true);
create policy catalog_book_pages_read on public.catalog_book_pages  for select using (true);
