# Master-Kids — Target Architecture

> Status: **Plan approved, not yet implemented.** This document is the blueprint for the
> child-centric revamp described in `Change request.docx`. Code lives in `apps/web`.
> Decisions locked with the user (2026-06-22): Supabase free tier as backend, single
> consolidated web app, Azure Static Web Apps hosting, target cost < $10/mo.

---

## 1. Product re-framing (from the Change Request)

The app pivots from a "daily log" tool to a **child-centric life platform**. The parent is the
**super-user / account owner**. Every feature is scoped to *one selected child*. The mental model:

```
Account (parent, 1 phone = 1 login)
  └── Child 1 ──┐
  └── Child 2   │  pick a child  →  the whole app re-scopes to that child
  └── Child N ──┘
                 ├── Profile
                 ├── Storyboard (class tiles, Nursery → Class 12)
                 ├── Academic (digital books, solved Q&A)
                 ├── Olympiad
                 ├── Extra-curricular (+ coach handshake)
                 ├── Knowledge / Daily / Weekend engagement
                 └── Social feed
```

Two more actor types sit alongside the parent:
- **Coach/Teacher** — own login, builds courses, attaches to a child via a handshake token.
- **Admin** — platform operator; enable/disable/add/remove any actor; monitor all modules.

---

## 2. System architecture

### 2.1 Now (MVP — single region, low traffic)

```
┌────────────────────────────────────────────────────────────┐
│  Browser / PWA (React 19 + Vite + Zustand + React Query)    │
│  Hosted on Azure Static Web Apps (Free) — global CDN edge   │
└───────────────┬───────────────────────────┬────────────────┘
                │ static assets             │ /api/*
                │ (served from edge)        ▼
                │              ┌──────────────────────────────┐
                │              │ SWA Managed Functions (Node) │
                │              │  /api/chat  (AI proxy)       │
                │              │  /api/otp   (request/verify) │
                │              │  /api/pay   (order/verify)   │
                │              │  /api/share (social deep-link)│
                │              └──────────┬───────────────────┘
                │                         │ service-role key (server-side only)
                ▼                         ▼
        ┌──────────────────────────────────────────────────┐
        │  Supabase (Free tier)                             │
        │   • Postgres + Row-Level Security (per-child)     │
        │   • Auth (phone OTP, JWT)                         │
        │   • Storage (photos, certificates, digital books) │
        └──────────────────────────────────────────────────┘
                │
                ▼  (variable cost, cached)
        ┌──────────────────────────────────────────────────┐
        │  AI provider (OpenAI gpt-4o-mini today;            │
        │  migrate to Claude Haiku/Sonnet per CLAUDE.md)     │
        └──────────────────────────────────────────────────┘
```

**Why this shape:**
- **No always-on server.** SWA static hosting + consumption Functions = idle cost ≈ $0.
- **Secrets never reach the browser.** OTP/payment/AI keys live only in Function app settings.
- **The browser talks to Supabase directly** for ordinary CRUD (protected by RLS + the
  user's JWT). Functions are reserved for actions that need a *secret* or a *trusted server*
  (AI, payment verification, OTP send, admin actions).

### 2.2 Scale path to 1,000,000 users

Nothing below is a rewrite — it's a swap of the same boundaries for higher-capacity equivalents.

| Concern | MVP | At scale |
|---|---|---|
| Static + edge | SWA Free | SWA Standard ($9) **or** Azure Front Door + Blob static site |
| API compute | SWA Managed Functions | Azure Container Apps (scale-to-zero → autoscale) behind Front Door |
| Database | Supabase Free Postgres | Postgres Flexible Server + read replicas, **or** Supabase Pro; data partitioned by `account_id` for tenant isolation |
| Hot data / rate limit | (none) | Upstash Redis (serverless) |
| Async AI / heavy jobs | inline in Function | Azure Service Bus queue → worker (Container App) |
| Media + books | Supabase Storage | Azure Blob + Azure CDN/Front Door |
| AI cost | pay-per-use | aggressive caching + Haiku for structuring, Sonnet for summaries |
| Observability | console + SWA logs | App Insights + Sentry + PostHog |

**Scaling principles baked in from day one:**
1. **Stateless API.** No server-side session; JWT in every request. Lets compute scale horizontally.
2. **Multi-tenant by `account_id`.** Every row carries the owning account; RLS enforces isolation.
   This is the natural Postgres partition / Cosmos partition key when we shard.
3. **Read-heavy → cache-first.** Knowledge content, digital books, olympiad sets are largely
   static and CDN/Redis-cacheable; they should never hit Postgres on the hot path.
4. **Expensive work is async.** AI structuring/summaries go through a queue at scale, never
   block a request.
5. **Content vs. user data are separate stores.** Curriculum/books/olympiad/knowledge is a
   read-only content catalog (cheap to cache, CDN-friendly); per-child progress is the only
   write-heavy data.

---

## 3. Frontend architecture (`apps/web`)

```
apps/web/src/
├── app/                 # routing shell + layouts (parent shell, child shell, coach, admin)
├── modules/             # one folder per Change-Request module (see MODULES.md)
│   ├── auth/            # OTP login
│   ├── parent/          # children CRUD, subscription, payment-skip
│   ├── profile/
│   ├── storyboard/      # class tiles, postcard flip, timeline
│   ├── academic/        # subjects, digital book reader, solved Q&A
│   ├── olympiad/
│   ├── social/
│   ├── extracurricular/
│   ├── coach/
│   ├── admin/
│   ├── knowledge/
│   └── engagement/      # daily feed, quote, weekend bonanza
├── components/          # shared UI primitives
├── stores/              # Zustand: authStore, childStore (selected child), uiStore
├── services/            # API layer — Supabase client + Function calls (swap target later)
├── data/                # seed/content catalogs (subjects, olympiad sets, knowledge items)
└── lib/                 # helpers (date, class-tile calc, image→postcard, print)
```

**Key frontend rules**
- **`childStore.selectedChildId` is global context.** Every scoped page reads it; switching
  child re-renders everything. Guard: if no child selected, redirect to child picker.
- **Class-tile gating** ([class logic](../docs/MODULES.md#5-storyboard)): a child in Class *N*
  sees tiles Nursery→*N* active; each **April** unlocks *N+1*. Computed from `enrolled_grade`
  + `academic_year_start`, not hard-coded.
- **Content is data, not code.** Subjects, olympiad sets, knowledge items, book pages come from
  `data/` (MVP) → Supabase content tables (later). New content never requires a deploy.
- **Local-first cache.** React Query caches server reads; Zustand persists selected child / UI.
- **PWA-ready.** Installable, offline shell for the daily engagement loop.

---

## 4. Security & compliance

- **RLS everywhere.** A parent reads only their own account's children/data; a coach reads only
  children who completed a handshake; admin uses a service-role path through Functions, never the
  browser. (Full policy matrix in `DATA_MODEL.md`.)
- **Secrets** only in SWA Function app settings / Supabase service-role (server-side). Never in
  the bundle, never in `VITE_*` vars.
- **Child-data isolation** by `account_id`; coach access is explicit + revocable (token).
- **DPDP (India) + COPPA**: parental consent gate, minimal PII, no PII in logs/analytics,
  media auto-expiry policy for raw audio (30-day max, per CLAUDE.md).
- **Auth**: phone OTP, short-lived JWT + refresh rotation (Supabase Auth defaults).
- **Payments**: amounts/verification server-side only; the in-app "skip/pass" button is a
  **test-only** bypass behind an env flag, never shipped enabled to production.

---

## 5. Deployment & CI/CD

- **Hosting**: Azure Static Web Apps. `apps/web` builds with `vite build` → `dist`; `apps/web/api`
  deploys as managed Functions. Existing workflow in `.github/workflows/`.
- **Environments**: `dev` (PR previews — SWA gives these free), `staging`, `production`.
- **Config**: per-environment via SWA app settings + Supabase project per env.
- **Rollback**: SWA keeps previous deployment; `git revert` + push redeploys.

See `AZURE_COST.md` for the full cost model and `MODULES.md` for per-module scope.
