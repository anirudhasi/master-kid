import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  type SyllabusSubject,
  type SyllabusChapter,
  type OlympiadExam,
  type DaySchedule,
  type Worksheet,
  type LogEntry,
  type Mood,
} from './appStore'
import { type KidOnboardingData } from '@/modules/identity'
import { chaptersFor } from '@/data/syllabusCatalog'
import { logActivity } from '@/store/activityLogStore'

// ── Assigned library sheets ───────────────────────────────────────────────────
// A parent assigns a PDF from the Worksheet Library to the kid; it shows in
// "Assigned to me" with dates, and marks are captured after solving on paper
// (the answer key is inside the sheet).
export interface AssignedSheet {
  id: string
  title: string
  file: string
  url: string
  subjectName: string
  classNum: string
  assignedDate: string          // ISO date
  dueDate: string               // ISO date
  status: 'assigned' | 'completed'
  score?: number
  maxScore?: number
  completedDate?: string
}

// ── Per-kid data shape ────────────────────────────────────────────────────────
export interface KidData {
  subjects:       SyllabusSubject[]
  olympiads:      OlympiadExam[]
  weeklySchedule: DaySchedule[]
  worksheets:     Worksheet[]
  assignedSheets?: AssignedSheet[]   // optional: older persisted data lacks it
  logs:           LogEntry[]
  badges:         string[]
  xpTotal:        number
  streakDays:     number
}

export const EMPTY_KID_DATA: KidData = {
  subjects:       [],
  olympiads:      [],
  weeklySchedule: [],
  worksheets:     [],
  assignedSheets: [],
  logs:           [],
  badges:         [],
  xpTotal:        0,
  streakDays:     0,
}

// ── Subject name → visual metadata ───────────────────────────────────────────
export const SUBJECT_META: Record<string, { icon: string; color: string; colorLight: string; textbook: string }> = {
  'Mathematics':                   { icon: '📐', color: '#4F46E5', colorLight: '#EEF2FF', textbook: 'NCERT Mathematics' },
  'English':                       { icon: '📖', color: '#059669', colorLight: '#ECFDF5', textbook: 'NCERT English' },
  'English Language':              { icon: '📖', color: '#059669', colorLight: '#ECFDF5', textbook: 'English Language' },
  'English Literature':            { icon: '📚', color: '#047857', colorLight: '#ECFDF5', textbook: 'English Literature' },
  'Hindi':                         { icon: '🔤', color: '#DC2626', colorLight: '#FFF5F5', textbook: 'NCERT Hindi' },
  'Environmental Studies (EVS)':   { icon: '🌍', color: '#0891B2', colorLight: '#ECFEFF', textbook: 'NCERT Looking Around' },
  'EVS (Science & Social)':        { icon: '🌍', color: '#0891B2', colorLight: '#ECFEFF', textbook: 'NCERT Looking Around' },
  'EVS':                           { icon: '🌍', color: '#0891B2', colorLight: '#ECFEFF', textbook: 'NCERT Looking Around' },
  'Science':                       { icon: '🔬', color: '#0369A1', colorLight: '#F0F9FF', textbook: 'NCERT Science' },
  'Social Science':                { icon: '🗺️', color: '#D97706', colorLight: '#FFFBEB', textbook: 'NCERT Social Science' },
  'Social Studies':                { icon: '🗺️', color: '#D97706', colorLight: '#FFFBEB', textbook: 'Social Studies' },
  'History':                       { icon: '📜', color: '#92400E', colorLight: '#FEF3C7', textbook: 'NCERT History' },
  'Geography':                     { icon: '🌐', color: '#065F46', colorLight: '#ECFDF5', textbook: 'NCERT Geography' },
  'Civics':                        { icon: '⚖️', color: '#1E40AF', colorLight: '#EFF6FF', textbook: 'NCERT Civics' },
  'History & Civics':              { icon: '⚖️', color: '#1E40AF', colorLight: '#EFF6FF', textbook: 'History & Civics' },
  'Computer':                      { icon: '💻', color: '#7C3AED', colorLight: '#F5F3FF', textbook: 'Computer Studies' },
  'Computer Science':              { icon: '💻', color: '#7C3AED', colorLight: '#F5F3FF', textbook: 'Computer Science' },
  'Computer Applications':         { icon: '💻', color: '#7C3AED', colorLight: '#F5F3FF', textbook: 'Computer Applications' },
  'Informatics Practices':         { icon: '💻', color: '#6D28D9', colorLight: '#F5F3FF', textbook: 'Informatics Practices' },
  'Information Technology':        { icon: '🖥️', color: '#6D28D9', colorLight: '#F5F3FF', textbook: 'Information Technology' },
  'Sanskrit':                      { icon: '📜', color: '#B45309', colorLight: '#FFFBEB', textbook: 'NCERT Sanskrit Manika' },
  'Physics':                       { icon: '⚛️', color: '#1D4ED8', colorLight: '#EFF6FF', textbook: 'NCERT Physics' },
  'Chemistry':                     { icon: '🧪', color: '#7C3AED', colorLight: '#F5F3FF', textbook: 'NCERT Chemistry' },
  'Biology':                       { icon: '🧬', color: '#059669', colorLight: '#ECFDF5', textbook: 'NCERT Biology' },
  'Economics':                     { icon: '💰', color: '#047857', colorLight: '#ECFDF5', textbook: 'NCERT Economics' },
  'Accountancy':                   { icon: '🧾', color: '#0F766E', colorLight: '#CCFBF1', textbook: 'NCERT Accountancy' },
  'Business Studies':              { icon: '💼', color: '#1E40AF', colorLight: '#EFF6FF', textbook: 'NCERT Business Studies' },
  'Political Science':             { icon: '🏛️', color: '#1E40AF', colorLight: '#EFF6FF', textbook: 'NCERT Political Science' },
  'Psychology':                    { icon: '🧠', color: '#7C3AED', colorLight: '#F5F3FF', textbook: 'NCERT Psychology' },
  'Sociology':                     { icon: '👥', color: '#DC2626', colorLight: '#FFF5F5', textbook: 'NCERT Sociology' },
  'Drawing & Art':                 { icon: '🎨', color: '#F59E0B', colorLight: '#FFFBEB', textbook: 'Drawing & Art' },
  'Fine Arts':                     { icon: '🎨', color: '#F59E0B', colorLight: '#FFFBEB', textbook: 'Fine Arts' },
  'Physical Education':            { icon: '🏃', color: '#EA580C', colorLight: '#FFF7ED', textbook: 'Physical Education' },
  'General Knowledge':             { icon: '🌟', color: '#CA8A04', colorLight: '#FEFCE8', textbook: 'GK' },
  'General Knowledge (GK)':       { icon: '🌟', color: '#CA8A04', colorLight: '#FEFCE8', textbook: 'GK' },
  'Value Education':               { icon: '💎', color: '#059669', colorLight: '#ECFDF5', textbook: 'Value Education' },
  'Moral Science':                 { icon: '💎', color: '#059669', colorLight: '#ECFDF5', textbook: 'Moral Science' },
  'French':                        { icon: '🇫🇷', color: '#1D4ED8', colorLight: '#EFF6FF', textbook: 'French (DELF)' },
  'German':                        { icon: '🇩🇪', color: '#1D4ED8', colorLight: '#EFF6FF', textbook: 'German (Goethe)' },
  'Music':                         { icon: '🎵', color: '#8B5CF6', colorLight: '#F5F3FF', textbook: 'Music' },
  'Home Science':                  { icon: '🏠', color: '#059669', colorLight: '#ECFDF5', textbook: 'Home Science' },
  'Commerce':                      { icon: '💼', color: '#1E40AF', colorLight: '#EFF6FF', textbook: 'Commerce' },
  'Mother Tongue (Kannada)':       { icon: '🔤', color: '#B45309', colorLight: '#FFFBEB', textbook: 'Kannada' },
  'Mother Tongue (Tamil)':         { icon: '🔤', color: '#DC2626', colorLight: '#FFF5F5', textbook: 'Tamil' },
  'Mother Tongue (Telugu)':        { icon: '🔤', color: '#7C3AED', colorLight: '#F5F3FF', textbook: 'Telugu' },
  'Mother Tongue (Marathi)':       { icon: '🔤', color: '#0891B2', colorLight: '#ECFEFF', textbook: 'Marathi' },
  'Mother Tongue (Malayalam)':     { icon: '🔤', color: '#059669', colorLight: '#ECFDF5', textbook: 'Malayalam' },
  'Mother Tongue (Bengali)':       { icon: '🔤', color: '#D97706', colorLight: '#FFFBEB', textbook: 'Bengali' },
  'Design':                        { icon: '✏️', color: '#6D28D9', colorLight: '#F5F3FF', textbook: 'Design' },
}

function getSubjectMeta(name: string) {
  return SUBJECT_META[name] ?? { icon: '📚', color: '#64748B', colorLight: '#F8FAFC', textbook: name }
}

// Sequential ~2-week windows across the Indian academic year (June → March).
function chapterWindows(count: number): { start: string; end: string }[] {
  const now = new Date()
  const yearStart = new Date(now.getMonth() >= 5 ? now.getFullYear() : now.getFullYear() - 1, 5, 1)
  const totalDays = 280 // June 1 → mid-March
  const span = Math.max(7, Math.floor(totalDays / Math.max(count, 1)))
  const iso = (d: Date) => d.toISOString().split('T')[0]
  return Array.from({ length: count }, (_, i) => {
    const s = new Date(yearStart); s.setDate(s.getDate() + i * span)
    const e = new Date(s); e.setDate(e.getDate() + span - 3)
    return { start: iso(s), end: iso(e) }
  })
}

/** Build the preloaded chapter list for a subject from the syllabus catalog. */
export function buildChapters(subjectName: string, grade: string, subjectId: string): SyllabusSubject['chapters'] {
  const names = chaptersFor(grade, subjectName)
  const windows = chapterWindows(names.length)
  return names.map((name, i) => ({
    id: `${subjectId}-ch${i + 1}-${Math.random().toString(36).slice(2, 6)}`,
    name,
    topics: [],
    targetStartDate: windows[i].start,
    targetEndDate: windows[i].end,
    status: 'not-started' as const,
    notes: '',
  }))
}

export function createSubjectStub(name: string, kidId: string, grade?: string): SyllabusSubject {
  const meta = getSubjectMeta(name)
  const id = `${kidId}-${name.toLowerCase().replace(/[\s()&/+.]+/g, '-')}`
  return {
    id,
    name,
    icon: meta.icon,
    color: meta.color,
    colorLight: meta.colorLight,
    textbook: meta.textbook,
    teacher: 'TBD',
    chapters: grade ? buildChapters(name, grade, id) : [],
  }
}

// ── Progress helpers (chapter progress rolls up into the subject bar) ─────────
export function chapterPct(ch: SyllabusChapter): number {
  if (ch.topics.length > 0) {
    return Math.round((ch.topics.filter(t => t.isCompleted).length / ch.topics.length) * 100)
  }
  if (ch.status === 'completed' || ch.status === 'revised') return 100
  if (ch.status === 'in-progress') return 50
  return 0
}

export function subjectPct(sub: SyllabusSubject): number {
  if (!sub.chapters.length) return 0
  return Math.round(sub.chapters.reduce((a, c) => a + chapterPct(c), 0) / sub.chapters.length)
}

// ── Badge awarding helper ─────────────────────────────────────────────────────
function awardBadges(xp: number, streak: number, badges: string[]): string[] {
  const b = [...badges]
  if (xp >= 1   && !b.includes('First Log 🌟'))       b.push('First Log 🌟')
  if (xp >= 100 && !b.includes('100 XP Club'))         b.push('100 XP Club')
  if (xp >= 500 && !b.includes('500 XP Scholar'))      b.push('500 XP Scholar')
  if (streak >= 3 && !b.includes('3-Day Streak 🔥'))   b.push('3-Day Streak 🔥')
  if (streak >= 7 && !b.includes('7-Day Streak ⚡'))   b.push('7-Day Streak ⚡')
  if (streak >= 14 && !b.includes('14-Day Streak 💪')) b.push('14-Day Streak 💪')
  return b
}



// ── Store interface ───────────────────────────────────────────────────────────
interface KidsDataState {
  kidsData: Record<string, KidData>

  initKidData:              (kidId: string, onboarding: KidOnboardingData, grade?: string) => void
  /** Re-key all data when a legacy local kid id is migrated to a UUID. */
  migrateKidId:             (oldId: string, newId: string) => void
  /** Backfill preloaded catalog chapters into subjects that still have none. */
  ensureChapters:           (kidId: string, grade: string) => void
  addChapter:               (kidId: string, subjectId: string, name: string) => void
  removeChapter:            (kidId: string, subjectId: string, chapterId: string) => void
  /** Parent assigns a library PDF to this kid ("Assigned to me" tab). */
  assignSheet:              (kidId: string, sheet: Omit<AssignedSheet, 'id' | 'assignedDate' | 'status'>) => void
  unassignSheet:            (kidId: string, assignmentId: string) => void
  /** Capture marks after solving on paper — completes the sheet, awards XP. */
  completeSheet:            (kidId: string, assignmentId: string, score: number, maxScore: number) => void
  addLog:                   (kidId: string, subject: string, activity: string, durationMinutes: number, mood: Mood) => void
  toggleTopicComplete:      (kidId: string, subjectId: string, chapterId: string, topicId: string) => void
  updateChapterStatus:      (kidId: string, subjectId: string, chapterId: string, status: SyllabusChapter['status']) => void
  updateSubjectTextbook:    (kidId: string, subjectId: string, textbook: string) => void
  toggleChapterInSchool:    (kidId: string, subjectId: string, chapterId: string) => void
  ensureOlympiads:          (kidId: string, defaults: OlympiadExam[]) => void
  toggleOlympiadRegistration: (kidId: string, olympiadId: string) => void
  overrideScheduleTopic:    (kidId: string, day: string, blockId: string, topic: string) => void
  submitWorksheet:          (kidId: string, worksheetId: string, score: number) => void
}

// ── Store ─────────────────────────────────────────────────────────────────────
export const useKidsDataStore = create<KidsDataState>()(
  persist(
    (set) => ({
      kidsData: {},   // starts empty — each user's kids are added on onboarding

      initKidData(kidId, onboarding, grade) {
        set(s => {
          if (s.kidsData[kidId]) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                subjects:       onboarding.subjects.map(name => createSubjectStub(name, kidId, grade)),
                olympiads:      [],
                weeklySchedule: [],
                worksheets:     [],
                logs:           [],
                badges:         [],
                xpTotal:        0,
                streakDays:     0,
              },
            },
          }
        })
      },

      migrateKidId(oldId, newId) {
        set(s => {
          const data = s.kidsData[oldId]
          if (!data) return s
          const kidsData = { ...s.kidsData, [newId]: data }
          delete kidsData[oldId]
          return { kidsData }
        })
      },

      ensureChapters(kidId, grade) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          if (!kid.subjects.some(sub => sub.chapters.length === 0)) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                subjects: kid.subjects.map(sub =>
                  sub.chapters.length > 0 ? sub : { ...sub, chapters: buildChapters(sub.name, grade, sub.id) }
                ),
              },
            },
          }
        })
      },

      addChapter(kidId, subjectId, name) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          const today = new Date()
          const end = new Date(today); end.setDate(end.getDate() + 14)
          const iso = (d: Date) => d.toISOString().split('T')[0]
          const chapter = {
            id: `${subjectId}-ch-${Date.now().toString(36)}`,
            name, topics: [],
            targetStartDate: iso(today), targetEndDate: iso(end),
            status: 'not-started' as const, notes: '',
          }
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                subjects: kid.subjects.map(sub =>
                  sub.id !== subjectId ? sub : { ...sub, chapters: [...sub.chapters, chapter] }
                ),
              },
            },
          }
        })
        logActivity('chapter_added', kidId, `Chapter added: ${name}`, kidId)
      },

      removeChapter(kidId, subjectId, chapterId) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                subjects: kid.subjects.map(sub =>
                  sub.id !== subjectId ? sub : { ...sub, chapters: sub.chapters.filter(c => c.id !== chapterId) }
                ),
              },
            },
          }
        })
        logActivity('chapter_removed', kidId, 'Chapter removed', kidId)
      },

      addLog(kidId, subject, activity, durationMinutes, mood) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          const newLog: LogEntry = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            subject, activity, durationMinutes, mood,
            createdAt: new Date().toISOString(),
          }
          const newXP     = kid.xpTotal + 10
          const newStreak = kid.streakDays  // streak logic simplified for now
          const newBadges = awardBadges(newXP, newStreak, kid.badges)
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: { ...kid, logs: [newLog, ...kid.logs], xpTotal: newXP, badges: newBadges },
            },
          }
        })
      },

      toggleTopicComplete(kidId, subjectId, chapterId, topicId) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                subjects: kid.subjects.map(sub => sub.id !== subjectId ? sub : {
                  ...sub,
                  chapters: sub.chapters.map(ch => ch.id !== chapterId ? ch : {
                    ...ch,
                    topics: ch.topics.map(t => t.id !== topicId ? t : {
                      ...t,
                      isCompleted: !t.isCompleted,
                      completedDate: !t.isCompleted ? new Date().toISOString().split('T')[0] : undefined,
                    }),
                  }),
                }),
              },
            },
          }
        })
      },

      updateChapterStatus(kidId, subjectId, chapterId, status) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                subjects: kid.subjects.map(sub => sub.id !== subjectId ? sub : {
                  ...sub,
                  chapters: sub.chapters.map(ch => ch.id !== chapterId ? ch : { ...ch, status }),
                }),
              },
            },
          }
        })
      },

      updateSubjectTextbook(kidId, subjectId, textbook) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                subjects: kid.subjects.map(sub => sub.id !== subjectId ? sub : { ...sub, textbook }),
              },
            },
          }
        })
      },

      toggleChapterInSchool(kidId, subjectId, chapterId) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                subjects: kid.subjects.map(sub => sub.id !== subjectId ? sub : {
                  ...sub,
                  chapters: sub.chapters.map(ch => ch.id !== chapterId ? ch : { ...ch, inSchool: !ch.inSchool }),
                }),
              },
            },
          }
        })
      },

      ensureOlympiads(kidId, defaults) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid || kid.olympiads.length > 0) return s
          return { kidsData: { ...s.kidsData, [kidId]: { ...kid, olympiads: defaults } } }
        })
      },

      toggleOlympiadRegistration(kidId, olympiadId) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                olympiads: kid.olympiads.map(o =>
                  o.id !== olympiadId ? o : { ...o, isRegistered: !o.isRegistered }
                ),
              },
            },
          }
        })
      },

      overrideScheduleTopic(kidId, day, blockId, topic) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                weeklySchedule: kid.weeklySchedule.map(d => d.day !== day ? d : {
                  ...d,
                  slots: d.slots.map(b => b.id !== blockId ? b : { ...b, topic, isOverridden: true }),
                }),
              },
            },
          }
        })
      },

      assignSheet(kidId, sheet) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          const existing = kid.assignedSheets ?? []
          if (existing.some(a => a.file === sheet.file && a.status === 'assigned')) return s
          const assignment: AssignedSheet = {
            ...sheet,
            id: `as-${Date.now().toString(36)}`,
            assignedDate: new Date().toISOString().split('T')[0],
            status: 'assigned',
          }
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: { ...kid, assignedSheets: [assignment, ...existing] },
            },
          }
        })
        logActivity('worksheet_assigned', kidId, `Assigned: ${sheet.title} (due ${sheet.dueDate})`, kidId)
      },

      unassignSheet(kidId, assignmentId) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: { ...kid, assignedSheets: (kid.assignedSheets ?? []).filter(a => a.id !== assignmentId) },
            },
          }
        })
      },

      completeSheet(kidId, assignmentId, score, maxScore) {
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          const sheets = (kid.assignedSheets ?? []).map(a =>
            a.id !== assignmentId ? a : {
              ...a,
              status: 'completed' as const,
              score, maxScore,
              completedDate: new Date().toISOString().split('T')[0],
            }
          )
          const newXP = kid.xpTotal + 15
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                assignedSheets: sheets,
                xpTotal: newXP,
                badges: awardBadges(newXP, kid.streakDays, kid.badges),
              },
            },
          }
        })
        logActivity('worksheet_submitted', kidId, `Sheet marked: ${score}/${maxScore}`, kidId)
      },

      submitWorksheet(kidId, worksheetId, score) {
        logActivity('worksheet_submitted', kidId, `Worksheet ${worksheetId} scored ${score}%`, kidId)
        set(s => {
          const kid = s.kidsData[kidId]
          if (!kid) return s
          return {
            kidsData: {
              ...s.kidsData,
              [kidId]: {
                ...kid,
                xpTotal:   kid.xpTotal + 15,
                worksheets: kid.worksheets.map(w =>
                  w.id !== worksheetId ? w : { ...w, status: 'graded' as const, score }
                ),
              },
            },
          }
        })
      },
    }),
    {
      name: 'mk-kids-data-v3',  // v3 clears old seeded data — each user starts fresh
    }
  )
)
