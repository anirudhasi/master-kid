-- 017_discovery.sql — M6 Discovery: listings projection + Postgres FTS (spec §2–§3)
-- The listings table is a READ MODEL: rebuilt from owner modules, never hand-edited.

create table if not exists public.listings (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null check (kind in ('coach','school','content')),
  ref_id         uuid not null,                 -- coach account_id / school org / content id
  title          text not null,
  summary        text,
  subjects       text[] not null default '{}',
  grades         text[] not null default '{}',
  city           text,
  mode           text check (mode in ('online','offline','hybrid')),
  price_band     text check (price_band in ('free','budget','standard','premium')),
  verified       boolean not null default false,
  activity_score integer not null default 0,
  rating         numeric(3,2),
  search         tsvector generated always as (
                   setweight(to_tsvector('simple', coalesce(title,   '')), 'A') ||
                   setweight(to_tsvector('simple', coalesce(summary, '')), 'B') ||
                   setweight(to_tsvector('simple', coalesce(city,    '')), 'C') ||
                   setweight(to_tsvector('simple', array_to_string(subjects, ' ')), 'A')
                 ) stored,
  updated_at     timestamptz not null default now(),
  unique (kind, ref_id)
);
create index if not exists listings_search_idx on public.listings using gin(search);
create index if not exists listings_filter_idx on public.listings(kind, city, mode);

alter table public.listings enable row level security;
create policy listings_read on public.listings for select using (true);
-- writes: service role / projection builders only.

-- ── anonymized demand signal (S1 feed; NO account ids by design) ─────────────
create table if not exists public.discovery_queries (
  id         uuid primary key default gen_random_uuid(),
  query_text text,
  filters    jsonb not null default '{}',
  result_ct  integer,
  created_at timestamptz not null default now()
);
alter table public.discovery_queries enable row level security;
create policy dq_insert_any on public.discovery_queries
  for insert with check (true);          -- anonymous append-only; no select for clients
-- reads: service role only (S1 / admin analytics).

-- ── search RPC: FTS + filters + transparent ranking (weights match ranking.ts) ─
create or replace function public.search_listings(
  p_text text default null, p_kind text default null, p_subject text default null,
  p_grade text default null, p_city text default null, p_mode text default null,
  p_price text default null, p_limit int default 20, p_offset int default 0)
returns setof public.listings language sql stable as $$
  select l.* from public.listings l
  where (p_kind    is null or l.kind = p_kind)
    and (p_subject is null or p_subject = any(l.subjects))
    and (p_grade   is null or p_grade   = any(l.grades))
    and (p_city    is null or l.city ilike p_city)
    and (p_mode    is null or l.mode = p_mode)
    and (p_price   is null or l.price_band = p_price)
    and (p_text    is null or l.search @@ plainto_tsquery('simple', p_text))
  order by
    (case when p_text is null then 0
          else ts_rank(l.search, plainto_tsquery('simple', p_text)) end) * 4
    + (case when l.verified then 1.5 else 0 end)
    + least(l.activity_score, 50) / 50.0
    + coalesce(l.rating, 0) / 5.0
    desc, l.updated_at desc
  limit p_limit offset p_offset;
$$;

-- ── full rebuild (nightly reconcile; projection must be reproducible) ─────────
create or replace function public.rebuild_listings()
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  -- coaches
  insert into listings (kind, ref_id, title, summary, subjects, verified, activity_score, rating, updated_at)
  select 'coach', cp.account_id,
         coalesce(cp.display_name, a.name, 'Coach'),
         cp.bio,
         coalesce(cp.disciplines, '{}'),
         cp.verification_status = 'verified',
         coalesce((select count(*) from enrollments e
                    where e.coach_id = cp.account_id and e.status = 'active'), 0) * 10,
         cp.rating, now()
    from coach_profiles cp
    join accounts a on a.id = cp.account_id and a.status = 'active'
  on conflict (kind, ref_id) do update set
    title = excluded.title, summary = excluded.summary, subjects = excluded.subjects,
    verified = excluded.verified, activity_score = excluded.activity_score,
    rating = excluded.rating, updated_at = now();

  -- remove listings whose source is gone/disabled
  delete from listings l
   where l.kind = 'coach'
     and not exists (select 1 from coach_profiles cp
                      join accounts a on a.id = cp.account_id and a.status = 'active'
                     where cp.account_id = l.ref_id);

  get diagnostics n = row_count;
  return n;
end $$;

revoke all on function public.rebuild_listings() from public;
-- executed by service role (scheduled job) only.
