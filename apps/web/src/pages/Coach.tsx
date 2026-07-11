import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  GraduationCap, Plus, X, ChevronLeft, Copy, Check, Users, BookOpen, Target,
  MessageCircle, Trash2, Calendar, IndianRupee, CheckCircle2, Circle, Send, Share2,
} from 'lucide-react'
import { useAuthStore } from '@/modules/identity'
import {
  useCoachStore, coursesByCoach, enrollmentsByCourse, enrollmentsByCoach, PLAN_PRICING,
  type Course, type Milestone, type Cadence, type Enrollment,
} from '@/store/coachStore'
import { coachService } from '@/services/coachService'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"
const DISCIPLINES = ['Bharatanatyam', 'Western Dance', 'Vocal Music', 'Piano', 'Guitar', 'Drawing & Art', 'Swimming', 'Cricket', 'Football', 'Chess', 'Abacus', 'Coding', 'Robotics', 'Maths Tuition', 'Science Tuition', 'Hindi', 'Kannada', 'French']
const fmt = (d: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'

export default function Coach() {
  const { activePhone, adminName } = useAuthStore()
  const coachId = activePhone || 'guest'
  const profile = useCoachStore(s => s.profiles[coachId])
  const courses = useCoachStore(s => s.courses)
  const enrollments = useCoachStore(s => s.enrollments)

  const [openCourse, setOpenCourse] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  const myCourses = useMemo(() => coursesByCoach(courses, coachId), [courses, coachId])
  const myStudents = useMemo(() => enrollmentsByCoach(enrollments, coachId), [enrollments, coachId])

  if (!profile) return <Onboarding coachId={coachId} defaultName={adminName} />

  const course = openCourse ? courses[openCourse] : null
  if (course) return <CourseDetail course={course} onBack={() => setOpenCourse(null)} />

  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg,${P},#9B59FF)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={24} color="#fff" /></div>
        <div>
          <h1 style={{ fontSize: 25, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Coach Studio</h1>
          <div style={{ fontSize: 13, color: '#64748B' }}>{profile.name} · {profile.disciplines.slice(0, 3).join(', ')}{profile.disciplines.length > 3 ? '…' : ''}</div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12, margin: '20px 0' }}>
        <Stat icon={<BookOpen size={18} />} label="Courses" value={myCourses.length} color="#4F46E5" />
        <Stat icon={<Users size={18} />} label="Students" value={myStudents.length} color="#059669" />
        <Stat icon={<IndianRupee size={18} />} label="Paid enrollments" value={myStudents.filter(e => e.paid).length} color="#D97706" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>My courses</h2>
        <button onClick={() => setCreating(true)} style={primaryBtn}><Plus size={15} /> Create course</button>
      </div>

      {myCourses.length === 0 ? (
        <Empty icon="🎓" title="Create your first course" sub="Add a course (e.g. Bharatanatyam, Chess, Maths), set milestones, then share the join code with parents." onAdd={() => setCreating(true)} label="Create course" />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 14 }}>
          {myCourses.map(c => {
            const students = enrollmentsByCourse(enrollments, c.id).length
            return (
              <motion.button key={c.id} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setOpenCourse(c.id)}
                style={{ textAlign: 'left', cursor: 'pointer', padding: '18px', borderRadius: 16, background: '#fff', border: '1px solid #EEF0F5', boxShadow: '0 1px 8px rgba(15,23,42,0.05)', fontFamily: FONT }}>
                <div style={{ fontSize: 15.5, fontWeight: 900, color: '#0F172A', marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>{c.discipline} · {PLAN_PRICING[c.plan].label}</div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#475569', fontWeight: 700 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Target size={13} color={P} /> {c.milestones.length} milestones</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Users size={13} color="#059669" /> {students} students</span>
                </div>
              </motion.button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {creating && <CreateCourseModal coachId={coachId} coachName={profile.name} onClose={() => setCreating(false)} onCreated={(id) => { setCreating(false); setOpenCourse(id) }} />}
      </AnimatePresence>
    </div>
  )
}

// ── Onboarding ──────────────────────────────────────────────────────────────────
function Onboarding({ coachId, defaultName }: { coachId: string; defaultName: string }) {
  const [name, setName] = useState(defaultName || '')
  const [disc, setDisc] = useState<string[]>([])
  const [bio, setBio] = useState('')
  const toggle = (d: string) => setDisc(disc.includes(d) ? disc.filter(x => x !== d) : [...disc, d])
  const save = () => { if (name.trim() && disc.length) void coachService.saveProfile({ coachId, name: name.trim(), disciplines: disc, bio: bio.trim() }) }

  return (
    <div style={{ ...wrap, maxWidth: 600 }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, margin: '0 auto 14px', background: `linear-gradient(135deg,${P},#9B59FF)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GraduationCap size={30} color="#fff" /></div>
        <h1 style={{ fontSize: 25, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Set up your Coach Studio</h1>
        <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 6, lineHeight: 1.6 }}>Create courses, set milestones, enrol students with a code, and keep parents in the loop.</p>
      </div>
      <Card title="Your name" icon={<GraduationCap size={15} color={P} />}>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Guru Priya / Coach Suresh" style={input} />
      </Card>
      <div style={{ height: 14 }} />
      <Card title="What do you teach?" icon={<BookOpen size={15} color={P} />}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {DISCIPLINES.map(d => (
            <button key={d} onClick={() => toggle(d)} style={{ padding: '7px 12px', borderRadius: 20, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 700, border: `1.5px solid ${disc.includes(d) ? P : '#E2E8F0'}`, background: disc.includes(d) ? '#EEECFF' : '#fff', color: disc.includes(d) ? P : '#64748B' }}>{d}</button>
          ))}
        </div>
      </Card>
      <div style={{ height: 14 }} />
      <Card title="Short bio (optional)" icon={<Users size={15} color={P} />}>
        <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="Experience, achievements, teaching style…" style={{ ...input, resize: 'vertical' }} />
      </Card>
      <button onClick={save} disabled={!name.trim() || !disc.length} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', marginTop: 18, opacity: (!name.trim() || !disc.length) ? 0.5 : 1 }}>Open my studio</button>
    </div>
  )
}

// ── Course detail (milestones + students) ───────────────────────────────────────
function CourseDetail({ course, onBack }: { course: Course; onBack: () => void }) {
  const enrollments = useCoachStore(s => s.enrollments)
  const students = enrollmentsByCourse(enrollments, course.id)
  const [copied, setCopied] = useState(false)
  const [editingMs, setEditingMs] = useState(false)
  const [openStudent, setOpenStudent] = useState<string | null>(null)

  const copy = () => { navigator.clipboard?.writeText(course.joinCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1200) }) }
  const student = openStudent ? enrollments[openStudent] : null

  return (
    <div style={wrap}>
      <button onClick={onBack} style={backBtn}><ChevronLeft size={15} /> Studio</button>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 900, color: '#0F172A' }}>{course.title}</h1>
          <div style={{ fontSize: 12.5, color: '#64748B' }}>{course.discipline} · {PLAN_PRICING[course.plan].label}</div>
        </div>
        <button onClick={() => coachService.removeCourse(course.id).then(onBack)} style={dangerBtn}><Trash2 size={13} /> Delete</button>
      </div>

      {/* Join code */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', border: '1px solid #DDD6FE', marginBottom: 22, flexWrap: 'wrap' }}>
        <Share2 size={18} color={P} />
        <div style={{ flex: 1, minWidth: 160 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Parent join code</div>
          <div style={{ fontSize: 22, fontWeight: 900, letterSpacing: '0.1em', color: P }}>{course.joinCode}</div>
        </div>
        <button onClick={copy} style={{ ...primaryBtn, padding: '9px 14px' }}>{copied ? <Check size={15} /> : <Copy size={15} />} {copied ? 'Copied' : 'Copy'}</button>
        <div style={{ flexBasis: '100%', fontSize: 11.5, color: '#64748B' }}>Share this code with parents — they enter it under their child's Extra-curricular → "Have a coach code?" to enrol.</div>
      </div>

      {/* Milestones */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>Milestones <span style={{ color: '#94A3B8', fontWeight: 700 }}>({course.milestones.length})</span></h2>
        <button onClick={() => setEditingMs(true)} style={ghostBtnSm}>{course.milestones.length ? 'Edit milestones' : 'Add milestones'}</button>
      </div>
      {course.milestones.length === 0 ? (
        <div style={{ fontSize: 13, color: '#64748B', padding: '14px 16px', borderRadius: 12, background: '#FAFAFF', border: '1.5px dashed #DDD6FE', marginBottom: 24 }}>No milestones yet. Add day/week/month milestones so students and parents know exactly what to expect.</div>
      ) : (
        <div style={{ display: 'grid', gap: 8, marginBottom: 24 }}>
          {course.milestones.map((m, i) => (
            <div key={m.id} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 12, background: '#fff', border: '1px solid #EEF0F5' }}>
              <div style={{ width: 26, height: 26, borderRadius: 8, background: '#EEECFF', color: P, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 12, flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{m.title}</span>
                  <span style={{ fontSize: 9.5, fontWeight: 800, padding: '2px 7px', borderRadius: 7, background: '#F1F5F9', color: '#64748B', textTransform: 'capitalize' }}>{m.cadence}</span>
                  {m.targetDate && <span style={{ fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', gap: 3 }}><Calendar size={11} /> {fmt(m.targetDate)}</span>}
                </div>
                {m.deliverable && <div style={{ fontSize: 12, color: '#475569', marginTop: 3 }}><strong>Deliver:</strong> {m.deliverable}</div>}
                {m.parentOutcome && <div style={{ fontSize: 12, color: '#059669', marginTop: 2 }}><strong>Parent sees:</strong> {m.parentOutcome}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Students */}
      <h2 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A', marginBottom: 10 }}>Students <span style={{ color: '#94A3B8', fontWeight: 700 }}>({students.length})</span></h2>
      {students.length === 0 ? (
        <div style={{ fontSize: 13, color: '#64748B', padding: '14px 16px', borderRadius: 12, background: '#FAFAFF', border: '1.5px dashed #DDD6FE' }}>No students yet. Share the join code above to enrol your first student.</div>
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {students.map(e => {
            const total = course.milestones.length
            const done = Object.values(e.progress).filter(p => p.status === 'done').length
            const pct = total ? Math.round((done / total) * 100) : 0
            return (
              <button key={e.id} onClick={() => setOpenStudent(e.id)} style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '14px 16px', borderRadius: 13, background: '#fff', border: '1px solid #EEF0F5', display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, background: '#EEECFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧑‍🎓</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>{e.childName}</div>
                  <div style={{ fontSize: 11.5, color: '#64748B' }}>Parent: {e.parentName} · {pct}% complete{e.paid ? ' · paid' : ''}</div>
                  <div style={{ height: 4, background: '#F1F5F9', borderRadius: 3, marginTop: 6, overflow: 'hidden' }}><div style={{ width: `${pct}%`, height: '100%', background: P }} /></div>
                </div>
                {!e.paid && <span style={{ fontSize: 9.5, fontWeight: 800, padding: '3px 8px', borderRadius: 8, background: '#FEF3C7', color: '#92400E' }}>Unpaid</span>}
                <MessageCircle size={16} color="#CBD5E1" />
              </button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {editingMs && <MilestoneEditor course={course} onClose={() => setEditingMs(false)} />}
        {student && <StudentPanel enrollment={student} course={course} onClose={() => setOpenStudent(null)} />}
      </AnimatePresence>
    </div>
  )
}

// ── Milestone editor ────────────────────────────────────────────────────────────
function MilestoneEditor({ course, onClose }: { course: Course; onClose: () => void }) {
  const [items, setItems] = useState<Milestone[]>(course.milestones.length ? course.milestones : [blankMs()])
  const upd = (i: number, patch: Partial<Milestone>) => setItems(items.map((x, j) => j === i ? { ...x, ...patch } : x))
  const save = () => { void coachService.setMilestones(course.id, items.filter(m => m.title.trim())); onClose() }

  return (
    <Modal title="Milestones" wide onClose={onClose}>
      <div style={{ display: 'grid', gap: 10, maxHeight: '62vh', overflowY: 'auto', paddingRight: 4 }}>
        {items.map((m, i) => (
          <div key={m.id} style={{ border: '1px solid #EEF0F5', borderRadius: 12, padding: 12, position: 'relative' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              <input value={m.title} onChange={e => upd(i, { title: e.target.value })} placeholder={`Milestone ${i + 1} title`} style={{ ...input, fontWeight: 700 }} />
              <select value={m.cadence} onChange={e => upd(i, { cadence: e.target.value as Cadence })} style={{ ...input, width: 110 }}>
                <option value="day">Daily</option><option value="week">Weekly</option><option value="month">Monthly</option>
              </select>
            </div>
            <input value={m.deliverable} onChange={e => upd(i, { deliverable: e.target.value })} placeholder="What you'll deliver" style={{ ...input, marginBottom: 6 }} />
            <input value={m.parentOutcome} onChange={e => upd(i, { parentOutcome: e.target.value })} placeholder="What the parent/student should see" style={{ ...input, marginBottom: 6 }} />
            <input type="date" value={m.targetDate} onChange={e => upd(i, { targetDate: e.target.value })} style={input} />
            {items.length > 1 && <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}><X size={15} /></button>}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button onClick={() => setItems([...items, blankMs()])} style={{ ...ghostBtnSm, flex: 1 }}><Plus size={13} /> Add milestone</button>
        <button onClick={save} style={{ ...primaryBtn, flex: 1, justifyContent: 'center' }}>Save milestones</button>
      </div>
    </Modal>
  )
}
const blankMs = (): Milestone => ({ id: `ms-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, cadence: 'week', title: '', deliverable: '', parentOutcome: '', targetDate: '' })

// ── Student panel (progress + payment + messaging) ──────────────────────────────
function StudentPanel({ enrollment, course, onClose }: { enrollment: Enrollment; course: Course; onClose: () => void }) {
  const live = useCoachStore(s => s.enrollments[enrollment.id]) ?? enrollment
  const messages = useCoachStore(s => s.messages[enrollment.id] ?? [])
  const { adminName } = useAuthStore()
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'progress' | 'chat'>('progress')

  const send = () => { if (!msg.trim()) return; void coachService.sendMessage(enrollment.id, { senderRole: 'coach', senderName: adminName || 'Coach', kind: 'note', body: msg.trim() }); setMsg('') }
  const toggle = (mid: string, cur?: string) => coachService.setProgress(enrollment.id, mid, cur === 'done' ? 'pending' : 'done')

  return (
    <Modal title={live.childName} onClose={onClose} wide>
      <div style={{ fontSize: 12, color: '#64748B', marginTop: -8, marginBottom: 12 }}>Parent: {live.parentName} · {course.title}</div>

      <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 10, padding: 3, marginBottom: 14 }}>
        <Tab active={tab === 'progress'} onClick={() => setTab('progress')}><Target size={13} /> Progress</Tab>
        <Tab active={tab === 'chat'} onClick={() => setTab('chat')}><MessageCircle size={13} /> Messages {messages.length ? `(${messages.length})` : ''}</Tab>
      </div>

      {tab === 'progress' ? (
        <div>
          {/* Payment */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, background: live.paid ? '#F0FDF4' : '#FFFBEB', border: `1px solid ${live.paid ? '#BBF7D0' : '#FDE68A'}`, marginBottom: 14 }}>
            <IndianRupee size={16} color={live.paid ? '#16A34A' : '#D97706'} />
            <span style={{ flex: 1, fontSize: 12.5, fontWeight: 700, color: live.paid ? '#15803D' : '#92400E' }}>{live.paid ? `Paid · ${PLAN_PRICING[course.plan].label}` : `Payment pending · ${PLAN_PRICING[course.plan].label}`}</span>
            {!live.paid && <button onClick={() => coachService.markPaid(enrollment.id)} style={ghostBtnSm}>Mark received (test)</button>}
          </div>
          {course.milestones.length === 0 ? (
            <div style={{ fontSize: 13, color: '#64748B' }}>Add milestones to this course to track progress.</div>
          ) : (
            <div style={{ display: 'grid', gap: 8 }}>
              {course.milestones.map(m => {
                const pr = live.progress[m.id]
                const done = pr?.status === 'done'
                return (
                  <button key={m.id} onClick={() => toggle(m.id, pr?.status)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 13px', borderRadius: 11, cursor: 'pointer', border: '1px solid #EEF0F5', background: done ? '#F0FDF4' : '#fff', textAlign: 'left', fontFamily: FONT }}>
                    {done ? <CheckCircle2 size={19} color="#16A34A" /> : <Circle size={19} color="#CBD5E1" />}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{m.title}</div>
                      {m.parentOutcome && <div style={{ fontSize: 11.5, color: '#64748B' }}>{m.parentOutcome}</div>}
                    </div>
                    {done && pr?.achievedOn && <span style={{ fontSize: 10.5, color: '#16A34A', fontWeight: 700 }}>{fmt(pr.achievedOn)}</span>}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        <ChatThread messages={messages} myRole="coach" onSend={send} value={msg} setValue={setMsg} />
      )}
    </Modal>
  )
}

// ── Reusable chat thread (used by coach here, and by parent in ExtraCurricular) ──
export function ChatThread({ messages, myRole, value, setValue, onSend }: { messages: { id: string; senderRole: string; senderName: string; body: string; createdAt: number }[]; myRole: 'coach' | 'parent'; value: string; setValue: (v: string) => void; onSend: () => void }) {
  return (
    <div>
      <div style={{ display: 'grid', gap: 8, maxHeight: '46vh', overflowY: 'auto', marginBottom: 12, padding: 2 }}>
        {messages.length === 0 && <div style={{ fontSize: 12.5, color: '#94A3B8', textAlign: 'center', padding: 16 }}>No messages yet. Start the conversation 👋</div>}
        {messages.map(m => {
          const mine = m.senderRole === myRole
          return (
            <div key={m.id} style={{ alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '80%', marginLeft: mine ? 'auto' : 0 }}>
              <div style={{ fontSize: 10, color: '#94A3B8', marginBottom: 2, textAlign: mine ? 'right' : 'left' }}>{m.senderName} · {m.senderRole}</div>
              <div style={{ padding: '8px 12px', borderRadius: 12, fontSize: 13, lineHeight: 1.5, background: mine ? P : '#F1F5F9', color: mine ? '#fff' : '#0F172A' }}>{m.body}</div>
            </div>
          )
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input value={value} onChange={e => setValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && onSend()} placeholder="Write a message…" style={{ ...input, flex: 1 }} />
        <button onClick={onSend} style={{ ...primaryBtn, padding: '0 16px' }}><Send size={15} /></button>
      </div>
    </div>
  )
}

// ── Create course modal ─────────────────────────────────────────────────────────
function CreateCourseModal({ coachId, coachName, onClose, onCreated }: { coachId: string; coachName: string; onClose: () => void; onCreated: (id: string) => void }) {
  const [title, setTitle] = useState('')
  const [discipline, setDiscipline] = useState(DISCIPLINES[0])
  const [description, setDescription] = useState('')
  const [plan, setPlan] = useState<'yearly' | '5yr'>('yearly')
  const create = () => { if (!title.trim()) return; coachService.createCourse(coachId, coachName, { title: title.trim(), discipline, description: description.trim(), plan }).then(c => onCreated(c.id)) }

  return (
    <Modal title="Create a course" onClose={onClose}>
      <Field label="Course title"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Bharatanatyam — Year 1" style={input} /></Field>
      <Field label="Discipline">
        <select value={discipline} onChange={e => setDiscipline(e.target.value)} style={input}>{DISCIPLINES.map(d => <option key={d}>{d}</option>)}</select>
      </Field>
      <Field label="Description (optional)"><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="What this course covers…" style={{ ...input, resize: 'vertical' }} /></Field>
      <Field label="Subscription plan">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {(['yearly', '5yr'] as const).map(p => (
            <button key={p} onClick={() => setPlan(p)} style={{ padding: '12px', borderRadius: 11, cursor: 'pointer', fontFamily: FONT, textAlign: 'left', border: `1.5px solid ${plan === p ? P : '#E2E8F0'}`, background: plan === p ? '#EEECFF' : '#fff' }}>
              <div style={{ fontSize: 14, fontWeight: 900, color: plan === p ? P : '#0F172A' }}>{PLAN_PRICING[p].label}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{p === 'yearly' ? 'Billed yearly' : 'Best value · 5 years' }</div>
            </button>
          ))}
        </div>
      </Field>
      <button onClick={create} disabled={!title.trim()} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', marginTop: 6, opacity: title.trim() ? 1 : 0.5 }}>Create course</button>
    </Modal>
  )
}

// ── shared bits ────────────────────────────────────────────────────────────────
const wrap: React.CSSProperties = { padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }
const input: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box', background: '#fff' }
const primaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }
const ghostBtnSm: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }
const dangerBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 9, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }
const backBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, fontFamily: FONT }

function Stat({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F5', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 11, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      <div><div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</div><div style={{ fontSize: 11.5, color: '#64748B', fontWeight: 600 }}>{label}</div></div>
    </div>
  )
}

function Tab({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, background: active ? '#fff' : 'transparent', color: active ? P : '#64748B', boxShadow: active ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>{children}</button>
}

function Card({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F5', padding: 16 }}><div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}>{icon}<h3 style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{title}</h3></div>{children}</div>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>{label}</label>{children}</div>
}

function Empty({ icon, title, sub, onAdd, label }: { icon: string; title: string; sub: string; onAdd: () => void; label: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 20px', borderRadius: 18, background: '#FAFAFF', border: '1.5px dashed #DDD6FE' }}>
      <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748B', maxWidth: 400, margin: '0 auto 16px', lineHeight: 1.6 }}>{sub}</div>
      <button onClick={onAdd} style={{ ...primaryBtn, display: 'inline-flex' }}><Plus size={14} /> {label}</button>
    </div>
  )
}

function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: React.ReactNode; wide?: boolean }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: wide ? 560 : 460, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
