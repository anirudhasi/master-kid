import { motion } from 'framer-motion'
import { useState } from 'react'
import { Edit3, Save, Trophy, Flame, Zap, Target, BookOpen, Star, User } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useKidStore } from '@/hooks/useKidStore'
import { getLevel } from '@/store/appStore'

const GRADES = [
  'Pre-Nursery','Nursery','LKG','UKG',
  'Grade 1','Grade 2','Grade 3','Grade 4','Grade 5',
  'Grade 6','Grade 7','Grade 8',
  'Grade 9','Grade 10','Grade 11','Grade 12',
]
const BOARDS = ['CBSE','ICSE','IB','IGCSE','State Board']
const AVATARS = ['👧','👦','🧒','👩','🎓','🌟','🦋','🐬','🦁','🐯','🦊','🐸']

export default function StudentProfile() {
  const { activeKidId, kids, updateKid } = useAuthStore()
  const { xpTotal, streakDays, badges, subjects } = useKidStore()

  const activeKid = kids.find(k => k.id === activeKidId)

  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({
    name:   activeKid?.name   ?? '',
    grade:  activeKid?.grade  ?? 'Grade 4',
    board:  activeKid?.board  ?? 'CBSE',
    school: activeKid?.school ?? '',
    age:    activeKid?.age    ?? 9,
    avatar: activeKid?.avatar ?? '👧',
  })
  const [saved, setSaved] = useState(false)

  // No kid selected (admin view)
  if (!activeKid) {
    return (
      <div className="page-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ fontSize: 56, marginBottom: 16 }}>👤</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No Profile Selected</div>
        <div style={{ fontSize: 14, color: '#64748B' }}>Select a child profile from the sidebar to view their profile.</div>
      </div>
    )
  }

  const level = getLevel(xpTotal)
  const nextXP = xpTotal >= 1500 ? 9999 : xpTotal >= 500 ? 1500 : xpTotal >= 100 ? 500 : 100
  const prevXP = xpTotal >= 1500 ? 1500 : xpTotal >= 500 ? 500  : xpTotal >= 100 ? 100 : 0
  const xpPct  = Math.min(1, (xpTotal - prevXP) / (nextXP - prevXP))

  const startEditing = () => {
    setForm({ name: activeKid.name, grade: activeKid.grade, board: activeKid.board, school: activeKid.school, age: activeKid.age, avatar: activeKid.avatar })
    setEditing(true)
  }

  const handleSave = () => {
    updateKid(activeKid.id, {
      name:   form.name,
      grade:  form.grade,
      board:  form.board,
      school: form.school,
      age:    form.age,
      avatar: form.avatar,
    })
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const onboarding   = activeKid.onboarding
  const activities   = onboarding?.activities ?? []
  const lifeGoal     = onboarding?.lifeGoal   ?? ''
  const targetYear   = onboarding?.targetYear  ?? (new Date().getFullYear() + 8)
  const subjectList  = subjects.length > 0
    ? subjects.map(s => s.name)
    : (onboarding?.subjects ?? [])

  const completeness = (() => {
    let s = 0
    if (activeKid.name.trim())   s += 15
    if (activeKid.grade)         s += 10
    if (activeKid.board)         s += 10
    if (activeKid.school.trim()) s += 10
    if (onboarding?.section)     s += 5
    if (lifeGoal.trim())         s += 20
    if (activities.length > 0)   s += 15
    if (subjectList.length > 0)  s += 15
    return Math.min(100, s)
  })()

  return (
    <div className="page-container">

      {/* ── Header ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
            Student Profile
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
            {activeKid.name}'s Profile
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {editing ? (
            <>
              <button onClick={() => setEditing(false)}
                style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#64748B' }}>
                Cancel
              </button>
              <button onClick={handleSave}
                style={{ padding: '8px 16px', borderRadius: 9, border: 'none', background: activeKid.color, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Save size={13} /> Save Changes
              </button>
            </>
          ) : (
            <button onClick={startEditing}
              style={{ padding: '8px 16px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#374151', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Edit3 size={13} /> Edit Profile
            </button>
          )}
        </div>
      </motion.div>

      {saved && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          style={{ padding: '12px 16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #BBF7D0', marginBottom: 16, fontSize: 13, fontWeight: 600, color: '#166534' }}>
          ✅ Profile saved! The dashboard and sidebar now reflect the changes.
        </motion.div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 18, alignItems: 'start' }}>

        {/* ── Left column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Identity card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #DCE8F5', padding: 24, textAlign: 'center' }}>

            {/* Avatar */}
            {editing ? (
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Choose Avatar</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, justifyContent: 'center' }}>
                  {AVATARS.map(a => (
                    <button key={a} onClick={() => setForm(f => ({ ...f, avatar: a }))}
                      style={{ width: 36, height: 36, borderRadius: 8, border: `2px solid ${form.avatar === a ? activeKid.color : '#E2E8F0'}`, background: form.avatar === a ? activeKid.colorLight : '#F8FAFC', fontSize: 18, cursor: 'pointer' }}>
                      {a}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: 22, background: `linear-gradient(135deg,${activeKid.colorLight},${activeKid.color}22)`, border: `2.5px solid ${activeKid.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 42, margin: '0 auto 14px', overflow: 'hidden' }}>
                {activeKid.photoUrl
                  ? <img src={activeKid.photoUrl} alt={activeKid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : activeKid.avatar}
              </div>
            )}

            {editing ? (
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', border: `1.5px solid ${activeKid.color}60`, borderRadius: 9, padding: '6px 12px', textAlign: 'center', width: '100%', outline: 'none', marginBottom: 10, fontFamily: 'inherit' }} />
            ) : (
              <div style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{activeKid.name}</div>
            )}

            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 12px', borderRadius: 20, background: activeKid.colorLight, border: `1px solid ${activeKid.color}30`, marginBottom: 16 }}>
              <span style={{ fontSize: 13 }}>{level.emoji}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: activeKid.color }}>{level.name}</span>
            </div>

            {/* Profile completeness */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Profile Complete</span>
                <span style={{ fontSize: 10, color: completeness >= 80 ? '#059669' : '#D97706', fontWeight: 700 }}>{completeness}%</span>
              </div>
              <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${completeness}%` }} transition={{ duration: 0.8 }}
                  style={{ height: '100%', background: completeness >= 80 ? '#059669' : '#D97706', borderRadius: 3 }} />
              </div>
              {completeness < 100 && (
                <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 4 }}>
                  {completeness < 60 ? 'Add life goal & activities for better AI plans' : 'Almost done — just a few more details!'}
                </div>
              )}
            </div>

            {/* XP / streak / badges quick stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
              {[
                { label: 'XP',     value: xpTotal,       color: '#D97706' },
                { label: 'Streak', value: `${streakDays}d`, color: '#DC2626' },
                { label: 'Badges', value: badges.length,  color: '#7C3AED' },
              ].map(s => (
                <div key={s.label} style={{ background: '#F8FAFC', borderRadius: 8, padding: '8px 4px' }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* XP progress bar */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}
            style={{ background: 'linear-gradient(135deg,#1E293B,#312E81)', borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <Zap size={13} color="#FCD34D" />
                <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{xpTotal} XP</span>
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>{level.emoji} {level.name}</span>
            </div>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden', marginBottom: 6 }}>
              <motion.div initial={{ width: 0 }} animate={{ width: `${xpPct * 100}%` }} transition={{ duration: 1.2 }}
                style={{ height: '100%', background: 'linear-gradient(90deg,#6366F1,#A78BFA)', borderRadius: 4 }} />
            </div>
            <div style={{ fontSize: 10, color: '#64748B', marginBottom: 10 }}>
              {nextXP === 9999 ? 'Max level reached! 🏆' : `${nextXP - xpTotal} XP to next level`}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Flame size={13} color="#F87171" />
              <span style={{ fontSize: 12, fontWeight: 700, color: '#F87171' }}>{streakDays}-day streak</span>
              {streakDays > 0 && <span style={{ fontSize: 10, color: '#64748B' }}>— keep it up!</span>}
            </div>
          </motion.div>

          {/* Life goal */}
          {lifeGoal && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}
              style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 14, border: '1px solid #C7D2FE', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Trophy size={14} color="#4F46E5" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#4338CA' }}>Life Goal</span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#4F46E5', marginBottom: 4 }}>🎯 {lifeGoal}</div>
              <div style={{ fontSize: 11, color: '#6366F1' }}>
                Target: {targetYear} · {targetYear - new Date().getFullYear()} years of focused learning
              </div>
            </motion.div>
          )}

          {/* Badges */}
          {badges.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: '#fff', borderRadius: 14, border: '1px solid #DCE8F5', padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Star size={14} color="#D97706" />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Achievements</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {badges.map(b => (
                  <span key={b} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: '#FFFBEB', border: '1px solid #FDE68A', color: '#92400E', fontWeight: 600 }}>
                    {b}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Day 1 nudge if no badges */}
          {badges.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 14, border: '1px solid #C7D2FE', padding: '16px 18px' }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🌟</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#4338CA', marginBottom: 4 }}>No badges yet — start today!</div>
              <div style={{ fontSize: 11, color: '#6366F1', lineHeight: 1.6 }}>
                Log your first study session from the dashboard to earn your first badge and 10 XP!
              </div>
            </motion.div>
          )}
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Basic Information */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #DCE8F5', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={14} color="#4F46E5" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Basic Information</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

              <Field label="Grade / Class">
                {editing ? (
                  <select value={form.grade} onChange={e => setForm(f => ({ ...f, grade: e.target.value }))}
                    style={selectStyle}>
                    {GRADES.map(g => <option key={g}>{g}</option>)}
                  </select>
                ) : activeKid.grade}
              </Field>

              <Field label="Board / Curriculum">
                {editing ? (
                  <select value={form.board} onChange={e => setForm(f => ({ ...f, board: e.target.value }))}
                    style={selectStyle}>
                    {BOARDS.map(b => <option key={b}>{b}</option>)}
                  </select>
                ) : activeKid.board}
              </Field>

              <Field label="Age">
                {editing ? (
                  <input type="number" min={3} max={22} value={form.age} onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))}
                    style={inputStyle} />
                ) : `${activeKid.age} years`}
              </Field>

              <Field label="Section">
                {onboarding?.section || <Placeholder />}
              </Field>

              <Field label="School" span>
                {editing ? (
                  <input value={form.school} onChange={e => setForm(f => ({ ...f, school: e.target.value }))}
                    placeholder="School name" style={inputStyle} />
                ) : (activeKid.school || <Placeholder />)}
              </Field>

              {onboarding?.classTeacher && (
                <Field label="Class Teacher" span>
                  {onboarding.classTeacher}
                </Field>
              )}
            </div>
          </motion.div>

          {/* Subjects */}
          {subjectList.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: '#fff', borderRadius: 14, border: '1px solid #DCE8F5', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <BookOpen size={14} color="#059669" />
                </div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Subjects ({subjectList.length})</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
                {subjectList.map(s => (
                  <span key={s} style={{ fontSize: 12, padding: '5px 12px', borderRadius: 20, background: '#F0F9FF', border: '1px solid #BAE6FD', color: '#0369A1', fontWeight: 600 }}>
                    {s}
                  </span>
                ))}
              </div>
              {onboarding?.subjectGoalMins && Object.keys(onboarding.subjectGoalMins).length > 0 && (
                <>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Weekly Study Goals</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px,1fr))', gap: 7 }}>
                    {Object.entries(onboarding.subjectGoalMins).map(([sub, mins]) => (
                      <div key={sub} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 10px', borderRadius: 8, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
                        <span style={{ fontSize: 11, color: '#374151', fontWeight: 600 }}>{sub}</span>
                        <span style={{ fontSize: 11, color: '#4F46E5', fontWeight: 700 }}>
                          {mins >= 60 ? `${Math.floor(mins/60)}h${mins%60>0 ? `${mins%60}m` : ''}` : `${mins}m`}/wk
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* Extra-curricular activities */}
          {activities.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }}
              style={{ background: '#fff', borderRadius: 14, border: '1px solid #DCE8F5', padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#FFF7ED', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🎨</div>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Extra-Curricular Activities</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {activities.map(a => (
                  <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 20, background: activeKid.colorLight, border: `1px solid ${activeKid.color}30` }}>
                    <span style={{ fontSize: 15 }}>{activityEmoji(a)}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: activeKid.color }}>{a}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Weekly targets */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
            style={{ background: '#fff', borderRadius: 14, border: '1px solid #DCE8F5', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 9, background: '#ECFDF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Target size={14} color="#059669" />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>Study Stats</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { icon: '⚡', label: 'Total XP', value: `${xpTotal} XP`, color: '#D97706', bg: '#FFFBEB' },
                { icon: '🔥', label: 'Day Streak', value: `${streakDays} days`, color: '#DC2626', bg: '#FFF5F5' },
                { icon: '🏅', label: 'Badges', value: `${badges.length} earned`, color: '#7C3AED', bg: '#F5F3FF' },
              ].map(s => (
                <div key={s.label} style={{ padding: '12px 14px', borderRadius: 10, background: s.bg, border: `1px solid ${s.color}20`, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, marginBottom: 4 }}>{s.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: s.color, marginBottom: 2 }}>{s.value}</div>
                  <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            style={{ background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius: 14, border: '1px solid #C7D2FE', padding: '18px 20px' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.07em' }}>✦ How your profile powers AI Tutor Miko</div>
            {[
              { e: '🎯', t: `Life goal → AI plans ${activeKid.name}'s path from today to target year` },
              { e: '📊', t: `${activeKid.board} ${activeKid.grade} → syllabus matched exactly to your curriculum` },
              { e: '🏫', t: `${activeKid.school || 'School'} → AI parent summaries include school context` },
              { e: '🎨', t: 'Activities → AI protects activity time in personalised study plans' },
            ].map(({ e, t }) => (
              <div key={t} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: 13, flexShrink: 0 }}>{e}</span>
                <span style={{ fontSize: 11, color: '#4338CA', lineHeight: 1.6 }}>{t}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

// ── Small helpers ─────────────────────────────────────────────────────────────

const selectStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1.5px solid #DCE8F5', fontSize: 13,
  fontFamily: 'inherit', outline: 'none', background: '#fff',
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9,
  border: '1.5px solid #DCE8F5', fontSize: 13,
  fontFamily: 'inherit', outline: 'none',
}

function Placeholder() {
  return <span style={{ color: '#D1D5DB', fontSize: 12 }}>Not set</span>
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={span ? { gridColumn: '1/-1' } : {}}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{label}</div>
      {typeof children === 'string' || typeof children === 'number'
        ? <div style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{children}</div>
        : children}
    </div>
  )
}

function activityEmoji(name: string): string {
  const n = name.toLowerCase()
  if (n.includes('swim'))   return '🏊'
  if (n.includes('cricket')) return '🏏'
  if (n.includes('football') || n.includes('soccer')) return '⚽'
  if (n.includes('badminton')) return '🏸'
  if (n.includes('tennis')) return '🎾'
  if (n.includes('basketball')) return '🏀'
  if (n.includes('dance') || n.includes('bharatanatyam') || n.includes('kathak') || n.includes('kuchipudi')) return '💃'
  if (n.includes('guitar')) return '🎸'
  if (n.includes('piano'))  return '🎹'
  if (n.includes('tabla') || n.includes('drums')) return '🥁'
  if (n.includes('vocal') || n.includes('singing')) return '🎤'
  if (n.includes('flute'))  return '🎵'
  if (n.includes('violin')) return '🎻'
  if (n.includes('drawing') || n.includes('art') || n.includes('painting')) return '🎨'
  if (n.includes('coding') || n.includes('programming')) return '💻'
  if (n.includes('chess'))  return '♟️'
  if (n.includes('yoga'))   return '🧘'
  if (n.includes('robot'))  return '🤖'
  if (n.includes('debate')) return '🎙️'
  if (n.includes('theatre') || n.includes('drama')) return '🎭'
  if (n.includes('reading')) return '📖'
  return '⭐'
}
