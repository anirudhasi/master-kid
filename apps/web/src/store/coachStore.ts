import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Shared coach data: profiles, courses + milestones, enrollments (the handshake),
// milestone progress, and the parent↔coach message threads. Global (cross-account)
// so a coach and a parent on the same device connect via a join code.

export type Cadence = 'day' | 'week' | 'month'

export interface Milestone {
  id: string
  cadence: Cadence
  title: string
  deliverable: string       // what the coach will deliver
  parentOutcome: string     // what the parent/student should see
  targetDate: string        // yyyy-mm-dd
}

export interface Course {
  id: string
  coachId: string
  coachName: string
  title: string
  discipline: string
  description: string
  plan: 'yearly' | '5yr'    // ₹300/yr or ₹1000/5yr
  priceInr: number
  joinCode: string
  milestones: Milestone[]
  createdAt: number
}

export interface Enrollment {
  id: string
  courseId: string
  childId: string
  childName: string
  parentId: string
  parentName: string
  coachId: string
  status: 'active' | 'revoked'
  progress: Record<string, { status: 'pending' | 'done'; achievedOn?: string; note?: string }>
  paid: boolean
  createdAt: number
}

export interface CoachMessage {
  id: string
  enrollmentId: string
  senderRole: 'coach' | 'parent'
  senderName: string
  kind: 'note' | 'progress' | 'complaint'
  body: string
  createdAt: number
}

export interface CoachProfile {
  coachId: string
  name: string
  disciplines: string[]
  bio: string
}

interface CoachState {
  profiles: Record<string, CoachProfile>
  courses: Record<string, Course>
  enrollments: Record<string, Enrollment>
  messages: Record<string, CoachMessage[]>
  _setProfile: (p: CoachProfile) => void
  _setCourse: (c: Course) => void
  _removeCourse: (id: string) => void
  _setEnrollment: (e: Enrollment) => void
  _addMessage: (enrollmentId: string, m: CoachMessage) => void
}

export const useCoachStore = create<CoachState>()(
  persist(
    (set) => ({
      profiles: {}, courses: {}, enrollments: {}, messages: {},
      _setProfile: (p) => set((s) => ({ profiles: { ...s.profiles, [p.coachId]: p } })),
      _setCourse: (c) => set((s) => ({ courses: { ...s.courses, [c.id]: c } })),
      _removeCourse: (id) => set((s) => { const n = { ...s.courses }; delete n[id]; return { courses: n } }),
      _setEnrollment: (e) => set((s) => ({ enrollments: { ...s.enrollments, [e.id]: e } })),
      _addMessage: (eid, m) => set((s) => ({ messages: { ...s.messages, [eid]: [...(s.messages[eid] ?? []), m] } })),
    }),
    { name: 'mk-coach-v1' },
  ),
)

export const PLAN_PRICING = {
  yearly: { inr: 300, label: '₹300 / year' },
  '5yr':  { inr: 1000, label: '₹1000 / 5 years' },
} as const

export const coursesByCoach = (all: Record<string, Course>, coachId: string) =>
  Object.values(all).filter((c) => c.coachId === coachId).sort((a, b) => b.createdAt - a.createdAt)
export const enrollmentsByCourse = (all: Record<string, Enrollment>, courseId: string) =>
  Object.values(all).filter((e) => e.courseId === courseId && e.status === 'active')
export const enrollmentsByCoach = (all: Record<string, Enrollment>, coachId: string) =>
  Object.values(all).filter((e) => e.coachId === coachId && e.status === 'active')

export function makeCode(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MK-${part()}-${part()}`
}
