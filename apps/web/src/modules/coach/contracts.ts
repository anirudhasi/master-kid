// modules/coach/contracts.ts — M4 Tutor/Coach (spec §4, amended M4-A1)

export type VerificationStatus = 'unverified' | 'documents_submitted' | 'verified'
export type MilestoneStatus = 'not_started' | 'in_progress' | 'completed'

export interface CoachProfile {
  coachId: string
  name?: string
  subjects: string[]
  bio?: string
  experienceYears?: number
  verificationStatus: VerificationStatus
  city?: string
}

export interface Course {
  id: string
  title: string
  discipline?: string
  description?: string
  priceInr?: number
  milestones: { id: string; ordinal: number; title: string }[]
}

export interface Enrollment {
  id: string
  courseId?: string
  childId: string
  childName?: string
  status: 'pending' | 'active' | 'revoked'
  createdAt: string
}

export interface Message {
  id: string
  senderAccountId: string
  body: string
  createdAt: string
}

export interface CoachContract {
  getProfile(coachId: string): Promise<CoachProfile | null>
  upsertMyProfile(patch: Partial<Omit<CoachProfile, 'coachId' | 'verificationStatus'>>): Promise<void>
  submitVerificationDocuments(docUrls: string[]): Promise<void>   // → documents_submitted
  listMyCourses(): Promise<Course[]>
  upsertCourse(input: Omit<Course, 'id'> & { id?: string }): Promise<Course>
  listMyEnrollments(): Promise<Enrollment[]>
  /** Redeems an M1 handshake token (hashed, single-use — M4-A1) and creates the enrollment. */
  redeemHandshake(token: string): Promise<{ ok: boolean; enrollmentId?: string }>
  /** Writes THROUGH ChildContract.recordMilestoneProgress (seam rule 1). */
  updateMilestone(enrollmentId: string, milestoneId: string,
    status: MilestoneStatus, note?: string): Promise<void>
  getThread(childId: string): Promise<Message[]>
  sendMessage(childId: string, body: string): Promise<void>
}
