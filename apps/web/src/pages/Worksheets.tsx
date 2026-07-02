import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, Circle, Upload, ChevronRight, Award, Clock, Lightbulb, ExternalLink, Trash2, ClipboardCheck } from 'lucide-react'
import { type Worksheet } from '@/store/appStore'
import { type AssignedSheet } from '@/store/kidsDataStore'
import { useKidStore } from '@/hooks/useKidStore'
import { useAuthStore } from '@/store/authStore'
import { useWalletStore, WORKSHEET_COST } from '@/store/walletStore'
import { logActivity } from '@/store/activityLogStore'
import Resources from '@/pages/Resources'
import Olympiad from '@/pages/Olympiad'

const FONT = "'Nunito', 'Inter', sans-serif"

const DIFFICULTY_CONFIG = {
  easy:   { label: 'Easy',   color: '#059669', bg: '#ECFDF5' },
  medium: { label: 'Medium', color: '#D97706', bg: '#FFFBEB' },
  hard:   { label: 'Hard',   color: '#DC2626', bg: '#FFF5F5' },
}

const STATUS_CONFIG = {
  pending:     { label: 'Pending',     color: '#94A3B8', bg: '#F8FAFC' },
  'in-progress':{ label: 'In Progress', color: '#3B82F6', bg: '#DBEAFE' },
  submitted:   { label: 'Submitted',   color: '#7C3AED', bg: '#EDE9FE' },
  graded:      { label: 'Graded',      color: '#059669', bg: '#ECFDF5' },
}

function WorksheetAttempt({ ws, onClose }: { ws: Worksheet; onClose: () => void }) {
  const { submitWorksheet } = useKidStore()
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submitted, setSubmitted] = useState(false)
  const [score, setScore] = useState(0)
  const [showHints, setShowHints] = useState<Record<string, boolean>>({})
  const fileRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    let correct = 0
    ws.questions.forEach(q => {
      const ans = (answers[q.id] ?? '').trim().toLowerCase()
      const right = q.answer.toLowerCase()
      if (q.type === 'mcq' || q.type === 'true-false') {
        if (ans === right) correct++
      } else {
        // Partial match for short/fill-blank
        if (right.split('(')[0].trim().toLowerCase().includes(ans) || ans.includes(right.split('(')[0].trim().toLowerCase())) correct++
      }
    })
    const pct = Math.round((correct / ws.questions.length) * 100)
    setScore(pct)
    setSubmitted(true)
    submitWorksheet(ws.id, pct)
  }

  if (submitted) {
    const color = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'
    return (
      <div style={{ padding: 24 }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 56, marginBottom: 8 }}>{score >= 80 ? '🏆' : score >= 60 ? '⭐' : '📚'}</div>
          <div style={{ fontSize: 40, fontWeight: 900, color, lineHeight: 1 }}>{score}%</div>
          <div style={{ fontSize: 14, color: '#64748B', marginTop: 4 }}>
            {score >= 80 ? 'Excellent work! 🎉' : score >= 60 ? 'Good effort! Review the incorrect ones.' : 'Keep practising — you\'ll get it! 💪'}
          </div>
        </div>
        {/* Answer review */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
          {ws.questions.map((q, i) => {
            const ans = (answers[q.id] ?? '').trim()
            const right = q.answer
            const correct = q.type === 'mcq' || q.type === 'true-false'
              ? ans.toLowerCase() === right.toLowerCase()
              : right.toLowerCase().includes(ans.toLowerCase()) || ans.toLowerCase().includes(right.split('(')[0].trim().toLowerCase())
            return (
              <div key={q.id} style={{ padding: '10px 12px', borderRadius: 9, background: correct ? '#F0FDF4' : '#FFF5F5', border: `1px solid ${correct ? '#BBF7D0' : '#FECACA'}` }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  {correct ? <CheckCircle2 size={14} color="#22C55E" style={{ marginTop: 2, flexShrink: 0 }} /> : <Circle size={14} color="#EF4444" style={{ marginTop: 2, flexShrink: 0 }} />}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#0F172A', marginBottom: 3 }}>Q{i+1}. {q.text}</div>
                    {!correct && <div style={{ fontSize: 11, color: '#166534' }}>✓ Correct answer: <strong>{right}</strong></div>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} className="btn btn-primary" style={{ flex: 1 }}>Done</button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{ws.title}</div>
        <div style={{ fontSize: 12, color: '#64748B' }}>{ws.subject} · {ws.chapter} · {ws.estimatedMinutes} min</div>
      </div>

      {/* Upload option */}
      <div style={{ padding: '10px 14px', borderRadius: 9, background: '#F5F9FE', border: '1.5px dashed #C7D2FE', marginBottom: 20, cursor: 'pointer', textAlign: 'center' }}
        onClick={() => fileRef.current?.click()}>
        <input ref={fileRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} />
        <Upload size={16} color="#6366F1" style={{ margin: '0 auto 4px' }} />
        <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600 }}>Upload scanned answer sheet</div>
        <div style={{ fontSize: 10.5, color: '#94A3B8' }}>Or complete online below</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {ws.questions.map((q, i) => (
          <div key={q.id} style={{ padding: '12px 14px', borderRadius: 10, background: '#fff', border: '1px solid #E2E8F0' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 10 }}>
              Q{i+1}. {q.text}
            </div>

            {q.type === 'mcq' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.options!.map(opt => (
                  <label key={opt} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px',
                    borderRadius: 8, cursor: 'pointer', border: '1px solid',
                    borderColor: answers[q.id] === opt ? '#818CF8' : '#E2E8F0',
                    background: answers[q.id] === opt ? '#EEF2FF' : '#FAFBFF',
                    transition: 'all 0.12s',
                  }}>
                    <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                      onChange={() => setAnswers({...answers, [q.id]: opt})} style={{ accentColor: '#4F46E5' }} />
                    <span style={{ fontSize: 13, color: '#1E293B' }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {q.type === 'true-false' && (
              <div style={{ display: 'flex', gap: 10 }}>
                {['True','False'].map(opt => (
                  <label key={opt} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '8px', borderRadius: 8, cursor: 'pointer', border: '1.5px solid',
                    borderColor: answers[q.id] === opt ? '#818CF8' : '#E2E8F0',
                    background: answers[q.id] === opt ? '#EEF2FF' : '#FAFBFF',
                  }}>
                    <input type="radio" name={q.id} value={opt} checked={answers[q.id] === opt}
                      onChange={() => setAnswers({...answers, [q.id]: opt})} style={{ accentColor: '#4F46E5' }} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{opt}</span>
                  </label>
                ))}
              </div>
            )}

            {(q.type === 'short' || q.type === 'fill-blank') && (
              <input
                value={answers[q.id] ?? ''} onChange={e => setAnswers({...answers, [q.id]: e.target.value})}
                placeholder={q.type === 'fill-blank' ? 'Fill in the blank...' : 'Write your answer...'}
                className="input" style={{ fontSize: 13 }} />
            )}

            {q.hint && (
              <div style={{ marginTop: 8 }}>
                {!showHints[q.id] ? (
                  <button onClick={() => setShowHints({...showHints, [q.id]: true})}
                    style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Lightbulb size={12} /> Show hint
                  </button>
                ) : (
                  <div style={{ fontSize: 11, color: '#D97706', background: '#FFFBEB', padding: '5px 10px', borderRadius: 7, border: '1px solid #FDE68A' }}>
                    💡 {q.hint}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <button onClick={handleSubmit}
        disabled={Object.keys(answers).length < ws.questions.length}
        className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
        Submit Worksheet (+15 XP)
      </button>
    </div>
  )
}

// One practice home: printable Worksheet Library (default), interactive
// Olympiad practice (merged in per user feedback — no separate section), and
// "Assigned to me" for teacher/AI-assigned sheets.
export default function Worksheets() {
  const [tab, setTab] = useState<'library' | 'olympiad' | 'assigned'>('library')
  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 11, padding: 3, margin: '0 0 4px', flexWrap: 'wrap' }}>
        {([['library', '📄 Worksheet Library'], ['olympiad', '🏆 Olympiad Practice'], ['assigned', '📋 Assigned to me']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 800,
              background: tab === k ? '#fff' : 'transparent', color: tab === k ? '#4F46E5' : '#64748B',
              boxShadow: tab === k ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'library' ? <Resources /> : tab === 'olympiad' ? <Olympiad /> : <AssignedWorksheets />}
    </div>
  )
}

// One assigned-PDF card: dates, open (wallet), marks entry, remove.
function AssignedSheetCard({ sheet }: { sheet: AssignedSheet }) {
  const { completeSheet, unassignSheet } = useKidStore()
  const { activePhone, activeKidId } = useAuthStore()
  const wallet = useWalletStore()
  const [entering, setEntering] = useState(false)
  const [score, setScore] = useState('')
  const [outOf, setOutOf] = useState('')

  const overdue = sheet.status === 'assigned' && new Date(sheet.dueDate) < new Date()
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })

  const open = () => {
    const res = wallet.buyWorksheet(activePhone, sheet.url, sheet.title)
    if (!res.ok) { alert('Not enough wallet credits to open this sheet.'); return }
    if (res.charged) logActivity('worksheet_downloaded', activePhone, `Downloaded: ${sheet.title} (−₹${WORKSHEET_COST})`, activeKidId ?? undefined)
    window.open(sheet.url, '_blank', 'noopener,noreferrer')
  }

  const saveMarks = () => {
    const s = parseInt(score); const m = parseInt(outOf)
    if (isNaN(s) || isNaN(m) || m <= 0 || s < 0 || s > m) return
    completeSheet(sheet.id, s, m)
    setEntering(false)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: '14px 16px', borderRadius: 12, background: '#fff', border: `1.5px solid ${overdue ? '#FECACA' : '#E2E8F0'}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
        <span style={{ fontSize: 22 }}>📄</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{sheet.title}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{sheet.subjectName} · Class {sheet.classNum} · Assigned {fmt(sheet.assignedDate)} · Due {fmt(sheet.dueDate)}</div>
        </div>
        {sheet.status === 'completed' && sheet.score !== undefined ? (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#059669' }}>{sheet.score}/{sheet.maxScore}</div>
            <div style={{ fontSize: 9.5, color: '#94A3B8' }}>marked {sheet.completedDate && fmt(sheet.completedDate)}</div>
          </div>
        ) : overdue ? (
          <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: '#FFF5F5', color: '#DC2626', flexShrink: 0 }}>⚠ Overdue</span>
        ) : (
          <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: '#EEF2FF', color: '#4338CA', flexShrink: 0 }}>Assigned</span>
        )}
      </div>

      {entering ? (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <input value={score} onChange={e => setScore(e.target.value)} placeholder="Marks" inputMode="numeric"
            style={{ width: 70, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #C7D2FE', fontSize: 12.5, outline: 'none' }} />
          <span style={{ color: '#94A3B8', fontSize: 12 }}>out of</span>
          <input value={outOf} onChange={e => setOutOf(e.target.value)} placeholder="Total" inputMode="numeric"
            style={{ width: 70, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #C7D2FE', fontSize: 12.5, outline: 'none' }} />
          <button onClick={saveMarks} className="btn btn-primary" style={{ fontSize: 11.5, padding: '7px 14px' }}>Save (+15 XP)</button>
          <button onClick={() => setEntering(false)} className="btn btn-ghost" style={{ fontSize: 11.5, padding: '7px 10px' }}>Cancel</button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={open} className="btn btn-primary" style={{ fontSize: 11.5, padding: '6px 12px' }}>
            <ExternalLink size={12} /> Open / Print
          </button>
          {sheet.status === 'assigned' && (
            <button onClick={() => setEntering(true)} className="btn btn-secondary" style={{ fontSize: 11.5, padding: '6px 12px' }}>
              <ClipboardCheck size={12} /> Enter marks
            </button>
          )}
          <button onClick={() => unassignSheet(sheet.id)} title="Remove assignment"
            style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', padding: '6px 9px', borderRadius: 8, border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', cursor: 'pointer' }}>
            <Trash2 size={12} />
          </button>
        </div>
      )}
    </motion.div>
  )
}

function AssignedWorksheets() {
  const { worksheets, subjects, assignedSheets } = useKidStore()
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const [filterSubject, setFilterSubject] = useState('All')
  const [filterStatus, setFilterStatus] = useState<'all' | Worksheet['status']>('all')
  const [activeWs, setActiveWs] = useState<Worksheet | null>(null)

  if (worksheets.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="label" style={{ marginBottom: 4 }}>{activeKid?.grade}</div>
            <h1 className="page-title">Assigned to {activeKid?.name ?? 'me'}</h1>
            <p className="page-subtitle">Sheets assigned from the Worksheet Library · record marks after solving · +15 XP each</p>
          </div>
        </div>

        {assignedSheets.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="resp-2col">
            {assignedSheets.map(s => <AssignedSheetCard key={s.id} sheet={s} />)}
          </div>
        ) : (
          <div className="card" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 16 }}>📋</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Nothing assigned yet</div>
            <div style={{ fontSize: 13, color: '#64748B' }}>
              Open the Worksheet Library tab and tap "Assign" on any sheet — it will appear here with its due date.
            </div>
          </div>
        )}
      </div>
    )
  }

  const subjectNames = ['All', ...new Set(worksheets.map(w => w.subject))]
  const filtered = worksheets.filter(w =>
    (filterSubject === 'All' || w.subject === filterSubject) &&
    (filterStatus === 'all' || w.status === filterStatus)
  )

  const pending  = worksheets.filter(w => w.status === 'pending').length
  const graded   = worksheets.filter(w => w.status === 'graded')
  const avgScore = graded.length ? Math.round(graded.reduce((a,w) => a+(w.score??0),0)/graded.length) : 0

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>{activeKid?.board} {activeKid?.grade} · AI-Generated</div>
          <h1 className="page-title">Worksheets</h1>
          <p className="page-subtitle">Complete online or upload scanned answers · +15 XP per submission</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, background: '#FFF5F5', border: '1px solid #FECACA' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#DC2626' }}>{pending}</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>Pending</div>
          </div>
          {graded.length > 0 && (
            <div style={{ textAlign: 'center', padding: '8px 14px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #BBF7D0' }}>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{avgScore}%</div>
              <div style={{ fontSize: 10, color: '#64748B' }}>Avg Score</div>
            </div>
          )}
        </div>
      </div>

      {/* Assigned library sheets (from the parent) */}
      {assignedSheets.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 16 }} className="resp-2col">
          {assignedSheets.map(s => <AssignedSheetCard key={s.id} sheet={s} />)}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {subjectNames.map(s => {
          const sub = subjects.find(x => x.name === s)
          return (
            <button key={s} onClick={() => setFilterSubject(s)}
              style={{
                padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer',
                fontWeight: filterSubject === s ? 700 : 500, fontSize: 12,
                background: filterSubject === s ? (sub?.color ?? '#4F46E5') : '#F1F5F9',
                color: filterSubject === s ? '#fff' : '#64748B',
              }}>
              {sub?.icon} {s}
            </button>
          )
        })}
        <div style={{ width: 1, background: '#E2E8F0', margin: '0 4px' }} />
        {(['all', 'pending', 'graded'] as const).map(f => (
          <button key={f} onClick={() => setFilterStatus(f)}
            style={{
              padding: '5px 12px', borderRadius: 20, border: '1px solid #DCE8F5', cursor: 'pointer',
              fontWeight: filterStatus === f ? 700 : 500, fontSize: 12,
              background: filterStatus === f ? '#0F172A' : '#fff',
              color: filterStatus === f ? '#fff' : '#64748B',
            }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Worksheet cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }} className="resp-2col">
        {filtered.map(ws => {
          const sub = subjects.find(s => s.name === ws.subject)
          const dc  = DIFFICULTY_CONFIG[ws.difficulty]
          const sc  = STATUS_CONFIG[ws.status]
          const isOverdue = ws.status === 'pending' && new Date(ws.dueDate) < new Date()
          return (
            <motion.div key={ws.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              style={{
                padding: '14px 16px', borderRadius: 12, background: '#fff',
                border: `1.5px solid ${isOverdue ? '#FECACA' : '#E2E8F0'}`,
                cursor: ws.status !== 'graded' ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
              onClick={() => ws.status !== 'graded' && setActiveWs(ws)}>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 22 }}>{sub?.icon ?? '📄'}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', marginBottom: 3 }}>{ws.title}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>{ws.subject} · {ws.chapter}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: dc.bg, color: dc.color }}>{dc.label}</span>
                <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, fontWeight: 600, background: sc.bg, color: sc.color }}>{sc.label}</span>
                {isOverdue && <span style={{ fontSize: 10.5, padding: '2px 8px', borderRadius: 10, fontWeight: 700, background: '#FFF5F5', color: '#DC2626' }}>⚠ Overdue</span>}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 10 }}>
                  <span style={{ fontSize: 11, color: '#64748B', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock size={11} /> {ws.estimatedMinutes}m
                  </span>
                  <span style={{ fontSize: 11, color: '#64748B' }}>{ws.questions.length} questions</span>
                </div>
                {ws.status === 'graded' && ws.score !== undefined ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Award size={14} color={ws.score >= 80 ? '#059669' : ws.score >= 60 ? '#D97706' : '#DC2626'} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: ws.score >= 80 ? '#059669' : ws.score >= 60 ? '#D97706' : '#DC2626' }}>{ws.score}%</span>
                  </div>
                ) : (
                  <button className="btn btn-primary" style={{ fontSize: 11, padding: '5px 12px' }}
                    onClick={e => { e.stopPropagation(); setActiveWs(ws) }}>
                    Start <ChevronRight size={12} />
                  </button>
                )}
              </div>

              {ws.status === 'graded' && ws.score !== undefined && (
                <div style={{ marginTop: 8, height: 4, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${ws.score}%`, height: '100%', background: ws.score>=80?'#22C55E':ws.score>=60?'#F59E0B':'#EF4444', borderRadius: 3 }} />
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="card" style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>No worksheets for this filter. New worksheets are added every week!</div>
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {activeWs && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
            <motion.div initial={{opacity:0,scale:0.95}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.95}}
              style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid #F1F5F9' }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{activeWs.title}</div>
                  <div style={{ fontSize: 11, color: '#64748B' }}>Due: {new Date(activeWs.dueDate).toLocaleDateString('en-IN',{weekday:'short',month:'short',day:'numeric'})}</div>
                </div>
                <button onClick={() => setActiveWs(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: '#94A3B8' }}>×</button>
              </div>
              <WorksheetAttempt ws={activeWs} onClose={() => setActiveWs(null)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
