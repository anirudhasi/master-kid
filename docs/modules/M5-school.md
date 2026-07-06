# M5 — School (Module Spec)

**Status:** Draft for sign-off · **Stage:** 5 (biggest net-new; B2B tier)

## 1. Responsibility
The institutional tier: school organizations, staff, classes/sections, rosters,
timetables, announcements, and the school↔parent link. Deliberately built on M4's
machinery — a school is structurally "a coach with an org chart."

## 2. Owned data (`019_school.sql`)
- `school_orgs` (owner_account_id → M1 role `school`, name, board, city, verification)
- `school_staff` (org_id, account_id, staff_role admin|teacher, subjects[])
- `school_classes` (org_id, grade, section, class_teacher)
- `school_rosters` (class_id, child_id, status invited|active|left, joined_at)
- `school_announcements` (org_id, scope org|class, body, published_at)
- `timetable` slots (absorb existing timetableStore's shape into DB)

## 3. Key decisions
1. **Roster consent flows through the parent, always.** School invites child (by phone
   lookup or code) → parent approves in-app (a school-flavored M1 handshake) → roster
   active. A school NEVER attaches to a child unilaterally. Same trust primitive as
   coaches, one mental model everywhere.
2. **Staff seats are sub-identities:** staff are normal accounts linked via
   `school_staff`; permissions derive from staff_role + class assignment. RLS: teacher
   reads only rostered children of their classes, and only school-context data (not the
   child's private storyboard/wallet — scope tables explicitly in the policy matrix).
3. **v1 scope = visibility + communication:** roster, timetable, announcements,
   class-level progress summaries (via M3 aggregates). NOT in v1: fee management,
   attendance hardware, exam engines. Each of those is its own ADR when a real school
   pilot demands it — scope creep here can eat a year.
4. **B2B commerce:** school plans are M9 plans with `seat_count`; per-seat licensing
   logic in M9, invoked by M5. Invoicing (GST) already in M9's 015.

## 4. Contract
```ts
export interface SchoolContract {
  getMyOrg(): Promise<SchoolOrg | null>
  upsertOrg(input: OrgInput): Promise<SchoolOrg>
  manageStaff(op: StaffOp): Promise<void>
  upsertClass(input: ClassInput): Promise<SchoolClass>
  inviteToRoster(classId: string, childRef: ChildLookup): Promise<{ inviteId: string }>
  getClassSummary(classId: string): Promise<ClassProgressSummary>   // composed from M3
  postAnnouncement(input: AnnouncementInput): Promise<void>          // fans out via M12
  getTimetable(classId: string): Promise<TimetableSlot[]>
}
```

## 5. Events
Emits: `school.roster_invited` · `school.roster_joined` · `school.announcement_posted`
Consumes: `access.revoked` (parent pulls child from roster)

## 6. DoD
- [ ] Migration 019 + role `school` live (schema already prepared by M1's 012)
- [ ] Invite→parent-approve→roster loop working
- [ ] Teacher RLS proven (sees only own classes' school-context data)
- [ ] Announcements → M12 fan-out; timetable migrated from store to DB
