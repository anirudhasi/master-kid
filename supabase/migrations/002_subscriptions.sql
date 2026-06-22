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

create policy payments_owner_all on public.payments
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
