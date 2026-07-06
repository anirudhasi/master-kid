# DEV SPEC — Stage 5 (M5 School)

**Status:** Ready for execution after Stage 4 exit tests pass.
**Scope:** the institutional tier — orgs, staff, classes, consent-safe rosters,
announcements, class timetables. Built on M4's trust primitives ("a coach with an
org chart").

**Grounding notes + design decisions (recorded as spec refinements):**
- **M5-D1 (privacy architecture):** school staff get **no read policy on `children`**.
  `school_rosters` stores a `child_name` display snapshot (denormalized at join,
  refreshed on `child.updated`). A compromised school account can enumerate its own
  roster names — never DOB, photos, progress, or family data. Class progress summaries
  arrive later as aggregates via M3's contract, not raw access.
- **M5-D2 (consent mechanics):** primary flow is **parent-initiated join by class code**
  (consent inherent in the act). Secondary flow is school-initiated invite → parent
  approves in-app. Both land in the same `school_rosters` table; a school can never
  attach to a child unilaterally — there is no code path for it.
- **Timetable:** the existing client `Timetable` shape (periods/days/grid) is adopted
  verbatim as the `jsonb` schema; class-level timetable becomes the source for rostered
  children, personal timetables keep working for non-school children.

Included artifacts (repo-relative):
```
supabase/migrations/019_school.sql
apps/web/src/modules/school/contracts.ts
apps/web/api/admin/school.js        ← org verification action (merge into admin gateway)
```

---

## PR sequence

### PR-25 — Migration 019 + school onboarding
- Apply 019. School signup path (M1 role `school` from 012) + org details form →
  `school_orgs` row (`verification_status = unverified`).
- Admin gateway gains `school_set_verification` (merge `api/admin/school.js`);
  unverified orgs can set up classes but rosters stay capped at 5 (pilot mode) until
  verified — anti-abuse without blocking evaluation.
**Accept:** school account signs up, creates org; verification flip via admin lifts the
roster cap; RLS: a school account sees only its own org rows.

### PR-26 — Classes, staff, timetable
- Class CRUD (grade, section, class teacher); staff management (link accounts by phone
  → `school_staff` with role admin|teacher).
- Class timetable editor: reuse the existing Timetable UI components against the class
  `timetable jsonb`; publishing a class timetable pushes it to rostered children's
  planner (M3 event `content.updated`-style fan-out or direct contract call — decide
  in PR, prefer event).
- Migrate SchoolTimetable page + timetableStore into `modules/school/` (personal
  timetables remain a child-scoped feature; shared-community timetables are retired in
  favor of class timetables — note in changelog).
**Accept:** teacher of class X can edit X's timetable, cannot see class Y (RLS test);
rostered child's planner reflects the published class timetable.

### PR-27 — Rosters (the consent-critical PR)
- **Join-code flow (primary):** class shows a rotating 6-char join code; parent enters
  code, picks child → `redeem_class_code` RPC → active roster row with name snapshot.
- **Invite flow (secondary):** school enters parent phone → `roster_invites` row (phone
  stored hashed; no confirmation to the school whether the phone exists — anti-enumeration)
  → parent sees pending invite on login → approve creates roster row / decline deletes.
- Parent can remove their child from a roster at any time (M2 grant list shows school
  memberships next to coach grants); removal emits `access.revoked`.
**Accept:** no code path lets a school create an ACTIVE roster row without a parent
action (grep + RLS test with direct insert as school role); anti-enumeration verified
(invite to non-existent phone returns identical response); name snapshot refreshes on
`child.updated`.

### PR-28 — Announcements + notifications
- Org-wide and class-scoped announcements; publish fans out via M12 to parents of
  rostered children (`school.announcement_posted` → notify category `progress`).
- Rate rule: max 2 announcement pushes per org per day (parents of schoolchildren are
  the most spam-sensitive audience this platform has).
**Accept:** class announcement reaches exactly the rostered parents; org announcement
reaches all; rate rule suppresses the 3rd push with `suppressed` logged.

### PR-29 — School plans (B2B commerce hook)
- M9: add school plan rows (`school_pilot` free ≤30 seats, `school_standard` per-seat
  yearly) — seat count enforced at roster-activation time via M9 `hasFeature`-style
  check `hasSeats(orgId)`.
- Razorpay flow reused from PR-12 with `target_type='school_subscription'`.
**Accept:** seat cap blocks the N+1th activation with a clear upgrade prompt; payment
lifts cap; invoice generated with org details.

## Test matrix (Stage 5 exit)
| Area | Test |
|---|---|
| Privacy | school/teacher role has zero rows visible from `children` (SQL as that role); roster shows snapshot only |
| Consent | direct roster insert as school role fails RLS; join-code + invite→approve both work; parent removal revokes immediately |
| Scoping | teacher sees own classes only; org admin sees all org classes; cross-org isolation |
| Timetable | class publish → child planner; personal timetable untouched for non-rostered child |
| Seats | cap enforced at activation, not invite; upgrade path works |

## Non-goals
Fee management, attendance, exam engines (each needs its own ADR + a real school pilot
demanding it); school listings in Discovery (small follow-up: add `school` kind to the
projection builder when the first verified org exists); staff seats beyond admin|teacher.
