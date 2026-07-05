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
