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
create policy posts_read on public.posts for select using (visibility = 'community' or account_id = auth.uid());
create policy posts_owner_write on public.posts for insert with check (account_id = auth.uid());
create policy posts_owner_modify on public.posts for update using (account_id = auth.uid());
create policy posts_owner_delete on public.posts for delete using (account_id = auth.uid());

create policy reactions_read on public.post_reactions for select using (true);
create policy reactions_owner_all on public.post_reactions for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create policy comments_read on public.post_comments for select using (true);
create policy comments_owner_all on public.post_comments for all using (account_id = auth.uid()) with check (account_id = auth.uid());
