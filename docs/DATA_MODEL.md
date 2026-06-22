# Master-Kids — Data Model (Supabase / Postgres)

> Target schema for the child-centric revamp. All tables carry `account_id` for tenant
> isolation and have **Row-Level Security** enabled. Content catalog tables (curriculum,
> olympiad, knowledge, books) are read-mostly and globally shared — they are *not* per-account.
> This is the contract the frontend `services/` layer codes against.

---

## 1. Tenancy & identity

```sql
-- One account = one phone number = one login (the parent / super-user).
accounts (
  id           uuid PK default gen_random_uuid(),
  phone        text UNIQUE NOT NULL,
  name         text,
  email        text,
  role         text CHECK (role IN ('parent','coach','admin')) DEFAULT 'parent',
  created_at   timestamptz DEFAULT now()
)

-- Children belong to an account. Everything child-scoped references child_id.
children (
  id                 uuid PK default gen_random_uuid(),
  account_id         uuid REFERENCES accounts(id) ON DELETE CASCADE,
  name               text NOT NULL,
  dob                date,
  photo_url          text,
  enrolled_grade     text NOT NULL,          -- 'NUR','LKG','UKG','1'..'12'
  academic_year_start date DEFAULT '2026-04-01', -- drives the April tile unlock
  is_active          boolean DEFAULT true,   -- admin/parent can disable
  created_at         timestamptz DEFAULT now()
)
```

**Class-tile rule (storyboard):** active tiles = Nursery..`enrolled_grade`. Each April, if
`now() >= academic_year_start + 1yr`, the next grade unlocks. Computed client-side; server only
stores `enrolled_grade` + `academic_year_start`.

---

## 2. Subscription & payments (per child)

```sql
subscriptions (
  id           uuid PK default gen_random_uuid(),
  account_id   uuid REFERENCES accounts(id) ON DELETE CASCADE,
  child_id     uuid REFERENCES children(id) ON DELETE CASCADE,
  plan         text CHECK (plan IN ('free_trial','monthly','yearly')),
  status       text CHECK (status IN ('trialing','active','past_due','canceled')),
  amount_inr   integer,                  -- 99 monthly / 999 yearly
  trial_ends_at timestamptz,             -- 1 month free from child creation
  current_period_end timestamptz,
  created_at   timestamptz DEFAULT now()
)

-- Coach course subscriptions (₹300/yr or ₹1000/5yr) live here too, distinguished by target.
payments (
  id           uuid PK default gen_random_uuid(),
  account_id   uuid REFERENCES accounts(id),
  target_type  text CHECK (target_type IN ('child_subscription','coach_course')),
  target_id    uuid,                     -- child_id or enrollment_id
  amount_inr   integer NOT NULL,
  provider     text,                     -- 'razorpay' | 'upi' | 'test_skip'
  provider_ref text,
  status       text CHECK (status IN ('created','paid','failed','skipped_test')),
  created_at   timestamptz DEFAULT now()
)
```
> The test-only "skip/pass" button writes a `status='skipped_test'` payment behind an env flag.

---

## 3. Storyboard (per child, per class tile)

```sql
storyboard_entries (
  id           uuid PK default gen_random_uuid(),
  account_id   uuid REFERENCES accounts(id) ON DELETE CASCADE,
  child_id     uuid REFERENCES children(id) ON DELETE CASCADE,
  grade        text NOT NULL,            -- which class tile
  kind         text CHECK (kind IN ('achievement','result','certificate','photo','note')),
  title        text,
  body         text,                     -- scribble note text / achievement description
  postcard_note text,                    -- the "flip side" note for a photo
  media_url    text,                     -- Supabase Storage key (photo/cert/result scan)
  occurred_on  date,                     -- powers the timeline view
  created_at   timestamptz DEFAULT now()
)
-- App rule: max 10 photos per (child, grade). Enforced in service layer + a CHECK trigger.
```

---

## 4. Academic — subjects + content catalog

```sql
-- Per-child chosen subjects (add/remove over time).
child_subjects (
  id          uuid PK default gen_random_uuid(),
  account_id  uuid REFERENCES accounts(id) ON DELETE CASCADE,
  child_id    uuid REFERENCES children(id) ON DELETE CASCADE,
  grade       text NOT NULL,
  subject_key text NOT NULL,             -- FK-ish to content catalog
  is_active   boolean DEFAULT true
)

-- ===== Shared content catalog (NOT per-account; read-mostly; CDN/Redis cacheable) =====
catalog_subjects ( subject_key text PK, name text, icon text )
catalog_lessons (
  id          uuid PK,
  subject_key text REFERENCES catalog_subjects(subject_key),
  grade       text NOT NULL,
  ordinal     integer,
  title       text,
  body_md     text,                      -- lesson content
  further_study jsonb                    -- [{title, url}] suggestions section
)
catalog_qa (                             -- solved questions & answers per lesson
  id          uuid PK,
  lesson_id   uuid REFERENCES catalog_lessons(id),
  question    text,
  answer_md   text
)
catalog_books (                          -- digital flip-book = ordered pages
  id          uuid PK,
  subject_key text,
  grade       text,
  title       text
)
catalog_book_pages (
  id          uuid PK,
  book_id     uuid REFERENCES catalog_books(id),
  page_no     integer,
  image_url   text,                      -- printable/downloadable page asset
  text_md     text
)
```

---

## 5. Olympiad

```sql
-- Shared catalog: 6 subjects × 4 categories (Basic/Intermediate/Pro/Sample) × sets.
catalog_olympiad_sets (
  id          uuid PK,
  subject     text CHECK (subject IN ('science','maths','english','gk','cs','sst')),
  category    text CHECK (category IN ('basic','intermediate','pro','sample')),
  grade       text,
  title       text,
  kind        text CHECK (kind IN ('worksheet','sample_paper')),
  asset_url   text
)
-- Per-child progress on a set.
olympiad_progress (
  id          uuid PK default gen_random_uuid(),
  account_id  uuid, child_id uuid REFERENCES children(id) ON DELETE CASCADE,
  set_id      uuid REFERENCES catalog_olympiad_sets(id),
  status      text CHECK (status IN ('not_started','in_progress','done')),
  score       integer,
  updated_at  timestamptz DEFAULT now()
)
-- Parent-uploaded resources (can be shared to community / social).
user_resources (
  id          uuid PK default gen_random_uuid(),
  account_id  uuid, child_id uuid,
  title       text, subject text, grade text,
  media_url   text,
  is_shared   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now()
)
```

---

## 6. Social feed

```sql
posts (
  id          uuid PK default gen_random_uuid(),
  account_id  uuid REFERENCES accounts(id),
  child_id    uuid,                       -- optional: posting a child achievement
  source_kind text,                       -- 'achievement' | 'resource' | 'freeform'
  source_id   uuid,                        -- storyboard_entry / user_resource id
  body        text,
  media_url   text,
  visibility  text CHECK (visibility IN ('community','private')) DEFAULT 'community',
  created_at  timestamptz DEFAULT now()
)
post_reactions ( id uuid PK, post_id uuid REFERENCES posts(id), account_id uuid, kind text )
post_comments  ( id uuid PK, post_id uuid REFERENCES posts(id), account_id uuid, body text, created_at timestamptz DEFAULT now() )
```
> External Instagram/Facebook posting = client share-intent / deep-link only for now (no API).

---

## 7. Extra-curricular + Coach module

```sql
-- A coach is an account with role='coach' + this profile.
coach_profiles (
  account_id     uuid PK REFERENCES accounts(id) ON DELETE CASCADE,
  display_name   text, bio text,
  disciplines    text[],                  -- 'bharatanatyam','chess','swimming','maths',...
  experience_yrs integer, rating numeric(3,2), is_top boolean DEFAULT false
)

courses (
  id          uuid PK default gen_random_uuid(),
  coach_id    uuid REFERENCES accounts(id),
  title       text, discipline text, description text,
  price_inr   integer,                    -- 300/yr or 1000/5yr handled at enrollment
  created_at  timestamptz DEFAULT now()
)
course_milestones (
  id          uuid PK default gen_random_uuid(),
  course_id   uuid REFERENCES courses(id) ON DELETE CASCADE,
  cadence     text CHECK (cadence IN ('day','week','month')),
  ordinal     integer,
  title       text, deliverable text, parent_visible_outcome text,
  target_date date                        -- flexible (e.g. Bharatanatyam Yr-1 exam date)
)

-- The parent↔coach handshake. Either side initiates; both must accept.
enrollments (
  id           uuid PK default gen_random_uuid(),
  course_id    uuid REFERENCES courses(id),
  child_id     uuid REFERENCES children(id),
  account_id   uuid,                       -- the child's account (parent)
  handshake_token text,                    -- authorization token shared parent↔coach
  status       text CHECK (status IN ('pending','active','revoked')),
  created_at   timestamptz DEFAULT now()
)
milestone_progress (
  id           uuid PK default gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  milestone_id uuid REFERENCES course_milestones(id),
  status       text CHECK (status IN ('pending','done')),
  achieved_on  date, coach_note text
)

-- Parent/coach can also set a custom curriculum + target without a full course.
custom_curricula (
  id          uuid PK default gen_random_uuid(),
  account_id  uuid, child_id uuid,
  set_by      text CHECK (set_by IN ('parent','coach')),
  title       text, syllabus_md text, target_date date,
  created_at  timestamptz DEFAULT now()
)

-- Secure 2-way parent↔coach messaging, scoped to an enrollment.
messages (
  id           uuid PK default gen_random_uuid(),
  enrollment_id uuid REFERENCES enrollments(id) ON DELETE CASCADE,
  sender_id    uuid REFERENCES accounts(id),
  kind         text CHECK (kind IN ('note','progress','complaint','system')),
  body         text,
  created_at   timestamptz DEFAULT now()
)
```

---

## 8. Knowledge + engagement (read-mostly catalog + per-child state)

```sql
catalog_knowledge_items (
  id          uuid PK,
  type        text CHECK (type IN ('riddle','puzzle','sudoku','quiz','crossword',
                                   'word_power','idiom','proverb','capital','tongue_twister')),
  level       text CHECK (level IN ('beginner','intermediate','advanced')),
  max_grade   text,                        -- only show at/below the child's class level
  payload     jsonb,                       -- type-specific content
  interest_tag text                        -- 'maths','science','arts','commerce'
)
catalog_quotes ( id uuid PK, text text, author text, audience text DEFAULT 'parent' )

-- Per-child daily feed is generated, then cached for the day.
daily_feed (
  id          uuid PK default gen_random_uuid(),
  child_id    uuid REFERENCES children(id) ON DELETE CASCADE,
  for_date    date,
  payload     jsonb,                       -- {focus, riddle_id, words[5], proverb_id, game_id}
  UNIQUE(child_id, for_date)
)
knowledge_progress ( id uuid PK, child_id uuid, item_id uuid, status text, updated_at timestamptz )
```

---

## 9. Admin

Admin acts through SWA Functions using the Supabase **service-role** key (bypasses RLS). No
admin-only tables beyond an audit log:

```sql
admin_audit_log (
  id          uuid PK default gen_random_uuid(),
  admin_id    uuid REFERENCES accounts(id),
  action      text,                        -- 'disable_child','remove_coach',...
  target_type text, target_id uuid,
  created_at  timestamptz DEFAULT now()
)
```

---

## 10. RLS policy matrix (summary)

| Table group | Parent (account owner) | Coach | Admin |
|---|---|---|---|
| `accounts`, `children`, `subscriptions`, `storyboard_*`, `child_*`, `olympiad_progress`, `user_resources`, `daily_feed`, `knowledge_progress` | R/W where `account_id = auth.uid()`'s account | none | all (service role) |
| `posts`/comments/reactions | R community + R/W own | R community + R/W own | all |
| `coach_profiles`, `courses`, `course_milestones` | R only | R/W own | all |
| `enrollments`, `milestone_progress`, `messages` | R/W where child belongs to account **and** enrollment `active` | R/W where coach owns course **and** enrollment `active` | all |
| `catalog_*`, `catalog_quotes` | R (public/anon read) | R | R/W |

**Pattern:** every per-account table gets a policy
`USING (account_id IN (SELECT id FROM accounts WHERE auth.uid()::text = ...))` plus matching
`WITH CHECK`. Catalog tables get a public `SELECT` policy and no write policy (writes via service role).

---

## 11. Migration plan

1. `001_tenancy.sql` — accounts, children, RLS base.
2. `002_subscriptions_payments.sql`
3. `003_storyboard.sql`
4. `004_academic_catalog.sql` (+ seed a few subjects/lessons)
5. `005_olympiad.sql`
6. `006_social.sql`
7. `007_coach.sql`
8. `008_knowledge_engagement.sql` (+ seed knowledge/quotes)
9. `009_admin_audit.sql`

Live in `supabase/migrations/`. Frontend `services/` codes to these tables from day one; the
MVP can stub them with `data/` seed files and switch the data source by flipping the service impl.
