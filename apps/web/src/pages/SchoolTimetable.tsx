import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, Trash2, CalendarPlus, Share2, Users, X, Copy, Check, Download, Info,
} from 'lucide-react'
import { useAuthStore } from '@/modules/identity'
import { usePlannerStore } from '@/store/plannerStore'
import {
  useTimetableStore, defaultTimetable, timetableToEvents, encodeTimetable, decodeTimetable,
  type Timetable, type Period, type SharedTimetable,
} from '@/store/timetableStore'

const FONT = "'Nunito', 'Inter', sans-serif"
const P = '#6C63FF'
const DAY_LABELS = ['', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const ALL_DAYS = [1, 2, 3, 4, 5, 6]
const FALLBACK_SUBJECTS = ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'Computer', 'EVS', 'Art', 'PE / Games', 'Music', 'Library', 'Moral Science']

const pid = () => `pd-${Math.random().toString(36).slice(2, 7)}`

export default function SchoolTimetable() {
  const { activeKidId, kids, adminName } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const stored = useTimetableStore(s => (kid ? s.byChild[kid.id] : undefined))
  const setStore = useTimetableStore(s => s._set)
  const community = useTimetableStore(s => s.community)
  const share = useTimetableStore(s => s._share)
  const events = usePlannerStore(s => s.events)
  const bulk = usePlannerStore(s => s._bulk)
  const removeMany = usePlannerStore(s => s._removeMany)

  const [tt, setTt] = useState<Timetable>(() => stored ?? defaultTimetable())
  const [msg, setMsg] = useState('')
  const [showShare, setShowShare] = useState(false)
  const [showGet, setShowGet] = useState(false)

  if (!kid) return <div style={{ padding: 40, textAlign: 'center', color: '#64748B', fontFamily: FONT }}>Pick a child to set up their school timetable.</div>

  const section = kid.onboarding?.section ?? ''
  const subjects = kid.onboarding?.subjects?.length ? kid.onboarding!.subjects : FALLBACK_SUBJECTS

  const flash = (t: string) => { setMsg(t); setTimeout(() => setMsg(''), 2500) }
  const update = (next: Timetable) => { setTt(next); setStore(kid.id, next) }

  const setCell = (periodId: string, day: number, subject: string) =>
    update({ ...tt, grid: { ...tt.grid, [periodId]: { ...(tt.grid[periodId] ?? {}), [day]: subject } } })
  const setPeriod = (id: string, patch: Partial<Period>) =>
    update({ ...tt, periods: tt.periods.map(p => p.id === id ? { ...p, ...patch } : p) })
  const addPeriod = (kind: Period['kind']) =>
    update({ ...tt, periods: [...tt.periods, { id: pid(), label: kind === 'break' ? 'Break' : `Period ${tt.periods.filter(p => p.kind === 'class').length + 1}`, start: '15:00', end: '15:45', kind }] })
  const removePeriod = (id: string) => {
    const grid = { ...tt.grid }; delete grid[id]
    update({ ...tt, periods: tt.periods.filter(p => p.id !== id), grid })
  }
  const toggleDay = (d: number) =>
    update({ ...tt, days: tt.days.includes(d) ? tt.days.filter(x => x !== d) : [...tt.days, d].sort() })

  const applyToPlanner = () => {
    const old = Object.values(events).filter(e => e.childId === kid.id && e.fromTimetable).map(e => e.id)
    removeMany(old)
    bulk(timetableToEvents(tt, kid.id))
    flash('✓ Timetable applied to your planner')
  }

  const importTimetable = (t: Timetable) => { update(t); flash('✓ Timetable copied — review and Apply to Planner') }

  return (
    <div style={{ fontFamily: FONT }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>School Timetable</h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>
            {kid.school || 'School'}{section ? ` · Section ${section}` : ''} · {kid.grade} · fill the grid by subject, then apply it to the planner.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button onClick={() => setShowGet(true)} style={ghostBtn}><Users size={14} /> Get from community</button>
          <button onClick={() => setShowShare(true)} style={ghostBtn}><Share2 size={14} /> Share</button>
          <button onClick={applyToPlanner} style={primaryBtn}><CalendarPlus size={15} /> Apply to Planner</button>
        </div>
      </div>

      {msg && <div style={{ fontSize: 12.5, fontWeight: 800, color: '#15803D', background: '#DCFCE7', borderRadius: 9, padding: '8px 12px', marginBottom: 10 }}>{msg}</div>}

      {/* Day toggles */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>School days:</span>
        {ALL_DAYS.map(d => (
          <button key={d} onClick={() => toggleDay(d)} style={{ width: 44, padding: '6px 0', borderRadius: 8, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 800, border: `1.5px solid ${tt.days.includes(d) ? P : '#E2E8F0'}`, background: tt.days.includes(d) ? '#EEF2FF' : '#fff', color: tt.days.includes(d) ? P : '#64748B' }}>{DAY_LABELS[d]}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ overflowX: 'auto', border: '1px solid #EEF0F5', borderRadius: 14, background: '#fff' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 520 }}>
          <thead>
            <tr style={{ background: '#FAFBFF' }}>
              <th style={{ ...th, minWidth: 150, textAlign: 'left' }}>Period / Time</th>
              {tt.days.map(d => <th key={d} style={th}>{DAY_LABELS[d]}</th>)}
              <th style={{ ...th, width: 34 }} />
            </tr>
          </thead>
          <tbody>
            {tt.periods.map(p => (
              <tr key={p.id} style={{ background: p.kind === 'break' ? '#FCFCFD' : '#fff' }}>
                <td style={{ ...td, textAlign: 'left' }}>
                  <input value={p.label} onChange={e => setPeriod(p.id, { label: e.target.value })}
                    style={{ ...miniInput, fontWeight: 800, width: '100%', marginBottom: 4 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                    <input type="time" value={p.start} onChange={e => setPeriod(p.id, { start: e.target.value })} style={{ ...miniInput, width: 78 }} />
                    <span style={{ color: '#CBD5E1' }}>–</span>
                    <input type="time" value={p.end} onChange={e => setPeriod(p.id, { end: e.target.value })} style={{ ...miniInput, width: 78 }} />
                  </div>
                </td>
                {tt.days.map(d => (
                  <td key={d} style={td}>
                    {p.kind === 'break'
                      ? <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 700 }}>{p.label}</span>
                      : (
                        <select value={tt.grid[p.id]?.[d] ?? ''} onChange={e => setCell(p.id, d, e.target.value)}
                          style={{ ...miniInput, cursor: 'pointer', width: '100%', minWidth: 96, background: tt.grid[p.id]?.[d] ? '#EEF2FF' : '#fff', color: tt.grid[p.id]?.[d] ? '#3730A3' : '#94A3B8', fontWeight: tt.grid[p.id]?.[d] ? 700 : 400 }}>
                          <option value="">— free —</option>
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      )}
                  </td>
                ))}
                <td style={{ ...td, width: 34 }}>
                  <button onClick={() => removePeriod(p.id)} title="Remove row" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}><Trash2 size={14} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <button onClick={() => addPeriod('class')} style={dashBtn}><Plus size={13} /> Add period</button>
        <button onClick={() => addPeriod('break')} style={dashBtn}><Plus size={13} /> Add break / lunch</button>
      </div>

      <div style={{ display: 'flex', gap: 7, alignItems: 'flex-start', marginTop: 14, padding: '10px 12px', borderRadius: 10, background: '#F0F9FF', border: '1px solid #BAE6FD' }}>
        <Info size={14} color="#0369A1" style={{ flexShrink: 0, marginTop: 1 }} />
        <span style={{ fontSize: 11.5, color: '#0C4A6E', lineHeight: 1.5 }}>
          Fill each period with the subject, hit <strong>Apply to Planner</strong> to drop the whole week into the calendar (repeats every week). Use <strong>Share</strong> to post it for {kid.school || 'your school'} {section ? `· Section ${section}` : ''} so other parents can copy it. Cross-parent sharing goes live with the cloud backend; for now use the <strong>share code</strong> (works anywhere).
        </span>
      </div>

      <AnimatePresence>
        {showShare && <ShareModal kid={kid} authorName={adminName} timetable={tt} section={section} onShare={share} onClose={() => setShowShare(false)} />}
        {showGet && <GetModal kid={kid} section={section} community={community} onImport={importTimetable} onClose={() => setShowGet(false)} />}
      </AnimatePresence>
    </div>
  )
}

// ── Share modal ───────────────────────────────────────────────────────────────
function ShareModal({ kid, authorName, timetable, section, onShare, onClose }: {
  kid: any; authorName: string; timetable: Timetable; section: string
  onShare: (s: SharedTimetable) => void; onClose: () => void
}) {
  const [note, setNote] = useState('')
  const [copied, setCopied] = useState(false)
  const [posted, setPosted] = useState(false)
  const meta = { school: kid.school ?? '', section, grade: kid.grade ?? '', board: kid.board ?? '', authorName: authorName || 'Parent', note }
  const code = encodeTimetable({ ...meta, timetable })

  const copy = () => { navigator.clipboard?.writeText(code).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500) }) }
  const post = () => {
    onShare({ id: `tt-${Date.now()}`, createdAt: Date.now(), ...meta, timetable })
    setPosted(true)
  }
  const whatsapp = () => {
    const text = `${kid.school || 'School'} ${section ? `Section ${section}` : ''} ${kid.grade} timetable — paste this code in Master-Kids → School Timetable → Get from community → Import code:\n\n${code}`
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Modal title="Share this timetable" onClose={onClose}>
      <p style={{ fontSize: 12.5, color: '#64748B', marginBottom: 12, lineHeight: 1.5 }}>
        Share with parents at <strong>{kid.school || 'your school'}{section ? ` · Section ${section}` : ''}</strong>. They import it and copy to their own child.
      </p>
      <label style={lbl}>Note (optional)</label>
      <input value={note} onChange={e => setNote(e.target.value)} placeholder="e.g. 2026–27 final timetable" style={{ ...input, marginBottom: 12 }} />

      <label style={lbl}>Share code</label>
      <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
        <textarea readOnly value={code} rows={3} style={{ ...input, resize: 'none', fontFamily: 'monospace', fontSize: 11 }} />
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <button onClick={copy} style={ghostBtn}>{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy code'}</button>
        <button onClick={whatsapp} style={ghostBtn}><Share2 size={14} /> Send on WhatsApp</button>
      </div>

      <button onClick={post} disabled={posted} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', opacity: posted ? 0.6 : 1 }}>
        {posted ? '✓ Posted to community' : 'Post to community'}
      </button>
      {posted && <p style={{ fontSize: 11.5, color: '#16A34A', fontWeight: 700, marginTop: 8, textAlign: 'center' }}>Visible to parents on this device now; cross-account with the cloud backend.</p>}
    </Modal>
  )
}

// ── Get-from-community modal ──────────────────────────────────────────────────
function GetModal({ kid, section, community, onImport, onClose }: {
  kid: any; section: string; community: SharedTimetable[]
  onImport: (t: Timetable) => void; onClose: () => void
}) {
  const [code, setCode] = useState('')
  const [err, setErr] = useState('')
  const norm = (s: string) => (s ?? '').trim().toLowerCase()
  const matches = community.filter(c => norm(c.school) === norm(kid.school) && (!section || norm(c.section) === norm(section)))
  const others = community.filter(c => !matches.includes(c))

  const importCode = () => {
    const d = decodeTimetable(code)
    if (!d) { setErr('That code is not valid. Paste the full share code.'); return }
    onImport(d.timetable); onClose()
  }

  const Card = ({ c }: { c: SharedTimetable }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 11, border: '1px solid #EEF0F5', background: '#fff' }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🗓️</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{c.school || 'School'}{c.section ? ` · ${c.section}` : ''} · {c.grade}</div>
        <div style={{ fontSize: 11, color: '#64748B' }}>by {c.authorName}{c.note ? ` · ${c.note}` : ''}</div>
      </div>
      <button onClick={() => { onImport(c.timetable); onClose() }} style={{ ...miniBtn }}>Copy</button>
    </div>
  )

  return (
    <Modal title="Get a timetable from the community" onClose={onClose}>
      {matches.length > 0 && (
        <>
          <div style={sectionLbl}>✅ Same school{section ? ' & section' : ''} as {kid.name}</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>{matches.map(c => <Card key={c.id} c={c} />)}</div>
        </>
      )}
      {others.length > 0 && (
        <>
          <div style={sectionLbl}>Other shared timetables</div>
          <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>{others.map(c => <Card key={c.id} c={c} />)}</div>
        </>
      )}
      {community.length === 0 && (
        <p style={{ fontSize: 12.5, color: '#64748B', marginBottom: 14, textAlign: 'center', padding: '8px 0' }}>
          No timetables shared yet on this device. Paste a share code below to import one.
        </p>
      )}

      <div style={sectionLbl}>Import a share code</div>
      <textarea value={code} onChange={e => { setCode(e.target.value); setErr('') }} rows={3} placeholder="Paste the share code a parent sent you…" style={{ ...input, resize: 'vertical', fontFamily: 'monospace', fontSize: 11 }} />
      {err && <div style={{ fontSize: 11.5, color: '#DC2626', fontWeight: 700, marginTop: 6 }}>{err}</div>}
      <button onClick={importCode} disabled={!code.trim()} style={{ ...primaryBtn, width: '100%', justifyContent: 'center', marginTop: 10, opacity: code.trim() ? 1 : 0.5 }}>
        <Download size={15} /> Import code
      </button>
    </Modal>
  )
}

// ── shared bits ───────────────────────────────────────────────────────────────
const th: React.CSSProperties = { padding: '8px 8px', fontSize: 11, fontWeight: 800, color: '#64748B', textAlign: 'center', borderBottom: '1px solid #EEF0F5' }
const td: React.CSSProperties = { padding: '6px 8px', borderBottom: '1px solid #F4F5F8', verticalAlign: 'top', textAlign: 'center' }
const miniInput: React.CSSProperties = { padding: '5px 7px', borderRadius: 7, border: '1.5px solid #E2E8F0', fontSize: 12, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const input: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const lbl: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#64748B', display: 'block', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.03em' }
const sectionLbl: React.CSSProperties = { fontSize: 12, fontWeight: 800, color: '#334155', margin: '4px 0 8px' }
const primaryBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }
const ghostBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', color: '#475569', cursor: 'pointer', fontSize: 12.5, fontWeight: 800, fontFamily: FONT }
const dashBtn: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, padding: '8px 13px', borderRadius: 9, border: '1.5px dashed #CBD5E1', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: FONT }
const miniBtn: React.CSSProperties = { padding: '7px 14px', borderRadius: 9, border: 'none', cursor: 'pointer', background: P, color: '#fff', fontSize: 12, fontWeight: 800, fontFamily: FONT }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
