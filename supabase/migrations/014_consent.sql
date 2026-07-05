-- 014_consent.sql — DPDP consent records (M2 spec §2)
-- Demonstrable, revocable, per-purpose consent. History preserved: revoking inserts
-- a new row rather than deleting — the trail is the compliance artifact.

create table if not exists public.consents (
  id          uuid primary key default gen_random_uuid(),
  account_id  uuid not null references public.accounts(id) on delete cascade,
  child_id    uuid not null references public.children(id) on delete cascade,
  kind        text not null check (kind in
                ('data_processing','community_visibility','coach_sharing','school_sharing')),
  granted     boolean not null,
  created_at  timestamptz not null default now()
);

create index if not exists consents_child_idx on public.consents(child_id, kind, created_at desc);

alter table public.consents enable row level security;

-- Parent manages consents for their own children only; append-only from the client.
create policy consents_owner_select on public.consents
  for select using (account_id = auth.uid());
create policy consents_owner_insert on public.consents
  for insert with check (
    account_id = auth.uid()
    and exists (select 1 from public.children c
                 where c.id = child_id and c.account_id = auth.uid())
  );
-- no update/delete policies: history is immutable.

-- Current-state view: latest row per (child, kind).
create or replace view public.consents_current
with (security_invoker = true) as
  select distinct on (child_id, kind)
         child_id, kind, granted, created_at as decided_at
    from public.consents
   order by child_id, kind, created_at desc;
