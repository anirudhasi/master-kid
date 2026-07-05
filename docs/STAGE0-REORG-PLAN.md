# Stage 0 — Repository Re-organization Plan

**Status:** Draft for sign-off · **Depends on:** ADR-000 (accepted)
**Prime directive:** the app keeps working after every single step. No big-bang refactor.

---

## 1. What we are doing and why

Today `apps/web/src` is organized by *technical kind* (pages/, stores/, services/, data/).
The seams from ADR-000 require organization by *module* (business capability). We migrate
incrementally — one module at a time, each migration a small PR that leaves the app green.

## 2. Target layout per module

```
src/modules/<name>/
├── index.ts        # THE ONLY public surface. Re-exports from contracts + ui.
├── contracts.ts    # types + function signatures = future service API
├── ui/             # pages + module-specific components
├── store/          # this module's Zustand store(s)
├── service/        # data access — the only code that touches this module's tables
└── data/           # module-owned static catalogs (until content moves to DB)
```

An ESLint `no-restricted-imports` rule (or `eslint-plugin-boundaries`) enforces:
`modules/A/**` may import `modules/B` ONLY via `modules/B/index`. Violations fail CI.

## 3. Existing code → module mapping

| Current file(s) | Destination module |
|---|---|
| pages/Login.tsx, services/authService.ts, store/authStore.ts, lib/adminAuth.ts (†retire) | **M1 identity** |
| pages/ParentDashboard, KidOnboarding, Pricing; store/kidsDataStore, appStore (parent parts) | **M2 parent** |
| pages/ChildDashboard, Daily, MyPlanner; store/plannerStore, engagementStore; lib/dailyFeed | **M3 child** |
| pages/TutorPortal, Coach; services/coachService; store/coachStore | **M4 coach** |
| pages/SchoolTimetable; store/timetableStore | **M5 school** (placeholder now) |
| pages/TutorMarketplace | **M6 discovery** |
| pages/Social; services/socialService; store/socialStore | **M7 community** |
| pages/Academic, Syllabus, Worksheets, Olympiad(s), Knowledge, Storyboard, Resources; services/academic/olympiad/knowledge/storyboard; matching stores; ALL of data/ | **M8 learning-content** |
| pages/Subscription; services/subscriptionService; store/subscriptionStore, walletStore | **M9 commerce** |
| pages/Admin; store/adminStore | **M10 admin** |
| pages/AIAssistant; api/chat | **S1-adjacent** (chat UI stays; brain moves to S1 later) |
| components/Navbar, Sidebar, RequireAuth, ErrorBoundary, Logo | stays `components/` (shared) |
| pages/Landing, Blog, NotFound | `app/marketing/` (not a domain module) |

† `lib/adminAuth.ts` is **retired**, not migrated — client-side admin password checking is
a security hole (hash ships in the JS bundle). Replaced by server-side admin auth in M1.

## 4. Migration sequence (each step = one small PR, app stays green)

| Step | Action | Risk |
|---|---|---|
| 0.1 | Replace CLAUDE.md; add docs/adr/, docs/modules/; commit ADR-000 | none |
| 0.2 | Add ESLint boundary rule in *warn* mode (visibility before enforcement) | none |
| 0.3 | Create empty `modules/` skeletons with index.ts + contracts.ts stubs | none |
| 0.4 | Move M13 event bus in (new code — nothing to migrate, see M13 spec) | low |
| 0.5 | Migrate M1 identity (per M1 spec) — includes the admin-auth fix | **medium — test hardest** |
| 0.6+ | One module per step, in Stage order; flip ESLint rule to *error* per migrated module | low each |

Route paths, page URLs, and user experience do not change during re-org. This is a
file-move + import-path exercise with the boundary rule as the ratchet.

## 5. Definition of done for Stage 0

- [ ] New CLAUDE.md merged; old content deleted
- [ ] ADR-000 + foundation doc live in docs/
- [ ] Boundary lint rule active (warn)
- [ ] modules/ skeleton exists with contracts.ts stubs for M1–M13
- [ ] CI runs lint + typecheck + build on every PR
