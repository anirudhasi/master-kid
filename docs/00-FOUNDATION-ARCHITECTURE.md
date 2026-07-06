# Master-Kids — Foundation Architecture (v2 Platform)

**Status:** Draft v0.1 — module map for sign-off. Per-module deep specs follow, one at a time.
**Governing decision:** ADR-000 (modular monolith, strangler-fig extraction).
**Date:** 2026-07-04

---

## 1. The platform in one picture

```
                        ┌─────────────────────────────────────────────┐
                        │            MASTER-KIDS PLATFORM             │
                        │        (one deployable, hard seams)         │
                        │                                             │
  Actors                │  ┌───────────── DOMAIN MODULES ──────────┐  │
  ──────                │  │ M1 Identity & Access  (accounts, RBAC)│  │
  Parent ──────────────▶│  │ M2 Parent      M3 Child               │  │
  Child  ──────────────▶│  │ M4 Tutor/Coach M5 School              │  │
  Tutor  ──────────────▶│  │ M6 Discovery   M7 Community           │  │
  School ──────────────▶│  │ M8 Learning Content (academic,        │  │
  Admin  ──────────────▶│  │    olympiad, knowledge, storyboard)   │  │
                        │  │ M9 Commerce (subscriptions, wallet)   │  │
                        │  └───────────────────────────────────────┘  │
                        │  ┌──────────── PLATFORM MODULES ─────────┐  │
                        │  │ M10 Admin & Flow Control              │  │
                        │  │ M11 Customer Service (integrate)      │  │
                        │  │ M12 Notifications & Messaging         │  │
                        │  │ M13 Event Bus (in-process, typed)     │  │
                        │  └───────────────────────────────────────┘  │
                        └───────────────┬─────────────────────────────┘
                                        │ events / API (the seam)
                        ┌───────────────▼─────────────────────────────┐
                        │  S1 INTELLIGENT LAYER — separate service    │
                        │  (agent fleet on fixed rhythms; writes to   │
                        │  knowledge base via M8's contract only)     │
                        └─────────────────────────────────────────────┘
```

Everything inside the big box deploys together. **S1 is the only day-one service** — its
rhythm-driven agent fleet meets extraction trigger #1 of ADR-000 immediately.

---

## 2. Module registry

Each module will get its own numbered spec (`docs/modules/M<n>-<name>.md`) covering:
responsibilities · owned tables · public contract · events emitted/consumed · extraction seam.
The table below is the registry and the *ownership law* — the single most important governance
artifact in the codebase.

| # | Module | Maps to your list | Owns (data) | Exists today as | Build verdict |
|---|--------|-------------------|-------------|-----------------|---------------|
| M1 | Identity & Access | (foundation for all) | accounts, roles, sessions, handshake tokens | Login, authStore, RLS policies | **Refactor first** — everything depends on it |
| M2 | Parent | (a) | children registry, parent prefs, consent records | ParentDashboard, KidOnboarding | Evolve |
| M3 | Child | (b) | child shell state, daily feed, engagement progress | ChildDashboard, Daily, plannerStore | Evolve |
| M4 | Tutor / Coach | (c) | coach profiles, courses, milestones, enrollments, coach↔parent threads | TutorPortal, coachService, migration 007 | Evolve |
| M5 | School | (d) | school orgs, classes/sections, rosters, school↔parent links, timetables | SchoolTimetable page + tenancy spine only | **Net-new build** (B2B tier) |
| M6 | Discovery | (e) | search indexes, rankings, tutor/school listings | TutorMarketplace (thin) | Build |
| M7 | Community | (f) | posts, reactions, comments, "looking-for" listings | Social, migration 006 | Evolve + extend |
| M8 | Learning Content | (spans b/i) | academic catalog, olympiad sets, knowledge items, storyboard entries, worksheets, **the knowledge base S1 feeds** | Academic/Olympiad/Knowledge/Storyboard pages, migrations 003–005, 008 | Consolidate (currently scattered) |
| M9 | Commerce | (cross-cutting) | subscriptions, payments, wallet, invoices | Subscription page, migrations 002, 011 | Evolve |
| M10 | Admin & Flow Control | (g) | feature flags, module toggles, flow definitions, audit log | Admin page, migration 009 | Evolve; **drag-drop flow control scoped as v1 = visual feature-flag/journey editor**, not a general workflow engine |
| M11 | Customer Service | (h) | tickets, transcripts (integration glue) | nothing | **Integrate, don't build** — embed a chat/call provider; own only the glue + escalation data |
| M12 | Notifications & Messaging | (foundation) | notification prefs, delivery log, push/email/WhatsApp adapters | scattered | Build small, early — 6 modules depend on it |
| M13 | Event Bus | (foundation) | event contracts | nothing | Build first week — it *is* the seam mechanism |
| S1 | Intelligent Layer | (i) | agent registry, schedules, run logs; **no direct DB writes to M8 — contract only** | nothing | **Design as a service from day one**; own workstream, own ADR, own budget model |

## 3. Dependency-ordered build sequence

This is the order the per-module deep specs (and then code) will proceed. Each stage is only
started after the previous stage's spec is signed off. Foundations first, revenue-critical next,
expansion last.

```
Stage 0  Housekeeping        rewrite CLAUDE.md · adopt ADR system · repo re-org plan
Stage 1  Foundations         M13 Event Bus → M1 Identity → M12 Notifications
Stage 2  Core actors         M2 Parent → M3 Child → M9 Commerce   (launch-critical path)
Stage 3  Supply side         M4 Tutor/Coach → M8 Learning Content consolidation
Stage 4  Growth surfaces     M6 Discovery → M7 Community
Stage 5  Institutions        M5 School   (B2B — biggest net-new)
Stage 6  Operations          M10 Admin & Flow Control → M11 Customer Service
Stage S  Intelligence        S1 agent platform (parallel track once M8's contract is stable)
```

Rationale for the order:
- **M13 before everything**: without the event bus, modules will couple directly and the seams
  die on day one.
- **M1 before actors**: RBAC for five actor types (parent/child/tutor/school/admin) must be
  designed once, centrally — retrofitting roles is the most expensive refactor in any platform.
- **M9 in Stage 2**: public launch needs working subscription flow; it can't trail.
- **M5 (School) after tutors**: schools are structurally "a coach with an org chart" — M4's
  course/roster/handshake machinery gets reused, so building it first is leverage.
- **S1 waits for M8's contract**: agents that write to an unstable knowledge-base schema will
  generate migration churn forever. Freeze the contract, then unleash the fleet.

## 4. Open items each stage must resolve (parked, tracked)

- M10: exact v1 scope of drag-drop "flow control" (proposal: journey editor + module toggles + plan gating; NOT a general BPMN engine).
- M11: provider shortlist for chat/call (evaluated on India telephony + WhatsApp + cost).
- S1: agent runtime choice, rhythm scheduler, cost-per-agent-run budget model, human-review gates for child-facing content.
- M8: content-as-code (`src/data/*.ts`) → content-as-data migration plan.
- Hosting: Azure SWA vs the AWS target mentioned in older docs — needs its own ADR (ADR-001 candidate).
