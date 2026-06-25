import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, ChevronRight, Upload, X, Plus, Trophy, CheckCircle2, Circle,
  Trash2, Share2, Users, FileText, Printer, Paperclip,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useOlympiadStore, olyKey, allSharedSets } from '@/store/olympiadStore'
import { olympiadService } from '@/services/olympiadService'
import {
  OLY_SUBJECTS, OLY_CATEGORIES, SUBJECT_META, setsFor,
  type OlySubject, type OlyCategory, type OlySet, type OlyQuestion,
} from '@/data/olympiadCatalog'
import { GRADE_LADDER, currentGradeIndex } from '@/lib/grades'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"

export default function Olympiad() {
  const { activeKidId, kids } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const progress = useOlympiadStore(s => (kid ? s.progress[kid.id] ?? {} : {}))
  const customMap = useOlympiadStore(s => s.custom)

  const [tab, setTab] = useState<'practice' | 'community'>('practice')
  const [openSubject, setOpenSubject] = useState<OlySubject | null>(null)
  const [category, setCategory] = useState<OlyCategory>('basic')
  const [running, setRunning] = useState<OlySet | null>(null)
  const [adding, setAdding] = useState(false)

  if (!kid) {
    return (
      <div style={wrap}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 }}>
          <Trophy size={24} color={P} />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Olympiad Practice</h1>
        </div>
        <Empty icon="🏆" title="Pick a child to start practising" sub="Select a child from the sidebar to see their Olympiad practice sets, worksheets and sample papers." />
      </div>
    )
  }
  const grade = GRADE_LADDER[currentGradeIndex(kid.grade)]

  const customFor = (subject: OlySubject, cat: OlyCategory) =>
    (customMap[olyKey(grade, subject)] ?? []).filter(s => s.category === cat)
  const merged = (subject: OlySubject, cat: OlyCategory) => [...setsFor(grade, subject, cat), ...customFor(subject, cat)]
  const totalFor = (subject: OlySubject, cat: OlyCategory) => merged(subject, cat).length

  // ── Community tab ───────────────────────────────────────────────────────────
  if (tab === 'community') {
    const shared = allSharedSets(customMap)
    return (
      <div style={wrap}>
        <TabBar tab={tab} setTab={setTab} />
        <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>Community resources</h1>
        <p style={{ fontSize: 13.5, color: '#64748B', margin: '4px 0 20px' }}>Practice sets parents have shared with the Master-Kids community.</p>
        {shared.length === 0 ? (
          <Empty icon="🤝" title="Nothing shared yet" sub="When you upload a set and tick “Share with community”, it appears here for everyone." />
        ) : (
          <div style={{ display: 'grid', gap: 12 }}>
            {shared.map(s => {
              const m = SUBJECT_META[s.subject]
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: '#fff', border: '1px solid #EEF0F5' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 11, background: m.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{m.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>{s.title}</div>
                    <div style={{ fontSize: 11.5, color: '#64748B' }}>{m.name} · {s.category} · {s.grade}</div>
                  </div>
                  {s.materialUrl
                    ? <a href={s.materialUrl} target="_blank" rel="noreferrer" style={{ fontSize: 12, fontWeight: 800, color: P, textDecoration: 'none' }}>Open</a>
                    : <button onClick={() => setRunning(s)} style={miniBtn}>Try it</button>}
                </div>
              )
            })}
          </div>
        )}
        <AnimatePresence>{running && <SetRunner set={running} childId={kid.id} onClose={() => setRunning(null)} />}</AnimatePresence>
      </div>
    )
  }

  // ── Subject grid ────────────────────────────────────────────────────────────
  if (!openSubject) {
    return (
      <div style={wrap}>
        <TabBar tab={tab} setTab={setTab} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, marginBottom: 4 }}>
          <Trophy size={24} color={P} />
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Olympiad Practice</h1>
        </div>
        <p style={{ fontSize: 13.5, color: '#64748B', margin: '0 0 20px', maxWidth: 540, lineHeight: 1.6 }}>
          Six subjects, four levels each — Basic, Intermediate, Pro and previous-year Sample Papers.
          {kid.name} is in <strong>{grade}</strong>.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14 }}>
          {OLY_SUBJECTS.map(s => {
            const count = OLY_CATEGORIES.reduce((a, c) => a + totalFor(s.key, c.key), 0)
            return (
              <motion.button key={s.key} whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                onClick={() => { setOpenSubject(s.key); setCategory('basic') }}
                style={{ textAlign: 'left', cursor: 'pointer', padding: '18px 16px', borderRadius: 16, background: s.colorLight, border: '1.5px solid transparent', minHeight: 116, fontFamily: FONT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 30 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{s.name}</div>
                  <div style={{ fontSize: 11.5, color: s.color, fontWeight: 700, marginTop: 2 }}>{count} {count === 1 ? 'set' : 'sets'} available →</div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Subject → categories + sets ─────────────────────────────────────────────
  const meta = SUBJECT_META[openSubject]
  const sets = merged(openSubject, category)
  const cat = OLY_CATEGORIES.find(c => c.key === category)!
  return (
    <div style={wrap}>
      <Back onClick={() => setOpenSubject(null)} label="All subjects" />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, background: meta.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{meta.icon}</div>
          <div>
            <h1 style={{ fontSize: 23, fontWeight: 900, color: '#0F172A' }}>{meta.name} Olympiad</h1>
            <div style={{ fontSize: 12.5, color: '#64748B' }}>{grade}</div>
          </div>
        </div>
        <button onClick={() => setAdding(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${meta.color}`, cursor: 'pointer', background: meta.colorLight, color: meta.color, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
          <Upload size={15} /> Add set / upload
        </button>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {OLY_CATEGORIES.map(c => {
          const active = c.key === category
          const have = totalFor(openSubject, c.key)
          return (
            <button key={c.key} onClick={() => setCategory(c.key)}
              style={{ padding: '9px 14px', borderRadius: 11, cursor: 'pointer', border: `1.5px solid ${active ? meta.color : '#E2E8F0'}`, background: active ? meta.colorLight : '#fff', fontFamily: FONT, textAlign: 'left' }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: active ? meta.color : '#0F172A' }}>{c.label}</div>
              <div style={{ fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>{have} / {c.target} sets</div>
            </button>
          )
        })}
      </div>

      <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 12 }}>{cat.blurb} · {sets.length} of {cat.target} loaded — add more with “Add set / upload”.</div>

      {sets.length === 0 ? (
        <Empty icon="🏆" title={`No ${cat.label} sets yet`} sub={`Add ${meta.name} ${cat.label.toLowerCase()} sets — interactive worksheets or uploaded papers.`} onAdd={() => setAdding(true)} onAddLabel="Add / upload set" />
      ) : (
        <div style={{ display: 'grid', gap: 10 }}>
          {sets.map(s => {
            const pr = progress[s.id]
            const done = pr?.status === 'done'
            return (
              <div key={s.id} style={{ position: 'relative' }}>
                <button onClick={() => setRunning(s)}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '14px 16px', borderRadius: 13, background: '#fff', border: '1px solid #EEF0F5', display: 'flex', alignItems: 'center', gap: 12, fontFamily: FONT }}>
                  {done ? <CheckCircle2 size={20} color="#16A34A" /> : <Circle size={20} color="#CBD5E1" />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A' }}>{s.title}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 7, background: s.source === 'custom' ? '#E0E7FF' : '#F1F5F9', color: s.source === 'custom' ? '#4338CA' : '#94A3B8' }}>{s.source === 'custom' ? 'Your upload' : 'Sample'}</span>
                      {s.shared && <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 7, background: '#DCFCE7', color: '#15803D' }}>Shared</span>}
                    </div>
                    <div style={{ fontSize: 11.5, color: '#64748B', marginTop: 2 }}>
                      {s.kind === 'sample_paper' ? 'Sample paper' : `${s.questions?.length ?? 0} questions`}
                      {done && pr?.score !== undefined && ` · scored ${pr.score}%`}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#CBD5E1" />
                </button>
                {s.source === 'custom' && (
                  <div style={{ position: 'absolute', top: 12, right: 38, display: 'flex', gap: 4 }}>
                    <button onClick={() => olympiadService.toggleShare(grade, openSubject, s.id)} title={s.shared ? 'Unshare' : 'Share with community'}
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: s.shared ? '#16A34A' : '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Share2 size={13} /></button>
                    <button onClick={() => olympiadService.removeSet(grade, openSubject, s.id)} title="Delete"
                      style={{ width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {running && <SetRunner set={running} childId={kid.id} onClose={() => setRunning(null)} />}
        {adding && <AddSetModal subject={openSubject} category={category} grade={grade}
          onClose={() => setAdding(false)}
          onSave={(set) => { void olympiadService.addSet(grade, openSubject, set); setAdding(false) }} />}
      </AnimatePresence>
    </div>
  )
}

// ── Set runner (interactive worksheet or sample paper) ──────────────────────────
function SetRunner({ set, childId, onClose }: { set: OlySet; childId: string; onClose: () => void }) {
  const meta = SUBJECT_META[set.subject]
  const isPaper = set.kind === 'sample_paper' || !set.questions || set.questions.length === 0
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)

  const score = set.questions
    ? Math.round((set.questions.filter((q, i) => answers[i] === q.answerIndex).length / set.questions.length) * 100)
    : 0

  const submit = () => { setSubmitted(true); void olympiadService.setProgress(childId, set.id, 'done', score) }
  const markComplete = () => { void olympiadService.setProgress(childId, set.id, 'done'); onClose() }
  const printPaper = () => {
    const win = window.open('', '_blank', 'width=800,height=900'); if (!win) return
    win.document.write(`<html><head><title>${set.title}</title></head><body style="font-family:Georgia,serif;padding:40px"><h2>${set.title}</h2><p>${meta.name} · ${set.category} · ${set.grade}</p><p style="color:#888">Sample paper placeholder — attach the previous-year PDF via upload.</p></body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 250)
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div><h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>{set.title}</h3>
            <div style={{ fontSize: 12, color: '#64748B' }}>{meta.name} · {set.category} · {set.grade}</div></div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>

        {isPaper ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <FileText size={40} color={meta.color} style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, color: '#475569', marginBottom: 18, lineHeight: 1.6 }}>
              {set.materialUrl ? 'Open the paper, attempt it offline, then mark complete.' : 'This is a sample-paper placeholder. Upload the previous-year PDF to attach it.'}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              {set.materialUrl
                ? <a href={set.materialUrl} target="_blank" rel="noreferrer" style={{ ...primaryBtn(meta.color), textDecoration: 'none' }}>Open paper</a>
                : <button onClick={printPaper} style={{ ...secondaryBtn, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Printer size={14} /> Print template</button>}
              <button onClick={markComplete} style={primaryBtn(meta.color)}>Mark complete</button>
            </div>
          </div>
        ) : submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 46, fontWeight: 900, color: score >= 60 ? '#16A34A' : '#D97706' }}>{score}%</div>
            <div style={{ fontSize: 14, color: '#475569', margin: '8px 0 18px' }}>{score >= 60 ? 'Great work! 🎉' : 'Good try — review and retry!'}</div>
            <div style={{ display: 'grid', gap: 8, textAlign: 'left', marginBottom: 18 }}>
              {set.questions!.map((q, i) => {
                const ok = answers[i] === q.answerIndex
                return <div key={i} style={{ fontSize: 12.5, padding: '8px 12px', borderRadius: 9, background: ok ? '#F0FDF4' : '#FEF2F2', color: ok ? '#166534' : '#991B1B' }}>
                  {ok ? '✓' : '✗'} {q.q} — <strong>{q.options[q.answerIndex]}</strong>
                </div>
              })}
            </div>
            <button onClick={onClose} style={primaryBtn(meta.color)}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gap: 14, marginBottom: 16 }}>
              {set.questions!.map((q, i) => (
                <div key={i}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Q{i + 1}. {q.q}</div>
                  <div style={{ display: 'grid', gap: 6 }}>
                    {q.options.map((opt, oi) => {
                      const sel = answers[i] === oi
                      return <button key={oi} onClick={() => setAnswers(a => ({ ...a, [i]: oi }))}
                        style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, border: `1.5px solid ${sel ? meta.color : '#E2E8F0'}`, background: sel ? meta.colorLight : '#fff', color: '#0F172A' }}>{opt}</button>
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={submit} disabled={Object.keys(answers).length < set.questions!.length} style={{ ...primaryBtn(meta.color), width: '100%', opacity: Object.keys(answers).length < set.questions!.length ? 0.5 : 1 }}>Submit answers</button>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

// ── Add / upload set modal ──────────────────────────────────────────────────────
function AddSetModal({ subject, category, grade, onClose, onSave }: { subject: OlySubject; category: OlyCategory; grade: string; onClose: () => void; onSave: (set: OlySet) => void }) {
  const meta = SUBJECT_META[subject]
  const [cat, setCat] = useState<OlyCategory>(category)
  const [title, setTitle] = useState('')
  const [mode, setMode] = useState<'questions' | 'upload'>('questions')
  const [questions, setQuestions] = useState<OlyQuestion[]>([{ q: '', options: ['', '', '', ''], answerIndex: 0 }])
  const [materialUrl, setMaterialUrl] = useState('')
  const [share, setShare] = useState(false)
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const setQ = (i: number, patch: Partial<OlyQuestion>) => setQuestions(questions.map((x, j) => j === i ? { ...x, ...patch } : x))
  const setOpt = (i: number, oi: number, v: string) => setQ(i, { options: questions[i].options.map((o, j) => j === oi ? v : o) })
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = () => setMaterialUrl(r.result as string); r.readAsDataURL(f) }

  const save = () => {
    setErr('')
    if (!title.trim()) { setErr('Give the set a title.'); return }
    const id = `oly-custom-${Date.now()}`
    if (mode === 'questions') {
      const clean = questions.filter(q => q.q.trim() && q.options.every(o => o.trim()))
      if (clean.length === 0) { setErr('Add at least one complete question (text + 4 options).'); return }
      onSave({ id, subject, category: cat, grade, title: title.trim(), kind: 'worksheet', questions: clean, shared: share })
    } else {
      if (!materialUrl) { setErr('Upload a file or paste a link.'); return }
      onSave({ id, subject, category: cat, grade, title: title.trim(), kind: 'sample_paper', materialUrl, shared: share })
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 86, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Add {meta.name} set</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16 }}>Build an interactive worksheet, or upload a previous-year paper. Optionally share it with the community.</p>

        <Field label="Title"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Geometry — Worksheet 3" style={input} /></Field>
        <Field label="Category">
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {OLY_CATEGORIES.map(c => (
              <button key={c.key} onClick={() => setCat(c.key)} style={{ padding: '7px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 700, border: `1.5px solid ${cat === c.key ? meta.color : '#E2E8F0'}`, background: cat === c.key ? meta.colorLight : '#fff', color: cat === c.key ? meta.color : '#64748B' }}>{c.label}</button>
            ))}
          </div>
        </Field>

        <div style={{ display: 'flex', gap: 6, margin: '4px 0 14px' }}>
          <ModeBtn active={mode === 'questions'} onClick={() => setMode('questions')} color={meta.color}>Build questions</ModeBtn>
          <ModeBtn active={mode === 'upload'} onClick={() => setMode('upload')} color={meta.color}>Upload paper</ModeBtn>
        </div>

        {mode === 'questions' ? (
          <div style={{ marginBottom: 12 }}>
            {questions.map((q, i) => (
              <div key={i} style={{ border: '1px solid #EEF0F5', borderRadius: 10, padding: 10, marginBottom: 8, position: 'relative' }}>
                <input value={q.q} onChange={e => setQ(i, { q: e.target.value })} placeholder={`Question ${i + 1}`} style={{ ...input, marginBottom: 6, fontWeight: 700 }} />
                {q.options.map((o, oi) => (
                  <div key={oi} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
                    <button onClick={() => setQ(i, { answerIndex: oi })} title="Mark correct" style={{ width: 20, height: 20, borderRadius: '50%', border: `2px solid ${q.answerIndex === oi ? '#16A34A' : '#CBD5E1'}`, background: q.answerIndex === oi ? '#16A34A' : '#fff', cursor: 'pointer', flexShrink: 0 }} />
                    <input value={o} onChange={e => setOpt(i, oi, e.target.value)} placeholder={`Option ${oi + 1}`} style={{ ...input, padding: '6px 10px' }} />
                  </div>
                ))}
                {questions.length > 1 && <button onClick={() => setQuestions(questions.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}><X size={14} /></button>}
                <div style={{ fontSize: 10.5, color: '#94A3B8', marginTop: 2 }}>Tap the circle to mark the correct option.</div>
              </div>
            ))}
            <button onClick={() => setQuestions([...questions, { q: '', options: ['', '', '', ''], answerIndex: 0 }])} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: FONT }}><Plus size={13} /> Add question</button>
          </div>
        ) : (
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#475569', fontFamily: FONT }}><Paperclip size={13} /> Upload file</button>
              <input value={materialUrl.startsWith('data:') ? '' : materialUrl} onChange={e => setMaterialUrl(e.target.value)} placeholder="…or paste a link" style={{ ...input, flex: 1 }} />
            </div>
            {materialUrl && <div style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700, marginTop: 6 }}>✓ Attached</div>}
            <input ref={fileRef} type="file" onChange={onFile} style={{ display: 'none' }} />
          </div>
        )}

        <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 14, cursor: 'pointer' }}>
          <input type="checkbox" checked={share} onChange={e => setShare(e.target.checked)} /> <Share2 size={14} color={P} /> Share with the community
        </label>

        {err && <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, marginBottom: 10 }}>{err}</div>}
        <button onClick={save} style={{ ...primaryBtn(P), width: '100%' }}>Save set</button>
      </motion.div>
    </motion.div>
  )
}

// ── shared bits ────────────────────────────────────────────────────────────────
const wrap: React.CSSProperties = { padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }
const input: React.CSSProperties = { width: '100%', padding: '8px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const miniBtn: React.CSSProperties = { padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', background: P, color: '#fff', fontSize: 12, fontWeight: 800, fontFamily: FONT }
const secondaryBtn: React.CSSProperties = { padding: '10px 18px', borderRadius: 10, border: '1.5px solid #E2E8F0', cursor: 'pointer', background: '#fff', color: '#475569', fontSize: 13, fontWeight: 800, fontFamily: FONT }
const primaryBtn = (color: string): React.CSSProperties => ({ padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: color, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT })

function TabBar({ tab, setTab }: { tab: 'practice' | 'community'; setTab: (t: 'practice' | 'community') => void }) {
  return (
    <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 11, padding: 3, marginBottom: 4 }}>
      <button onClick={() => setTab('practice')} style={tabBtn(tab === 'practice')}><Trophy size={14} /> Practice</button>
      <button onClick={() => setTab('community')} style={tabBtn(tab === 'community')}><Users size={14} /> Community</button>
    </div>
  )
}
const tabBtn = (active: boolean): React.CSSProperties => ({ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 800, background: active ? '#fff' : 'transparent', color: active ? P : '#64748B', boxShadow: active ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' })

function ModeBtn({ active, onClick, color, children }: { active: boolean; onClick: () => void; color: string; children: React.ReactNode }) {
  return <button onClick={onClick} style={{ flex: 1, padding: '8px 0', borderRadius: 9, cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 800, border: `1.5px solid ${active ? color : '#E2E8F0'}`, background: active ? color + '15' : '#fff', color: active ? color : '#64748B' }}>{children}</button>
}

function Back({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, fontFamily: FONT }}><ChevronLeft size={15} /> {label}</button>
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }}>{label}</label>{children}</div>
}

function Empty({ icon, title, sub, onAdd, onAddLabel = 'Add' }: { icon: string; title: string; sub: string; onAdd?: () => void; onAddLabel?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 20px', borderRadius: 18, background: '#FAFAFF', border: '1.5px dashed #DDD6FE' }}>
      <div style={{ fontSize: 40, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748B', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.6 }}>{sub}</div>
      {onAdd && <button onClick={onAdd} style={{ ...primaryBtn(P) }}>{onAddLabel}</button>}
    </div>
  )
}
