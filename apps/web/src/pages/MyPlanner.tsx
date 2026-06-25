import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, ChevronLeft, ChevronRight, X, Trash2, Clock, MapPin, Bell, Repeat as RepeatIcon,
  CalendarDays, School, StickyNote, Target,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import {
  usePlannerStore, eventsForChildOn, CATEGORY_META, makeEventId, ymd, parseYmd, toMin, noteKey,
  type PlannerEvent, type EventCategory, type Repeat,
} from '@/store/plannerStore'
import LearningPlan from '@/pages/LearningPlan'
import SchoolTimetable from '@/pages/SchoolTimetable'

const FONT = "'Nunito', 'Inter', sans-serif"
const P = '#6C63FF'
const GRID_START_H = 6, GRID_END_H = 22, SLOT_MIN = 30, ROW_H = 26
const TOTAL_ROWS = ((GRID_END_H - GRID_START_H) * 60) / SLOT_MIN
const GRID_H = TOTAL_ROWS * ROW_H
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
type View = 'day' | 'week' | 'month' | 'year'

const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
const startOfWeek = (d: Date) => { const x = new Date(d); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); x.setHours(0, 0, 0, 0); return x } // Monday
const isToday = (d: Date) => ymd(d) === ymd(new Date())
const fmtTime = (t: string) => { const [h, m] = t.split(':').map(Number); const ap = h < 12 ? 'AM' : 'PM'; const hh = h % 12 || 12; return `${hh}:${String(m).padStart(2, '0')} ${ap}` }

// ── Root: Planner + AI Learning Plan tabs ─────────────────────────────────────
export default function MyPlanner() {
  const [tab, setTab] = useState<'planner' | 'timetable' | 'ai'>('planner')
  return (
    <div className="page-container" style={{ paddingBottom: 0, maxWidth: 1100 }}>
      <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 11, padding: 3, marginBottom: 12, flexWrap: 'wrap' }}>
        {([['planner', '📅 Planner'], ['timetable', '🗓️ School Timetable'], ['ai', '🎯 AI Learning Plan']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 800,
              background: tab === k ? '#fff' : 'transparent', color: tab === k ? P : '#64748B',
              boxShadow: tab === k ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'planner' ? <Planner /> : tab === 'timetable' ? <SchoolTimetable /> : <LearningPlan />}
    </div>
  )
}

// ── Planner ───────────────────────────────────────────────────────────────────
function Planner() {
  const { activeKidId, kids } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const events = usePlannerStore(s => s.events)
  const notes = usePlannerStore(s => s.notes)
  const setNote = usePlannerStore(s => s._setNote)
  const removeEvent = usePlannerStore(s => s._remove)
  const setEvent = usePlannerStore(s => s._set)
  const bulk = usePlannerStore(s => s._bulk)

  const [view, setView] = useState<View>('week')
  const [cursor, setCursor] = useState(new Date())
  const [editing, setEditing] = useState<PlannerEvent | null>(null)
  const [creatingDefaults, setCreatingDefaults] = useState<Partial<PlannerEvent> | null>(null)

  const childId = kid?.id ?? ''

  // Best-effort Outlook-style reminders via the browser Notification API.
  const firedRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    if (!childId) return
    const tick = () => {
      if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return
      const now = new Date()
      const todays = eventsForChildOn(events, childId, now)
      todays.forEach(e => {
        if (e.reminderMinutes === undefined || e.reminderMinutes === null) return
        const start = toMin(e.startTime); const cur = now.getHours() * 60 + now.getMinutes()
        const fireAt = start - e.reminderMinutes
        const key = `${e.id}:${ymd(now)}`
        if (cur >= fireAt && cur < start && !firedRef.current.has(key)) {
          firedRef.current.add(key)
          new Notification(`⏰ ${e.title}`, { body: `Starts at ${fmtTime(e.startTime)}${e.location ? ` · ${e.location}` : ''}` })
        }
      })
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [events, childId])

  if (!kid) {
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontFamily: FONT }}>Pick a child to open the planner.</div>
  }

  const openNew = (defaults?: Partial<PlannerEvent>) => { setEditing(null); setCreatingDefaults(defaults ?? {}) }
  const save = (e: PlannerEvent) => { setEvent(e); setEditing(null); setCreatingDefaults(null) }
  const del = (id: string) => { removeEvent(id); setEditing(null); setCreatingDefaults(null) }

  // Seed a typical school timetable (Mon–Fri) the user can then edit/drag.
  const loadSchoolTimetable = () => {
    const monday = startOfWeek(cursor)
    const until = ymd(addDays(monday, 364))
    const base = { childId, date: ymd(monday), repeat: 'weekdays' as Repeat, repeatUntil: until, createdAt: Date.now() }
    const seed: PlannerEvent[] = [
      { ...base, id: makeEventId(), title: 'School', category: 'school', startTime: '08:00', endTime: '14:30', location: kid.school || 'School', reminderMinutes: 30 },
      { ...base, id: makeEventId(), title: 'Lunch & rest', category: 'meal', startTime: '14:30', endTime: '15:30' },
      { ...base, id: makeEventId(), title: 'Homework', category: 'homework', startTime: '16:00', endTime: '17:00', reminderMinutes: 10 },
      { ...base, id: makeEventId(), title: 'Self-study', category: 'study', startTime: '17:30', endTime: '18:30' },
    ]
    bulk(seed)
    setView('week')
  }

  const title = view === 'day' ? cursor.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })
    : view === 'week' ? (() => { const m = startOfWeek(cursor); const s = addDays(m, 6); return `${m.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} – ${s.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` })()
    : view === 'month' ? cursor.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })
    : String(cursor.getFullYear())

  const step = (dir: number) => {
    if (view === 'day') setCursor(addDays(cursor, dir))
    else if (view === 'week') setCursor(addDays(cursor, dir * 7))
    else if (view === 'month') setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + dir, 1))
    else setCursor(new Date(cursor.getFullYear() + dir, cursor.getMonth(), 1))
  }

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>My Planner</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <IconBtn onClick={() => step(-1)}><ChevronLeft size={16} /></IconBtn>
            <button onClick={() => setCursor(new Date())} style={chip(false)}>Today</button>
            <IconBtn onClick={() => step(1)}><ChevronRight size={16} /></IconBtn>
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#334155' }}>{title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
            {(['day', 'week', 'month', 'year'] as View[]).map(v => (
              <button key={v} onClick={() => setView(v)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, textTransform: 'capitalize', background: view === v ? '#fff' : 'transparent', color: view === v ? P : '#64748B', boxShadow: view === v ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>{v}</button>
            ))}
          </div>
          <button onClick={loadSchoolTimetable} style={{ ...ghostBtn }}><School size={14} /> Load school timetable</button>
          <button onClick={() => openNew()} style={primaryBtn}><Plus size={15} /> New event</button>
        </div>
      </div>

      {view === 'day' && <DayWeek view="day" cursor={cursor} childId={childId} events={events} onOpen={setEditing} onCreate={openNew} onMove={save} />}
      {view === 'week' && <DayWeek view="week" cursor={cursor} childId={childId} events={events} onOpen={setEditing} onCreate={openNew} onMove={save} />}
      {view === 'month' && <MonthView cursor={cursor} childId={childId} events={events} onPick={(d) => { setCursor(d); setView('day') }} onCreate={openNew} />}
      {view === 'year' && <YearView cursor={cursor} childId={childId} events={events} onPick={(d) => { setCursor(d); setView('month') }} />}

      {view === 'day' && (
        <DayNotes value={notes[noteKey(childId, ymd(cursor))] ?? ''} onChange={(t) => setNote(noteKey(childId, ymd(cursor)), t)} />
      )}

      <AnimatePresence>
        {(editing || creatingDefaults) && (
          <EventModal
            childId={childId}
            existing={editing}
            defaults={creatingDefaults ?? {}}
            onClose={() => { setEditing(null); setCreatingDefaults(null) }}
            onSave={save}
            onDelete={del}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Day / Week time-grid (shared) ─────────────────────────────────────────────
function DayWeek({ view, cursor, childId, events, onOpen, onCreate, onMove }: {
  view: 'day' | 'week'; cursor: Date; childId: string; events: Record<string, PlannerEvent>
  onOpen: (e: PlannerEvent) => void; onCreate: (d: Partial<PlannerEvent>) => void; onMove: (e: PlannerEvent) => void
}) {
  const days = view === 'day' ? [new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate())]
    : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(cursor), i))
  const [dragId, setDragId] = useState<string | null>(null)

  const onDrop = (day: Date) => {
    if (!dragId) return
    const e = events[dragId]; if (e) onMove({ ...e, date: ymd(day) })
    setDragId(null)
  }

  return (
    <div style={{ border: '1px solid #EEF0F5', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: `54px repeat(${days.length}, 1fr)`, borderBottom: '1px solid #EEF0F5' }}>
        <div />
        {days.map(d => (
          <div key={ymd(d)} style={{ textAlign: 'center', padding: '8px 4px', borderLeft: '1px solid #F1F5F9' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{WEEKDAYS[d.getDay()]}</div>
            <div style={{ fontSize: 15, fontWeight: 900, color: isToday(d) ? P : '#0F172A', marginTop: 2 }}>
              <span style={{ display: 'inline-flex', width: 26, height: 26, borderRadius: '50%', alignItems: 'center', justifyContent: 'center', background: isToday(d) ? P : 'transparent', color: isToday(d) ? '#fff' : 'inherit' }}>{d.getDate()}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Scrollable grid */}
      <div style={{ display: 'grid', gridTemplateColumns: `54px repeat(${days.length}, 1fr)`, maxHeight: '62vh', overflowY: 'auto' }}>
        {/* time gutter */}
        <div style={{ position: 'relative', height: GRID_H }}>
          {Array.from({ length: GRID_END_H - GRID_START_H + 1 }, (_, i) => (
            <div key={i} style={{ position: 'absolute', top: i * 2 * ROW_H - 7, right: 6, fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>
              {((GRID_START_H + i) % 12) || 12}{GRID_START_H + i < 12 ? 'a' : 'p'}
            </div>
          ))}
        </div>
        {/* day columns */}
        {days.map(day => {
          const dayEvents = eventsForChildOn(events, childId, day)
          return (
            <div key={ymd(day)}
              onDragOver={e => { e.preventDefault() }}
              onDrop={() => onDrop(day)}
              onClick={(e) => {
                // click empty space → new event at the clicked hour
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
                const y = e.clientY - rect.top + (e.currentTarget as HTMLDivElement).scrollTop
                const mins = GRID_START_H * 60 + Math.floor(y / ROW_H) * SLOT_MIN
                const hh = String(Math.floor(mins / 60)).padStart(2, '0'); const mm = String(mins % 60).padStart(2, '0')
                const eh = String(Math.min(GRID_END_H, Math.floor(mins / 60) + 1)).padStart(2, '0')
                onCreate({ date: ymd(day), startTime: `${hh}:${mm}`, endTime: `${eh}:${mm}` })
              }}
              style={{ position: 'relative', height: GRID_H, borderLeft: '1px solid #F1F5F9', background: isToday(day) ? '#FBFAFF' : '#fff', cursor: 'copy' }}>
              {/* hour lines */}
              {Array.from({ length: GRID_END_H - GRID_START_H }, (_, i) => (
                <div key={i} style={{ position: 'absolute', top: (i + 1) * 2 * ROW_H, left: 0, right: 0, borderTop: '1px solid #F4F5F8' }} />
              ))}
              {dayEvents.map(ev => {
                const top = Math.max(0, ((toMin(ev.startTime) - GRID_START_H * 60) / SLOT_MIN) * ROW_H)
                const h = Math.max(18, ((toMin(ev.endTime) - toMin(ev.startTime)) / SLOT_MIN) * ROW_H - 2)
                const m = CATEGORY_META[ev.category]
                return (
                  <div key={ev.id} draggable
                    onDragStart={() => setDragId(ev.id)} onDragEnd={() => setDragId(null)}
                    onClick={(e) => { e.stopPropagation(); onOpen(ev) }}
                    title={`${ev.title} · ${fmtTime(ev.startTime)}–${fmtTime(ev.endTime)}`}
                    style={{ position: 'absolute', top, left: 3, right: 3, height: h, background: m.bg, borderLeft: `3px solid ${m.color}`, borderRadius: 7, padding: '3px 6px', overflow: 'hidden', cursor: 'grab', boxShadow: '0 1px 3px rgba(15,23,42,0.08)' }}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: m.color, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {m.icon} {ev.title}
                    </div>
                    {h > 30 && <div style={{ fontSize: 9.5, color: '#64748B' }}>{fmtTime(ev.startTime)}{ev.repeat !== 'none' ? ' · ↻' : ''}</div>}
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
      <div style={{ padding: '6px 12px', fontSize: 11, color: '#94A3B8', borderTop: '1px solid #F1F5F9' }}>
        Tap an empty slot to add · drag an event to another day to reschedule · ↻ = repeats
      </div>
    </div>
  )
}

// ── Month view ────────────────────────────────────────────────────────────────
function MonthView({ cursor, childId, events, onPick, onCreate }: {
  cursor: Date; childId: string; events: Record<string, PlannerEvent>
  onPick: (d: Date) => void; onCreate: (d: Partial<PlannerEvent>) => void
}) {
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1)
  const gridStart = startOfWeek(first)
  const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
  return (
    <div style={{ border: '1px solid #EEF0F5', borderRadius: 14, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', borderBottom: '1px solid #EEF0F5' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
          <div key={d} style={{ textAlign: 'center', padding: '8px 0', fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {cells.map(d => {
          const inMonth = d.getMonth() === cursor.getMonth()
          const evs = eventsForChildOn(events, childId, d)
          return (
            <div key={ymd(d)} onClick={() => onPick(d)}
              style={{ minHeight: 96, padding: 6, borderTop: '1px solid #F1F5F9', borderLeft: '1px solid #F1F5F9', cursor: 'pointer', background: isToday(d) ? '#FBFAFF' : inMonth ? '#fff' : '#FAFBFC' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: isToday(d) ? '#fff' : inMonth ? '#0F172A' : '#CBD5E1', background: isToday(d) ? P : 'transparent', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{d.getDate()}</span>
                <button onClick={(e) => { e.stopPropagation(); onCreate({ date: ymd(d), startTime: '16:00', endTime: '17:00' }) }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', padding: 0 }}><Plus size={13} /></button>
              </div>
              <div style={{ marginTop: 4, display: 'grid', gap: 2 }}>
                {evs.slice(0, 3).map(ev => {
                  const m = CATEGORY_META[ev.category]
                  return <div key={ev.id} style={{ fontSize: 9.5, fontWeight: 700, color: m.color, background: m.bg, borderRadius: 5, padding: '1px 5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                })}
                {evs.length > 3 && <div style={{ fontSize: 9, color: '#94A3B8' }}>+{evs.length - 3} more</div>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Year view ─────────────────────────────────────────────────────────────────
function YearView({ cursor, childId, events, onPick }: {
  cursor: Date; childId: string; events: Record<string, PlannerEvent>; onPick: (d: Date) => void
}) {
  const year = cursor.getFullYear()
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 12 }}>
      {Array.from({ length: 12 }, (_, mo) => {
        const first = new Date(year, mo, 1)
        const gridStart = startOfWeek(first)
        const cells = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i))
        return (
          <div key={mo} onClick={() => onPick(new Date(year, mo, 1))}
            style={{ border: '1px solid #EEF0F5', borderRadius: 12, padding: 10, background: '#fff', cursor: 'pointer' }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: '#0F172A', marginBottom: 6 }}>{first.toLocaleDateString('en-IN', { month: 'long' })}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2 }}>
              {cells.map(d => {
                const inMonth = d.getMonth() === mo
                const has = inMonth && eventsForChildOn(events, childId, d).length > 0
                return (
                  <div key={ymd(d)} style={{ textAlign: 'center', fontSize: 9.5, padding: '2px 0', borderRadius: 5, color: !inMonth ? '#E2E8F0' : isToday(d) ? '#fff' : '#475569', background: isToday(d) ? P : has ? '#EDE9FE' : 'transparent', fontWeight: has ? 800 : 500 }}>
                    {d.getDate()}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Per-day notes ─────────────────────────────────────────────────────────────
function DayNotes({ value, onChange }: { value: string; onChange: (t: string) => void }) {
  return (
    <div style={{ marginTop: 14, background: '#fff', border: '1px solid #EEF0F5', borderRadius: 14, padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
        <StickyNote size={15} color="#D97706" />
        <h3 style={{ fontSize: 13.5, fontWeight: 900, color: '#0F172A' }}>Notes for this day</h3>
      </div>
      <textarea value={value} onChange={e => onChange(e.target.value)} rows={3}
        placeholder="Free notepad — reminders, to-dos, comments for the day…"
        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1.5px solid #E2E8F0', fontFamily: FONT, fontSize: 13, color: '#1F2937', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
    </div>
  )
}

// ── Create / edit event modal (Outlook-style) ─────────────────────────────────
const REMINDER_OPTS: { label: string; value: number | null }[] = [
  { label: 'No reminder', value: null }, { label: 'At start time', value: 0 },
  { label: '5 min before', value: 5 }, { label: '10 min before', value: 10 },
  { label: '15 min before', value: 15 }, { label: '30 min before', value: 30 }, { label: '1 hour before', value: 60 },
]
const REPEAT_OPTS: { label: string; value: Repeat }[] = [
  { label: 'Just this day', value: 'none' }, { label: 'Every day', value: 'daily' },
  { label: 'Weekdays (Mon–Fri)', value: 'weekdays' }, { label: 'Weekly (same weekday)', value: 'weekly' },
  { label: 'Custom days…', value: 'custom' },
]

function EventModal({ childId, existing, defaults, onClose, onSave, onDelete }: {
  childId: string; existing: PlannerEvent | null; defaults: Partial<PlannerEvent>
  onClose: () => void; onSave: (e: PlannerEvent) => void; onDelete: (id: string) => void
}) {
  const seed = existing ?? defaults
  const [title, setTitle] = useState(seed.title ?? '')
  const [category, setCategory] = useState<EventCategory>(seed.category ?? 'study')
  const [date, setDate] = useState(seed.date ?? ymd(new Date()))
  const [startTime, setStartTime] = useState(seed.startTime ?? '16:00')
  const [endTime, setEndTime] = useState(seed.endTime ?? '17:00')
  const [location, setLocation] = useState(seed.location ?? '')
  const [notes, setNotes] = useState(seed.notes ?? '')
  const [reminder, setReminder] = useState<number | null>(seed.reminderMinutes ?? null)
  const [repeat, setRepeat] = useState<Repeat>(seed.repeat ?? 'none')
  const [repeatDays, setRepeatDays] = useState<number[]>(seed.repeatDays ?? [parseYmd(seed.date ?? ymd(new Date())).getDay()])
  const [repeatUntil, setRepeatUntil] = useState(seed.repeatUntil ?? '')
  const [err, setErr] = useState('')

  const toggleDay = (d: number) => setRepeatDays(s => s.includes(d) ? s.filter(x => x !== d) : [...s, d].sort())

  const save = () => {
    if (!title.trim()) { setErr('Give the event a title.'); return }
    if (toMin(endTime) <= toMin(startTime)) { setErr('End time must be after start time.'); return }
    if (reminder !== null && typeof Notification !== 'undefined' && Notification.permission === 'default') {
      void Notification.requestPermission()
    }
    onSave({
      id: existing?.id ?? makeEventId(),
      childId, title: title.trim(), category, date, startTime, endTime,
      location: location.trim() || undefined, notes: notes.trim() || undefined,
      reminderMinutes: reminder, repeat,
      repeatDays: repeat === 'custom' ? repeatDays : undefined,
      repeatUntil: repeat !== 'none' ? (repeatUntil || '') : undefined,
      createdAt: existing?.createdAt ?? Date.now(),
    })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '92vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{existing ? 'Edit event' : 'New event'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>

        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title — e.g. Maths revision, Piano class" style={{ ...input, fontSize: 15, fontWeight: 700, marginBottom: 12 }} />

        <Label icon={<Target size={12} />}>Category</Label>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
          {(Object.keys(CATEGORY_META) as EventCategory[]).map(c => (
            <button key={c} onClick={() => setCategory(c)} style={{ padding: '5px 9px', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, fontSize: 11, fontWeight: 700, border: `1.5px solid ${category === c ? CATEGORY_META[c].color : '#E2E8F0'}`, background: category === c ? CATEGORY_META[c].bg : '#fff', color: category === c ? CATEGORY_META[c].color : '#64748B' }}>
              {CATEGORY_META[c].icon} {CATEGORY_META[c].label}
            </button>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
          <div><Label icon={<CalendarDays size={12} />}>Date</Label><input type="date" value={date} onChange={e => setDate(e.target.value)} style={input} /></div>
          <div><Label icon={<Clock size={12} />}>Start</Label><input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} style={input} /></div>
          <div><Label icon={<Clock size={12} />}>End</Label><input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} style={input} /></div>
        </div>

        <Label icon={<MapPin size={12} />}>Location (optional)</Label>
        <input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Dance academy, Room 2" style={{ ...input, marginBottom: 12 }} />

        <Label icon={<RepeatIcon size={12} />}>Repeat — apply to which days?</Label>
        <select value={repeat} onChange={e => setRepeat(e.target.value as Repeat)} style={{ ...input, cursor: 'pointer', marginBottom: repeat === 'none' ? 12 : 8 }}>
          {REPEAT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {repeat === 'custom' && (
          <div style={{ display: 'flex', gap: 5, marginBottom: 8, flexWrap: 'wrap' }}>
            {WEEKDAYS.map((d, i) => (
              <button key={i} onClick={() => toggleDay(i)} style={{ width: 38, padding: '6px 0', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, fontSize: 11, fontWeight: 800, border: `1.5px solid ${repeatDays.includes(i) ? P : '#E2E8F0'}`, background: repeatDays.includes(i) ? '#EEF2FF' : '#fff', color: repeatDays.includes(i) ? P : '#64748B' }}>{d}</button>
            ))}
          </div>
        )}
        {repeat !== 'none' && (
          <div style={{ marginBottom: 12 }}>
            <Label icon={<CalendarDays size={12} />}>Repeat until (optional)</Label>
            <input type="date" value={repeatUntil} onChange={e => setRepeatUntil(e.target.value)} style={input} />
          </div>
        )}

        <Label icon={<Bell size={12} />}>Reminder</Label>
        <select value={reminder === null ? 'null' : String(reminder)} onChange={e => setReminder(e.target.value === 'null' ? null : Number(e.target.value))} style={{ ...input, cursor: 'pointer', marginBottom: 12 }}>
          {REMINDER_OPTS.map(o => <option key={String(o.value)} value={o.value === null ? 'null' : String(o.value)}>{o.label}</option>)}
        </select>

        <Label icon={<StickyNote size={12} />}>Notes (optional)</Label>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Anything to remember…" style={{ ...input, resize: 'vertical', marginBottom: 12 }} />

        {err && <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, marginBottom: 10 }}>{err}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          {existing && <button onClick={() => onDelete(existing.id)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '11px 14px', borderRadius: 10, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer', fontSize: 13, fontWeight: 800, fontFamily: FONT }}><Trash2 size={14} /> Delete</button>}
          <button onClick={save} style={{ flex: 1, padding: '11px 0', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: FONT }}>{existing ? 'Save changes' : 'Add to planner'}</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── small shared bits ─────────────────────────────────────────────────────────
const input: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const primaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }
const ghostBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 12.5, fontWeight: 800, fontFamily: FONT }
const chip = (active: boolean): React.CSSProperties => ({ padding: '6px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: active ? P : '#fff', color: active ? '#fff' : '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: FONT })

function IconBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569' }}>{children}</button>
}
function Label({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.03em' }}>{icon}{children}</label>
}
