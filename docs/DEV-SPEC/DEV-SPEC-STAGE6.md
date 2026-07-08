# DEV SPEC — Stage 6 (M10 Admin & Flow Control · M11 Customer Service)

**Status:** Ready for execution after Stage 5 exit tests pass.
**Scope:** the operator console — toggles, the journey editor (the scoped drag-and-drop),
unified review queues, audit — plus integrated support.

**Spec amendment (grounded):**
- **M10-A1:** `admin_audit_log` (009) lacks a `details` column, but the Stage-1 admin
  gateway writes one — that insert would fail at runtime. 020 adds `details jsonb`
  (params capture is valuable audit data). This is grounding finding #7; it also means
  PR-5's acceptance test would have caught it — run the suites, they earn their keep.

Included artifacts (repo-relative):
```
supabase/migrations/020_admin.sql
supabase/migrations/021_support.sql
apps/web/src/modules/admin/contracts.ts
apps/web/src/modules/customer-service/contracts.ts
apps/web/api/admin/platform.js     ← toggles/journeys/review-queue actions (merge into gateway)
```

---

## PR sequence

### PR-30 — Migration 020 + feature toggles
- Apply 020 (audit fix + toggles + journeys + review_items).
- Merge `platform.js` actions into the admin gateway.
- `modules/admin/`: toggle management UI (global / per-plan / per-account scopes) with
  kill-switch semantics: a module toggle OFF hides routes + nav AND the module's
  contract functions throw `ModuleDisabledError` (modules check via a tiny
  `toggles.isEnabled(name)` helper reading a cached snapshot; snapshot refreshes on
  `toggle.changed`).
- Adopt at 3 call sites minimum: community, school, discovery.
**Accept:** flipping community OFF removes it within one refresh for a non-admin;
per-account override wins over global; every flip audited with details.

### PR-31 — Journey editor (the drag-and-drop, scoped)
- `journey_definitions` versioned rows; journeys shipped in v1:
  `onboarding_steps`, `child_daily_feed_composition`, `parent_nav_order`.
- Editor UI: drag to reorder, toggle steps on/off, edit step params (jsonb form),
  **save draft → publish** (new version) → **rollback = republish previous version**
  (one click; versions are immutable).
- App reads journeys through `modules/admin/journeys.ts` with a hardcoded fallback
  definition per journey (if the DB row is missing/corrupt, the app never breaks —
  the fallback IS the current hardcoded behavior).
- Step *types* are code; arrangement is data (per M10 spec §2.2 — this is not a BPMN
  engine and PRs must not grow it into one).
**Accept:** reorder onboarding steps → new users see the new order; rollback restores
instantly without deploy; deleting the DB row falls back gracefully; journey publishes
are audited + emit `journey.published`.

### PR-32 — Unified review queue
- `review_items` becomes the single inbox; adapters enqueue from:
  content drafts (M8 `content.draft_submitted`), coach verification requests (M4),
  community reports (M7 `report.filed`), school verification (M5),
  delete-my-data requests (M2).
- Queue UI: filter by kind, item preview (adapter-rendered), approve/reject with notes;
  resolution calls the kind's existing action (e.g. `content_publish`,
  `coach_set_verification`, `community_review`) — the queue orchestrates, domain
  actions execute.
- Retire the interim surfaces from PR-18/PR-22 (they fold into the queue).
**Accept:** one item of each kind flows enqueue → review → resolve → domain effect →
audit row; interim surfaces removed; queue survives an unknown kind gracefully
(renders raw, resolvable with notes only).

### PR-33 — Migration 021 + support (M11)
- Apply 021. Tier 0: `help` content category in M8 (uses the publishing workflow —
  write 10 seed FAQ items covering onboarding, payments, handshakes, PIN reset).
  Contextual "?" links per page → filtered help search.
- Tier 1: support mode for the existing `/api/chat` assistant — system prompt includes
  top FAQ content; when it can't resolve, it collects a structured ticket
  (`support_tickets` insert via RLS) and confirms via M12.
- Tier 2: provider evaluation per M11 spec criteria (free tier, WhatsApp channel,
  identity handoff, export). Evaluate at build time; wire the widget with identity
  handoff; store `provider_ref` on tickets. Phone = scheduled-callback ticket category,
  not a live line.
**Accept:** FAQ deflection answers a known question without a ticket; unresolvable
chat produces a well-formed ticket + confirmation notification; provider transcript
linked via provider_ref; DPDP export can enumerate a user's tickets.

### PR-34 — Ops dashboard (thin)
- Single admin page composing: review-queue counts by kind, ticket counts by status,
  yesterday's `notification_log` failures, `discovery_queries` top terms, and (when S1
  lands) agent spend. Read-only, service-role queries via gateway action `ops_snapshot`.
**Accept:** loads in one gateway call; numbers reconcile with direct SQL spot-checks.

## Test matrix (Stage 6 exit)
| Area | Test |
|---|---|
| Toggles | scope precedence (account > plan > global); kill-switch blocks contract calls, not just UI; audit |
| Journeys | publish/rollback versioning; fallback on missing row; no-deploy behavior change verified |
| Queue | all five kinds round-trip; resolution idempotent (double-click safe); audit completeness |
| Support | deflection → no ticket; ticket → notification; export path |
| Audit | M10-A1 regression: gateway writes succeed WITH details captured |

## Non-goals
Conditional branching / visual scripting in journeys (future ADR with concrete use
case); building chat/telephony infrastructure; automated delete-my-data execution
(remains a runbook actioned FROM the queue — automation is its own PR after launch).
