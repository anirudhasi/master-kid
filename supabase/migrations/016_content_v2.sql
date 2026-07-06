-- 016_content_v2.sql — M8 content v2 + Stage-3 amendments (M4-A1, M8-A1)
-- Backward-compatible: new columns default to 'published'/'manual' so existing
-- reads and UI behavior are unchanged until the workflow is adopted.

-- ── publishing workflow columns on every catalog table (M8 spec §2) ──────────
do $$
declare t text;
begin
  foreach t in array array[
    'catalog_subjects','catalog_lessons','catalog_qa','catalog_book_pages',
    'catalog_olympiad_sets','catalog_knowledge_items','catalog_quotes'
  ] loop
    execute format('alter table public.%I
      add column if not exists status text not null default ''published''
        check (status in (''draft'',''review'',''published'',''deprecated'')),
      add column if not exists source text not null default ''manual''
        check (source in (''manual'',''agent'',''import'')),
      add column if not exists version integer not null default 1,
      add column if not exists reviewed_by uuid references public.accounts(id),
      add column if not exists updated_at timestamptz not null default now()', t);
  end loop;
end $$;

-- Read filters: public read policies become published-only; drafts visible to
-- service role (admin gateway / S1) only. Recreate the known read policies.
drop policy if exists knowledge_read on public.catalog_knowledge_items;
create policy knowledge_read on public.catalog_knowledge_items
  for select using (status = 'published');

drop policy if exists catalog_oly_read on public.catalog_olympiad_sets;
create policy catalog_oly_read on public.catalog_olympiad_sets
  for select using (status = 'published');

-- Apply the same pattern to the remaining catalog read policies; policy names in
-- 004 may vary — verify with:  select policyname, tablename from pg_policies
--   where tablename like 'catalog%';
-- and recreate each as: for select using (status = 'published').

-- ── legacy id continuity (M8-A1): keep child progress intact after import ─────
alter table public.catalog_knowledge_items add column if not exists legacy_id text;
create unique index if not exists cki_legacy_uidx
  on public.catalog_knowledge_items(legacy_id) where legacy_id is not null;

alter table public.catalog_olympiad_sets add column if not exists legacy_id text;
create unique index if not exists cos_legacy_uidx
  on public.catalog_olympiad_sets(legacy_id) where legacy_id is not null;

-- ── coach verification (M4 spec §3.1) ────────────────────────────────────────
alter table public.coach_profiles
  add column if not exists verification_status text not null default 'unverified'
    check (verification_status in ('unverified','documents_submitted','verified'));

-- ── handshake reconciliation (M4-A1) ─────────────────────────────────────────
-- The 007 plaintext token column is DEPRECATED. Kept nullable for historical rows;
-- no code writes it after Stage 3 PR-19. M1's handshake_tokens (012) is the only
-- grant mechanism.
comment on column public.enrollments.handshake_token is
  'DEPRECATED (Stage 3, M4-A1): plaintext token superseded by handshake_tokens (012). Never write.';
