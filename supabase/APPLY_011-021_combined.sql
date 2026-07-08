-- ============================================================================
-- Master-Kids — Catch-up migration bundle: 011 → 021
-- ============================================================================
-- Diagnostic (DIAGNOSE_state.sql) showed 001-010 already applied; migration
-- 011 (wallet) was NEVER applied to this project. This bundle fills that gap
-- (011) and then applies 012-021, all in ONE transaction: any failure rolls
-- everything back, nothing is half-applied.
--
-- BEFORE RUNNING: take a backup (Supabase Dashboard -> Database -> Backups).
--
-- NOTE (Supabase): pgcrypto lives in the `extensions` schema; functions using
-- crypt()/gen_salt()/digest() set search_path = public, extensions.
-- NOTE (017): the listings FTS column uses an IMMUTABLE wrapper function
-- (public.listings_search_tsv) because Postgres rejects an inlined to_tsvector
-- in a generated column ("generation expression is not immutable").
--
-- What this adds:
--   011 wallet (wallets + wallet_transactions + RLS)  <-- the missing piece
--   012 identity v2   013 notifications   014 consent   015 commerce v2
--   016 content v2    017 discovery       018 community moderation
--   019 school        020 admin           021 support
-- ============================================================================

begin;


-- ####################################################################
-- ##  011_wallet.sql
-- ####################################################################

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


-- ####################################################################
-- ##  012_identity_v2.sql
-- ####################################################################

-- 012_identity_v2.sql — Identity v2 (M1 spec §2, §4)
-- Backward-compatible: existing rows keep working; old code reading `role` unaffected.

-- ── accounts: expand roles, add multi-role + status ─────────────────────────
alter table public.accounts drop constraint if exists accounts_role_check;
alter table public.accounts add constraint accounts_role_check
  check (role in ('parent','coach','school','admin'));

alter table public.accounts
  add column if not exists roles  text[] not null default array['parent'],
  add column if not exists status text   not null default 'active'
    check (status in ('active','disabled'));

update public.accounts set roles = array[role] where roles = array['parent'] and role <> 'parent';

-- Admin provisioning is service-role ONLY. Example (run in SQL editor, never in app):
--   update public.accounts set role='admin', roles=array_append(roles,'admin')
--   where phone='<admin-phone-10>';

-- ── handshake tokens (parent grants coach/school access to a child) ─────────
create table if not exists public.handshake_tokens (
  id           uuid primary key default gen_random_uuid(),
  child_id     uuid not null references public.children(id) on delete cascade,
  granted_by   uuid not null references public.accounts(id) on delete cascade,
  grantee_role text not null default 'coach' check (grantee_role in ('coach','school')),
  token_hash   text not null unique,           -- sha256 of the 8-char code; plaintext never stored
  expires_at   timestamptz not null default now() + interval '72 hours',
  redeemed_by  uuid references public.accounts(id),
  redeemed_at  timestamptz,
  revoked_at   timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists handshake_child_idx on public.handshake_tokens(child_id);

alter table public.handshake_tokens enable row level security;

-- Granting parent manages their own tokens.
create policy handshake_owner_all on public.handshake_tokens
  for all using (granted_by = auth.uid()) with check (granted_by = auth.uid());

-- Redemption happens via SECURITY DEFINER RPC (below), not direct table access,
-- so no select policy for grantees is needed.

create or replace function public.redeem_handshake(p_token_hash text)
returns table (ok boolean, child_id uuid) language plpgsql security definer
set search_path = public as $$
declare t record;
begin
  select * into t from handshake_tokens
   where token_hash = p_token_hash
     and redeemed_at is null and revoked_at is null and expires_at > now()
   for update;
  if not found then return query select false, null::uuid; return; end if;
  update handshake_tokens
     set redeemed_by = auth.uid(), redeemed_at = now()
   where id = t.id;
  return query select true, t.child_id;
end $$;

revoke all on function public.redeem_handshake(text) from public;
grant execute on function public.redeem_handshake(text) to authenticated;

-- ── child-mode PIN (parent-set exit lock) ───────────────────────────────────
create table if not exists public.child_mode_pins (
  account_id  uuid primary key references public.accounts(id) on delete cascade,
  pin_hash    text not null,                    -- bcrypt/scrypt done in RPC below
  updated_at  timestamptz not null default now()
);
alter table public.child_mode_pins enable row level security;
create policy pin_owner_all on public.child_mode_pins
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Hashing server-side via pgcrypto (bcrypt), so the client never handles hashes.
-- On Supabase pgcrypto lives in the `extensions` schema, so crypt()/gen_salt()
-- below need it on the search_path (public alone can't resolve them).
create extension if not exists pgcrypto with schema extensions;

create or replace function public.set_child_pin(p_pin text)
returns void language sql security definer set search_path = public, extensions as $$
  insert into child_mode_pins(account_id, pin_hash)
  values (auth.uid(), crypt(p_pin, gen_salt('bf')))
  on conflict (account_id) do update
    set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now();
$$;

create or replace function public.verify_child_pin(p_pin text)
returns boolean language sql security definer stable set search_path = public, extensions as $$
  select coalesce(
    (select pin_hash = crypt(p_pin, pin_hash) from child_mode_pins
      where account_id = auth.uid()), false);
$$;

revoke all on function public.set_child_pin(text) from public;
revoke all on function public.verify_child_pin(text) from public;
grant execute on function public.set_child_pin(text) to authenticated;
grant execute on function public.verify_child_pin(text) to authenticated;


-- ####################################################################
-- ##  013_notifications.sql
-- ####################################################################

-- 013_notifications.sql — M12 Notifications core

create table if not exists public.notification_prefs (
  account_id  uuid not null references public.accounts(id) on delete cascade,
  category    text not null check (category in ('transactional','progress','engagement','marketing')),
  channel     text not null check (channel in ('inapp','push','email','whatsapp')),
  enabled     boolean not null default true,
  quiet_start smallint,        -- local hour 0-23, null = no quiet hours
  quiet_end   smallint,
  updated_at  timestamptz not null default now(),
  primary key (account_id, category, channel)
);

-- transactional cannot be disabled — enforce at write time
create or replace function public.guard_transactional_prefs()
returns trigger language plpgsql as $$
begin
  if new.category = 'transactional' and new.enabled = false then
    raise exception 'transactional notifications cannot be disabled';
  end if;
  return new;
end $$;
drop trigger if exists trg_guard_transactional on public.notification_prefs;
create trigger trg_guard_transactional
  before insert or update on public.notification_prefs
  for each row execute function public.guard_transactional_prefs();

alter table public.notification_prefs enable row level security;
create policy prefs_owner_all on public.notification_prefs
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

create table if not exists public.notification_log (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references public.accounts(id) on delete cascade,
  category     text not null,
  channel      text not null,
  template_key text not null,
  payload      jsonb not null default '{}',
  status       text not null default 'sent' check (status in ('sent','failed','suppressed')),
  read_at      timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists notif_log_inbox_idx
  on public.notification_log(account_id, created_at desc);

alter table public.notification_log enable row level security;
-- Users read their own inbox and can mark read; only server writes rows.
create policy notif_log_owner_select on public.notification_log
  for select using (account_id = auth.uid());
create policy notif_log_owner_read on public.notification_log
  for update using (account_id = auth.uid()) with check (account_id = auth.uid());
-- (insert happens via service role in /api/notify or an in-app SECURITY DEFINER RPC)

create or replace function public.log_notification(
  p_category text, p_channel text, p_template text, p_payload jsonb, p_status text)
returns uuid language sql security definer set search_path = public as $$
  insert into notification_log(account_id, category, channel, template_key, payload, status)
  values (auth.uid(), p_category, p_channel, p_template, coalesce(p_payload,'{}'), p_status)
  returning id;
$$;
revoke all on function public.log_notification(text,text,text,jsonb,text) from public;
grant execute on function public.log_notification(text,text,text,jsonb,text) to authenticated;


-- ####################################################################
-- ##  014_consent.sql
-- ####################################################################

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


-- ####################################################################
-- ##  015_commerce_v2.sql
-- ####################################################################

-- 015_commerce_v2.sql — M9 Commerce v2 (dev-spec amendments M9-A1, M9-A2)
-- 1) plans move from code to DB   2) invoices (GST-ready numbering)
-- 3) SECURITY: wallet ledger becomes server-authoritative; self-credit hole closed
-- 4) webhook idempotency

-- ── plans (admin-editable; per-child pricing model per 002) ──────────────────
create table if not exists public.plans (
  id          text primary key,               -- 'free_trial' | 'monthly' | 'yearly' (+ future)
  name        text not null,
  amount_inr  integer not null,
  period      text not null check (period in ('month','year','trial')),
  features    jsonb not null default '{}',    -- { "olympiad_pro": true, ... }
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

insert into public.plans (id, name, amount_inr, period, features) values
  ('free_trial', 'Free trial',   0, 'trial', '{"core":true}'),
  ('monthly',    'Monthly',     99, 'month', '{"core":true,"olympiad_pro":true}'),
  ('yearly',     'Yearly',     999, 'year',  '{"core":true,"olympiad_pro":true,"weekly_report":true}')
on conflict (id) do nothing;

alter table public.plans enable row level security;
create policy plans_read_all on public.plans for select using (true);
-- writes: service role only (M10 admin gateway).

-- link subscriptions to plans (keeps old text column valid — plan ids match)
alter table public.subscriptions
  add constraint subscriptions_plan_fkey
  foreign key (plan) references public.plans(id) not valid;
alter table public.subscriptions validate constraint subscriptions_plan_fkey;

-- ── webhook idempotency ──────────────────────────────────────────────────────
alter table public.payments add column if not exists gateway_event_id text;
create unique index if not exists payments_gateway_event_uidx
  on public.payments(gateway_event_id) where gateway_event_id is not null;

-- ── invoices (GST-ready sequential numbering per FY) ─────────────────────────
create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  number      text not null unique,           -- MK/2026-27/000001
  account_id  uuid not null references public.accounts(id),
  payment_id  uuid not null references public.payments(id),
  amount_inr  integer not null,
  gst_inr     integer not null default 0,
  created_at  timestamptz not null default now()
);
create sequence if not exists invoice_seq;

create or replace function public.next_invoice_number()
returns text language sql security definer set search_path = public as $$
  select 'MK/' ||
    case when extract(month from now()) >= 4
         then extract(year from now())::int || '-' || right((extract(year from now())::int + 1)::text, 2)
         else (extract(year from now())::int - 1) || '-' || right(extract(year from now())::int::text, 2)
    end || '/' || lpad(nextval('invoice_seq')::text, 6, '0');
$$;

alter table public.invoices enable row level security;
create policy invoices_owner_select on public.invoices
  for select using (account_id = auth.uid());
-- writes: service role only (payments webhook).

-- ── WALLET HARDENING (closes self-credit hole; M9-A2) ────────────────────────
-- Remove client write paths.
drop policy if exists wallet_tx_self_insert on public.wallet_transactions;
drop policy if exists wallets_self_all on public.wallets;
create policy wallets_self_select on public.wallets
  for select using (id = auth.uid());
-- wallet_tx_self_select (read own ledger) from 011 remains.

-- Balance becomes trigger-maintained from the ledger (derived, never trusted).
create or replace function public.apply_wallet_tx()
returns trigger language plpgsql security definer set search_path = public as $$
declare new_balance integer;
begin
  insert into wallets (id, balance) values (new.account_id, 0)
    on conflict (id) do nothing;
  update wallets set balance = balance + new.amount, updated_at = now()
   where id = new.account_id
   returning balance into new_balance;
  if new_balance < 0 then
    raise exception 'insufficient wallet balance';
  end if;
  return new;
end $$;

drop trigger if exists trg_apply_wallet_tx on public.wallet_transactions;
create trigger trg_apply_wallet_tx
  before insert on public.wallet_transactions
  for each row execute function public.apply_wallet_tx();

-- Client-callable SPEND only (server credits via service role: refunds, promos).
create or replace function public.wallet_spend(p_amount integer, p_reason text)
returns integer language plpgsql security definer set search_path = public as $$
declare bal integer;
begin
  if p_amount is null or p_amount <= 0 then raise exception 'amount must be positive'; end if;
  insert into wallet_transactions (account_id, amount, reason)
  values (auth.uid(), -p_amount, coalesce(p_reason,'spend'));
  select balance into bal from wallets where id = auth.uid();
  return bal;
end $$;

revoke all on function public.wallet_spend(integer, text) from public;
grant execute on function public.wallet_spend(integer, text) to authenticated;

-- One-time reconciliation report: stored vs derived balances (run manually, review
-- before trusting; do NOT auto-overwrite).
--   select w.id, w.balance as stored,
--          coalesce(sum(t.amount),0) + 100 as derived_with_signup_bonus
--     from wallets w left join wallet_transactions t on t.account_id = w.id
--    group by w.id, w.balance
--   having w.balance <> coalesce(sum(t.amount),0) + 100;


-- ####################################################################
-- ##  016_content_v2.sql
-- ####################################################################

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


-- ####################################################################
-- ##  017_discovery.sql
-- ####################################################################

-- 017_discovery.sql — M6 Discovery: listings projection + Postgres FTS (spec §2–§3)
-- The listings table is a READ MODEL: rebuilt from owner modules, never hand-edited.

-- Immutable wrapper for the generated tsvector column. The two-arg
-- to_tsvector('simple', ...) IS immutable, but Postgres won't accept it inlined
-- in a generated column ("generation expression is not immutable"); wrapping it
-- in an IMMUTABLE function is the canonical workaround.
create or replace function public.listings_search_tsv(
  p_title text, p_summary text, p_city text, p_subjects text[])
returns tsvector language sql immutable as $$
  select setweight(to_tsvector('simple', coalesce(p_title,   '')), 'A') ||
         setweight(to_tsvector('simple', coalesce(p_summary, '')), 'B') ||
         setweight(to_tsvector('simple', coalesce(p_city,    '')), 'C') ||
         setweight(to_tsvector('simple', array_to_string(p_subjects, ' ')), 'A');
$$;

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
                   public.listings_search_tsv(title, summary, city, subjects)
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


-- ####################################################################
-- ##  018_community_v2.sql
-- ####################################################################

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


-- ####################################################################
-- ##  019_school.sql
-- ####################################################################

-- 019_school.sql — M5 School (spec + dev-spec decisions M5-D1, M5-D2)
-- Privacy invariant: school staff have NO read access to public.children.
-- Rosters carry a display-name snapshot instead (M5-D1).

-- ── organizations ─────────────────────────────────────────────────────────────
create table if not exists public.school_orgs (
  id                  uuid primary key default gen_random_uuid(),
  owner_account_id    uuid not null references public.accounts(id) on delete cascade,
  name                text not null,
  board               text,
  city                text,
  verification_status text not null default 'unverified'
                        check (verification_status in ('unverified','documents_submitted','verified')),
  created_at          timestamptz not null default now()
);

create table if not exists public.school_staff (
  org_id     uuid not null references public.school_orgs(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  staff_role text not null check (staff_role in ('admin','teacher')),
  subjects   text[] not null default '{}',
  created_at timestamptz not null default now(),
  primary key (org_id, account_id)
);

-- helper: is caller staff (optionally admin) of org?
create or replace function public.is_school_staff(p_org uuid, p_admin_only boolean default false)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from school_staff s
     where s.org_id = p_org and s.account_id = auth.uid()
       and (not p_admin_only or s.staff_role = 'admin'))
  or exists (select 1 from school_orgs o where o.id = p_org and o.owner_account_id = auth.uid());
$$;

alter table public.school_orgs enable row level security;
create policy orgs_owner_all on public.school_orgs
  for all using (owner_account_id = auth.uid()) with check (owner_account_id = auth.uid());
create policy orgs_staff_read on public.school_orgs
  for select using (public.is_school_staff(id));

alter table public.school_staff enable row level security;
create policy staff_admin_manage on public.school_staff
  for all using (public.is_school_staff(org_id, true))
  with check (public.is_school_staff(org_id, true));
create policy staff_self_read on public.school_staff
  for select using (account_id = auth.uid());

-- ── classes (timetable jsonb matches the app's existing Timetable shape) ─────
create table if not exists public.school_classes (
  id               uuid primary key default gen_random_uuid(),
  org_id           uuid not null references public.school_orgs(id) on delete cascade,
  grade            text not null,
  section          text not null default 'A',
  class_teacher_id uuid references public.accounts(id),
  join_code        text unique,                 -- rotating 6-char; null = joining paused
  timetable        jsonb,                       -- { periods:[], days:[], grid:{} }
  timetable_published_at timestamptz,
  created_at       timestamptz not null default now(),
  unique (org_id, grade, section)
);

alter table public.school_classes enable row level security;
create policy classes_org_admin_all on public.school_classes
  for all using (public.is_school_staff(org_id, true))
  with check (public.is_school_staff(org_id, true));
create policy classes_teacher_read on public.school_classes
  for select using (public.is_school_staff(org_id));
create policy classes_teacher_update_own on public.school_classes
  for update using (class_teacher_id = auth.uid());

-- ── rosters (consent-critical; M5-D2) ────────────────────────────────────────
-- NO insert policy for school roles on ACTIVE rows: activation happens only via
-- parent-driven RPCs below. child_name is a display snapshot (M5-D1).
create table if not exists public.school_rosters (
  id          uuid primary key default gen_random_uuid(),
  class_id    uuid not null references public.school_classes(id) on delete cascade,
  child_id    uuid not null references public.children(id) on delete cascade,
  account_id  uuid not null references public.accounts(id) on delete cascade, -- parent
  child_name  text not null,
  status      text not null default 'active' check (status in ('active','left')),
  joined_at   timestamptz not null default now(),
  left_at     timestamptz,
  unique (class_id, child_id)
);

alter table public.school_rosters enable row level security;
create policy roster_parent_all on public.school_rosters
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy roster_staff_read on public.school_rosters
  for select using (exists (
    select 1 from school_classes c
     where c.id = class_id and public.is_school_staff(c.org_id)));

-- parent-initiated join by class code (consent inherent)
create or replace function public.redeem_class_code(p_code text, p_child_id uuid)
returns table (ok boolean, class_id uuid) language plpgsql security definer
set search_path = public as $$
declare c record; child_rec record; seat_cap integer; seats integer;
begin
  select cl.*, o.verification_status into c
    from school_classes cl join school_orgs o on o.id = cl.org_id
   where cl.join_code = upper(p_code);
  if not found then return query select false, null::uuid; return; end if;

  select * into child_rec from children
   where id = p_child_id and account_id = auth.uid() and is_active;
  if not found then return query select false, null::uuid; return; end if;

  -- pilot cap for unverified orgs (dev-spec PR-25); paid seats checked app-side via M9
  if c.verification_status <> 'verified' then
    select count(*) into seats from school_rosters r
      join school_classes cl on cl.id = r.class_id
     where cl.org_id = c.org_id and r.status = 'active';
    if seats >= 5 then raise exception 'pilot roster cap reached — org verification required'; end if;
  end if;

  insert into school_rosters (class_id, child_id, account_id, child_name)
  values (c.id, p_child_id, auth.uid(), child_rec.name)
  on conflict (class_id, child_id) do update
    set status = 'active', left_at = null, child_name = child_rec.name;
  return query select true, c.id;
end $$;
revoke all on function public.redeem_class_code(text, uuid) from public;
grant execute on function public.redeem_class_code(text, uuid) to authenticated;

-- school-initiated invite (secondary flow; anti-enumeration: phone stored hashed,
-- identical response whether or not the phone maps to an account)
create table if not exists public.roster_invites (
  id         uuid primary key default gen_random_uuid(),
  class_id   uuid not null references public.school_classes(id) on delete cascade,
  phone_hash text not null,                    -- sha256(normalized phone)
  status     text not null default 'pending'
               check (status in ('pending','approved','declined','expired')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '14 days',
  unique (class_id, phone_hash)
);
alter table public.roster_invites enable row level security;
create policy invites_staff_manage on public.roster_invites
  for all using (exists (select 1 from school_classes c
                          where c.id = class_id and public.is_school_staff(c.org_id)))
  with check (exists (select 1 from school_classes c
                       where c.id = class_id and public.is_school_staff(c.org_id)));
-- Parent-side listing/approval goes through a SECURITY DEFINER RPC that matches
-- the caller's own phone hash (parents never query this table directly):
create or replace function public.my_roster_invites()
returns setof public.roster_invites language sql stable security definer
set search_path = public, extensions as $$
  select ri.* from roster_invites ri
   where ri.status = 'pending' and ri.expires_at > now()
     and ri.phone_hash = encode(digest(
           (select phone from accounts where id = auth.uid()), 'sha256'), 'hex');
$$;
create or replace function public.resolve_roster_invite(p_invite uuid, p_child_id uuid, p_approve boolean)
returns boolean language plpgsql security definer set search_path = public, extensions as $$
declare inv record; child_rec record;
begin
  select * into inv from roster_invites
   where id = p_invite and status = 'pending' and expires_at > now()
     and phone_hash = encode(digest(
           (select phone from accounts where id = auth.uid()), 'sha256'), 'hex');
  if not found then return false; end if;
  if not p_approve then
    update roster_invites set status = 'declined' where id = inv.id; return true;
  end if;
  select * into child_rec from children
   where id = p_child_id and account_id = auth.uid() and is_active;
  if not found then return false; end if;
  insert into school_rosters (class_id, child_id, account_id, child_name)
  values (inv.class_id, p_child_id, auth.uid(), child_rec.name)
  on conflict (class_id, child_id) do update set status = 'active', left_at = null;
  update roster_invites set status = 'approved' where id = inv.id;
  return true;
end $$;
revoke all on function public.my_roster_invites() from public;
revoke all on function public.resolve_roster_invite(uuid, uuid, boolean) from public;
grant execute on function public.my_roster_invites() to authenticated;
grant execute on function public.resolve_roster_invite(uuid, uuid, boolean) to authenticated;

-- ── announcements ─────────────────────────────────────────────────────────────
create table if not exists public.school_announcements (
  id           uuid primary key default gen_random_uuid(),
  org_id       uuid not null references public.school_orgs(id) on delete cascade,
  class_id     uuid references public.school_classes(id) on delete cascade,  -- null = org-wide
  author_id    uuid not null references public.accounts(id),
  body         text not null,
  published_at timestamptz not null default now()
);
alter table public.school_announcements enable row level security;
create policy ann_staff_write on public.school_announcements
  for insert with check (public.is_school_staff(org_id));
create policy ann_staff_read on public.school_announcements
  for select using (public.is_school_staff(org_id));
create policy ann_parent_read on public.school_announcements
  for select using (exists (
    select 1 from school_rosters r
      join school_classes c on c.id = r.class_id
     where r.account_id = auth.uid() and r.status = 'active'
       and c.org_id = school_announcements.org_id
       and (school_announcements.class_id is null or school_announcements.class_id = r.class_id)));


-- ####################################################################
-- ##  020_admin.sql
-- ####################################################################

-- 020_admin.sql — M10 Admin & Flow Control (spec §3) + M10-A1 audit fix

-- ── M10-A1: the Stage-1 gateway writes `details`; 009 lacks the column ────────
alter table public.admin_audit_log
  add column if not exists details jsonb not null default '{}';

-- ── feature toggles (scope precedence: account > plan > global) ───────────────
create table if not exists public.feature_toggles (
  key        text not null,                    -- 'module.community', 'feature.olympiad_pro', ...
  scope      text not null check (scope in ('global','plan','account')),
  scope_ref  text not null default '*',        -- plan id / account id / '*'
  value      boolean not null,
  updated_by uuid references public.accounts(id),
  updated_at timestamptz not null default now(),
  primary key (key, scope, scope_ref)
);
alter table public.feature_toggles enable row level security;
create policy toggles_read_all on public.feature_toggles for select using (true);
-- writes: service role via admin gateway only.

-- resolution helper (client may call; read-only)
create or replace function public.resolve_toggle(p_key text, p_plan text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select value from feature_toggles
      where key = p_key and scope = 'account' and scope_ref = auth.uid()::text),
    (select value from feature_toggles
      where key = p_key and scope = 'plan' and p_plan is not null and scope_ref = p_plan),
    (select value from feature_toggles
      where key = p_key and scope = 'global'),
    true);   -- default ON: absence of a toggle never breaks the app
$$;
grant execute on function public.resolve_toggle(text, text) to authenticated;

-- ── journey definitions (versioned, immutable rows; rollback = republish) ─────
create table if not exists public.journey_definitions (
  key          text not null,                  -- 'onboarding_steps', ...
  version      integer not null,
  definition   jsonb not null,                 -- { steps: [{id,type,enabled,params}] }
  published    boolean not null default false, -- exactly one published row per key
  published_by uuid references public.accounts(id),
  created_at   timestamptz not null default now(),
  primary key (key, version)
);
create unique index if not exists journey_one_published_uidx
  on public.journey_definitions(key) where published;

alter table public.journey_definitions enable row level security;
create policy journeys_read_published on public.journey_definitions
  for select using (published = true);
-- drafts + writes: service role via admin gateway only.

-- ── unified review queue ──────────────────────────────────────────────────────
create table if not exists public.review_items (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in
                ('content_draft','coach_verification','community_report',
                 'school_verification','data_request')),
  ref_id      text not null,                   -- id in the kind's own table
  summary     text,                            -- adapter-provided preview line
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  reviewer_id uuid references public.accounts(id),
  notes       text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (kind, ref_id)                        -- resolution idempotency anchor
);
create index if not exists review_pending_idx on public.review_items(status, kind, created_at);

alter table public.review_items enable row level security;
-- No client policies: enqueue via SECURITY DEFINER helper below or service role;
-- review via admin gateway.

create or replace function public.enqueue_review(p_kind text, p_ref text, p_summary text)
returns uuid language sql security definer set search_path = public as $$
  insert into review_items (kind, ref_id, summary)
  values (p_kind, p_ref, p_summary)
  on conflict (kind, ref_id) do update set summary = excluded.summary
  returning id;
$$;
revoke all on function public.enqueue_review(text, text, text) from public;
grant execute on function public.enqueue_review(text, text, text) to authenticated;


-- ####################################################################
-- ##  021_support.sql
-- ####################################################################

-- 021_support.sql — M11 Customer Service ticket index (spec §3 — thin by design:
-- the provider holds transcripts; we hold linkage for DPDP export/delete reach).

create table if not exists public.support_tickets (
  id           uuid primary key default gen_random_uuid(),
  account_id   uuid not null references public.accounts(id) on delete cascade,
  source       text not null check (source in ('ai','widget','email','callback')),
  category     text not null check (category in
                 ('onboarding','payments','subscription','coach','school',
                  'content','technical','data_request','other')),
  summary      text not null,
  context      jsonb not null default '{}',    -- page, childId (no PII beyond ids)
  status       text not null default 'open'
                 check (status in ('open','in_progress','resolved','closed')),
  provider_ref text,                            -- external conversation/ticket id
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz
);
create index if not exists tickets_account_idx on public.support_tickets(account_id, created_at desc);
create index if not exists tickets_status_idx  on public.support_tickets(status, created_at);

alter table public.support_tickets enable row level security;
create policy tickets_own_select on public.support_tickets
  for select using (account_id = auth.uid());
create policy tickets_own_insert on public.support_tickets
  for insert with check (account_id = auth.uid() and status = 'open');
-- status transitions + provider_ref linkage: service role (gateway / provider webhook).


commit;

-- ============================================================================
-- Done. Verify: select count(*) from public.wallets;  select count(*) from public.listings;
-- ============================================================================
