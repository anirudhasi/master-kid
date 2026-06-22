-- 003_storyboard.sql — per-child, per-class storyboard (flagship module)
-- One row per achievement / result / certificate / photo / scribble note,
-- tagged to a class tile (grade). Photos carry a postcard "flip-side" note.

create table if not exists public.storyboard_entries (
  id            uuid primary key default gen_random_uuid(),
  account_id    uuid not null references public.accounts(id) on delete cascade,
  child_id      uuid not null references public.children(id) on delete cascade,
  grade         text not null,                 -- class tile key e.g. 'Class 4'
  kind          text not null check (kind in ('achievement','result','certificate','photo','note')),
  title         text,
  body          text,                          -- description / scribble note
  postcard_note text,                          -- flip-side note for a photo
  media_url     text,                          -- Supabase Storage key (photo/cert/result scan)
  occurred_on   date not null default current_date,   -- powers the timeline
  created_at    timestamptz not null default now()
);

create index if not exists storyboard_child_grade_idx
  on public.storyboard_entries(child_id, grade);

alter table public.storyboard_entries enable row level security;

create policy storyboard_owner_all on public.storyboard_entries
  for all using (account_id = auth.uid()) with check (account_id = auth.uid());

-- Enforce the "max 10 photos per (child, grade)" rule at the DB level.
create or replace function public.enforce_photo_cap()
returns trigger language plpgsql as $$
begin
  if new.kind = 'photo' and (
    select count(*) from public.storyboard_entries
    where child_id = new.child_id and grade = new.grade and kind = 'photo'
  ) >= 10 then
    raise exception 'Photo limit reached (max 10 per class)';
  end if;
  return new;
end; $$;

drop trigger if exists storyboard_photo_cap on public.storyboard_entries;
create trigger storyboard_photo_cap
  before insert on public.storyboard_entries
  for each row execute function public.enforce_photo_cap();
