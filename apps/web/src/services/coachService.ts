// ── Coach service boundary ───────────────────────────────────────────────────
// UI talks only to this. Mock (write-through to coachStore) is the active path;
// supabase mirrors to coach_profiles/courses/course_milestones/enrollments/
// milestone_progress/messages (007_coach.sql) — deeper sync is a later step.

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import {
  useCoachStore, makeCode, PLAN_PRICING,
  type Course, type Milestone, type Enrollment, type CoachProfile, type CoachMessage,
} from '@/store/coachStore'

export interface RedeemResult {
  ok: boolean
  enrollmentId?: string
  courseTitle?: string
  coachName?: string
  error?: string
}

export interface CoachService {
  saveProfile(p: CoachProfile): Promise<void>
  createCourse(coachId: string, coachName: string, data: { title: string; discipline: string; description: string; plan: 'yearly' | '5yr' }): Promise<Course>
  updateCourse(id: string, patch: Partial<Course>): Promise<void>
  removeCourse(id: string): Promise<void>
  setMilestones(courseId: string, milestones: Milestone[]): Promise<void>
  redeem(code: string, child: { childId: string; childName: string; parentId: string; parentName: string }): Promise<RedeemResult>
  setProgress(enrollmentId: string, milestoneId: string, status: 'pending' | 'done', note?: string): Promise<void>
  markPaid(enrollmentId: string): Promise<void>
  sendMessage(enrollmentId: string, m: Omit<CoachMessage, 'id' | 'createdAt' | 'enrollmentId'>): Promise<void>
}

const store = () => useCoachStore.getState()

const base: CoachService = {
  async saveProfile(p) { store()._setProfile(p) },
  async createCourse(coachId, coachName, data) {
    const course: Course = {
      id: `course-${Date.now()}`, coachId, coachName,
      title: data.title, discipline: data.discipline, description: data.description,
      plan: data.plan, priceInr: PLAN_PRICING[data.plan].inr, joinCode: makeCode(),
      milestones: [], createdAt: Date.now(),
    }
    store()._setCourse(course)
    return course
  },
  async updateCourse(id, patch) { const c = store().courses[id]; if (c) store()._setCourse({ ...c, ...patch }) },
  async removeCourse(id) { store()._removeCourse(id) },
  async setMilestones(courseId, milestones) { const c = store().courses[courseId]; if (c) store()._setCourse({ ...c, milestones }) },
  async redeem(code, child) {
    const course = Object.values(store().courses).find((c) => c.joinCode.toUpperCase() === code.trim().toUpperCase())
    if (!course) return { ok: false, error: 'No course found for that code.' }
    // Already enrolled?
    const existing = Object.values(store().enrollments).find((e) => e.courseId === course.id && e.childId === child.childId)
    if (existing) return { ok: true, enrollmentId: existing.id, courseTitle: course.title, coachName: course.coachName }
    const enrollment: Enrollment = {
      id: `enr-${Date.now()}`, courseId: course.id, childId: child.childId, childName: child.childName,
      parentId: child.parentId, parentName: child.parentName, coachId: course.coachId,
      status: 'active', progress: {}, paid: false, createdAt: Date.now(),
    }
    store()._setEnrollment(enrollment)
    return { ok: true, enrollmentId: enrollment.id, courseTitle: course.title, coachName: course.coachName }
  },
  async setProgress(enrollmentId, milestoneId, status, note) {
    const e = store().enrollments[enrollmentId]; if (!e) return
    store()._setEnrollment({ ...e, progress: { ...e.progress, [milestoneId]: { status, achievedOn: status === 'done' ? new Date().toISOString().slice(0, 10) : undefined, note } } })
  },
  async markPaid(enrollmentId) { const e = store().enrollments[enrollmentId]; if (e) store()._setEnrollment({ ...e, paid: true }) },
  async sendMessage(enrollmentId, m) {
    store()._addMessage(enrollmentId, { ...m, enrollmentId, id: `msg-${Date.now()}`, createdAt: Date.now() })
  },
}

// Supabase mirror (best-effort; cache authoritative for UI).
const supabaseCoachService: CoachService = {
  ...base,
  async createCourse(coachId, coachName, data) {
    const course = await base.createCourse(coachId, coachName, data)
    if (supabase) await supabase.from('courses').insert({ coach_id: coachId, title: data.title, discipline: data.discipline, description: data.description, price_inr: course.priceInr })
    return course
  },
}

export const coachService: CoachService =
  AUTH_PROVIDER === 'supabase' ? supabaseCoachService : base
