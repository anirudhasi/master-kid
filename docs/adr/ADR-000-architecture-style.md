# ADR-000 — Architecture Style: Modular Monolith with Strangler-Fig Extraction

**Status:** Proposed (awaiting owner sign-off)
**Date:** 2026-07-04
**Deciders:** Ani (Product Owner / Builder), Claude (System Architect)
**Supersedes:** implicit architecture in stale `CLAUDE.md` (React Native + Hono/Lambda habit-tracker — obsolete)

---

## Context

Master-Kids is pivoting from its current build (React 19 + Vite SPA on Azure Static Web Apps,
Supabase Postgres/Auth/Storage, thin SWA Functions) into a professional multi-module platform:

Parent · Child · Tutor/Mentor · School · Discovery · Community · Admin (flow control) ·
Customer Service · Intelligent Layer (agent fleet).

Constraints that shape this decision:

1. **Team size: one person.** Every operational burden lands on a single builder.
2. **Nearest milestone: public launch.** Time-to-market matters more than theoretical scale.
3. **Cost ceiling:** current infra target is <$10/mo (per `docs/ARCHITECTURE.md`, decision of 2026-06-22).
4. **Explicit product constraint:** build *on top of* the current app without disturbing it.
5. **Existing asset:** 11 Supabase migrations already form a coherent multi-tenant schema
   (tenancy → wallet). The data layer is ahead of the code layer.

## Options Considered

### Option A — Full microservices from day one
Each module (a–i) is an independently deployed service with its own database, API, and pipeline.

- ✅ Independent scaling and deployment per module; matches the long-term vision literally.
- ❌ ~10 deployables, ~10 CI/CD pipelines, service discovery, a message broker, distributed
  tracing, and inter-service auth — operated by one person.
- ❌ Distributed-systems tax (network partitions, eventual consistency, saga patterns) paid
  *before* any module has the traffic to justify it.
- ❌ Blows the cost ceiling by an order of magnitude (always-on services, broker, observability stack).
- ❌ Slowest possible path to public launch.

### Option B — Keep the current structure, add features ad-hoc
Continue growing `apps/web` organically (more pages, more stores, more service files).

- ✅ Fastest short-term velocity.
- ❌ Already showing strain: 18 Zustand stores, cross-cutting reads, content-as-code in `src/data/`.
- ❌ No seams → future extraction becomes a rewrite. Directly contradicts the "professional
  next version" goal.

### Option C — Modular monolith with designed seams (strangler-fig extraction path) ✅ CHOSEN
One deployable. Hard internal module boundaries. Each module: owns its tables, exposes a typed
interface, communicates with other modules only through that interface (and later, events).
Modules are extracted into real services one at a time, when — and only when — they earn it.

- ✅ 90% of microservice benefits (isolation, ownership, testability, clear contracts) at ~10% of
  the operational cost.
- ✅ One pipeline, one deploy, one thing to debug — operable by a solo builder.
- ✅ Extraction is a move across an existing seam, not a rewrite. The current build is preserved
  and re-organized, not replaced.
- ✅ Fits the cost ceiling until revenue justifies more.
- ⚠️ Requires discipline: boundary violations must be treated as build failures (lint rules /
  dependency checks), not suggestions.

## Decision

**Adopt Option C.** The target end-state topology remains service-oriented; the *path* is a
modular monolith whose module seams are the future service boundaries.

### Extraction triggers (when a module becomes a real service)
A module is extracted only when at least one of these is true:

1. **Rhythm mismatch** — it runs on its own schedule independent of user requests
   (→ the Intelligent Layer / agent fleet is expected to be the first extraction).
2. **Scale mismatch** — its load profile diverges 10× from the rest of the app.
3. **Blast-radius risk** — its failures must not take down the core app (e.g., payment webhooks).
4. **Team split** — a second developer/team takes ownership of it.

### Non-negotiable seam rules (enforced from the first refactor)
1. A module's tables are written **only** by that module. Cross-module reads go through the
   module's exported API, never raw table access.
2. Every module ships a `contracts.ts` (types + function signatures) — this file *is* the future
   service API.
3. Cross-module side-effects use an in-process event bus with typed events; the bus is swappable
   for a real broker (queue) at extraction time.
4. No module imports another module's internals. Only `modules/<name>/index.ts` exports are public.

## Consequences

- `CLAUDE.md` must be rewritten immediately — it currently describes a dead architecture and
  will mislead any human or AI collaborator.
- The existing `apps/web/src` (pages/stores/services/data) will be progressively re-homed into
  `modules/` folders per the seam rules; this is a re-organization, not a rewrite.
- The Intelligent Layer will be designed *as a service from day one* (its rhythm-driven nature
  meets trigger #1 immediately) — it is the exception that proves the rule.
- All future significant decisions get their own numbered ADR in `docs/adr/`.

## Revisit Criteria

Re-open this decision if: (a) team grows beyond 4 engineers, (b) an enterprise/school procurement
contract mandates service isolation, or (c) two or more modules simultaneously hit extraction
triggers and monolith deploys become the bottleneck.
