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
