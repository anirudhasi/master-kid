-- 009_admin_audit.sql — admin audit log
-- Admin acts through SWA Functions using the Supabase service-role key (bypasses
-- RLS); see docs/ARCHITECTURE.md §4. Enable/disable is modelled as children.is_active
-- and an account-level suspended flag; this table records who did what.

alter table public.accounts add column if not exists is_suspended boolean not null default false;

create table if not exists public.admin_audit_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references public.accounts(id),
  action      text not null,
  target_type text,
  target_id   text,
  created_at  timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;
-- No client policies: only the service role (admin Functions) reads/writes this.
