import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Eye, Check, X, RefreshCw } from 'lucide-react'
import { useAuthStore } from '@/modules/identity'
import { useKnowledgeStore, solvedSet } from '@/store/knowledgeStore'
import { knowledgeService } from '@/services/knowledgeService'
import {
  CATEGORIES, CATEGORY_META, itemsForGrade, countForGrade,
  type KType, type KLevel, type KItem,
} from '@/data/knowledgeCatalog'
import { GRADE_LADDER, currentGradeIndex } from '@/lib/grades'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"
const LEVELS: KLevel[] = ['beginner', 'intermediate', 'advanced']
const LEVEL_LABEL: Record<KLevel, string> = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' }

export default function Knowledge() {
  const { activeKidId, kids } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const solved = useKnowledgeStore(s => s.solved)

  const [open, setOpen] = useState<KType | null>(null)
  const [quiz, setQuiz] = useState<KItem | null>(null)
  const [sudoku, setSudoku] = useState<KItem | null>(null)

  if (!kid) return null
  const grade = GRADE_LADDER[currentGradeIndex(kid.grade)]
  const mySolved = solvedSet(solved, kid.id)
  const meta = open ? CATEGORY_META[open] : null

  // ── Category grid ───────────────────────────────────────────────────────────
  if (!open) {
    return (
      <div style={wrap}>
        <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Fun & Knowledge</h1>
        <p style={{ fontSize: 13.5, color: '#64748B', margin: '4px 0 20px', maxWidth: 540, lineHeight: 1.6 }}>
          Games and brain-food picked for <strong>{grade}</strong> — beginner to advanced, never beyond {kid.name}'s level.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 14 }}>
          {CATEGORIES.map(c => {
            const count = countForGrade(grade, c.type)
            return (
              <motion.button key={c.type} whileHover={{ scale: 1.03, y: -2 }} whileTap={{ scale: 0.98 }} onClick={() => setOpen(c.type)}
                style={{ textAlign: 'left', cursor: 'pointer', padding: '18px 16px', borderRadius: 16, background: c.colorLight, border: '1.5px solid transparent', minHeight: 116, fontFamily: FONT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div style={{ fontSize: 30 }}>{c.icon}</div>
                <div>
                  <div style={{ fontSize: 15.5, fontWeight: 900, color: '#0F172A' }}>{c.label}</div>
                  <div style={{ fontSize: 11.5, color: c.color, fontWeight: 700, marginTop: 2 }}>{count} {count === 1 ? 'item' : 'items'} →</div>
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Category detail ─────────────────────────────────────────────────────────
  const items = itemsForGrade(grade, open)
  const wordPower = open === 'word_power'
  const todaysWords = wordPower ? pickToday(items, 5) : []
  const todayIds = new Set(todaysWords.map(i => i.id))

  return (
    <div style={wrap}>
      <button onClick={() => setOpen(null)} style={backBtn}><ChevronLeft size={15} /> All categories</button>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
        <div style={{ width: 46, height: 46, borderRadius: 13, background: meta!.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{meta!.icon}</div>
        <div>
          <h1 style={{ fontSize: 23, fontWeight: 900, color: '#0F172A' }}>{meta!.label}</h1>
          <div style={{ fontSize: 12.5, color: '#64748B' }}>{items.length} for {grade} · {items.filter(i => mySolved.has(i.id)).length} done</div>
        </div>
      </div>

      {items.length === 0 ? (
        <Empty label={meta!.label} />
      ) : wordPower ? (
        <>
          <Section title="✨ Today's 5 words">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
              {todaysWords.map(i => <WordCard key={i.id} item={i} childId={kid.id} solved={mySolved.has(i.id)} highlight />)}
            </div>
          </Section>
          <Section title="More words">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 12 }}>
              {items.filter(i => !todayIds.has(i.id)).map(i => <WordCard key={i.id} item={i} childId={kid.id} solved={mySolved.has(i.id)} />)}
            </div>
          </Section>
        </>
      ) : (
        LEVELS.filter(l => items.some(i => i.level === l)).map(level => (
          <Section key={level} title={LEVEL_LABEL[level]} pill={meta!.color}>
            <div style={{ display: 'grid', gridTemplateColumns: open === 'quiz' || open === 'sudoku' ? 'repeat(auto-fill,minmax(240px,1fr))' : 'repeat(auto-fill,minmax(280px,1fr))', gap: 12 }}>
              {items.filter(i => i.level === level).map(i => {
                const done = mySolved.has(i.id)
                if (i.type === 'quiz') return <LaunchCard key={i.id} title={i.title ?? 'Quiz'} sub={`${i.questions?.length ?? 0} questions`} icon="❓" color={meta!.color} done={done} onClick={() => setQuiz(i)} />
                if (i.type === 'sudoku') return <LaunchCard key={i.id} title={i.title ?? 'Sudoku'} sub="4×4 grid" icon="🔢" color={meta!.color} done={done} onClick={() => setSudoku(i)} />
                if (i.type === 'tongue_twister') return <TongueCard key={i.id} item={i} childId={kid.id} done={done} />
                return <RevealCard key={i.id} item={i} childId={kid.id} done={done} color={meta!.color} />
              })}
            </div>
          </Section>
        ))
      )}

      <AnimatePresence>
        {quiz && <QuizModal item={quiz} childId={kid.id} onClose={() => setQuiz(null)} />}
        {sudoku && <SudokuModal item={sudoku} childId={kid.id} onClose={() => setSudoku(null)} />}
      </AnimatePresence>
    </div>
  )
}

// pick N deterministically by date so "today's words" are stable for the day
function pickToday(items: KItem[], n: number): KItem[] {
  if (items.length <= n) return items
  const day = Math.floor(Date.now() / 86400000)
  const start = (day * 7) % items.length
  return Array.from({ length: n }, (_, k) => items[(start + k) % items.length])
}

// ── Cards ────────────────────────────────────────────────────────────────────
function RevealCard({ item, childId, done, color }: { item: KItem; childId: string; done: boolean; color: string }) {
  const [show, setShow] = useState(false)
  const reveal = () => { setShow(true); if (!done) void knowledgeService.markSolved(childId, item.id) }
  const label = item.type === 'capital' ? 'Capital of' : item.type === 'idiom' ? 'Idiom' : item.type === 'proverb' ? 'Proverb' : item.type === 'puzzle' ? 'Puzzle' : 'Riddle'
  return (
    <div style={{ ...card, borderColor: show ? color + '55' : '#EEF0F5' }}>
      <div style={{ fontSize: 10, fontWeight: 800, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', lineHeight: 1.5, flex: 1 }}>{item.prompt}</div>
      <AnimatePresence>
        {show && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
          <div style={{ marginTop: 10, padding: '10px 12px', borderRadius: 10, background: color + '12', fontSize: 13.5, color: '#1F2937', lineHeight: 1.5 }}><strong style={{ color }}>Answer: </strong>{item.answer}</div>
        </motion.div>}
      </AnimatePresence>
      {!show && <button onClick={reveal} style={{ ...revealBtn, color, borderColor: color + '55', marginTop: 12 }}><Eye size={14} /> Reveal answer</button>}
      {show && done && <div style={{ marginTop: 10, fontSize: 11.5, color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={13} /> Solved</div>}
    </div>
  )
}

function WordCard({ item, childId, solved, highlight }: { item: KItem; childId: string; solved: boolean; highlight?: boolean }) {
  return (
    <div style={{ ...card, background: highlight ? '#ECFDF5' : '#fff', borderColor: highlight ? '#A7F3D0' : '#EEF0F5' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 18, fontWeight: 900, color: '#065F46' }}>{item.word}</span>
        {solved && <Check size={15} color="#16A34A" />}
      </div>
      <div style={{ fontSize: 13, color: '#1F2937', marginTop: 6 }}><strong>Meaning:</strong> {item.meaning}</div>
      <div style={{ fontSize: 12.5, color: '#64748B', fontStyle: 'italic', marginTop: 4 }}>“{item.example}”</div>
      {!solved && <button onClick={() => knowledgeService.markSolved(childId, item.id)} style={{ ...revealBtn, color: '#059669', borderColor: '#A7F3D0', marginTop: 10 }}><Check size={13} /> Got it</button>}
    </div>
  )
}

function TongueCard({ item, childId, done }: { item: KItem; childId: string; done: boolean }) {
  return (
    <div style={{ ...card }}>
      <div style={{ fontSize: 26, marginBottom: 6 }}>👅</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', lineHeight: 1.5, flex: 1 }}>{item.text}</div>
      <button onClick={() => knowledgeService.markSolved(childId, item.id)} style={{ ...revealBtn, color: '#DC2626', borderColor: '#FECACA', marginTop: 12 }}>{done ? <><Check size={13} /> Said it 3×!</> : 'Say it 3× fast →'}</button>
    </div>
  )
}

function LaunchCard({ title, sub, icon, color, done, onClick }: { title: string; sub: string; icon: string; color: string; done: boolean; onClick: () => void }) {
  return (
    <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }} onClick={onClick}
      style={{ ...card, cursor: 'pointer', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><span style={{ fontSize: 28 }}>{icon}</span>{done && <Check size={16} color="#16A34A" />}</div>
      <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginTop: 8 }}>{title}</div>
      <div style={{ fontSize: 12, color: '#64748B' }}>{sub}</div>
      <div style={{ marginTop: 10, fontSize: 12.5, fontWeight: 800, color, display: 'flex', alignItems: 'center', gap: 4 }}>Play <ChevronRight size={14} /></div>
    </motion.button>
  )
}

// ── Quiz modal ───────────────────────────────────────────────────────────────
function QuizModal({ item, childId, onClose }: { item: KItem; childId: string; onClose: () => void }) {
  const qs = item.questions ?? []
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [submitted, setSubmitted] = useState(false)
  const score = Math.round((qs.filter((q, i) => answers[i] === q.answerIndex).length / qs.length) * 100)
  const submit = () => { setSubmitted(true); void knowledgeService.recordQuiz(childId, item.id, score) }
  return (
    <Modal title={item.title ?? 'Quiz'} onClose={onClose}>
      {submitted ? (
        <div style={{ textAlign: 'center', padding: '16px 0' }}>
          <div style={{ fontSize: 46, fontWeight: 900, color: score >= 60 ? '#16A34A' : '#D97706' }}>{score}%</div>
          <div style={{ fontSize: 14, color: '#475569', margin: '8px 0 18px' }}>{score >= 60 ? 'Brilliant! 🎉' : 'Nice try — review and go again!'}</div>
          <button onClick={onClose} style={primaryBtn}>Done</button>
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gap: 14, marginBottom: 14 }}>
            {qs.map((q, i) => (
              <div key={i}>
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A', marginBottom: 8 }}>Q{i + 1}. {q.q}</div>
                <div style={{ display: 'grid', gap: 6 }}>
                  {q.options.map((opt, oi) => {
                    const sel = answers[i] === oi
                    return <button key={oi} onClick={() => setAnswers(a => ({ ...a, [i]: oi }))} style={{ textAlign: 'left', padding: '9px 12px', borderRadius: 9, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 600, border: `1.5px solid ${sel ? P : '#E2E8F0'}`, background: sel ? '#EEECFF' : '#fff', color: '#0F172A' }}>{opt}</button>
                  })}
                </div>
              </div>
            ))}
          </div>
          <button onClick={submit} disabled={Object.keys(answers).length < qs.length} style={{ ...primaryBtn, width: '100%', opacity: Object.keys(answers).length < qs.length ? 0.5 : 1 }}>Submit</button>
        </>
      )}
    </Modal>
  )
}

// ── Sudoku modal (4×4) ────────────────────────────────────────────────────────
function SudokuModal({ item, childId, onClose }: { item: KItem; childId: string; onClose: () => void }) {
  const puzzle = item.sudoku!.puzzle
  const solution = item.sudoku!.solution
  const [grid, setGrid] = useState<number[][]>(puzzle.map(r => [...r]))
  const [msg, setMsg] = useState('')
  const fixed = (r: number, c: number) => puzzle[r][c] !== 0
  const set = (r: number, c: number, v: string) => {
    const num = parseInt(v) || 0
    if (num < 0 || num > 4) return
    setGrid(g => g.map((row, ri) => row.map((cell, ci) => ri === r && ci === c ? num : cell))); setMsg('')
  }
  const check = () => {
    const ok = grid.every((row, r) => row.every((v, c) => v === solution[r][c]))
    if (ok) { setMsg('🎉 Solved!'); void knowledgeService.markSolved(childId, item.id) }
    else setMsg('Not quite — keep trying!')
  }
  const reset = () => { setGrid(puzzle.map(r => [...r])); setMsg('') }
  return (
    <Modal title={item.title ?? 'Sudoku'} onClose={onClose}>
      <div style={{ fontSize: 12.5, color: '#64748B', marginBottom: 14, textAlign: 'center' }}>Fill 1–4 so each row, column and 2×2 box has all four.</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 56px)', gap: 3, justifyContent: 'center', marginBottom: 16 }}>
        {grid.map((row, r) => row.map((v, c) => (
          <input key={`${r}-${c}`} value={v || ''} onChange={e => set(r, c, e.target.value)} readOnly={fixed(r, c)} inputMode="numeric" maxLength={1}
            style={{ width: 56, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 900, fontFamily: FONT, borderRadius: 8, outline: 'none', color: fixed(r, c) ? '#0F172A' : P, background: fixed(r, c) ? '#F1F5F9' : '#fff', border: `2px solid ${(c === 1 || r === 1) ? '#CBD5E1' : '#E2E8F0'}`, borderRightWidth: c === 1 ? 3 : 2, borderBottomWidth: r === 1 ? 3 : 2 }} />
        )))}
      </div>
      {msg && <div style={{ textAlign: 'center', fontSize: 14, fontWeight: 800, color: msg.includes('Solved') ? '#16A34A' : '#D97706', marginBottom: 12 }}>{msg}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={reset} style={{ ...primaryBtn, flex: 1, justifyContent: 'center', background: '#fff', color: '#64748B', border: '1.5px solid #E2E8F0' }}><RefreshCw size={14} /> Reset</button>
        <button onClick={check} style={{ ...primaryBtn, flex: 2, justifyContent: 'center' }}><Check size={15} /> Check</button>
      </div>
    </Modal>
  )
}

// ── bits ─────────────────────────────────────────────────────────────────────
const wrap: React.CSSProperties = { padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }
const card: React.CSSProperties = { background: '#fff', borderRadius: 14, border: '1px solid #EEF0F5', padding: 16, boxShadow: '0 1px 8px rgba(15,23,42,0.04)', display: 'flex', flexDirection: 'column', minHeight: 120 }
const revealBtn: React.CSSProperties = { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, border: '1.5px solid', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 800, fontFamily: FONT }
const backBtn: React.CSSProperties = { background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, fontFamily: FONT }
const primaryBtn: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }

function Section({ title, pill, children }: { title: string; pill?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{title}</h2>
        {pill && <span style={{ width: 8, height: 8, borderRadius: '50%', background: pill }} />}
      </div>
      {children}
    </div>
  )
}

function Empty({ label }: { label: string }) {
  return <div style={{ textAlign: 'center', padding: '48px 20px', borderRadius: 18, background: '#FAFAFF', border: '1.5px dashed #DDD6FE' }}>
    <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>No {label.toLowerCase()} for this class yet</div>
    <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>More content is added regularly.</div>
  </div>
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
