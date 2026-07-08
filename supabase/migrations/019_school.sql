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
