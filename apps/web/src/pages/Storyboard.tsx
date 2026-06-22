import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Lock, Plus, Trophy, FileText, Award, Image as ImageIcon, StickyNote,
  Clock, LayoutGrid, ChevronLeft, X, Trash2, Pencil, Camera, RotateCw, Calendar,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useStoryboardStore, entriesFor, photoCountFor, PHOTO_CAP, type StoryKind, type StoryEntry } from '@/store/storyboardStore'
import { storyboardService, type NewEntry } from '@/services/storyboardService'
import { GRADE_LADDER, currentGradeIndex, tileState, nextUnlockLabel } from '@/lib/grades'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"

const KIND_META: Record<StoryKind, { label: string; icon: typeof Trophy; color: string; bg: string }> = {
  achievement: { label: 'Achievement', icon: Trophy,    color: '#D97706', bg: '#FEF3C7' },
  result:      { label: 'Result',      icon: FileText,   color: '#2563EB', bg: '#DBEAFE' },
  certificate: { label: 'Certificate', icon: Award,      color: '#7C3AED', bg: '#EDE9FE' },
  photo:       { label: 'Photo',       icon: ImageIcon,  color: '#DB2777', bg: '#FCE7F3' },
  note:        { label: 'Scribble',    icon: StickyNote, color: '#059669', bg: '#D1FAE5' },
}

const TILE_TINTS = ['#EEF2FF', '#FCE7F3', '#ECFDF5', '#FEF3C7', '#E0F2FE', '#F3E8FF', '#FFE4E6', '#ECFEFF']
const todayISO = () => new Date().toISOString().slice(0, 10)
const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })

export default function Storyboard() {
  const { activeKidId, kids } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const allEntries = useStoryboardStore(s => s.entries)
  const [openGrade, setOpenGrade] = useState<string | null>(null)
  const [view, setView] = useState<'timeline' | 'detail'>('timeline')
  const [adding, setAdding] = useState(false)

  if (!kid) return null
  const curIdx = currentGradeIndex(kid.grade)

  // ── Tile grid ───────────────────────────────────────────────────────────────
  if (!openGrade) {
    return (
      <div style={{ padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1100, margin: '0 auto' }}>
        <Header kid={kid} />
        <p style={{ fontSize: 14, color: '#64748B', margin: '4px 0 24px', lineHeight: 1.6 }}>
          A dedicated tile for every class from Nursery to Class 12. Capture achievements, results, certificates,
          photos and notes — one memory book that grows with {kid.name}.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(150px,1fr))', gap: 14 }}>
          {GRADE_LADDER.map((grade, i) => {
            const st = tileState(i, curIdx)
            const tint = TILE_TINTS[i % TILE_TINTS.length]
            const count = entriesFor(allEntries, kid.id, grade).length
            const locked = st !== 'unlocked'
            return (
              <motion.button
                key={grade}
                whileHover={locked ? undefined : { scale: 1.03, y: -2 }}
                whileTap={locked ? undefined : { scale: 0.98 }}
                onClick={() => !locked && (setOpenGrade(grade), setView('timeline'))}
                disabled={locked}
                style={{
                  position: 'relative', textAlign: 'left', cursor: locked ? 'not-allowed' : 'pointer',
                  padding: '16px 14px', borderRadius: 16, minHeight: 116,
                  background: locked ? '#F8FAFC' : tint,
                  border: `1.5px solid ${i === curIdx ? P : locked ? '#E2E8F0' : 'transparent'}`,
                  boxShadow: locked ? 'none' : '0 2px 12px rgba(15,23,42,0.06)',
                  opacity: st === 'locked' ? 0.55 : 1,
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                }}>
                {i === curIdx && (
                  <span style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 8, background: P, color: '#fff' }}>NOW</span>
                )}
                <div>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>{locked ? <Lock size={20} color="#94A3B8" /> : '📖'}</div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: '#0F172A' }}>{grade}</div>
                </div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>
                  {locked
                    ? (st === 'next' ? nextUnlockLabel() : 'Locked')
                    : `${count} ${count === 1 ? 'memory' : 'memories'}`}
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    )
  }

  // ── Tile detail ─────────────────────────────────────────────────────────────
  const entries = entriesFor(allEntries, kid.id, openGrade)
  const photoCount = photoCountFor(allEntries, kid.id, openGrade)

  return (
    <div style={{ padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1100, margin: '0 auto' }}>
      <button onClick={() => setOpenGrade(null)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
        <ChevronLeft size={15} /> All classes
      </button>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>{openGrade} · {kid.name}</h1>
          <div style={{ fontSize: 12.5, color: '#64748B', marginTop: 2 }}>{entries.length} {entries.length === 1 ? 'memory' : 'memories'} · {photoCount}/{PHOTO_CAP} photos</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ display: 'flex', background: '#F1F5F9', borderRadius: 10, padding: 3 }}>
            <ToggleBtn active={view === 'timeline'} onClick={() => setView('timeline')} icon={<Clock size={14} />} label="Timeline" />
            <ToggleBtn active={view === 'detail'} onClick={() => setView('detail')} icon={<LayoutGrid size={14} />} label="Detail" />
          </div>
          <button onClick={() => setAdding(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT, boxShadow: `0 4px 16px ${P}40` }}>
            <Plus size={15} /> Add memory
          </button>
        </div>
      </div>

      {entries.length === 0 ? (
        <EmptyState onAdd={() => setAdding(true)} />
      ) : view === 'timeline' ? (
        <Timeline entries={entries} />
      ) : (
        <DetailGrid entries={entries} />
      )}

      <AnimatePresence>
        {adding && (
          <AddModal grade={openGrade} childId={kid.id} photoCount={photoCount} onClose={() => setAdding(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Sub-components ──────────────────────────────────────────────────────────────
function Header({ kid }: { kid: { name: string; avatar: string; photoUrl?: string } }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, overflow: 'hidden', background: '#EEECFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
        {kid.photoUrl ? <img src={kid.photoUrl} alt={kid.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : kid.avatar}
      </div>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>{kid.name}'s Storyboard</h1>
    </div>
  )
}

function ToggleBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 12.5, fontWeight: 700, background: active ? '#fff' : 'transparent', color: active ? P : '#64748B', boxShadow: active ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>
      {icon} {label}
    </button>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ textAlign: 'center', padding: '56px 20px', borderRadius: 18, background: '#FAFAFF', border: '1.5px dashed #DDD6FE' }}>
      <div style={{ fontSize: 44, marginBottom: 10 }}>📖</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>This page is waiting for its first memory</div>
      <div style={{ fontSize: 13, color: '#64748B', marginBottom: 18 }}>Add an achievement, result, certificate, photo or scribble note.</div>
      <button onClick={onAdd} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
        <Plus size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> Add first memory
      </button>
    </div>
  )
}

function Timeline({ entries }: { entries: StoryEntry[] }) {
  return (
    <div style={{ position: 'relative', paddingLeft: 28 }}>
      <div style={{ position: 'absolute', left: 9, top: 6, bottom: 6, width: 2, background: 'linear-gradient(#DDD6FE,#F1F5F9)' }} />
      {entries.map((e, i) => {
        const meta = KIND_META[e.kind]
        const Icon = meta.icon
        return (
          <motion.div key={e.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
            style={{ position: 'relative', marginBottom: 18 }}>
            <div style={{ position: 'absolute', left: -28, top: 2, width: 20, height: 20, borderRadius: '50%', background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff', boxShadow: '0 0 0 1.5px ' + meta.color + '40' }}>
              <Icon size={11} color={meta.color} />
            </div>
            <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #EEF0F5', boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, fontWeight: 800, color: meta.color, background: meta.bg, padding: '2px 8px', borderRadius: 7 }}>{meta.label}</span>
                <Calendar size={11} color="#94A3B8" />
                <span style={{ fontSize: 11.5, color: '#94A3B8', fontWeight: 600 }}>{fmtDate(e.occurredOn)}</span>
              </div>
              {e.title && <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>{e.title}</div>}
              {e.body && <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.55 }}>{e.body}</div>}
              {e.mediaUrl && <img src={e.mediaUrl} alt={e.title} style={{ marginTop: 10, maxWidth: 200, borderRadius: 10, border: '1px solid #EEF0F5' }} />}
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

function DetailGrid({ entries }: { entries: StoryEntry[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
      {entries.map(e => (e.kind === 'photo' && e.mediaUrl)
        ? <Postcard key={e.id} entry={e} />
        : <EntryCard key={e.id} entry={e} />)}
    </div>
  )
}

// Photo postcard — click to flip and read/write the note on the back.
function Postcard({ entry }: { entry: StoryEntry }) {
  const [flipped, setFlipped] = useState(false)
  const [note, setNote] = useState(entry.postcardNote)
  const meta = KIND_META.photo

  const saveNote = () => {
    setFlipped(false)
    if (note !== entry.postcardNote) void storyboardService.update(entry.id, { postcardNote: note })
  }

  return (
    <div style={{ perspective: 1200, height: 240 }}>
      <motion.div
        animate={{ rotateY: flipped ? 180 : 0 }} transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
        style={{ position: 'relative', width: '100%', height: '100%', transformStyle: 'preserve-3d' }}>
        {/* Front — the photo */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', borderRadius: 14, overflow: 'hidden', boxShadow: '0 4px 18px rgba(15,23,42,0.12)', background: '#000' }}>
          <img src={entry.mediaUrl} alt={entry.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '24px 12px 10px', background: 'linear-gradient(transparent,rgba(0,0,0,0.7))' }}>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{entry.title || 'Photo'}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.8)' }}>{fmtDate(entry.occurredOn)}</div>
          </div>
          <button onClick={() => setFlipped(true)}
            style={{ position: 'absolute', top: 8, right: 8, width: 30, height: 30, borderRadius: 9, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.9)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: meta.color }} title="Flip to write a note">
            <RotateCw size={15} />
          </button>
          <DeleteBtn id={entry.id} dark />
        </div>
        {/* Back — the note */}
        <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: 14, background: '#FFFDF5', border: '1px solid #FDE68A', boxShadow: '0 4px 18px rgba(15,23,42,0.12)', padding: 14, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>✍️ Note on the back</div>
          <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Write a memory about this photo…"
            style={{ flex: 1, resize: 'none', border: 'none', outline: 'none', background: 'transparent', fontFamily: FONT, fontSize: 13, color: '#451A03', lineHeight: 1.5 }} />
          <button onClick={saveNote}
            style={{ marginTop: 8, padding: '7px 0', borderRadius: 9, border: 'none', cursor: 'pointer', background: '#F59E0B', color: '#fff', fontSize: 12, fontWeight: 800, fontFamily: FONT }}>
            Save & flip back
          </button>
        </div>
      </motion.div>
    </div>
  )
}

function EntryCard({ entry }: { entry: StoryEntry }) {
  const meta = KIND_META[entry.kind]
  const Icon = meta.icon
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(entry.title)
  const [body, setBody] = useState(entry.body)
  const [occurredOn, setOccurredOn] = useState(entry.occurredOn)

  const save = () => { setEditing(false); void storyboardService.update(entry.id, { title, body, occurredOn }) }

  return (
    <div style={{ position: 'relative', borderRadius: 14, background: '#fff', border: '1px solid #EEF0F5', boxShadow: '0 1px 8px rgba(15,23,42,0.04)', padding: 14, minHeight: 150, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: meta.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={15} color={meta.color} /></div>
        <span style={{ fontSize: 10, fontWeight: 800, color: meta.color }}>{meta.label}</span>
        <span style={{ marginLeft: 'auto', fontSize: 10.5, color: '#94A3B8', fontWeight: 600 }}>{fmtDate(entry.occurredOn)}</span>
      </div>
      {entry.mediaUrl && <img src={entry.mediaUrl} alt={entry.title} style={{ width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 8 }} />}
      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title"
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 13, fontFamily: FONT, fontWeight: 700, outline: 'none' }} />
          <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Description / note" rows={2}
            style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12.5, fontFamily: FONT, outline: 'none', resize: 'vertical' }} />
          <input type="date" value={occurredOn} onChange={e => setOccurredOn(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, fontFamily: FONT, outline: 'none' }} />
          <button onClick={save} style={{ marginTop: 'auto', padding: '7px 0', borderRadius: 8, border: 'none', cursor: 'pointer', background: P, color: '#fff', fontSize: 12, fontWeight: 800, fontFamily: FONT }}>Save</button>
        </div>
      ) : (
        <>
          {entry.title && <div style={{ fontSize: 14.5, fontWeight: 800, color: '#0F172A', marginBottom: 3 }}>{entry.title}</div>}
          {entry.body && <div style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, flex: 1 }}>{entry.body}</div>}
          <button onClick={() => setEditing(true)}
            style={{ marginTop: 10, alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 11.5, fontWeight: 700, color: '#64748B', fontFamily: FONT }}>
            <Pencil size={12} /> Edit
          </button>
        </>
      )}
      <DeleteBtn id={entry.id} />
    </div>
  )
}

function DeleteBtn({ id, dark }: { id: string; dark?: boolean }) {
  const [confirm, setConfirm] = useState(false)
  return confirm ? (
    <div style={{ position: 'absolute', top: 8, right: dark ? 44 : 8, display: 'flex', gap: 4 }}>
      <button onClick={() => storyboardService.remove(id)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700, fontFamily: FONT }}>Delete</button>
      <button onClick={() => setConfirm(false)} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 6, background: dark ? 'rgba(255,255,255,0.9)' : '#F1F5F9', color: '#64748B', border: 'none', cursor: 'pointer', fontFamily: FONT }}>Cancel</button>
    </div>
  ) : (
    <button onClick={(e) => { e.stopPropagation(); setConfirm(true) }} title="Delete"
      style={{ position: 'absolute', top: dark ? 8 : 10, right: dark ? 44 : 10, width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: dark ? 'rgba(255,255,255,0.9)' : 'transparent', color: dark ? '#DC2626' : '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Trash2 size={13} />
    </button>
  )
}

// ── Add memory modal ─────────────────────────────────────────────────────────
function AddModal({ grade, childId, photoCount, onClose }: { grade: string; childId: string; photoCount: number; onClose: () => void }) {
  const [kind, setKind] = useState<StoryKind>('achievement')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [postcardNote, setPostcardNote] = useState('')
  const [occurredOn, setOccurredOn] = useState(todayISO())
  const [mediaUrl, setMediaUrl] = useState<string | undefined>()
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const wantsMedia = kind === 'photo' || kind === 'certificate' || kind === 'result'
  const photoFull = kind === 'photo' && photoCount >= PHOTO_CAP

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => setMediaUrl(r.result as string); r.readAsDataURL(f)
  }

  const save = async () => {
    setErr('')
    if (kind === 'photo' && !mediaUrl) { setErr('Please choose a photo.'); return }
    if (!title.trim() && !body.trim() && !mediaUrl) { setErr('Add a title, note, or image.'); return }
    setSaving(true)
    try {
      const entry: NewEntry = { childId, grade, kind, title: title.trim(), body: body.trim(), postcardNote: postcardNote.trim(), mediaUrl, occurredOn }
      await storyboardService.add(entry)
      onClose()
    } catch (e) { setErr(e instanceof Error ? e.message : 'Could not save.'); setSaving(false) }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 460, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Add to {grade}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>

        {/* Kind picker */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {(Object.keys(KIND_META) as StoryKind[]).map(k => {
            const m = KIND_META[k]; const Icon = m.icon; const active = kind === k
            return (
              <button key={k} onClick={() => setKind(k)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 11px', borderRadius: 9, cursor: 'pointer', fontFamily: FONT, fontSize: 12, fontWeight: 700, border: `1.5px solid ${active ? m.color : '#E2E8F0'}`, background: active ? m.bg : '#fff', color: active ? m.color : '#64748B' }}>
                <Icon size={13} /> {m.label}
              </button>
            )
          })}
        </div>

        {photoFull && <div style={{ padding: '8px 12px', borderRadius: 9, background: '#FEF2F2', color: '#B91C1C', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>Photo limit reached ({PHOTO_CAP}/{PHOTO_CAP}) for {grade}.</div>}

        {wantsMedia && (
          <div style={{ marginBottom: 14 }}>
            <div onClick={() => !photoFull && fileRef.current?.click()}
              style={{ borderRadius: 12, border: '2px dashed #DDD6FE', background: '#FAFAFF', minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: photoFull ? 'not-allowed' : 'pointer', overflow: 'hidden' }}>
              {mediaUrl
                ? <img src={mediaUrl} alt="upload" style={{ width: '100%', maxHeight: 200, objectFit: 'contain' }} />
                : <div style={{ textAlign: 'center', color: '#94A3B8' }}><Camera size={26} /><div style={{ fontSize: 12, marginTop: 6, fontWeight: 700 }}>Tap to upload {kind === 'photo' ? 'a photo' : 'an image / scan'}</div></div>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          </div>
        )}

        <Field label="Title">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder={kind === 'note' ? 'A short heading (optional)' : 'e.g. Won 100m freestyle'}
            style={inputStyle} />
        </Field>
        <Field label={kind === 'note' ? 'Scribble note' : 'Description'}>
          <textarea value={body} onChange={e => setBody(e.target.value)} rows={3} placeholder="Write the details…" style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
        {kind === 'photo' && (
          <Field label="Postcard note (shown when the photo flips)">
            <textarea value={postcardNote} onChange={e => setPostcardNote(e.target.value)} rows={2} placeholder="A memory to write on the back…" style={{ ...inputStyle, resize: 'vertical' }} />
          </Field>
        )}
        <Field label="Date">
          <input type="date" value={occurredOn} onChange={e => setOccurredOn(e.target.value)} style={inputStyle} />
        </Field>

        {err && <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, marginBottom: 10 }}>{err}</div>}

        <button onClick={save} disabled={saving || photoFull}
          style={{ width: '100%', padding: '12px 0', borderRadius: 11, border: 'none', cursor: saving || photoFull ? 'not-allowed' : 'pointer', background: photoFull ? '#E2E8F0' : `linear-gradient(135deg,${P},#9B59FF)`, color: photoFull ? '#94A3B8' : '#fff', fontSize: 14, fontWeight: 800, fontFamily: FONT }}>
          {saving ? 'Saving…' : 'Save memory'}
        </button>
      </motion.div>
    </motion.div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0',
  fontSize: 13.5, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 5 }}>{label}</label>
      {children}
    </div>
  )
}
