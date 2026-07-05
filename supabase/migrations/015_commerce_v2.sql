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
