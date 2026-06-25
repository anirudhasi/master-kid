import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type PlannerEvent, type EventCategory, makeEventId, ymd } from '@/store/plannerStore'

// School timetable: a bell schedule (periods) × school days grid filled by subject.
// Built once per child, applied to the planner as recurring events, and shareable
// (via code or local community) so other parents in the same school+section can copy.

export interface Period {
  id: string
  label: string        // e.g. "Period 1", "Lunch"
  start: string        // HH:mm
  end: string          // HH:mm
  kind: 'class' | 'break'
}

export interface Timetable {
  periods: Period[]
  days: number[]                                  // weekday numbers 1=Mon..6=Sat
  grid: Record<string, Record<number, string>>   // grid[periodId][day] = subject name ('' = free)
}

export interface SharedTimetable {
  id: string
  school: string
  section: string
  grade: string
  board: string
  authorName: string
  note?: string
  timetable: Timetable
  createdAt: number
}

const pid = () => `pd-${Math.random().toString(36).slice(2, 7)}`

export function defaultTimetable(): Timetable {
  const periods: Period[] = [
    { id: pid(), label: 'Period 1', start: '08:00', end: '08:45', kind: 'class' },
    { id: pid(), label: 'Period 2', start: '08:45', end: '09:30', kind: 'class' },
    { id: pid(), label: 'Period 3', start: '09:30', end: '10:15', kind: 'class' },
    { id: pid(), label: 'Short Break', start: '10:15', end: '10:30', kind: 'break' },
    { id: pid(), label: 'Period 4', start: '10:30', end: '11:15', kind: 'class' },
    { id: pid(), label: 'Period 5', start: '11:15', end: '12:00', kind: 'class' },
    { id: pid(), label: 'Lunch', start: '12:00', end: '12:40', kind: 'break' },
    { id: pid(), label: 'Period 6', start: '12:40', end: '13:25', kind: 'class' },
    { id: pid(), label: 'Period 7', start: '13:25', end: '14:10', kind: 'class' },
    { id: pid(), label: 'Period 8', start: '14:10', end: '14:55', kind: 'class' },
  ]
  return { periods, days: [1, 2, 3, 4, 5], grid: {} }
}

interface TimetableState {
  byChild: Record<string, Timetable>
  community: SharedTimetable[]
  _set: (childId: string, t: Timetable) => void
  _share: (s: SharedTimetable) => void
  _unshare: (id: string) => void
}

export const useTimetableStore = create<TimetableState>()(
  persist(
    (set) => ({
      byChild: {},
      community: [],
      _set: (childId, t) => set((s) => ({ byChild: { ...s.byChild, [childId]: t } })),
      _share: (item) => set((s) => ({ community: [item, ...s.community.filter(c => c.id !== item.id)] })),
      _unshare: (id) => set((s) => ({ community: s.community.filter(c => c.id !== id) })),
    }),
    { name: 'mk-timetable-v1' },
  ),
)

// Map a subject/period to a planner category for colour.
function categoryFor(subject: string, kind: Period['kind']): EventCategory {
  if (kind === 'break') return /lunch/i.test(subject) ? 'meal' : 'break'
  const s = subject.toLowerCase()
  if (/(p\.?e|physical|games|sport)/.test(s)) return 'sport'
  if (/(music|sing)/.test(s)) return 'music'
  if (/(art|draw|paint|craft)/.test(s)) return 'art'
  if (/(dance)/.test(s)) return 'dance'
  return 'school'
}

const nextDateForWeekday = (day: number) => {
  const d = new Date(); const cur = d.getDay()
  const delta = (day - cur + 7) % 7
  d.setDate(d.getDate() + delta)
  return ymd(d)
}

/** Expand a timetable into recurring planner events for a child (one per filled cell). */
export function timetableToEvents(t: Timetable, childId: string): PlannerEvent[] {
  const out: PlannerEvent[] = []
  const until = (() => { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return ymd(d) })()
  t.days.forEach(day => {
    t.periods.forEach(p => {
      const subject = p.kind === 'break' ? p.label : (t.grid[p.id]?.[day] ?? '')
      if (p.kind === 'class' && !subject) return // skip free periods
      out.push({
        id: makeEventId(),
        childId,
        title: p.kind === 'break' ? p.label : subject,
        category: categoryFor(subject, p.kind),
        date: nextDateForWeekday(day),
        startTime: p.start,
        endTime: p.end,
        reminderMinutes: null,
        repeat: 'custom',
        repeatDays: [day],
        repeatUntil: until,
        fromTimetable: true,
        createdAt: Date.now(),
      })
    })
  })
  return out
}

// ── share code (works cross-device without a backend) ─────────────────────────
export function encodeTimetable(s: Omit<SharedTimetable, 'id' | 'createdAt'>): string {
  try { return btoa(encodeURIComponent(JSON.stringify(s))) } catch { return '' }
}
export function decodeTimetable(code: string): Omit<SharedTimetable, 'id' | 'createdAt'> | null {
  try {
    const obj = JSON.parse(decodeURIComponent(atob(code.trim())))
    if (!obj?.timetable?.periods) return null
    return obj
  } catch { return null }
}
