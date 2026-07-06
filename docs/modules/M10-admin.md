# M10 — Admin & Flow Control (Module Spec)

**Status:** Draft for sign-off · **Stage:** 6

## 1. Responsibility
The operator console: platform configuration, module/feature toggles, the **journey
editor** (the scoped answer to "drag-and-drop control of the complete flow"), review
queues (content drafts, coach verification, community reports), user administration,
and the audit trail. Everything here runs through server-side admin auth (M1 §5).

## 2. Scoping decision — what "drag-and-drop flow control" means in v1
A general BPMN/workflow engine is a product in itself and would consume months. v1
delivers the three things the phrase actually needs:

1. **Module & feature toggles** — turn modules (M5 school, M7 community…) and features
   on/off globally, per plan, or per account (kill-switches + gradual rollout).
2. **Journey editor (drag-and-drop)** — reorderable, toggleable *steps* for defined
   journeys: onboarding flow, child daily-feed composition, navigation order. Journeys
   are declarative JSON (`journey_definitions`); the app renders from the definition.
   Drag-and-drop reorders steps — it does not invent arbitrary logic. New step *types*
   are added in code; arrangement is admin-editable.
3. **Review queues** — unified inbox: content drafts (M8), coach verification (M4),
   community reports (M7), delete-my-data requests (M2). Approve/reject with notes; all
   actions audited.

Anything beyond this (conditional branching, visual scripting) → future ADR with a
concrete use case.

## 3. Owned data
`admin_audit_log` (009 — every admin mutation writes here, enforced in `/api/admin/*`) ·
`020_admin.sql`: `feature_toggles` (key, scope global|plan|account, value, updated_by) ·
`journey_definitions` (key, version, definition jsonb, published_at, published_by) ·
`review_items` (kind, ref_id, status pending|approved|rejected, reviewer, notes).

## 4. Contract
```ts
export interface AdminContract {   // ALL server-side via /api/admin/*
  getToggles(): Promise<Toggle[]>
  setToggle(key: string, scope: ToggleScope, value: boolean): Promise<void>
  getJourney(key: string): Promise<JourneyDefinition>
  saveJourneyDraft(key: string, def: JourneyDefinition): Promise<void>
  publishJourney(key: string): Promise<void>       // versioned; instant rollback = republish previous
  getReviewQueue(kind?: ReviewKind): Promise<ReviewItem[]>
  resolveReview(id: string, decision: 'approved'|'rejected', notes?: string): Promise<void>
  searchAccounts(q: string): Promise<AccountAdminView[]>
  setAccountStatus(accountId: string, status: 'active'|'disabled'): Promise<void>
}
```

## 5. Events
Emits: `admin.action_performed` (all) · `toggle.changed` · `journey.published`
Consumes: `content.draft_submitted` · `report.filed` · verification requests → queue

## 6. DoD
- [ ] Server-side admin auth live (M1 §5) — precondition, not part of this module
- [ ] Migration 020; toggles respected by ≥3 modules via M9/M10 gates
- [ ] Journey editor: reorder + toggle onboarding steps, publish, rollback demonstrated
- [ ] Unified review queue operating on real M7/M8 items; 100% actions in audit log
