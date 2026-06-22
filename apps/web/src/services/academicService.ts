// ── Academic service boundary ────────────────────────────────────────────────
// The catalog itself is static content (imported directly from data/). This
// service owns the *stateful* part — which subjects a child has chosen for a
// class — with mock (store) + supabase (child_subjects table) impls.

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import { useAcademicStore, childGradeKey } from '@/store/academicStore'
import { useAcademicContentStore, contentKey } from '@/store/academicContentStore'
import type { Lesson } from '@/data/academicCatalog'

export interface AcademicService {
  getSubjects(childId: string, grade: string): Promise<string[]>
  addSubject(childId: string, grade: string, key: string): Promise<void>
  removeSubject(childId: string, grade: string, key: string): Promise<void>
  // Parent-uploaded lesson content (the "build the rest over time" path).
  addLesson(grade: string, subjectKey: string, lesson: Lesson): Promise<void>
  removeLesson(grade: string, subjectKey: string, lessonId: string): Promise<void>
}

const store = () => useAcademicStore.getState()
const list = (childId: string, grade: string) => store().selected[childGradeKey(childId, grade)] ?? []

// Custom-content helpers (mock-backed today; an upload backend is a later step).
const content = () => useAcademicContentStore.getState()
function addCustomLesson(grade: string, subjectKey: string, lesson: Lesson) {
  const k = contentKey(grade, subjectKey)
  content()._setList(k, [...(content().custom[k] ?? []), { ...lesson, source: 'custom' }])
}
function removeCustomLesson(grade: string, subjectKey: string, lessonId: string) {
  const k = contentKey(grade, subjectKey)
  content()._setList(k, (content().custom[k] ?? []).filter((l) => l.id !== lessonId))
}

// ── Mock provider ─────────────────────────────────────────────────────────────
const mockAcademicService: AcademicService = {
  async getSubjects(childId, grade) {
    return list(childId, grade)
  },
  async addSubject(childId, grade, key) {
    const cur = list(childId, grade)
    if (!cur.includes(key)) store()._setList(childGradeKey(childId, grade), [...cur, key])
  },
  async removeSubject(childId, grade, key) {
    store()._setList(childGradeKey(childId, grade), list(childId, grade).filter((k) => k !== key))
  },
  async addLesson(grade, subjectKey, lesson) { addCustomLesson(grade, subjectKey, lesson) },
  async removeLesson(grade, subjectKey, lessonId) { removeCustomLesson(grade, subjectKey, lessonId) },
}

// ── Supabase provider (production) ────────────────────────────────────────────
const supabaseAcademicService: AcademicService = {
  async getSubjects(childId, grade) {
    if (!supabase) return list(childId, grade)
    const { data } = await supabase
      .from('child_subjects')
      .select('subject_key')
      .eq('child_id', childId)
      .eq('grade', grade)
      .eq('is_active', true)
    const keys = (data ?? []).map((r: any) => r.subject_key)
    store()._setList(childGradeKey(childId, grade), keys)
    return keys
  },
  async addSubject(childId, grade, key) {
    await mockAcademicService.addSubject(childId, grade, key) // optimistic cache
    if (!supabase) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('child_subjects').upsert({
      account_id: u.user?.id, child_id: childId, grade, subject_key: key, is_active: true,
    })
  },
  async removeSubject(childId, grade, key) {
    await mockAcademicService.removeSubject(childId, grade, key)
    if (!supabase) return
    await supabase.from('child_subjects').update({ is_active: false })
      .eq('child_id', childId).eq('grade', grade).eq('subject_key', key)
  },
  // Uploaded content is kept client-side for now; a Storage/table-backed upload
  // pipeline is a later step. Shares the same write-through helpers as mock.
  async addLesson(grade, subjectKey, lesson) { addCustomLesson(grade, subjectKey, lesson) },
  async removeLesson(grade, subjectKey, lessonId) { removeCustomLesson(grade, subjectKey, lessonId) },
}

export const academicService: AcademicService =
  AUTH_PROVIDER === 'supabase' ? supabaseAcademicService : mockAcademicService
