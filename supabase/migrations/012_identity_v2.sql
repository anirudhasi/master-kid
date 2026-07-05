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
create extension if not exists pgcrypto;

create or replace function public.set_child_pin(p_pin text)
returns void language sql security definer set search_path = public as $$
  insert into child_mode_pins(account_id, pin_hash)
  values (auth.uid(), crypt(p_pin, gen_salt('bf')))
  on conflict (account_id) do update
    set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now();
$$;

create or replace function public.verify_child_pin(p_pin text)
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce(
    (select pin_hash = crypt(p_pin, pin_hash) from child_mode_pins
      where account_id = auth.uid()), false);
$$;

revoke all on function public.set_child_pin(text) from public;
revoke all on function public.verify_child_pin(text) from public;
grant execute on function public.set_child_pin(text) to authenticated;
grant execute on function public.verify_child_pin(text) to authenticated;
