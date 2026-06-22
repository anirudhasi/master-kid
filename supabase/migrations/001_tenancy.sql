-- 001_tenancy.sql — identity + tenancy foundation (Auth increment)
-- Backs the Supabase phone-OTP auth. Every per-account table downstream
-- references accounts(id); RLS isolates each account's data.
--
-- Apply: supabase db push  (or paste into the SQL editor).

-- ── accounts ─────────────────────────────────────────────────────────────────
-- One row per Supabase auth user (one phone = one login). id == auth.uid().
create table if not exists public.accounts (
  id          uuid primary key references auth.users(id) on delete cascade,
  phone       text unique,
  name        text,
  email       text,
  role        text not null default 'parent' check (role in ('parent','coach','admin')),
  avatar_url  text,
  created_at  timestamptz not null default now()
);

alter table public.accounts enable row level security;

-- A user can see and edit only their own account row.
create policy accounts_self_select on public.accounts
  for select using (id = auth.uid());
create policy accounts_self_upsert on public.accounts
  for insert with check (id = auth.uid());
create policy accounts_self_update on public.accounts
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Auto-provision an accounts row when a new auth user is created.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.accounts (id, phone)
  values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ── children ─────────────────────────────────────────────────────────────────
create table if not exists public.children (
  id                  uuid primary key default gen_random_uuid(),
  account_id          uuid not null references public.accounts(id) on delete cascade,
  name                text not null,
  dob                 date,
  photo_url           text,
  enrolled_grade      text not null,                 -- 'NUR','LKG','UKG','1'..'12'
  academic_year_start date not null default date_trunc('year', now())::date,
  board               text,
  is_active           boolean not null default true,
  created_at          timestamptz not null default now()
);

create index if not exists children_account_idx on public.children(account_id);

alter table public.children enable row level security;

-- A parent can manage only their own children. (Coach read access is granted
-- later, scoped to active enrollments — see 007_coach.sql.)
create policy children_owner_all on public.children
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());
