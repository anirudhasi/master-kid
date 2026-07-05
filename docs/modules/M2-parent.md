# M2 — Parent (Module Spec)

**Status:** Draft for sign-off · **Stage:** 2 (launch-critical)

## 1. Responsibility
The parent's command center: manage children, see cross-child overview, control consent,
grants, subscriptions entry-points, and settings. Parent = account owner (M1); M2 is the
*experience and domain logic* on top of that identity.

## 2. Owned data
- `children` (from 001 — M2 is the sole writer; M3/M4/M5 read via contract/RLS)
- `child_subjects` (from 004 — parent curates the child's subject set)
- Consent records (new, `014_consent.sql`): (account_id, child_id, consent_kind
  data_processing|community_visibility|coach_sharing|school_sharing, granted_at,
  revoked_at) — DPDP requires demonstrable, revocable consent; today it's implicit.

## 3. Key flows
1. **Child CRUD + onboarding** (exists: KidOnboarding) — emits `child.created` →
   M9 starts trial, M3 initializes feed, M12 welcomes.
2. **Grant management UI** — list active coach/school grants per child (from M1/M4),
   one-tap revoke (`access.revoked`).
3. **Cross-child overview** — parent dashboard cards per child: streak, last activity,
   next milestone, subscription state. Reads ONLY via M3/M4/M9 contracts — the dashboard
   is a composition, it owns nothing it displays.
4. **Consent center** — DPDP screen: what's collected, per-purpose toggles, export &
   delete-my-data request (fulfilment via M10 admin runbook at launch; automated later).

## 4. Contract
```ts
export interface ParentContract {
  listChildren(): Promise<ChildSummary[]>
  createChild(input: NewChild): Promise<ChildSummary>
  updateChild(id: string, patch: Partial<NewChild>): Promise<void>
  archiveChild(id: string): Promise<void>          // soft-delete; hard-delete via consent flow
  setChildSubjects(childId: string, subjectIds: string[]): Promise<void>
  getConsents(childId: string): Promise<Consent[]>
  setConsent(childId: string, kind: ConsentKind, granted: boolean): Promise<void>
}
```

## 5. Events
Emits: `child.created` · `child.updated` · `child.archived` · `consent.changed`
Consumes: `subscription.*` (badge states) · `enrollment.handshake_completed` (grant list)

## 6. DoD
- [ ] Existing ParentDashboard/KidOnboarding migrated into `modules/parent/`
- [ ] Migration 014 + consent center UI
- [ ] Grant list + revoke wired through M1
- [ ] Dashboard composes exclusively via other modules' contracts (boundary lint clean)
