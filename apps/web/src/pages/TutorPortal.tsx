import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { useAppStore } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'

const QUICK_TOPICS = ['Math revision', 'English reading', 'Science concepts', 'Hindi grammar', 'Problem solving']
const QUICK_HW     = ['Finish worksheet', 'Practice flashcards', 'Read 10 pages', 'Solve 5 problems']

function addToList(current: string, item: string): string {
  const arr = current.split(',').map(s => s.trim()).filter(Boolean)
  return arr.includes(item) ? current : [...arr, item].join(', ')
}

const fade = (d = 0) => ({
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay: d, ease: [0.16, 1, 0.3, 1] },
})

export default function TutorPortal() {
  const { tutorSessions, addTutorSession, tutorSummary, isGenerating } = useAppStore()
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const childName = activeKid?.name ?? 'Student'
  const [topics,   setTopics]   = useState('Math revision, English reading')
  const [homework, setHomework] = useState('Finish worksheet, Practice flashcards')
  const [notes,    setNotes]    = useState('Student was attentive and completed all tasks with great energy.')
  const [saved,    setSaved]    = useState(false)

  const topicList = useMemo(() => topics.split(',').map(s => s.trim()).filter(Boolean), [topics])
  const hwList    = useMemo(() => homework.split(',').map(s => s.trim()).filter(Boolean), [homework])

  const handleSave = async () => {
    await addTutorSession(topicList, hwList, notes)
    setSaved(true)
    setTimeout(() => setSaved(false), 3500)
  }

  return (
    <div className="page-container">

      <motion.div {...fade(0)} style={{ marginBottom: 28 }}>
        <p className="label" style={{ marginBottom: 6 }}>Tutor Portal</p>
        <h1 style={{ fontSize: 30, fontWeight: 900, letterSpacing: '-0.04em', color: '#111827' }}>
          Log Session
        </h1>
        <p style={{ fontSize: 14, color: '#9CA3AF', marginTop: 4 }}>For {childName} · +20 XP credited to child on save</p>
      </motion.div>

      {saved && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
          className="badge badge-emerald"
          style={{ display: 'flex', justifyContent: 'center', padding: '12px 20px', marginBottom: 20, width: '100%', fontSize: 13, borderRadius: 12 }}>
          ✅ Session saved · AI summary sent to parent dashboard
        </motion.div>
      )}

      {/* Topics */}
      <motion.div {...fade(0.05)} className="card" style={{ padding: 24, marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Topics Covered</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {QUICK_TOPICS.map(t => (
            <button key={t} onClick={() => setTopics(addToList(topics, t))}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', transition: 'all 0.15s' }}>
              + {t}
            </button>
          ))}
        </div>
        <input className="input" value={topics} onChange={e => setTopics(e.target.value)} placeholder="Math, Science, English…" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {topicList.map(t => <span key={t} className="badge badge-brand">{t}</span>)}
        </div>
      </motion.div>

      {/* Homework */}
      <motion.div {...fade(0.1)} className="card" style={{ padding: 24, marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Homework Assigned</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
          {QUICK_HW.map(h => (
            <button key={h} onClick={() => setHomework(addToList(homework, h))}
              style={{ fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 8, cursor: 'pointer',
                background: '#ECFDF5', color: '#065F46', border: '1px solid #A7F3D0', transition: 'all 0.15s' }}>
              + {h}
            </button>
          ))}
        </div>
        <input className="input" value={homework} onChange={e => setHomework(e.target.value)} placeholder="Finish worksheet…" style={{ marginBottom: 10 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {hwList.map(h => <span key={h} className="badge badge-emerald">{h}</span>)}
        </div>
      </motion.div>

      {/* Notes */}
      <motion.div {...fade(0.15)} className="card" style={{ padding: 24, marginBottom: 20 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 12 }}>Notes for Parent</p>
        <textarea className="input" rows={4} value={notes} onChange={e => setNotes(e.target.value)}
          placeholder="Share observations, progress highlights, or areas needing attention…"
          style={{ resize: 'none', lineHeight: 1.7 }} />
      </motion.div>

      <motion.button whileTap={{ scale: 0.98 }} onClick={handleSave} disabled={isGenerating}
        className="btn btn-success"
        style={{ width: '100%', padding: '14px 0', fontSize: 14, marginBottom: 20, opacity: isGenerating ? 0.7 : 1 }}>
        {isGenerating ? '⏳ Generating AI Summary…' : '💾 Save Session · +20 XP to Child'}
      </motion.button>

      {tutorSummary && (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          className="card" style={{ padding: 24, marginBottom: 20, borderColor: '#A7F3D0' }}>
          <div className="badge badge-emerald" style={{ marginBottom: 10 }}>✦ AI Session Summary</div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.8 }}>{tutorSummary}</p>
        </motion.div>
      )}

      {tutorSessions.length > 0 && (
        <motion.div {...fade(0.2)} className="card" style={{ padding: 24 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#111827', marginBottom: 14 }}>Recent Sessions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tutorSessions.slice(0, 4).map((s, i) => (
              <div key={s.id} className="card-flat" style={{ padding: '12px 16px', display: 'flex', gap: 12 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#ECFDF5', border: '1px solid #A7F3D0',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 800, color: '#059669', flexShrink: 0 }}>
                  {tutorSessions.length - i}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#374151', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {s.topics.join(' · ') || 'Untitled'}
                  </div>
                  <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>HW: {s.homework.join(', ') || 'none'}</div>
                </div>
                <span className="badge badge-emerald" style={{ flexShrink: 0, fontSize: 11 }}>+20 XP</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
