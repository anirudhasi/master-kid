# CLAUDE.md — Master-Kids Project Context (v2)

> Single source of truth for any coding session (human or AI).
> **This file replaced an obsolete version on 2026-07-05.** If you see references to
> React Native, Expo, Hono.js, or a "habit-tracking app" anywhere, they are dead
> architecture — ignore them.

---

## What This Product Is

**Master-Kids** is a **child-centric cradle-to-career learning platform** for the Indian
market (NEP 2020-aligned, board-agnostic: CBSE / ICSE / State Boards). Tagline:
*"One Student. One Platform. 15 Years."*

The parent is the **super-user** (one phone = one login) and creates children; selecting a
child re-scopes the entire app to that child. Alongside parents sit four more actors:
**Child**, **Tutor/Coach**, **School**, and **Admin**.

## Governing Architecture — READ FIRST

- **`docs/adr/ADR-000-architecture-style.md`** — we are a **modular monolith with
  strangler-fig extraction**. NOT microservices (yet). One deployable, hard internal seams.
- **`docs/00-FOUNDATION-ARCHITECTURE.md`** — module registry (M1–M13 + S1), data
  ownership law, dependency-ordered build sequence.
- All significant decisions get a numbered ADR in `docs/adr/`. Never contradict an
  accepted ADR silently — propose a superseding ADR instead.

### The four seam rules (non-negotiable, enforce in every PR)
1. A module's tables are written **only** by that module. Cross-module reads go through
   the module's exported API, never raw table access.
2. Every module ships a `contracts.ts` — types + function signatures. This file IS the
   future service API.
3. Cross-module side-effects go through the typed in-process event bus (`modules/events/`).
4. No module imports another module's internals — only `modules/<name>/index.ts` exports.

## Tech Stack — Current Reality

| Layer | Choice |
|---|---|
| Frontend | React 19 + Vite + TypeScript (SPA/PWA) |
| Routing | react-router-dom |
| State | Zustand (client) — consolidating per-module |
| Styling | Tailwind CSS |
| Hosting | Azure Static Web Apps (free tier) + SWA Managed Functions (`apps/web/api`) |
| Auth | Supabase Auth — phone OTP + Google OAuth, via `authService` provider seam |
| Database | Supabase Postgres + Row-Level Security (11 migrations, `supabase/migrations/`) |
| Storage | Supabase Storage |
| AI | Provider behind `/api/chat` Function (server-side key only) |
| Cost ceiling | < $10/mo until revenue (ADR-000 context) |

Open ADR candidate: long-term hosting (Azure SWA vs AWS) — do not migrate clouds
without an accepted ADR.

## Repository Layout (target — see docs/STAGE0-REORG-PLAN.md for migration state)

```
master-kid/
├── CLAUDE.md                  ← you are here
├── docs/
│   ├── adr/                   ← numbered decision records
│   ├── modules/               ← one deep spec per module (M1…M13, S1)
│   └── 00-FOUNDATION-ARCHITECTURE.md
├── apps/web/
│   ├── api/                   ← SWA Functions (secrets live here, never in the bundle)
│   └── src/
│       ├── app/               ← routing shells/layouts (parent, child, coach, school, admin)
│       ├── modules/           ← M1…M13 — each: index.ts, contracts.ts, ui/, data/, store/
│       ├── components/        ← shared UI primitives only
│       └── lib/               ← cross-cutting helpers (no business logic)
├── packages/shared/           ← shared types (database.types.ts)
└── supabase/migrations/       ← ALL schema changes as numbered migrations
```

## Actor & Access Model (M1)

Roles: `parent | coach | school | admin` (+ children as parent-owned records with their
own child-mode session). RBAC is defined centrally in M1 — never scatter role checks in
UI components; use M1's `can(actor, action, resource)` contract.

**Security invariants:**
- Secrets ONLY in SWA Function app settings / Supabase service-role. Never `VITE_*`.
- Admin authentication happens **server-side** (`/api/admin/*`), never in the browser.
- RLS on every table; children isolated by `account_id`; coach/school access is explicit,
  token-granted, revocable.
- DPDP (India) + COPPA posture: parental consent gate, minimal PII, no PII in logs.

## How To Start Each Session

> "We are building Master-Kids v2. Read CLAUDE.md, ADR-000, and the module spec for
> [module]. Current stage: [Stage N of the foundation build sequence]. Today's task: [X]."

Never begin coding a module without its accepted spec in `docs/modules/`.
