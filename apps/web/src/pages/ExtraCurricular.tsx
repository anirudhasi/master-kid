import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, ChevronLeft, Trash2, Target, Sparkles, Link2, Copy, Check,
  UserPlus, ShieldCheck, Calendar,
} from 'lucide-react'
import { useAuthStore } from '@/modules/identity'
import { useActivityStore, activitiesFor, type Activity } from '@/store/activityStore'
import { activityService } from '@/services/activityService'
import {
  ACTIVITY_TYPES, ACTIVITY_META, defaultCurriculum,
  standardCoursesFor, TARGET_NO_TARGET, TARGET_UNDECIDED,
} from '@/data/activityCatalog'
import { useCoachStore, PLAN_PRICING } from '@/store/coachStore'
import { coachService } from '@/services/coachService'
import { ChatThread } from '@/pages/Coach'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"
const LEVELS = ['Beginner', 'Intermediate', 'Advanced']

const daysTo = (d: string) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) : null
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''

export default function ExtraCurricular() {
  const { activeKidId, kids } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const all = useActivityStore(s => s.activities)

  const [openId, setOpenId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [customName, setCustomName] = useState('')

  // Seed activities from the profile onboarding selections the first time the
  // page is opened, so the extra-curricular page reflects what the parent picked.
  useEffect(() => {
    if (!kid) return
    const fresh = activitiesFor(useActivityStore.getState().activities, kid.id)
    if (fresh.length > 0) return
    const names = kid.onboarding?.activities ?? []
    names.forEach(name => {
      const meta = ACTIVITY_TYPES.find(t => t.name.toLowerCase() === name.toLowerCase())
        ?? ACTIVITY_TYPES.find(t => {
          const a = t.name.toLowerCase(), b = name.toLowerCase()
          return a.includes(b) || b.includes(a)
        })
      void activityService.add({
        childId: kid.id,
        key: meta?.key ?? `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name: meta?.name ?? name,
        icon: meta?.icon ?? '⭐',
        color: meta?.color ?? P,
        level: 'Beginner',
        curriculum: defaultCurriculum(meta?.key ?? '', kid.age, name),
        targetName: '', targetDate: '',
      })
    })
     
  }, [kid?.id])

  if (!kid) return null
  const activities = activitiesFor(all, kid.id)
  const open = openId ? all[openId] : null

  const addActivity = (key: string) => {
    const meta = ACTIVITY_META[key]
    activityService.add({
      childId: kid.id, key, name: meta.name, icon: meta.icon, color: meta.color,
      level: 'Beginner', curriculum: defaultCurriculum(key, kid.age), targetName: '', targetDate: '',
    }).then(a => { setAdding(false); setOpenId(a.id) })
  }

  // "Add your own" — any activity not in the preset list (feedback: option to add activities).
  const addCustomActivity = (name: string) => {
    const n = name.trim(); if (!n) return
    activityService.add({
      childId: kid.id, key: `custom-${Date.now()}`, name: n, icon: '⭐', color: P,
      level: 'Beginner', curriculum: defaultCurriculum('', kid.age, n), targetName: '', targetDate: '',
    }).then(a => { setAdding(false); setCustomName(''); setOpenId(a.id) })
  }

  // ── Activity detail ─────────────────────────────────────────────────────────
  if (open) {
    return <ActivityDetail activity={open} age={kid.age} onBack={() => setOpenId(null)} onDeleted={() => setOpenId(null)} />
  }

  // ── Activity list ─────────────────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Extra-curricular</h1>
          <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 4, maxWidth: 520, lineHeight: 1.6 }}>
            {kid.name}'s activities — dance, music, sports, chess, coding and more. Set a custom
            syllabus, a target date, and link a coach.
          </p>
        </div>
        <button onClick={() => setAdding(true)} style={primaryBtn}>
          <Plus size={15} /> Add activity
        </button>
      </div>

      {activities.length === 0 ? (
        <Empty onAdd={() => setAdding(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(230px,1fr))', gap: 14, marginTop: 18 }}>
          {activities.map(a => {
            const d = daysTo(a.targetDate)
            return (
              <motion.button key={a.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setOpenId(a.id)}
                style={{ textAlign: 'left', cursor: 'pointer', padding: '16px', borderRadius: 16, background: '#fff', border: `1px solid #EEF0F5`, boxShadow: '0 1px 8px rgba(15,23,42,0.05)', fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: a.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{a.icon}</div>
                  <div>
                    <div style={{ fontSize: 15.5, fontWeight: 900, color: '#0F172A' }}>{a.name}</div>
                    <div style={{ fontSize: 11.5, color: a.color, fontWeight: 700 }}>{a.level}</div>
                  </div>
                </div>
                {a.targetName && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', background: '#F8FAFC', padding: '6px 10px', borderRadius: 9 }}>
                    <Target size={12} color={a.color} /> {a.targetName}{d !== null && d >= 0 && <span style={{ marginLeft: 'auto', fontWeight: 800, color: a.color }}>{d}d</span>}
                  </div>
                )}
                <CoachChip a={a} />
              </motion.button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {adding && (
          <Modal title="Add an activity" onClose={() => { setAdding(false); setCustomName('') }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxHeight: '48vh', overflowY: 'auto' }}>
              {ACTIVITY_TYPES.map(t => (
                <button key={t.key} onClick={() => addActivity(t.key)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px', borderRadius: 11, cursor: 'pointer', border: '1.5px solid #E2E8F0', background: '#fff', fontFamily: FONT, textAlign: 'left' }}>
                  <span style={{ fontSize: 22 }}>{t.icon}</span>
                  <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{t.name}</span>
                </button>
              ))}
            </div>
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #EEF0F5' }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: '#64748B', marginBottom: 6 }}>Don't see it? Add your own</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={customName} onChange={e => setCustomName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addCustomActivity(customName) }}
                  placeholder="e.g. Karate, Pottery, Violin…" style={{ ...input, flex: 1 }} />
                <button onClick={() => addCustomActivity(customName)} disabled={!customName.trim()}
                  style={{ ...primaryBtn, opacity: customName.trim() ? 1 : 0.5, cursor: customName.trim() ? 'pointer' : 'not-allowed' }}>
                  <Plus size={14} /> Add
                </button>
              </div>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function CoachChip({ a }: { a: Activity }) {
  if (a.coachStatus === 'linked') return <span style={{ ...miniChip, background: '#DCFCE7', color: '#15803D' }}><ShieldCheck size={11} /> Coach: {a.coachName}</span>
  if (a.coachStatus === 'pending') return <span style={{ ...miniChip, background: '#FEF3C7', color: '#92400E' }}><Link2 size={11} /> Invite pending</span>
  return <span style={{ ...miniChip, background: '#F1F5F9', color: '#94A3B8' }}><UserPlus size={11} /> No coach linked</span>
}

// ── Activity detail / editor ────────────────────────────────────────────────────
function ActivityDetail({ activity, age, onBack, onDeleted }: { activity: Activity; age?: number; onBack: () => void; onDeleted: () => void }) {
  const [level, setLevel] = useState(activity.level)
  const [curriculum, setCurriculum] = useState(activity.curriculum)
  const [targetName, setTargetName] = useState(activity.targetName)
  const [targetDate, setTargetDate] = useState(activity.targetDate)
  const [saved, setSaved] = useState(false)
  const dirty = level !== activity.level || curriculum !== activity.curriculum || targetName !== activity.targetName || targetDate !== activity.targetDate

  // Target = standard course picker + special options (feedback). Picking a
  // standard course auto-fills the syllabus; "Custom course name…" reveals a field.
  const courses = standardCoursesFor(activity.key, activity.name)
  const isStdTarget = courses.some(c => c.name === targetName)
  const isSpecialTarget = targetName === TARGET_NO_TARGET || targetName === TARGET_UNDECIDED
  const [customTarget, setCustomTarget] = useState(!!targetName && !isStdTarget && !isSpecialTarget)
  const targetSelectVal = customTarget ? '__custom__' : (isStdTarget || isSpecialTarget ? targetName : '')
  const onTargetSelect = (v: string) => {
    if (v === '__custom__') { setCustomTarget(true); setTargetName(''); return }
    setCustomTarget(false); setTargetName(v)
    const c = courses.find(x => x.name === v)
    if (c) setCurriculum(c.syllabus)
  }

  const save = () => { void activityService.update(activity.id, { level, curriculum, targetName, targetDate }); setSaved(true); setTimeout(() => setSaved(false), 1500) }

  return (
    <div style={wrap}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
        <ChevronLeft size={15} /> All activities
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 50, height: 50, borderRadius: 14, background: activity.color + '1A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26 }}>{activity.icon}</div>
          <div>
            <h1 style={{ fontSize: 23, fontWeight: 900, color: '#0F172A' }}>{activity.name}</h1>
            <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
              {LEVELS.map(l => (
                <button key={l} onClick={() => setLevel(l)} style={{ padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, fontSize: 11, fontWeight: 700, border: `1.5px solid ${level === l ? activity.color : '#E2E8F0'}`, background: level === l ? activity.color + '15' : '#fff', color: level === l ? activity.color : '#64748B' }}>{l}</button>
              ))}
            </div>
          </div>
        </div>
        <button onClick={() => { activityService.remove(activity.id); onDeleted() }} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 9, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }}><Trash2 size={13} /> Remove</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 300px', gap: 18, alignItems: 'start' }} className="ec-grid">
        {/* Curriculum */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>Curriculum / Syllabus</h2>
            <button onClick={() => setCurriculum(defaultCurriculum(activity.key, age))} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 11px', borderRadius: 8, border: `1.5px solid ${activity.color}`, background: activity.color + '12', color: activity.color, cursor: 'pointer', fontSize: 11.5, fontWeight: 800, fontFamily: FONT }}>
              <Sparkles size={12} /> Suggest for age {age ?? '—'}
            </button>
          </div>
          <textarea value={curriculum} onChange={e => setCurriculum(e.target.value)} placeholder="Write or paste the syllabus / lesson plan here…" rows={14}
            style={{ width: '100%', padding: '14px', borderRadius: 12, border: '1.5px solid #E2E8F0', fontFamily: FONT, fontSize: 13.5, lineHeight: 1.6, color: '#1F2937', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }} />
          <button onClick={save} disabled={!dirty} style={{ marginTop: 12, padding: '10px 20px', borderRadius: 10, border: 'none', cursor: dirty ? 'pointer' : 'not-allowed', background: dirty ? `linear-gradient(135deg,${P},#9B59FF)` : '#E2E8F0', color: dirty ? '#fff' : '#94A3B8', fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
            {saved ? '✓ Saved' : 'Save changes'}
          </button>
        </div>

        {/* Side: target + coach */}
        <div style={{ display: 'grid', gap: 14 }}>
          <Card title="Target" icon={<Target size={15} color={activity.color} />}>
            <select value={targetSelectVal} onChange={e => onTargetSelect(e.target.value)} style={{ ...input, cursor: 'pointer' }}>
              <option value="" disabled>Choose a target…</option>
              <optgroup label="Standard courses">
                {courses.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
              </optgroup>
              <optgroup label="Other">
                <option value={TARGET_NO_TARGET}>{TARGET_NO_TARGET}</option>
                <option value={TARGET_UNDECIDED}>{TARGET_UNDECIDED}</option>
                <option value="__custom__">Custom course name…</option>
              </optgroup>
            </select>
            {customTarget && (
              <input value={targetName} onChange={e => setTargetName(e.target.value)} placeholder="e.g. Year-1 grade exam" style={{ ...input, marginTop: 8 }} />
            )}
            {isStdTarget && <div style={{ fontSize: 11, color: '#16A34A', fontWeight: 700, marginTop: 8 }}>✓ Syllabus auto-filled from this course</div>}
            <label style={{ fontSize: 11, fontWeight: 700, color: '#64748B', display: 'flex', alignItems: 'center', gap: 5, margin: '10px 0 5px' }}><Calendar size={12} /> Target date (flexible)</label>
            <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} style={input} />
            {targetDate && (() => { const d = daysTo(targetDate); return <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 8 }}>{fmt(targetDate)}{d !== null && d >= 0 ? ` · ${d} days to go` : ''}</div> })()}
          </Card>

          <CoachCard activity={activity} />
        </div>
      </div>

      {activity.coachStatus === 'linked' && activity.enrollmentId && (
        <ParentCoachPanel enrollmentId={activity.enrollmentId} />
      )}

      <style>{`@media (max-width: 760px){ .ec-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}

// Parent's window into the coach course: milestone progress (read-only),
// secure 2-way messaging, and UPI payment.
function ParentCoachPanel({ enrollmentId }: { enrollmentId: string }) {
  const { activePhone: _activePhone, adminName } = useAuthStore()
  const enrollment = useCoachStore(s => s.enrollments[enrollmentId])
  const course = useCoachStore(s => (enrollment ? s.courses[enrollment.courseId] : undefined))
  const messages = useCoachStore(s => s.messages[enrollmentId] ?? [])
  const [msg, setMsg] = useState('')
  if (!enrollment || !course) return null

  const total = course.milestones.length
  const done = Object.values(enrollment.progress).filter(p => p.status === 'done').length
  const pct = total ? Math.round((done / total) * 100) : 0
  const send = () => { if (!msg.trim()) return; void coachService.sendMessage(enrollmentId, { senderRole: 'parent', senderName: adminName || 'Parent', kind: 'note', body: msg.trim() }); setMsg('') }
  const payUpi = () => {
    const amt = PLAN_PRICING[course.plan].inr
    const link = `upi://pay?pa=masterkids@upi&pn=${encodeURIComponent(course.coachName)}&am=${amt}&cu=INR&tn=${encodeURIComponent(course.title)}`
    window.location.href = link
  }

  return (
    <div style={{ marginTop: 22, background: '#fff', borderRadius: 16, border: '1px solid #EEF0F5', padding: 18, boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{course.title}</h2>
          <div style={{ fontSize: 12, color: '#64748B' }}>Coach {course.coachName} · {pct}% complete</div>
        </div>
        {!enrollment.paid && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={payUpi} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg,#16A34A,#22C55E)', color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }}>Pay ₹{PLAN_PRICING[course.plan].inr} via UPI</button>
            <button onClick={() => coachService.markPaid(enrollmentId)} style={ghostBtn}>Mark paid (test)</button>
          </div>
        )}
        {enrollment.paid && <span style={{ fontSize: 11, fontWeight: 800, padding: '5px 11px', borderRadius: 9, background: '#DCFCE7', color: '#15803D' }}>✓ Paid · {PLAN_PRICING[course.plan].label}</span>}
      </div>

      {/* Milestone progress (read-only for parent) */}
      {total > 0 && (
        <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
          {course.milestones.map(m => {
            const d = enrollment.progress[m.id]?.status === 'done'
            return (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: d ? '#F0FDF4' : '#F8FAFC' }}>
                <span style={{ fontSize: 16 }}>{d ? '✅' : '⏳'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{m.title}</div>
                  {m.parentOutcome && <div style={{ fontSize: 11.5, color: '#64748B' }}>{m.parentOutcome}</div>}
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: d ? '#16A34A' : '#94A3B8' }}>{d ? 'Done' : 'In progress'}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Secure 2-way messaging */}
      <h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>Messages with your coach</h3>
      <ChatThread messages={messages} myRole="parent" value={msg} setValue={setMsg} onSend={send} />
    </div>
  )
}

function CoachCard({ activity }: { activity: Activity }) {
  const { activePhone, adminName, activeKidId, kids } = useAuthStore()
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const [err, setErr] = useState('')
  const a = useActivityStore(s => s.activities[activity.id]) ?? activity  // live status

  const invite = () => void activityService.inviteCoach(a.id)
  const link = () => {
    if (!code.trim()) return
    setErr('')
    const kid = kids.find(k => k.id === activeKidId)
    void activityService.linkCoach(a.id, code, {
      childId: a.childId, childName: kid?.name ?? 'Child',
      parentId: activePhone || 'guest', parentName: adminName || 'Parent',
    }).then(res => { if (!res.ok) setErr(res.error ?? 'Could not link.') })
  }
  const copy = () => { if (a.coachToken) navigator.clipboard?.writeText(a.coachToken).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200) }) }

  return (
    <Card title="Coach link" icon={<Link2 size={15} color={activity.color} />}>
      {a.coachStatus === 'linked' ? (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#DCFCE7', color: '#15803D', fontSize: 13, fontWeight: 800 }}><ShieldCheck size={15} /> {a.coachName} is linked</div>
          <button onClick={() => activityService.unlinkCoach(a.id)} style={{ ...ghostBtn, marginTop: 10 }}>Unlink coach</button>
        </div>
      ) : a.coachStatus === 'pending' ? (
        <div>
          <div style={{ fontSize: 12, color: '#64748B', marginBottom: 8 }}>Share this code with your coach to connect:</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
            <code style={{ flex: 1, fontSize: 15, fontWeight: 900, letterSpacing: '0.08em', color: '#92400E' }}>{a.coachToken}</code>
            <button onClick={copy} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#92400E' }}>{copied ? <Check size={15} /> : <Copy size={15} />}</button>
          </div>
          <button onClick={() => activityService.unlinkCoach(a.id)} style={{ ...ghostBtn, marginTop: 10 }}>Cancel invite</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <button onClick={invite} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', background: activity.color }}><UserPlus size={14} /> Invite a coach</button>
          <div style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8' }}>— or —</div>
          <div>
            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#64748B', marginBottom: 5 }}>Have a code from a coach?</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input value={code} onChange={e => { setCode(e.target.value); setErr('') }} placeholder="MK-XXXX-XXXX" style={{ ...input, flex: 1 }} />
              <button onClick={link} style={{ padding: '0 14px', borderRadius: 9, border: 'none', background: P, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 800, fontFamily: FONT }}>Link</button>
            </div>
            {err && <div style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 700, marginTop: 6 }}>{err}</div>}
          </div>
        </div>
      )}
    </Card>
  )
}

// ── shared bits ────────────────────────────────────────────────────────────────
const wrap: React.CSSProperties = { padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }
const input: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const primaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }
const ghostBtn: React.CSSProperties = { width: '100%', padding: '8px 0', borderRadius: 9, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }
const miniChip: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5, fontWeight: 800, padding: '3px 9px', borderRadius: 8, alignSelf: 'flex-start' }

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F5', padding: 16, boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>{icon}<h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{title}</h3></div>
      {children}
    </div>
  )
}

function Empty({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 20px', borderRadius: 18, background: '#FAFAFF', border: '1.5px dashed #DDD6FE', marginTop: 18 }}>
      <div style={{ fontSize: 42, marginBottom: 10 }}>🎭</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>No activities yet</div>
      <div style={{ fontSize: 13, color: '#64748B', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.6 }}>Add dance, music, a sport, chess, coding — anything. Each gets a curriculum, a target and an optional coach.</div>
      <button onClick={onAdd} style={primaryBtn}><Plus size={14} /> Add activity</button>
    </div>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
