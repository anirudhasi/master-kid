-- 020_admin.sql — M10 Admin & Flow Control (spec §3) + M10-A1 audit fix

-- ── M10-A1: the Stage-1 gateway writes `details`; 009 lacks the column ────────
alter table public.admin_audit_log
  add column if not exists details jsonb not null default '{}';

-- ── feature toggles (scope precedence: account > plan > global) ───────────────
create table if not exists public.feature_toggles (
  key        text not null,                    -- 'module.community', 'feature.olympiad_pro', ...
  scope      text not null check (scope in ('global','plan','account')),
  scope_ref  text not null default '*',        -- plan id / account id / '*'
  value      boolean not null,
  updated_by uuid references public.accounts(id),
  updated_at timestamptz not null default now(),
  primary key (key, scope, scope_ref)
);
alter table public.feature_toggles enable row level security;
create policy toggles_read_all on public.feature_toggles for select using (true);
-- writes: service role via admin gateway only.

-- resolution helper (client may call; read-only)
create or replace function public.resolve_toggle(p_key text, p_plan text default null)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(
    (select value from feature_toggles
      where key = p_key and scope = 'account' and scope_ref = auth.uid()::text),
    (select value from feature_toggles
      where key = p_key and scope = 'plan' and p_plan is not null and scope_ref = p_plan),
    (select value from feature_toggles
      where key = p_key and scope = 'global'),
    true);   -- default ON: absence of a toggle never breaks the app
$$;
grant execute on function public.resolve_toggle(text, text) to authenticated;

-- ── journey definitions (versioned, immutable rows; rollback = republish) ─────
create table if not exists public.journey_definitions (
  key          text not null,                  -- 'onboarding_steps', ...
  version      integer not null,
  definition   jsonb not null,                 -- { steps: [{id,type,enabled,params}] }
  published    boolean not null default false, -- exactly one published row per key
  published_by uuid references public.accounts(id),
  created_at   timestamptz not null default now(),
  primary key (key, version)
);
create unique index if not exists journey_one_published_uidx
  on public.journey_definitions(key) where published;

alter table public.journey_definitions enable row level security;
create policy journeys_read_published on public.journey_definitions
  for select using (published = true);
-- drafts + writes: service role via admin gateway only.

-- ── unified review queue ──────────────────────────────────────────────────────
create table if not exists public.review_items (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in
                ('content_draft','coach_verification','community_report',
                 'school_verification','data_request')),
  ref_id      text not null,                   -- id in the kind's own table
  summary     text,                            -- adapter-provided preview line
  status      text not null default 'pending'
                check (status in ('pending','approved','rejected')),
  reviewer_id uuid references public.accounts(id),
  notes       text,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  unique (kind, ref_id)                        -- resolution idempotency anchor
);
create index if not exists review_pending_idx on public.review_items(status, kind, created_at);

alter table public.review_items enable row level security;
-- No client policies: enqueue via SECURITY DEFINER helper below or service role;
-- review via admin gateway.

create or replace function public.enqueue_review(p_kind text, p_ref text, p_summary text)
returns uuid language sql security definer set search_path = public as $$
  insert into review_items (kind, ref_id, summary)
  values (p_kind, p_ref, p_summary)
  on conflict (kind, ref_id) do update set summary = excluded.summary
  returning id;
$$;
revoke all on function public.enqueue_review(text, text, text) from public;
grant execute on function public.enqueue_review(text, text, text) to authenticated;
