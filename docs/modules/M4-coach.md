# M4 — Tutor / Coach (Module Spec)

**Status:** Draft for sign-off · **Stage:** 3 (supply side)

## 1. Responsibility
The coach's workspace and the coach↔family relationship: profiles, courses, milestones,
enrollments, custom curricula, and coach↔parent messaging. Also the structural template
M5 School reuses ("a school is a coach with an org chart").

## 2. Owned data (all from 007)
`coach_profiles` · `courses` · `course_milestones` · `enrollments` · `custom_curricula` ·
`messages` (coach↔parent threads).
NOT owned: `milestone_progress` — M3 owns it; M4 writes through
`ChildContract.recordMilestoneProgress()` (seam rule 1).

## 3. Key flows
1. **Coach onboarding** — role `coach` (M1), profile with subjects/experience/verification
   status. `verification_status: unverified|documents_submitted|verified` (new column) —
   Discovery ranks verified higher; trust matters in Indian tutoring.
2. **Course builder** — courses + ordered milestones; optionally derived from a
   `custom_curricula` template.
3. **Enrollment via handshake** — parent grants token (M1) → coach redeems → `enrollments`
   row → `enrollment.handshake_completed`. Revocation (M1) deactivates enrollment; RLS
   drops access immediately.
4. **Session/milestone updates** — coach marks progress + note → M3 write-through →
   `milestone.progress_updated` → parent sees it (M2) + gets notified (M12). This loop is
   the product's trust engine — spec it, test it, polish it.
5. **Messaging** — threads scoped to (coach, parent, child). Retention & export included
   in DPDP data bundle.

## 4. Contract
```ts
export interface CoachContract {
  getProfile(coachId: string): Promise<CoachProfile>
  upsertMyProfile(patch: ProfilePatch): Promise<void>
  listMyCourses(): Promise<Course[]>
  upsertCourse(input: CourseInput): Promise<Course>
  listMyEnrollments(): Promise<Enrollment[]>
  redeemHandshake(token: string): Promise<{ ok: boolean }>   // delegates to M1, creates enrollment
  updateMilestone(enrollmentId: string, milestoneId: string,
    status: MilestoneStatus, note?: string): Promise<void>
  getThread(childId: string): Promise<Message[]>
  sendMessage(childId: string, body: string): Promise<void>
}
```

## 5. Events
Emits: `enrollment.handshake_completed` · `enrollment.ended` ·
`milestone.progress_updated` · `message.sent` · `coach.profile_updated`
Consumes: `access.revoked` (end enrollment)

## 6. DoD
- [ ] TutorPortal/Coach pages + coachService migrated into `modules/coach/`
- [ ] Verification status field + admin review hook (M10)
- [ ] Full handshake→enroll→progress→notify loop demonstrated in staging
- [ ] Messaging with RLS proven (coach sees only enrolled threads)
