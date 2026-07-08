-- ============================================================================
-- Diagnostic: which migrations (001-011) are actually applied?
-- Read-only. Paste into Supabase SQL Editor, Run, and send me the result grid.
-- Each row: one migration's signature table -> present? (true/false)
-- ============================================================================
select m.migration,
       m.table_name,
       (to_regclass('public.' || m.table_name) is not null) as present
from (values
  ('001_tenancy',              'accounts'),
  ('001_tenancy',              'children'),
  ('002_subscriptions',        'subscriptions'),
  ('002_subscriptions',        'payments'),
  ('003_storyboard',           'storyboard_entries'),
  ('004_academic_catalog',     'catalog_subjects'),
  ('004_academic_catalog',     'catalog_lessons'),
  ('005_olympiad',             'catalog_olympiad_sets'),
  ('005_olympiad',             'olympiad_progress'),
  ('006_social',               'posts'),
  ('006_social',               'post_comments'),
  ('007_coach',                'coach_profiles'),
  ('007_coach',                'enrollments'),
  ('008_knowledge_engagement', 'catalog_knowledge_items'),
  ('008_knowledge_engagement', 'catalog_quotes'),
  ('009_admin_audit',          'admin_audit_log'),
  ('010_children_sync',        'activity_events'),
  ('011_wallet',               'wallets'),
  ('011_wallet',               'wallet_transactions')
) as m(migration, table_name)
order by m.migration, m.table_name;
