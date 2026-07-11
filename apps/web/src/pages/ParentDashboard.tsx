import { motion } from 'framer-motion'
import { RefreshCw, Bell, TrendingUp, Clock, Zap, Award, User } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { useAppStore, getLevel } from '@/store/appStore'
import { useAuthStore } from '@/modules/identity'
import { useKidStore } from '@/hooks/useKidStore'
import QuoteOfDay from '@/components/QuoteOfDay'
import { useEngagementStore, todayState } from '@/store/engagementStore'
import { buildDailyFeed, dayKey } from '@/lib/dailyFeed'
import { GRADE_LADDER, currentGradeIndex } from '@/lib/grades'

const weekData = [
  { day: 'Mon', xp: 20, mins: 45 }, { day: 'Tue', xp: 35, mins: 60 },
  { day: 'Wed', xp: 15, mins: 30 }, { day: 'Thu', xp: 45, mins: 75 },
  { day: 'Fri', xp: 35, mins: 55 }, { day: 'Sat', xp: 50, mins: 90 },
  { day: 'Sun', xp: 30, mins: 50 },
]

const MOOD_EMOJI: Record<string, string> = { happy: '😊', excited: '🤩', neutral: '😐', tired: '😴' }
const MOOD_LABEL: Record<string, string> = { happy: 'Happy', excited: 'Excited', neutral: 'Neutral', tired: 'Tired' }

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: d, ease: [0.16, 1, 0.3, 1] },
})

function StatCard({ icon: Icon, label, value, sub, color, bg }: any) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={17} color={color} />
        </div>
        <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{label}</span>
      </div>
      <div className="stat-value" style={{ color, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#9CA3AF' }}>{sub}</div>}
    </div>
  )
}

// Read-only mirror of the child's daily challenge (feedback: parents asked to see it).
function ParentDailyChallenge({ kid }: { kid: { id: string; name: string; grade?: string; onboarding?: { subjects?: string[] } } }) {
  const byChild = useEngagementStore(s => s.byChild)
  const grade = GRADE_LADDER[currentGradeIndex(kid.grade)]
  const subjects = kid.onboarding?.subjects ?? []
  const dk = dayKey()
  const feed = buildDailyFeed(kid.id, grade, subjects, dk)
  const { done } = todayState(byChild, kid.id, dk)

  const tasks = [
    { key: 'riddle',  icon: '🧩', label: 'Riddle of the day', detail: feed.riddle?.prompt },
    { key: 'words',   icon: '📖', label: '5 new words',        detail: feed.words?.map(w => w.word).join(', ') },
    { key: 'proverb', icon: '🦉', label: 'Proverb of the day', detail: feed.proverb?.prompt },
    { key: 'game',    icon: '🎮', label: "Today's game",       detail: feed.game?.title ?? 'A quick brain game' },
  ]
  const completed = tasks.filter(t => done.includes(t.key)).length

  return (
    <motion.div {...fade(0.07)} className="card" style={{ padding: 20, marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>
          Today's Challenge <span style={{ fontWeight: 600, color: '#9CA3AF' }}>· {completed}/{tasks.length} done by {kid.name}</span>
        </p>
        <span style={{ fontSize: 11, color: '#9CA3AF' }}>👀 Read-only mirror of {kid.name}'s view</span>
      </div>
      <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 14 }}>Focus: {feed.focus}</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
        {tasks.map(t => {
          const isDone = done.includes(t.key)
          return (
            <div key={t.key} style={{ padding: '10px 12px', borderRadius: 10, border: `1px solid ${isDone ? '#BBF7D0' : '#E8ECF4'}`, background: isDone ? '#F0FDF4' : '#fff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 15 }}>{t.icon}</span>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#111827', flex: 1 }}>{t.label}</span>
                {isDone
                  ? <span style={{ fontSize: 10.5, fontWeight: 700, color: '#16A34A' }}>✓ Done</span>
                  : <span style={{ fontSize: 10.5, color: '#9CA3AF' }}>Pending</span>}
              </div>
              {t.detail && <div style={{ fontSize: 11.5, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.detail}</div>}
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default function ParentDashboard() {
  const { summary, isGenerating, refreshSummary } = useAppStore()
  const { activeKidId, kids } = useAuthStore()
  const { logs, xpTotal, streakDays, badges } = useKidStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const childName = activeKid?.name ?? 'Student'
  const level = getLevel(xpTotal)

  // Build subject goals from onboarding data
  const subjectGoals = Object.entries(activeKid?.onboarding?.subjectGoalMins ?? {})
    .map(([subject, weeklyMinutes]) => ({ subject, weeklyMinutes, active: true }))

  const todayLogs = logs.filter(l => new Date(l.createdAt).toDateString() === new Date().toDateString())
  const totalMins = todayLogs.reduce((a, l) => a + l.durationMinutes, 0)

  const subjectMap: Record<string, number> = {}
  todayLogs.forEach(l => { subjectMap[l.subject] = (subjectMap[l.subject] || 0) + l.durationMinutes })
  const subjectData = Object.entries(subjectMap).map(([name, mins]) => ({ name, mins }))

  useEffect(() => { if (!summary) refreshSummary() }, [])

  return (
    <div className="page-container">

      {/* Header */}
      <motion.div {...fade(0)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p className="label" style={{ marginBottom: 6 }}>Parent Dashboard</p>
          <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', color: '#111827', lineHeight: 1.1 }}>
            {childName}'s Progress
          </h1>
          <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>Real-time learning insights for today</p>
        </div>
        <div className="badge badge-brand" style={{ padding: '6px 14px', fontSize: 13 }}>
          {level.emoji} {level.name} · {xpTotal} XP
        </div>
      </motion.div>

      <motion.div {...fade(0.02)} style={{ marginBottom: 20 }}><QuoteOfDay /></motion.div>

      {activeKid && <ParentDailyChallenge kid={activeKid} />}

      {/* Child profile strip */}
      <motion.div {...fade(0.05)} className="card" style={{ padding: '16px 24px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
        <div style={{ fontSize: 44 }}>{activeKid?.avatar ?? '👤'}</div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
            {activeKid?.grade && <span className="badge badge-gray" style={{ fontSize: 11 }}>{activeKid.grade}</span>}
            {activeKid?.school && <span className="badge badge-gray" style={{ fontSize: 11 }}>{activeKid.school}</span>}
            {activeKid?.age && <span className="badge badge-gray" style={{ fontSize: 11 }}>Age {activeKid.age}</span>}
          </div>
          <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>
            {activeKid?.onboarding?.lifeGoal
              ? `Goal: ${activeKid.onboarding.lifeGoal}`
              : 'No goal set — complete profile setup.'}
          </p>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end', flexShrink: 0 }}>
          {activeKid?.onboarding?.activities && activeKid.onboarding.activities.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {activeKid.onboarding.activities.slice(0, 3).map(t => (
                <span key={t} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontWeight: 600 }}>
                  ⚡ {t}
                </span>
              ))}
            </div>
          )}
          <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>
            <User size={12} /> View full profile
          </Link>
        </div>
      </motion.div>

      {/* Stats row */}
      <motion.div {...fade(0.1)} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        <StatCard icon={Zap}       label="XP Total"    value={xpTotal}         sub="All time"   color="#D97706" bg="#FFFBEB" />
        <StatCard icon={TrendingUp} label="Day Streak"  value={`${streakDays}d`} sub="🔥 Active"  color="#DC2626" bg="#FEF2F2" />
        <StatCard icon={Clock}     label="Study Time"  value={`${totalMins}m`}  sub="Today"      color="#0891B2" bg="#ECFEFF" />
        <StatCard icon={Award}     label="Badges"      value={badges.length}    sub="Earned"     color="#7C3AED" bg="#F5F3FF" />
      </motion.div>

      {/* AI Summary */}
      <motion.div {...fade(0.1)} className="card" style={{ padding: 24, marginBottom: 20, borderColor: '#C7D2FE' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="badge badge-brand">✦ AI Summary</div>
              <span style={{ fontSize: 12, color: '#9CA3AF' }}>Groq · llama3 · real-time</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Bell size={13} color="#059669" />
              <span style={{ fontSize: 12, color: '#059669', fontWeight: 600 }}>6 PM daily alert</span>
            </div>
            <button onClick={refreshSummary} disabled={isGenerating} className="btn btn-secondary" style={{ padding: '6px 14px', fontSize: 12 }}>
              <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Generating…' : 'Refresh'}
            </button>
          </div>
        </div>
        <p style={{ fontSize: 15, color: '#374151', lineHeight: 1.8 }}>
          {isGenerating
            ? 'Generating your personalised AI summary…'
            : summary || `${childName} has ${todayLogs.length} log${todayLogs.length !== 1 ? 's' : ''} today. Click Refresh to generate an AI summary.`}
        </p>
        <hr className="divider" style={{ margin: '16px 0' }} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>📤 Share with tutor</button>
          <button className="btn btn-ghost" style={{ fontSize: 12, padding: '7px 14px' }}>📄 Export PDF</button>
        </div>
      </motion.div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>

        <motion.div {...fade(0.15)} className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Weekly XP Progress</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>XP earned each day this week</p>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={weekData} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
              <defs>
                <linearGradient id="xpGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#4F46E5" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="day" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <Area type="monotone" dataKey="xp" stroke="#4F46E5" strokeWidth={2.5} fill="url(#xpGrad)"
                dot={{ fill: '#4F46E5', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#4F46E5' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div {...fade(0.2)} className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 4 }}>Today's Subjects</p>
          <p style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 16 }}>Minutes per subject logged today</p>
          {subjectData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={subjectData} margin={{ top: 4, right: 0, bottom: 0, left: -24 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E8ECF4', borderRadius: 10, fontSize: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
                <Bar dataKey="mins" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: 13 }}>
              No logs today yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Subject Goals vs Actuals */}
      <motion.div {...fade(0.25)} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>Weekly Subject Goals</p>
            <p style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>Today's progress vs. {childName}'s weekly target</p>
          </div>
          <Link to="/profile" style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600, textDecoration: 'none' }}>Edit goals →</Link>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {subjectGoals.map(g => {
            const todayMins = todayLogs.filter(l => l.subject === g.subject).reduce((a, l) => a + l.durationMinutes, 0)
            const dailyTarget = Math.round(g.weeklyMinutes / 5)
            const pct = Math.min(100, (todayMins / Math.max(1, dailyTarget)) * 100)
            return (
              <div key={g.subject} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#374151', width: 64, flexShrink: 0 }}>{g.subject}</span>
                <div style={{ flex: 1 }}>
                  <div className="progress-track">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.8, delay: 0.1 }}
                      style={{ height: '100%', borderRadius: 4, background: pct >= 100 ? '#059669' : '#4F46E5', transition: 'none' }} />
                  </div>
                </div>
                <div style={{ flexShrink: 0, textAlign: 'right', minWidth: 90 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: pct >= 100 ? '#059669' : '#111827' }}>{todayMins}m</span>
                  <span style={{ fontSize: 11, color: '#9CA3AF' }}> / {dailyTarget}m today</span>
                </div>
              </div>
            )
          })}
          {subjectGoals.length === 0 && (
            <p style={{ fontSize: 13, color: '#9CA3AF', textAlign: 'center', padding: '12px 0' }}>
              No active subjects — <Link to="/profile" style={{ color: '#4F46E5', textDecoration: 'none' }}>set up goals in Profile</Link>
            </p>
          )}
        </div>
      </motion.div>

      {/* Activity timeline */}
      <motion.div {...fade(0.3)} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 16 }}>Today's Activity Log</p>
        {todayLogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0', color: '#9CA3AF', fontSize: 13 }}>
            No sessions yet. Ask {childName} to log a subject — it takes 10 seconds!
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayLogs.map((log, i) => (
              <motion.div key={log.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i }} className="card-flat"
                style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>
                  {MOOD_EMOJI[log.mood] ?? '😊'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>{log.subject}</div>
                  <div style={{ fontSize: 12, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {log.activity} · {MOOD_LABEL[log.mood]}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: 12, color: '#6B7280' }}>{log.durationMinutes} min</div>
                  <div className="badge badge-emerald" style={{ marginTop: 4, fontSize: 11 }}>+10 XP</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Badges */}
      {badges.length > 0 && (
        <motion.div {...fade(0.3)} className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Achievements Unlocked</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {badges.map(b => <span key={b} className="badge badge-amber">{b}</span>)}
          </div>
        </motion.div>
      )}
    </div>
  )
}
