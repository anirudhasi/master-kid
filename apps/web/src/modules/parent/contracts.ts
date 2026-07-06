// modules/parent/contracts.ts — M2 Parent (spec §4)

export type ConsentKind =
  | 'data_processing' | 'community_visibility' | 'coach_sharing' | 'school_sharing'

export interface NewChild {
  name: string
  dob?: string                 // ISO date
  enrolledGrade: string        // 'NUR' | 'LKG' | 'UKG' | '1'..'12'
  board?: string
  photoUrl?: string
}

export interface ChildSummary {
  id: string
  name: string
  enrolledGrade: string
  board?: string
  photoUrl?: string
  isActive: boolean
}

export interface Consent {
  kind: ConsentKind
  granted: boolean
  decidedAt: string
}

export interface ParentContract {
  listChildren(): Promise<ChildSummary[]>
  createChild(input: NewChild): Promise<ChildSummary>       // emits child.created (isFirstChild)
  updateChild(id: string, patch: Partial<NewChild>): Promise<void>
  archiveChild(id: string): Promise<void>                   // soft-delete; hard-delete via consent flow
  setChildSubjects(childId: string, subjectIds: string[]): Promise<void>
  getConsents(childId: string): Promise<Consent[]>          // reads consents_current view
  setConsent(childId: string, kind: ConsentKind, granted: boolean): Promise<void> // append-only
}
