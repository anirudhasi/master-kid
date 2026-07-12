import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trophy, Flame, Zap, Clock, CheckCircle2, ChevronRight, BookOpen, Calendar } from 'lucide-react'
import { getLevel, type Mood } from '@/store/appStore'
import { useAuthStore } from '@/modules/identity'
import { useKidStore } from '@/hooks/useKidStore'

const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: 'happy',   emoji: '😊', label: 'Happy'   },
  { key: 'excited', emoji: '🤩', label: 'Excited' },
  { key: 'neutral', emoji: '😐', label: 'Neutral' },
  { key: 'tired',   emoji: '😴', label: 'Tired'   },
]

function daysUntil(dateStr: string) {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000)
}

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function now24() {
  const d = new Date()
  return d.getHours() * 60 + d.getMinutes()
}

export default function ChildDashboard() {
  const navigate = useNavigate()

  // ── Auth store: who is logged in ──────────────────────────────────────────
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)

  // ── Per-kid store (all data is per-kid — no global Prisha bleed-over) ────
  const {
    subjects: kidSubjects, olympiads, weeklySchedule, worksheets,
    logs, badges, xpTotal: displayXP, streakDays: displayStreak, addLog,
  } = useKidStore()

  // ── Resolved display values ────────────────────────────────────────────────
  const displayName   = activeKid?.name   ?? 'Student'
  const displayGrade  = activeKid?.grade  ?? ''
  const displayAvatar = activeKid?.avatar ?? '👤'
  const displayPhoto  = activeKid?.photoUrl
  const displayColor  = activeKid?.color  ?? '#4F46E5'
  const displayBoard  = activeKid?.board  ?? ''
  const displaySchool = activeKid?.school ?? ''

  // ── Subjects with progress percentages ────────────────────────────────────
  const displaySubjects = useMemo(() => kidSubjects.map(sub => {
    const total = sub.chapters.reduce((a, c) => a + c.topics.length, 0)
    const done  = sub.chapters.reduce((a, c) => a + c.topics.filter(t => t.isCompleted).length, 0)
    return { ...sub, pct: total > 0 ? Math.round((done / total) * 100) : 0, done, total }
  }), [kidSubjects])

  // ── XP level ───────────────────────────────────────────────────────────────
  const level  = getLevel(displayXP)
  const nextXP = displayXP >= 1500 ? 9999 : displayXP >= 500 ? 1500 : displayXP >= 100 ? 500 : 100
  const prevXP = displayXP >= 1500 ? 1500 : displayXP >= 500 ? 500  : displayXP >= 100 ? 100 : 0
  const xpPct  = Math.min(1, (displayXP - prevXP) / (nextXP - prevXP))

  // ── Local state ────────────────────────────────────────────────────────────
  const [selSubject, setSelSubject] = useState(displaySubjects[0]?.name ?? '')
  const [selMood,    setSelMood]    = useState<Mood>('happy')
  const [activity,   setActivity]   = useState('')
  const [loggedSet,  setLoggedSet]  = useState<Set<string>>(new Set())
  const [toast,      setToast]      = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  const handleTap = (subjectName: string) => {
    addLog(subjectName, 'Self study session', 30, 'happy')
    setLoggedSet(prev => new Set([...prev, subjectName]))
    showToast(`+10 XP · ${subjectName} logged! 🎉`)
  }

  const handleCustom = () => {
    if (!activity.trim()) return
    addLog(selSubject, activity.trim(), 20, selMood)
    setActivity('')
    showToast(`+10 XP · ${selSubject} logged!`)
  }

  const todayLogs = logs.filter(l =>
    new Date(l.createdAt).toDateString() === new Date().toDateString()
  )

  // ── Today's schedule ───────────────────────────────────────────────────────
  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long' })
  const nowMins = now24()
  const todayScheduleDay = weeklySchedule.find(d => d.day === today) ?? weeklySchedule[0]
  const currentBlock  = todayScheduleDay?.slots.find(s => toMinutes(s.startTime) <= nowMins && toMinutes(s.endTime) > nowMins)
  const nextBlock     = todayScheduleDay?.slots.find(s => toMinutes(s.startTime) > nowMins)

  const pendingWorksheets = worksheets.filter(w => w.status === 'pending' || w.status === 'in-progress')

  const nextOlympiad = useMemo(() => {
    const attending = olympiads.filter(o => o.isAttending || o.isRegistered)
    return attending.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())[0]
  }, [olympiads])

  // ── Activities from onboarding ────────────────────────────────────────────
  const activityList = (activeKid?.onboarding?.activities ?? []).map(a => ({
    emoji: activityEmoji(a), name: a, level: 'Learning',
    color: displayColor, bg: activeKid?.colorLight ?? '#EEF2FF',
  }))

  return (
    <div className="page-container">

      {/* ── Hero banner ─── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 16,
          alignItems: 'center', marginBottom: 20, padding: '18px 20px',
          borderRadius: 14,
          background: `linear-gradient(135deg, #1E293B, #312E81)`,
          boxShadow: '0 4px 24px rgba(79,70,229,0.2)',
        }}>

        {/* Avatar */}
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: `linear-gradient(135deg,${displayColor},#7C3AED)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 28, border: '2px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
          }}>
            {displayPhoto
              ? <img src={displayPhoto} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : displayAvatar}
          </div>
          <div style={{ position: 'absolute', bottom: -3, right: -3, background: '#22C55E', borderRadius: '50%', width: 14, height: 14, border: '2px solid #1E293B' }} />
        </div>

        {/* Name/info */}
        <div>
          <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {nowMins < 720 ? 'Good Morning' : nowMins < 1020 ? 'Good Afternoon' : 'Good Evening'}!
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {displayName} 👋
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 3 }}>
            {displayGrade} · {displaySchool} · {displayBoard}
          </div>
          {currentBlock && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 6, padding: '3px 9px', borderRadius: 20, background: 'rgba(99,102,241,0.3)', border: '1px solid rgba(99,102,241,0.4)' }}>
              <Clock size={10} color="#A5B4FC" />
              <span style={{ fontSize: 10, color: '#A5B4FC', fontWeight: 600 }}>Now: {currentBlock.label}</span>
            </div>
          )}
        </div>

        {/* XP / streak */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: 'rgba(217,119,6,0.2)', border: '1px solid rgba(217,119,6,0.4)' }}>
            <Flame size={14} color="#FBBF24" />
            <span style={{ fontSize: 14, fontWeight: 900, color: '#FCD34D' }}>{displayStreak}</span>
            <span style={{ fontSize: 10, color: '#FCD34D' }}>day streak</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 12, background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)' }}>
            <Zap size={14} color="#A78BFA" />
            <span style={{ fontSize: 14, fontWeight: 900, color: '#C4B5FD' }}>{displayXP}</span>
            <span style={{ fontSize: 10, color: '#C4B5FD' }}>XP · {level.name}</span>
          </div>
          <div style={{ width: 100, height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct * 100}%` }} transition={{ duration: 1.2 }}
              style={{ height: '100%', background: 'linear-gradient(90deg,#6366F1,#A78BFA)', borderRadius: 3 }} />
          </div>
        </div>
      </motion.div>

      {/* ── Goal + daily motivation band ─── */}
      {(() => {
        const goal = activeKid?.onboarding?.lifeGoal
        const targetYear = activeKid?.onboarding?.targetYear
        const { quote, emoji } = dailyMotivation(displayName, activeKid?.age ?? 9, goal ?? '')
        return (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', marginBottom: 18, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg,#FFF7ED,#FEF3FF)', border: '1px solid #FBCFE8' }}>
            <div style={{ flex: '1 1 260px', minWidth: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#9333EA', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 3 }}>
                {goal ? 'My Dream' : 'Today'}
              </div>
              {goal ? (
                <button onClick={() => navigate('/profile')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', textAlign: 'left' }}>
                  <span style={{ fontSize: 17, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>🎯 {goal}</span>
                  {targetYear ? <span style={{ fontSize: 12, fontWeight: 700, color: '#9333EA', marginLeft: 8 }}>by {targetYear}</span> : null}
                </button>
              ) : (
                <button onClick={() => navigate('/profile')} style={{ fontSize: 14, fontWeight: 800, color: '#9333EA', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  🎯 Set your dream goal →
                </button>
              )}
            </div>
            <div style={{ flex: '2 1 320px', fontSize: 14, fontWeight: 700, color: '#7C2D12', lineHeight: 1.5 }}>
              {emoji} {quote}
            </div>
          </motion.div>
        )
      })()}

      {/* ── Toast ─── */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={{ background: '#ECFDF5', border: '1px solid #BBF7D0', borderRadius: 10, padding: '10px 16px', marginBottom: 14, fontSize: 13, fontWeight: 600, color: '#166534', display: 'flex', alignItems: 'center', gap: 8 }}>
            ✅ {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 3-column grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 300px', gap: 14, alignItems: 'start' }}>

        {/* ── LEFT COL ──────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Subject progress */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Subject Progress</div>
              {displaySubjects.some(s => s.total > 0) && (
                <button onClick={() => navigate('/syllabus')}
                  style={{ fontSize: 10, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                  Full Syllabus <ChevronRight size={10} />
                </button>
              )}
            </div>

            {displaySubjects.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>📚</div>
                <div style={{ fontSize: 12, color: '#64748B' }}>No subjects set up yet.</div>
                <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4 }}>Complete your profile setup to add subjects.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {displaySubjects.map(sub => (
                  <div key={sub.id} onClick={() => navigate('/syllabus')} title={`Open ${sub.name} syllabus`}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', borderRadius: 8, padding: '2px 4px', margin: '0 -4px' }}>
                    <span style={{ fontSize: 16, flexShrink: 0, width: 22, textAlign: 'center' }}>{sub.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A' }}>{sub.name}</span>
                        <span style={{ fontSize: 10, color: sub.color, fontWeight: 700 }}>
                          {sub.total > 0 ? `${sub.pct}%` : 'Day 1'}
                        </span>
                      </div>
                      <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${sub.pct}%`, height: '100%', background: sub.color, borderRadius: 3, transition: 'width 0.8s' }} />
                      </div>
                      {sub.total > 0 && (
                        <div style={{ fontSize: 9.5, color: '#94A3B8', marginTop: 2 }}>{sub.done}/{sub.total} topics</div>
                      )}
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); if (!loggedSet.has(sub.name)) handleTap(sub.name) }} title="Log a study session"
                      style={{ flexShrink: 0, width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', background: loggedSet.has(sub.name) ? '#DCFCE7' : '#EEF2FF', color: loggedSet.has(sub.name) ? '#166534' : '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {loggedSet.has(sub.name) ? '✓' : '+'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick log */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Log Study Session</div>

            {displaySubjects.length > 0 ? (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
                  {displaySubjects.slice(0, 5).map(sub => (
                    <button key={sub.id} onClick={() => setSelSubject(sub.name)}
                      style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, background: selSubject === sub.name ? sub.color : '#F1F5F9', color: selSubject === sub.name ? '#fff' : '#64748B', border: 'none', transition: 'all 0.12s' }}>
                      {sub.icon} {sub.name}
                    </button>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 5, marginBottom: 10 }}>
                  {MOODS.map(m => (
                    <button key={m.key} onClick={() => setSelMood(m.key)}
                      style={{ padding: '6px 4px', borderRadius: 8, cursor: 'pointer', textAlign: 'center', border: 'none', background: selMood === m.key ? '#EEF2FF' : '#F8FAFC', outline: selMood === m.key ? '1.5px solid #6366F1' : 'none' }}>
                      <div style={{ fontSize: 16 }}>{m.emoji}</div>
                      <div style={{ fontSize: 9.5, color: selMood === m.key ? '#4F46E5' : '#94A3B8', fontWeight: 600, marginTop: 2 }}>{m.label}</div>
                    </button>
                  ))}
                </div>
                <input value={activity} onChange={e => setActivity(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleCustom()}
                  placeholder="What did you study? e.g. Finished Ch.3…"
                  style={{ width: '100%', fontSize: 12, padding: '8px 12px', borderRadius: 8, border: '1px solid #DCE8F5', outline: 'none', marginBottom: 8, fontFamily: 'inherit' }} />
                <button onClick={handleCustom}
                  style={{ width: '100%', padding: '9px 0', borderRadius: 9, background: displayColor, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
                  ⚡ Save Log · +10 XP
                </button>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 12, color: '#94A3B8' }}>
                Add subjects in your profile setup to start logging.
              </div>
            )}
          </div>

          {/* Today's logs */}
          {todayLogs.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                Today's Logs <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 400 }}>({todayLogs.length})</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {todayLogs.map(log => (
                  <div key={log.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                    <span style={{ fontSize: 16 }}>
                      {log.mood === 'happy' ? '😊' : log.mood === 'excited' ? '🤩' : log.mood === 'neutral' ? '😐' : '😴'}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>{log.subject}</div>
                      <div style={{ fontSize: 10.5, color: '#94A3B8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.activity}</div>
                    </div>
                    <span style={{ fontSize: 10, background: '#ECFDF5', color: '#166534', padding: '2px 7px', borderRadius: 10, fontWeight: 700 }}>+10 XP</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── MIDDLE COL ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Today's schedule */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Today — {today}</div>
              {weeklySchedule.length > 0 && (
                <button onClick={() => navigate('/plan')}
                  style={{ fontSize: 10, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                  My Planner <ChevronRight size={10} />
                </button>
              )}
            </div>

            {!todayScheduleDay ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>📅</div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 4 }}>No schedule set up yet.</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>Your timetable will appear here once added.</div>
              </div>
            ) : (
              <>
                {currentBlock && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 9, background: '#EEF2FF', border: '1px solid #C7D2FE', marginBottom: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5' }} className="pulse-dot" />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#4338CA' }}>Now: {currentBlock.label}</div>
                      <div style={{ fontSize: 10, color: '#6366F1' }}>{currentBlock.startTime}–{currentBlock.endTime}</div>
                    </div>
                  </div>
                )}
                {nextBlock && (
                  <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 8 }}>
                    Next: <strong style={{ color: '#64748B' }}>{nextBlock.label}</strong> at {nextBlock.startTime}
                  </div>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5, maxHeight: 260, overflowY: 'auto' }}>
                  {(todayScheduleDay.slots).slice(0, 10).map(slot => {
                    const isPast = toMinutes(slot.endTime) < nowMins
                    const isCurr = toMinutes(slot.startTime) <= nowMins && toMinutes(slot.endTime) > nowMins
                    const catEmoji: Record<string, string> = { school:'🏫', swimming:'🏊', dance:'💃', drawing:'🎨', music:'🎵', study:'📚', homework:'📝', meal:'🍛', sleep:'😴', break:'😌', free:'🎮' }
                    const catColor: Record<string, string> = { school:'#2563EB', swimming:'#06B6D4', dance:'#EC4899', drawing:'#F59E0B', music:'#8B5CF6', study:'#4F46E5', homework:'#22C55E', meal:'#F97316', sleep:'#94A3B8', break:'#94A3B8', free:'#86EFAC' }
                    return (
                      <div key={slot.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', borderRadius: 7, background: isCurr ? '#EEF2FF' : '#F8FAFC', border: isCurr ? '1px solid #C7D2FE' : '1px solid #F1F5F9', opacity: isPast ? 0.5 : 1 }}>
                        <span style={{ fontSize: 13, flexShrink: 0 }}>{catEmoji[slot.category] ?? '📌'}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 11, fontWeight: isCurr ? 700 : 500, color: isCurr ? '#4338CA' : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{slot.label}</div>
                        </div>
                        <span style={{ fontSize: 9.5, color: '#94A3B8', flexShrink: 0 }}>{slot.startTime}</span>
                        <div style={{ width: 3, height: 20, borderRadius: 2, background: catColor[slot.category] ?? '#64748B', flexShrink: 0 }} />
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          {/* Activities */}
          {activityList.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>My Activities</div>
              {activityList.map(a => (
                <div key={a.name} onClick={() => navigate('/activities')} title={`Open ${a.name}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7, cursor: 'pointer', borderRadius: 8, padding: '2px 4px', margin: '0 -4px 7px' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{a.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F172A' }}>{a.name}</div>
                    <div style={{ fontSize: 10, color: a.color, fontWeight: 600 }}>{a.level}</div>
                  </div>
                  <ChevronRight size={13} color="#CBD5E1" />
                </div>
              ))}
            </div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>
                <Trophy size={13} style={{ display: 'inline', marginRight: 5 }} />My Badges
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {badges.slice(0, 9).map(b => (
                  <span key={b} title={b} style={{ fontSize: 20, padding: '4px 6px', borderRadius: 8, background: '#FFF7ED', border: '1px solid #FED7AA' }}>{b}</span>
                ))}
              </div>
            </div>
          )}

          {/* Day-1 encouragement when no schedule yet */}
          {weeklySchedule.length === 0 && (
            <div style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 12, border: '1px solid #C7D2FE', padding: '16px' }}>
              <div style={{ fontSize: 22, marginBottom: 8 }}>🚀</div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#4338CA', marginBottom: 6 }}>Welcome, {displayName}!</div>
              <div style={{ fontSize: 12, color: '#6366F1', lineHeight: 1.7 }}>
                Your learning journey starts today. Log your first study session to earn 10 XP and start your streak!
              </div>
              {activeKid?.onboarding?.lifeGoal && (
                <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 8, background: 'rgba(99,102,241,0.1)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#4F46E5', marginBottom: 2 }}>YOUR GOAL</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>🎯 {activeKid.onboarding.lifeGoal}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── RIGHT COL ──────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Olympiad countdown (Prisha only) */}
          {nextOlympiad && (() => {
            const days    = daysUntil(nextOlympiad.examDate)
            const urgency = days <= 30 ? '#DC2626' : days <= 60 ? '#D97706' : '#4F46E5'
            const urgBg   = days <= 30 ? '#FFF5F5' : days <= 60 ? '#FFFBEB' : '#EEF2FF'
            return (
              <div style={{ background: '#fff', borderRadius: 12, border: `1.5px solid ${urgency}30`, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>Next Olympiad</div>
                  <button onClick={() => navigate('/olympiads')} style={{ fontSize: 10, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>All <ChevronRight size={10} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: 10, background: urgBg, border: `1.5px solid ${urgency}30`, flexShrink: 0 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: urgency, lineHeight: 1 }}>{days}</div>
                    <div style={{ fontSize: 9, color: urgency, fontWeight: 700, textTransform: 'uppercase' }}>days</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>{nextOlympiad.shortName}</div>
                    <div style={{ fontSize: 10, color: '#64748B', marginTop: 2 }}>{nextOlympiad.name}</div>
                    <div style={{ fontSize: 10, color: urgency, fontWeight: 600, marginTop: 4 }}>
                      {new Date(nextOlympiad.examDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {nextOlympiad.isRegistered && <span style={{ fontSize: 10, background: '#DCFCE7', color: '#166534', padding: '2px 7px', borderRadius: 10, fontWeight: 600, display: 'inline-block', marginTop: 4 }}>✓ Registered</span>}
                  </div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Prep Progress</span>
                    <span style={{ fontSize: 10, color: urgency, fontWeight: 700 }}>{nextOlympiad.prepProgress}%</span>
                  </div>
                  <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ width: `${nextOlympiad.prepProgress}%`, height: '100%', background: urgency, borderRadius: 3 }} />
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Pending worksheets */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                <BookOpen size={13} style={{ display: 'inline', marginRight: 5 }} />Worksheets
              </div>
              {worksheets.length > 0 && (
                <button onClick={() => navigate('/worksheets')} style={{ fontSize: 10, color: '#4F46E5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}>
                  All <ChevronRight size={10} />
                </button>
              )}
            </div>
            {pendingWorksheets.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={22} color="#22C55E" style={{ margin: '0 auto 6px' }} />
                <div style={{ fontSize: 11, color: '#64748B' }}>{worksheets.length > 0 ? 'All done!' : 'Worksheets will be added by your teacher.'}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {pendingWorksheets.slice(0, 4).map(ws => {
                  const dueIn = daysUntil(ws.dueDate)
                  return (
                    <div key={ws.id} onClick={() => navigate('/worksheets')}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #F1F5F9', cursor: 'pointer' }}>
                      <span style={{ fontSize: 18, flexShrink: 0 }}>📄</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11.5, fontWeight: 600, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.title}</div>
                        <div style={{ fontSize: 10, color: '#94A3B8' }}>{ws.subject} · {ws.estimatedMinutes}m</div>
                      </div>
                      <div style={{ fontSize: 9.5, color: dueIn <= 2 ? '#DC2626' : '#94A3B8', fontWeight: 600, flexShrink: 0 }}>
                        {dueIn <= 0 ? 'Overdue' : `${dueIn}d`}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Quick nav */}
          <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #DCE8F5', padding: '14px 16px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 10 }}>Quick Navigate</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              {[
                { label: 'Syllabus',  emoji: '📚', path: '/syllabus',  bg: '#EEF2FF', color: '#4F46E5' },
                { label: 'My Planner', emoji: '📅', path: '/plan',     bg: '#ECFDF5', color: '#059669' },
                { label: 'Olympiads', emoji: '🏆', path: '/olympiads', bg: '#FFFBEB', color: '#D97706' },
                { label: 'AI Tutor',  emoji: '🤖', path: '/assistant', bg: '#F5F3FF', color: '#7C3AED' },
              ].map(tile => (
                <button key={tile.path} onClick={() => navigate(tile.path)}
                  style={{ padding: '10px 8px', borderRadius: 9, border: `1px solid ${tile.color}20`, background: tile.bg, cursor: 'pointer', textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 3 }}>{tile.emoji}</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: tile.color }}>{tile.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Academic year progress */}
          <div style={{ background: 'linear-gradient(135deg,#1E293B,#0F172A)', borderRadius: 12, padding: '14px 16px', color: '#F1F5F9' }}>
            <div style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, marginBottom: 8 }}>
              <Calendar size={10} style={{ display: 'inline', marginRight: 4 }} />
              AY 2026–27 · {displaySchool.split(',')[0]}
            </div>
            {(() => {
              const start = new Date('2026-06-01').getTime()
              const end   = new Date('2027-03-31').getTime()
              const now   = Date.now()
              const pct   = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)))
              const weeksLeft = Math.ceil((end - now) / (7 * 86400000))
              return (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>Jun 2026</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#A5B4FC' }}>{pct}% done</span>
                    <span style={{ fontSize: 10, color: '#94A3B8' }}>Mar 2027</span>
                  </div>
                  <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg,#6366F1,#A78BFA)', borderRadius: 4 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#64748B' }}>{weeksLeft > 0 ? `${weeksLeft} weeks remaining` : 'Academic year complete!'}</div>
                </>
              )
            })()}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Daily motivation keyed to the child's ambition + age ───────────────────────
function dailyMotivation(name: string, age: number, goal: string): { quote: string; emoji: string } {
  const g = goal.toLowerCase()
  const pools: { match: RegExp; emoji: string; lines: string[] }[] = [
    { match: /space|astronaut|astro|scientist|science|physic|research/, emoji: '🚀', lines: [
      `Every great scientist started by asking "why?" — keep wondering, ${name}!`,
      'The stars are reached one small step at a time. Take yours today.',
      'Curiosity is your superpower — discover something new today!',
    ] },
    { match: /doctor|medicine|surgeon|nurse|bio|marine|vet/, emoji: '🩺', lines: [
      `Healers begin with curiosity and kindness — you have both, ${name}.`,
      "Every page you learn today helps someone you'll care for tomorrow.",
      'Great doctors are great learners first. Keep going!',
    ] },
    { match: /sport|swim|cricket|football|athlete|olympic|tennis|badminton|skat/, emoji: '🏅', lines: [
      `Champions train even on the days they don't feel like it. Show up, ${name}!`,
      'Small practice today, big medal tomorrow. 🏆',
      'Discipline beats talent — and you have the discipline!',
    ] },
    { match: /art|paint|draw|design|music|sing|dance|actor|create|fashion/, emoji: '🎨', lines: [
      `Create a little every day and watch your magic grow, ${name}.`,
      'Your imagination has no limits — let it out today!',
      'Practice turns talent into art. Keep creating!',
    ] },
    { match: /engineer|coding|tech|robot|software|computer|game|ai/, emoji: '💡', lines: [
      `Builders change the world one idea at a time. Build today, ${name}!`,
      'Every problem you solve makes you smarter. Keep solving!',
      'Great inventions start as tiny experiments — try one today.',
    ] },
    { match: /teacher|lawyer|business|leader|ias|ips|civil|entrepreneur|pilot/, emoji: '⭐', lines: [
      `Leaders are learners. Learn something worth sharing today, ${name}.`,
      "Your effort today shapes the leader you'll become.",
      'Big dreams need daily steps — take one now!',
    ] },
  ]
  const general = { emoji: '🌟', lines: [
    `A little progress each day adds up to big things, ${name}!`,
    "Believe in yourself — you're capable of amazing things.",
    'Today is a fresh page — make it a great one!',
    age <= 8 ? `You're a superstar in the making, ${name}! ✨` : `Dream big and work a little every day, ${name}.`,
  ] }
  const pool = pools.find(p => p.match.test(g)) ?? general
  const dayIdx = Math.floor(Date.now() / 86400000)
  return { quote: pool.lines[dayIdx % pool.lines.length], emoji: pool.emoji }
}

// ── Activity emoji helper ──────────────────────────────────────────────────────
function activityEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('swim'))         return '🏊'
  if (n.includes('cricket'))      return '🏏'
  if (n.includes('football') || n.includes('soccer')) return '⚽'
  if (n.includes('badminton'))    return '🏸'
  if (n.includes('tennis'))       return '🎾'
  if (n.includes('basketball'))   return '🏀'
  if (n.includes('gymnastics') || n.includes('skating')) return '🤸'
  if (n.includes('chess'))        return '♟️'
  if (n.includes('bharatanatyam') || n.includes('kathak') || n.includes('dance')) return '💃'
  if (n.includes('vocal') || n.includes('singing')) return '🎤'
  if (n.includes('guitar'))       return '🎸'
  if (n.includes('piano'))        return '🎹'
  if (n.includes('tabla') || n.includes('drums')) return '🥁'
  if (n.includes('flute'))        return '🎵'
  if (n.includes('violin'))       return '🎻'
  if (n.includes('drawing') || n.includes('painting') || n.includes('art')) return '🎨'
  if (n.includes('coding') || n.includes('programming')) return '💻'
  if (n.includes('robotics'))     return '🤖'
  if (n.includes('theatre') || n.includes('drama')) return '🎭'
  if (n.includes('debate'))       return '🎙️'
  if (n.includes('reading'))      return '📖'
  if (n.includes('cooking'))      return '👨‍🍳'
  return '⭐'
}
