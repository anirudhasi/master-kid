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
