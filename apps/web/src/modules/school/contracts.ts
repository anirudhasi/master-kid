// modules/school/contracts.ts — M5 School (spec §4, dev-spec M5-D1/D2)

import type { Timetable } from './timetable-types' // moved from store/timetableStore (PR-26)

export type StaffRole = 'admin' | 'teacher'
export type OrgVerification = 'unverified' | 'documents_submitted' | 'verified'

export interface SchoolOrg {
  id: string
  name: string
  board?: string
  city?: string
  verificationStatus: OrgVerification
}

export interface SchoolClass {
  id: string
  grade: string
  section: string
  classTeacherId?: string
  joinCode?: string            // visible to staff only
  timetable?: Timetable
  timetablePublishedAt?: string
}

export interface RosterEntry {
  id: string
  classId: string
  childName: string            // display snapshot (M5-D1) — never joined to children
  status: 'active' | 'left'
  joinedAt: string
}

export interface RosterInvite {
  id: string
  classId: string
  className?: string
  orgName?: string
  expiresAt: string
}

export interface Announcement {
  id: string
  classId?: string             // undefined = org-wide
  body: string
  publishedAt: string
}

export interface SchoolContract {
  // ── school-side ──
  getMyOrg(): Promise<SchoolOrg | null>
  upsertOrg(input: Pick<SchoolOrg, 'name' | 'board' | 'city'>): Promise<SchoolOrg>
  submitVerificationDocuments(docUrls: string[]): Promise<void>
  manageStaff(op: { action: 'add' | 'remove' | 'set_role'; phone?: string;
    accountId?: string; role?: StaffRole; subjects?: string[] }): Promise<void>
  upsertClass(input: Omit<SchoolClass, 'joinCode' | 'timetablePublishedAt'> & { id?: string }): Promise<SchoolClass>
  rotateJoinCode(classId: string): Promise<{ joinCode: string }>
  getRoster(classId: string): Promise<RosterEntry[]>
  inviteByPhone(classId: string, phone: string): Promise<void>   // anti-enumeration: always succeeds silently
  publishTimetable(classId: string, t: Timetable): Promise<void>
  postAnnouncement(input: { classId?: string; body: string }): Promise<void>

  // ── parent-side ──
  redeemClassCode(code: string, childId: string): Promise<{ ok: boolean }>
  myRosterInvites(): Promise<RosterInvite[]>
  resolveInvite(inviteId: string, childId: string, approve: boolean): Promise<boolean>
  leaveRoster(rosterId: string): Promise<void>                    // emits access.revoked
  getAnnouncementsForChild(childId: string): Promise<Announcement[]>
}
