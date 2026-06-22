# Master-Kids — Module Specs (from Change Request)

> One section per module. Each lists: **what the Change Request asks**, **scope for the build**,
> **existing page to reuse/replace**, and **data** (see `DATA_MODEL.md`). "Later" items are
> intentionally deferred — they were mentioned but aren't needed for a coherent first revamp.

Legend: ✅ build now · 🟡 build basic now, deepen later · ⏸ defer.

---

## 1. Auth — OTP login ✅
- **Ask:** Login with OTP. One number = one login.
- **Scope:** Phone entry → OTP → session. Supabase Auth (phone). `/api/otp` Function sends/verifies
  in MVP (email/WhatsApp OTP free; SMS only if needed). Reuse `pages/Login.tsx`.
- **Data:** `accounts`.

## 2. Parent (super-user) ✅
- **Ask:** Parent is main user; creates multiple children; on creating a child, prompt
  per-child subscription — **1 month free**, then ₹99/mo or ₹999/yr; payment module with a small
  **"skip/pass" button** to bypass during testing.
- **Scope:** Children CRUD; "add child" wizard → subscription screen with plan cards + **test skip**
  (env-flagged). Parent dashboard = list of children → tap to enter child shell. Reuse/replace
  `pages/ParentDashboard.tsx`, `pages/KidOnboarding.tsx`, `pages/Pricing.tsx`.
- **Data:** `children`, `subscriptions`, `payments`.

## 3. Child shell ✅
- **Ask:** Select a child → every functionality built around that child.
- **Scope:** `childStore.selectedChildId` drives a child-scoped layout with bottom/side nav to all
  child modules. Guard: no child selected → child picker. Reuse `pages/ChildDashboard.tsx` as the
  child home.
- **Data:** `children`.

## 4. Profile 🟡
- **Ask:** Simple — photo + basic info, class-wise.
- **Scope:** Photo upload, name/DOB/grade, current class. Reuse `pages/StudentProfile.tsx`
  (already exists per memory: `/profile` + SubjectGoals).
- **Data:** `children`.

## 5. Storyboard ✅ (flagship — "make it innovative")
- **Ask:** Dedicated tile per class, **Nursery → Class 12**. Only tiles up to the child's class are
  active; **each April a new tile unlocks**. Per tile: document achievements, upload results,
  certificate images, photos (**max 10**), scribble notes. **Each photo → a postcard that flips to
  reveal a written note.** Page has a **timeline view** + an **editable detail view**.
- **Scope (now):** Grid of class tiles with active/locked state (computed from `enrolled_grade` +
  `academic_year_start`); tile detail with timeline + edit; postcard flip-card component
  (CSS 3D flip via framer-motion); upload with 10-photo cap. New module `modules/storyboard/`.
- **Class-tile logic:** active = Nursery..enrolled; unlock next when `today >= academic_year_start
  + N years` and month ≥ April.
- **Data:** `storyboard_entries`.

## 6. Academic ✅
- **Ask:** Subjects per class (add/remove anytime). Complete repository: each lesson of each
  subject, all solved Q&A. **Each book as a digital flip-book** (page-turn view). Parent can
  **download/print** each page/lesson/Q&A. Each lesson has a **"further studies & suggestions"**
  section.
- **Scope (now):** Subject manager (add/remove); lesson list → lesson view with solved Q&A +
  further-study links; **digital book reader** (page-flip) over `catalog_book_pages`; print/download
  per page. Seed a small real sample (1–2 subjects, a few lessons) so it's demonstrably real; full
  content is a catalog-population task, not code. Reuse `pages/Syllabus.tsx`, `pages/Resources.tsx`,
  `pages/Worksheets.tsx`, `data/worksheetsData.ts`, and `master-kids_Worksheets/`.
- **Data:** `child_subjects`, `catalog_subjects/lessons/qa/books/book_pages`.

## 7. Olympiad ✅
- **Ask:** Sections for Science, Maths, English, GK, Computer Science, SST. 100 practice sets
  across **Basic / Intermediate / Pro** + **sample papers** (20 worksheets per category + 40
  sample papers from previous papers). Parents can upload new resources and **share to community**.
- **Scope (now):** Subject → category → set list with progress; worksheet/sample-paper viewer;
  parent upload → optional community share. Seed catalog structure + sample items. Reuse
  `pages/Olympiads.tsx`.
- **Data:** `catalog_olympiad_sets`, `olympiad_progress`, `user_resources`.

## 8. Social feed 🟡
- **Ask:** Social page for parents + students; share child achievements/resources; also push out to
  **Instagram & Facebook** (from the achievement section).
- **Scope (now):** In-app community feed (post/react/comment) sourcing from storyboard achievements
  + uploaded resources; external IG/FB = **share-intent/deep-link** button. Reuse `pages/SocialFeed.tsx`.
- **Later (⏸):** Real IG/FB Graph API posting (OAuth + app review).
- **Data:** `posts`, `post_reactions`, `post_comments`.

## 9. Extra-curricular ✅
- **Ask:** Pick/customize activities; add/delete anytime; customize syllabus; app suggests an
  age-appropriate default curriculum; parent and coach can access each other's content via an
  **authorization token**; set curriculum + **target with a flexible date** (e.g. Bharatanatyam
  Year-1 exam this year).
- **Scope (now):** Activity picker + age-default curricula; custom syllabus editor (write/paste);
  target date; handshake-token entry to link a coach. Reuse `pages/LearningPlan.tsx`,
  `pages/Schedule.tsx`.
- **Data:** `custom_curricula`, `enrollments` (handshake), `courses`.

## 10. Coach / Teacher ✅ (key acquisition surface — "advanced & innovative")
- **Ask:** Any kind of coach (singing, dance, drawing, maths, chess, cricket, swimming, languages…)
  creates **course content**, sets **day/week/month milestones** (deliverable + what student/parent
  should expect/see), **attaches a student** (handshake) → parent gets visibility into curriculum +
  child progress. Coach **dashboard** across all courses/students with notifications (class time,
  performance, extra help, notes/complaints to parent). **Secure 2-way parent↔coach portal.**
  Subscription ₹300/yr or ₹1000/5yr. UPI payment facilitated by the platform.
- **Scope (now):** Coach onboarding/profile; course builder + milestone editor; enrollment via
  handshake token; coach dashboard (students × milestone progress); parent view of progress;
  parent↔coach messaging thread. Reuse `pages/TutorPortal.tsx`, `pages/TutorMarketplace.tsx`.
- **Data:** `coach_profiles`, `courses`, `course_milestones`, `enrollments`, `milestone_progress`,
  `messages`.

## 11. Admin ✅
- **Ask:** Dashboard to control/monitor all modules; enable/disable/add/remove any parent, child,
  teacher/coach.
- **Scope (now):** Admin-only route; tables of accounts/children/coaches with enable/disable/remove;
  module health overview. Acts via `/api/admin/*` Functions (service-role). New `modules/admin/`.
- **Data:** all (service role) + `admin_audit_log`.

## 12. Knowledge 🟡
- **Ask:** Organize riddles, puzzles, sudoku, quizzes (all levels), National Geographic content,
  crosswords, **word-power (5 words/day)**, idioms, proverbs, country-capital, tongue-twisters.
  **Show only content at/below the child's class level**, beginner→advanced. Add more for engagement.
- **Scope (now):** Catalog browser filtered by `max_grade <= child grade`, grouped by type/level;
  playable: quiz, word-power, riddle reveal, capitals; sudoku/crossword = basic playable or viewer.
  Reuse `pages/FunHub.tsx`, `data/funContentData.ts`.
- **Later (⏸):** Licensed National Geographic content (needs a content deal).
- **Data:** `catalog_knowledge_items`, `knowledge_progress`.

## 13. Daily & Weekend engagement 🟡
- **Ask:** Educational/motivational **quote of the day** (parent). Student page: **dynamic daily**
  notification of what to focus on — combo of his lessons + a math riddle + 5 words + a proverb
  (by interest: maths/science/arts/commerce) + a daily game (sudoku/crossword) to solve.
  **Weekend Bonanza:** weekly quiz, local competitions, movie suggestion, weekend/educational trip
  for the class level.
- **Scope (now):** `daily_feed` generator (deterministic per child per day) rendered as the child
  home hero; parent quote-of-the-day card; Weekend Bonanza section (weekly quiz + curated
  suggestions). Reuse `pages/DailyDigest.tsx`, `pages/AIAssistant.tsx` for the AI-assist piece.
- **Data:** `daily_feed`, `catalog_quotes`, `catalog_knowledge_items`.

---

## Deferred (mentioned, parked by mutual agreement)
- Real Instagram/Facebook Graph API posting (share-intent only for now).
- Licensed National Geographic content.
- Real UPI settlement / escrow / payout to coaches (deep-link + record-keeping only now).
- Native mobile app (Expo) — web PWA covers the MVP; mobile is a later track.

## Existing pages → module map (for the build session)
| Existing `apps/web` page | New module |
|---|---|
| Login | auth |
| ParentDashboard, KidOnboarding, Pricing | parent |
| ChildDashboard, DailyDigest, AIAssistant | child shell + engagement |
| StudentProfile | profile |
| (new) | storyboard |
| Syllabus, Resources, Worksheets | academic |
| Olympiads | olympiad |
| SocialFeed | social |
| LearningPlan, Schedule | extracurricular |
| TutorPortal, TutorMarketplace | coach |
| FunHub | knowledge |
| (new) | admin |
| Landing, Blog, NotFound | marketing/shell (keep) |
