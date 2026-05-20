import { useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Edit3, Check, X, Info, CalendarDays } from 'lucide-react'
import { type ScheduleBlock } from '@/store/appStore'
import { useKidStore } from '@/hooks/useKidStore'
import { useAuthStore } from '@/store/authStore'

const CATEGORY_CONFIG: Record<ScheduleBlock['category'], { cls: string; emoji: string; label: string }> = {
  school:   { cls: 'block-school',   emoji: '🏫', label: 'School'       },
  swimming: { cls: 'block-swimming', emoji: '🏊', label: 'Swimming'     },
  dance:    { cls: 'block-dance',    emoji: '💃', label: 'Bharatanatyam'},
  drawing:  { cls: 'block-drawing',  emoji: '🎨', label: 'Drawing'      },
  music:    { cls: 'block-music',    emoji: '🎵', label: 'Western Vocal'},
  study:    { cls: 'block-study',    emoji: '📚', label: 'Self Study'   },
  homework: { cls: 'block-homework', emoji: '📝', label: 'Homework'     },
  meal:     { cls: 'block-meal',     emoji: '🍛', label: 'Meal'         },
  break:    { cls: 'block-sleep',    emoji: '😌', label: 'Break'        },
  free:     { cls: 'block-free',     emoji: '🎮', label: 'Free Time'    },
  sleep:    { cls: 'block-sleep',    emoji: '😴', label: 'Sleep'        },
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const SHORT_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function BlockCard({ block, dayName }: { block: ScheduleBlock; dayName: string }) {
  const { overrideScheduleTopic } = useKidStore()
  const [editing, setEditing] = useState(false)
  const [newTopic, setNewTopic] = useState(block.topic ?? block.recommendedTopic ?? '')
  const cfg = CATEGORY_CONFIG[block.category]
  const dur = toMinutes(block.endTime) - toMinutes(block.startTime)
  const isStudy = ['study', 'homework'].includes(block.category)

  return (
    <div style={{
      padding: '10px 12px', borderRadius: 9, marginBottom: 6,
      border: '1px solid #E2E8F0', background: '#fff',
      transition: 'box-shadow 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Time */}
        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, minWidth: 56, marginTop: 2 }}>
          {block.startTime}–{block.endTime}
        </div>

        {/* Category badge */}
        <span style={{
          fontSize: 10, padding: '2px 8px', borderRadius: 20, fontWeight: 700,
          flexShrink: 0, whiteSpace: 'nowrap',
        }} className={cfg.cls}>
          {cfg.emoji} {cfg.label}
        </span>

        {/* Label / topic */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12.5, fontWeight: 600, color: '#0F172A' }}>{block.label}</div>
          {block.isAIRecommended && block.recommendedTopic && !block.isOverridden && (
            <div style={{ fontSize: 11, color: '#6366F1', marginTop: 2, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Info size={10} />
              <span>AI suggests: <em>{block.recommendedTopic}</em></span>
            </div>
          )}
          {block.isOverridden && block.topic && (
            <div style={{ fontSize: 11, color: '#059669', marginTop: 2 }}>✎ Overridden: {block.topic}</div>
          )}
          {block.location && (
            <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 1 }}>📍 {block.location}</div>
          )}

          {/* Topic edit for study slots */}
          {isStudy && editing && (
            <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
              <input value={newTopic} onChange={e => setNewTopic(e.target.value)}
                placeholder="Override topic..."
                style={{ flex: 1, fontSize: 11.5, padding: '4px 8px', borderRadius: 6, border: '1px solid #C7D2FE', outline: 'none' }} />
              <button onClick={() => { overrideScheduleTopic(dayName, block.id, newTopic); setEditing(false) }}
                style={{ padding: '4px 8px', borderRadius: 6, background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer' }}>
                <Check size={12} />
              </button>
              <button onClick={() => setEditing(false)}
                style={{ padding: '4px 8px', borderRadius: 6, background: '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer' }}>
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Duration */}
        <div style={{ fontSize: 10, color: '#94A3B8', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Clock size={10} /> {dur}m
        </div>

        {/* Edit button for study slots */}
        {isStudy && !editing && (
          <button onClick={() => setEditing(true)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C7D2FE', padding: 2 }}>
            <Edit3 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

function Legend() {
  const cats = ['school', 'swimming', 'dance', 'drawing', 'music', 'study', 'homework', 'meal', 'free', 'sleep'] as const
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14, padding: '10px 14px', borderRadius: 10, background: '#fff', border: '1px solid #DCE8F5' }}>
      {cats.map(c => {
        const cfg = CATEGORY_CONFIG[c]
        return (
          <span key={c} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, display: 'inline-block' }} className={cfg.cls} />
            <span style={{ color: '#64748B' }}>{cfg.emoji} {cfg.label}</span>
          </span>
        )
      })}
    </div>
  )
}

function DayStats({ day }: { day: typeof import('@/store/appStore').seedWeeklySchedule[0] }) {
  const study = day.slots.filter(s => s.category === 'study').reduce((a,b) => a + (toMinutes(b.endTime) - toMinutes(b.startTime)), 0)
  const activities = day.slots.filter(s => ['swimming','dance','drawing','music'].includes(s.category))
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
      {study > 0 && <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#EEF2FF', color: '#4338CA', fontWeight: 600 }}>📚 {study}m study</span>}
      {activities.map(a => (
        <span key={a.id} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: '#F0F9FF', color: '#0369A1', fontWeight: 600 }}>
          {CATEGORY_CONFIG[a.category].emoji} {CATEGORY_CONFIG[a.category].label}
        </span>
      ))}
    </div>
  )
}

export default function Schedule() {
  const { weeklySchedule } = useKidStore()
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const [activeDay, setActiveDay] = useState('Monday')

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' })
  const dayData = weeklySchedule.find(d => d.day === activeDay) ?? weeklySchedule[0]
  const month   = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  if (weeklySchedule.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="label" style={{ marginBottom: 4 }}>{activeKid?.name}'s Week</div>
            <h1 className="page-title">Weekly Schedule</h1>
          </div>
        </div>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <CalendarDays size={40} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No schedule yet</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            {activeKid?.name}'s weekly timetable will appear here once set up.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>{activeKid?.name}'s Complete Week · {month}</div>
          <h1 className="page-title">Weekly Schedule</h1>
          <p className="page-subtitle">School + Activities + Self Study — AI-recommended study topics can be overridden</p>
        </div>
      </div>

      {/* Day tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 14, overflowX: 'auto', paddingBottom: 2 }}>
        {DAYS.map((day, i) => {
          const active = day === activeDay
          const isToday = day === today
          return (
            <button key={day} onClick={() => setActiveDay(day)}
              style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: active ? 700 : 500, fontSize: 12, whiteSpace: 'nowrap',
                background: active ? '#4F46E5' : isToday ? '#EEF2FF' : '#F1F5F9',
                color: active ? '#fff' : isToday ? '#4338CA' : '#64748B',
                boxShadow: active ? '0 2px 8px rgba(79,70,229,0.3)' : 'none',
              }}>
              {SHORT_DAYS[i]}
              {isToday && <span style={{ fontSize: 9, marginLeft: 4, opacity: 0.7 }}>today</span>}
              {/* Activity dots */}
              {weeklySchedule.find(d => d.day === day)?.slots.some(s => ['swimming','dance','drawing','music'].includes(s.category)) && (
                <span style={{ fontSize: 8, marginLeft: 4 }}>●</span>
              )}
            </button>
          )
        })}
      </div>

      <Legend />

      {dayData && (
        <motion.div key={activeDay} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{duration:0.2}}>
          <DayStats day={dayData} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {dayData.slots.map(block => (
              <BlockCard key={block.id} block={block} dayName={dayData.day} />
            ))}
          </div>
        </motion.div>
      )}

      {/* Weekly overview strip */}
      <div style={{ marginTop: 24, padding: '14px 16px', borderRadius: 12, background: '#fff', border: '1px solid #DCE8F5' }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Weekly Activity Overview</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
          {DAYS.map((day, i) => {
            const d = weeklySchedule.find(x => x.day === day)
            const acts = d?.slots.filter(s => ['swimming','dance','drawing','music'].includes(s.category)) ?? []
            const studyMins = d?.slots.filter(s => s.category === 'study').reduce((a,b) => a + (toMinutes(b.endTime) - toMinutes(b.startTime)), 0) ?? 0
            return (
              <button key={day} onClick={() => setActiveDay(day)}
                style={{
                  padding: '10px 6px', borderRadius: 9, border: '1.5px solid',
                  borderColor: day === activeDay ? '#4F46E5' : '#E2E8F0',
                  background: day === activeDay ? '#EEF2FF' : '#FAFBFF',
                  cursor: 'pointer', textAlign: 'center',
                }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: day === activeDay ? '#4F46E5' : '#0F172A', marginBottom: 4 }}>{SHORT_DAYS[i]}</div>
                <div style={{ fontSize: 14, marginBottom: 4 }}>
                  {acts.map(a => CATEGORY_CONFIG[a.category as ScheduleBlock['category']].emoji).join('')}
                  {acts.length === 0 && '—'}
                </div>
                {studyMins > 0 && (
                  <div style={{ fontSize: 9.5, color: '#4F46E5', fontWeight: 600 }}>{studyMins}m</div>
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
