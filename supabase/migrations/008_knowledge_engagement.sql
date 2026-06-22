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
create policy quotes_read on public.catalog_quotes for select using (true);

create table if not exists public.daily_feed (
  id        uuid primary key default gen_random_uuid(),
  child_id  uuid not null references public.children(id) on delete cascade,
  for_date  date not null,
  payload   jsonb not null,
  unique (child_id, for_date)
);
alter table public.daily_feed enable row level security;
create policy daily_feed_owner_via_child on public.daily_feed
  for all using (exists (select 1 from public.children c where c.id = child_id and c.account_id = auth.uid()));
