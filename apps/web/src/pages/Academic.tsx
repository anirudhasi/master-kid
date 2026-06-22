import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus, X, ChevronLeft, ChevronRight, BookOpen, HelpCircle, Compass,
  Trash2, Printer, ChevronDown, Upload, Paperclip, FileUp,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useAcademicStore, childGradeKey } from '@/store/academicStore'
import { useAcademicContentStore, contentKey } from '@/store/academicContentStore'
import { academicService } from '@/services/academicService'
import {
  ADDABLE_SUBJECTS, SUBJECT_META, subjectContent, catalogForGrade,
  type Lesson, type QA, type Material,
} from '@/data/academicCatalog'
import { GRADE_LADDER, currentGradeIndex } from '@/lib/grades'

type SubjectMeta = { key: string; name: string; icon: string; color: string; colorLight: string }

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"

export default function Academic() {
  const { activeKidId, kids } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const gradeTile = kid ? GRADE_LADDER[currentGradeIndex(kid.grade)] : 'Class 4'
  const selectedKeys = useAcademicStore(s => (kid ? s.selected[childGradeKey(kid.id, gradeTile)] ?? [] : []))

  const customMap = useAcademicContentStore(s => s.custom)

  const [openSubject, setOpenSubject] = useState<string | null>(null)
  const [openLesson, setOpenLesson] = useState<string | null>(null)
  const [picking, setPicking] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [reader, setReader] = useState<{ subject: string; lesson: Lesson } | null>(null)

  useEffect(() => { if (kid) void academicService.getSubjects(kid.id, gradeTile) }, [kid?.id, gradeTile])

  if (!kid) return null

  // Merge seeded sample lessons (badged) with parent-uploaded lessons.
  const lessonsFor = (subjectKey: string): Lesson[] => [
    ...(subjectContent(gradeTile, subjectKey)?.lessons ?? []).map(l => ({ ...l, source: 'sample' as const })),
    ...(customMap[contentKey(gradeTile, subjectKey)] ?? []),
  ]

  // Subjects available to add (not yet chosen). Seeded content auto-suggested first.
  const seededKeys = catalogForGrade(gradeTile).map(s => s.key)
  const addable = ADDABLE_SUBJECTS.filter(s => !selectedKeys.includes(s.key))
    .sort((a, b) => Number(seededKeys.includes(b.key)) - Number(seededKeys.includes(a.key)))

  const add = (key: string) => { void academicService.addSubject(kid.id, gradeTile, key); setPicking(false) }
  const remove = (key: string) => { void academicService.removeSubject(kid.id, gradeTile, key); if (openSubject === key) setOpenSubject(null) }

  // ── Lesson detail ─────────────────────────────────────────────────────────
  if (openSubject && openLesson) {
    const meta = SUBJECT_META[openSubject]
    const lesson = lessonsFor(openSubject).find(l => l.id === openLesson)
    if (lesson && meta) {
      return (
        <>
          <LessonDetail subject={meta} lesson={lesson}
            onBack={() => setOpenLesson(null)}
            onRead={() => setReader({ subject: meta.name, lesson })} />
          <AnimatePresence>
            {reader && <BookReader subjectName={reader.subject} lesson={reader.lesson} onClose={() => setReader(null)} />}
          </AnimatePresence>
        </>
      )
    }
  }

  // ── Lessons list for a subject ──────────────────────────────────────────────
  if (openSubject) {
    const meta = SUBJECT_META[openSubject]
    const lessons = lessonsFor(openSubject)
    return (
      <div style={wrap}>
        <Back onClick={() => setOpenSubject(null)} label="All subjects" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 46, height: 46, borderRadius: 13, background: meta.colorLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{meta.icon}</div>
            <div>
              <h1 style={{ fontSize: 23, fontWeight: 900, color: '#0F172A' }}>{meta.name}</h1>
              <div style={{ fontSize: 12.5, color: '#64748B' }}>{gradeTile} · {lessons.length} {lessons.length === 1 ? 'lesson' : 'lessons'}</div>
            </div>
          </div>
          <button onClick={() => setUploading(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: `1.5px solid ${meta.color}`, cursor: 'pointer', background: meta.colorLight, color: meta.color, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
            <Upload size={15} /> Add lesson / upload
          </button>
        </div>

        {lessons.length === 0 && (
          <Empty icon="📚" title="No lessons here yet"
            sub={`Add the first ${meta.name} lesson for ${gradeTile} — solved Q&A plus any worksheets or notes you upload.`}
            onAddLabel="Add / upload lesson" onAdd={() => setUploading(true)} />
        )}

        {lessons.length > 0 && (
          <div style={{ display: 'grid', gap: 12 }}>
            {lessons.map((l, i) => (
              <div key={l.id} style={{ position: 'relative' }}>
                <motion.button initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  onClick={() => setOpenLesson(l.id)} whileHover={{ x: 3 }}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '16px 18px', borderRadius: 14, background: '#fff', border: '1px solid #EEF0F5', boxShadow: '0 1px 8px rgba(15,23,42,0.04)', display: 'flex', alignItems: 'center', gap: 14, fontFamily: FONT }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: meta.colorLight, color: meta.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 14, flexShrink: 0 }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{l.title}</span>
                      <span style={{ fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 7, background: l.source === 'custom' ? '#E0E7FF' : '#F1F5F9', color: l.source === 'custom' ? '#4338CA' : '#94A3B8' }}>{l.source === 'custom' ? 'Your upload' : 'Sample'}</span>
                    </div>
                    {l.summary && <div style={{ fontSize: 12.5, color: '#64748B', lineHeight: 1.5, marginTop: 2 }}>{l.summary}</div>}
                    <div style={{ display: 'flex', gap: 10, marginTop: 7, flexWrap: 'wrap' }}>
                      <Tag icon={<HelpCircle size={11} />} text={`${l.qa.length} solved Q&A`} />
                      {l.pages.length > 0 && <Tag icon={<BookOpen size={11} />} text={`${l.pages.length}-page book`} />}
                      {l.materials && l.materials.length > 0 && <Tag icon={<Paperclip size={11} />} text={`${l.materials.length} material${l.materials.length > 1 ? 's' : ''}`} />}
                    </div>
                  </div>
                  <ChevronRight size={16} color="#CBD5E1" />
                </motion.button>
                {l.source === 'custom' && (
                  <button onClick={() => academicService.removeLesson(gradeTile, openSubject, l.id)} title="Delete lesson"
                    style={{ position: 'absolute', top: 10, right: 40, width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'transparent', color: '#CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {uploading && (
            <AddLessonModal subjectName={meta.name}
              onClose={() => setUploading(false)}
              onSave={(lesson) => { void academicService.addLesson(gradeTile, openSubject, lesson); setUploading(false) }} />
          )}
        </AnimatePresence>
      </div>
    )
  }

  // ── Subject manager (home) ──────────────────────────────────────────────────
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Academics</h1>
          <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 4, maxWidth: 520, lineHeight: 1.6 }}>
            {kid.name}'s subjects for <strong>{gradeTile}</strong>. Open a subject for its lessons, solved Q&A,
            a digital flip-book you can print, and further-study suggestions.
          </p>
        </div>
        <button onClick={() => setPicking(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT, boxShadow: `0 4px 16px ${P}40` }}>
          <Plus size={15} /> Add subject
        </button>
      </div>

      {selectedKeys.length === 0 ? (
        <Empty icon="📘" title="No subjects added yet" sub="Add subjects for this class to unlock the lesson repository and digital books." onAdd={() => setPicking(true)} />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 14, marginTop: 18 }}>
          {selectedKeys.map(key => {
            const meta = SUBJECT_META[key]
            if (!meta) return null
            const lessons = subjectContent(gradeTile, key)?.lessons.length ?? 0
            return (
              <div key={key} style={{ position: 'relative' }}>
                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setOpenSubject(key)}
                  style={{ width: '100%', textAlign: 'left', cursor: 'pointer', padding: '18px 16px', borderRadius: 16, background: meta.colorLight, border: '1.5px solid transparent', minHeight: 120, fontFamily: FONT, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 30 }}>{meta.icon}</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{meta.name}</div>
                    <div style={{ fontSize: 11.5, color: meta.color, fontWeight: 700, marginTop: 2 }}>
                      {lessons > 0 ? `${lessons} ${lessons === 1 ? 'lesson' : 'lessons'} →` : 'Tracking active →'}
                    </div>
                  </div>
                </motion.button>
                <button onClick={() => remove(key)} title="Remove subject"
                  style={{ position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.7)', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Trash2 size={13} />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {picking && (
          <Modal onClose={() => setPicking(false)} title={`Add a subject for ${gradeTile}`}>
            {addable.length === 0 ? (
              <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: 16 }}>All subjects added.</div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {addable.map(s => {
                  const hasContent = seededKeys.includes(s.key)
                  return (
                    <button key={s.key} onClick={() => add(s.key)}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px', borderRadius: 11, cursor: 'pointer', border: '1.5px solid #E2E8F0', background: '#fff', fontFamily: FONT, textAlign: 'left' }}>
                      <span style={{ fontSize: 22 }}>{s.icon}</span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{s.name}</span>
                        {hasContent && <span style={{ fontSize: 10, color: '#059669', fontWeight: 700 }}>● Lessons ready</span>}
                      </span>
                      <Plus size={15} color={P} />
                    </button>
                  )
                })}
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Lesson detail ─────────────────────────────────────────────────────────────
function LessonDetail({ subject, lesson, onBack, onRead }: { subject: SubjectMeta; lesson: Lesson; onBack: () => void; onRead: () => void }) {
  const [openQ, setOpenQ] = useState<number | null>(0)
  const hasBook = lesson.pages.length > 0
  return (
    <div style={wrap}>
      <Back onClick={onBack} label={subject.name} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 6 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em' }}>{lesson.title}</h1>
          <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 4, maxWidth: 560, lineHeight: 1.6 }}>{lesson.summary}</p>
        </div>
        {hasBook && (
          <button onClick={onRead}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${subject.color},${subject.color}CC)`, color: '#fff', fontSize: 13.5, fontWeight: 800, fontFamily: FONT, boxShadow: `0 4px 16px ${subject.color}40`, flexShrink: 0 }}>
            <BookOpen size={16} /> Open digital book
          </button>
        )}
      </div>

      {/* Solved Q&A */}
      <Section icon={<HelpCircle size={16} color={subject.color} />} title="Solved Questions & Answers">
        <div style={{ display: 'grid', gap: 8 }}>
          {lesson.qa.map((qa, i) => (
            <div key={i} style={{ borderRadius: 12, border: '1px solid #EEF0F5', overflow: 'hidden', background: '#fff' }}>
              <button onClick={() => setOpenQ(openQ === i ? null : i)}
                style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', cursor: 'pointer', background: 'none', border: 'none', textAlign: 'left', fontFamily: FONT }}>
                <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A', flex: 1 }}>Q{i + 1}. {qa.q}</span>
                <ChevronDown size={16} color="#94A3B8" style={{ transform: openQ === i ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }} />
              </button>
              <AnimatePresence initial={false}>
                {openQ === i && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                    <div style={{ padding: '0 14px 14px', fontSize: 13, color: '#334155', lineHeight: 1.6, borderTop: '1px solid #F1F5F9', paddingTop: 12, background: '#FAFBFF' }}>
                      <strong style={{ color: subject.color }}>Answer: </strong>{qa.a}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </Section>

      {/* Further studies */}
      <Section icon={<Compass size={16} color={subject.color} />} title="Further Studies & Suggestions">
        <div style={{ display: 'grid', gap: 8 }}>
          {lesson.furtherStudy.map((f, i) => (
            <a key={i} href={f.url ?? undefined} target={f.url ? '_blank' : undefined} rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: subject.colorLight, textDecoration: 'none', color: '#0F172A', fontSize: 13, fontWeight: 600, cursor: f.url ? 'pointer' : 'default' }}>
              <span style={{ color: subject.color }}>›</span> {f.title}
              {f.url && <ChevronRight size={14} color={subject.color} style={{ marginLeft: 'auto' }} />}
            </a>
          ))}
        </div>
      </Section>

      {lesson.materials && lesson.materials.length > 0 && (
        <Section icon={<Paperclip size={16} color={subject.color} />} title="Materials (worksheets, notes, scans)">
          <div style={{ display: 'grid', gap: 8 }}>
            {lesson.materials.map((m, i) => (
              <a key={i} href={m.url} target="_blank" rel="noreferrer" download={m.url.startsWith('data:') ? m.name : undefined}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderRadius: 11, background: '#fff', border: '1px solid #EEF0F5', textDecoration: 'none', color: '#0F172A', fontSize: 13, fontWeight: 700 }}>
                <Paperclip size={14} color={subject.color} /> {m.name}
                <span style={{ marginLeft: 'auto', fontSize: 11, color: subject.color, fontWeight: 800 }}>Open / download</span>
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

// ── Digital flip-book reader ────────────────────────────────────────────────────
function BookReader({ subjectName, lesson, onClose }: { subjectName: string; lesson: Lesson; onClose: () => void }) {
  const [page, setPage] = useState(0)
  const [dir, setDir] = useState(1)
  const total = lesson.pages.length
  const go = (d: number) => { const n = page + d; if (n >= 0 && n < total) { setDir(d); setPage(n) } }

  const printBook = () => {
    const win = window.open('', '_blank', 'width=800,height=900')
    if (!win) return
    const pagesHtml = lesson.pages.map((p, i) =>
      `<section style="page-break-after:always;padding:40px"><div style="color:#6C63FF;font-size:12px;font-weight:700">${subjectName} · ${lesson.title} · Page ${i + 1}/${total}</div><h2 style="margin:8px 0">${p.heading}</h2><p style="font-size:15px;line-height:1.7;color:#222">${p.body}</p></section>`).join('')
    win.document.write(`<html><head><title>${lesson.title}</title></head><body style="font-family:Georgia,serif">${pagesHtml}</body></html>`)
    win.document.close(); win.focus(); setTimeout(() => win.print(), 250)
  }

  const cur = lesson.pages[page]
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(15,23,42,0.75)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, fontFamily: FONT }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 640, marginBottom: 12 }}>
        <span style={{ color: '#E2E8F0', fontSize: 13, fontWeight: 700 }}>{subjectName} · {lesson.title}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={printBook} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, border: 'none', cursor: 'pointer', background: '#fff', color: '#0F172A', fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}><Printer size={14} /> Print / Download</button>
          <button onClick={onClose} style={{ width: 34, height: 34, borderRadius: 9, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.15)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
        </div>
      </div>

      <div style={{ perspective: 1600, width: '100%', maxWidth: 640, height: 'min(70vh,520px)' }}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={page} custom={dir}
            initial={{ rotateY: dir > 0 ? 35 : -35, opacity: 0 }}
            animate={{ rotateY: 0, opacity: 1 }}
            exit={{ rotateY: dir > 0 ? -35 : 35, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{ transformStyle: 'preserve-3d', height: '100%', background: 'linear-gradient(135deg,#FFFDF8,#FFF8EE)', borderRadius: 16, boxShadow: '0 24px 60px rgba(0,0,0,0.4)', padding: '36px 40px', overflowY: 'auto', borderLeft: '6px solid #E7D9B8' }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: P, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Page {page + 1} of {total}</div>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#1F2937', marginBottom: 14, fontFamily: 'Georgia, serif' }}>{cur.heading}</h2>
            <p style={{ fontSize: 16, lineHeight: 1.8, color: '#374151', fontFamily: 'Georgia, serif' }}>{cur.body}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
        <NavBtn disabled={page === 0} onClick={() => go(-1)}><ChevronLeft size={18} /></NavBtn>
        <div style={{ display: 'flex', gap: 5 }}>
          {lesson.pages.map((_, i) => (
            <div key={i} style={{ width: i === page ? 18 : 7, height: 7, borderRadius: 4, background: i === page ? '#fff' : 'rgba(255,255,255,0.4)', transition: 'all 0.2s' }} />
          ))}
        </div>
        <NavBtn disabled={page === total - 1} onClick={() => go(1)}><ChevronRight size={18} /></NavBtn>
      </div>
    </motion.div>
  )
}

// ── Add / upload lesson modal (the "build the rest over time" entry point) ──────
function AddLessonModal({ subjectName, onClose, onSave }: { subjectName: string; onClose: () => void; onSave: (lesson: Lesson) => void }) {
  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [qa, setQa] = useState<QA[]>([{ q: '', a: '' }])
  const [materials, setMaterials] = useState<Material[]>([])
  const [link, setLink] = useState('')
  const [err, setErr] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const setQA = (i: number, patch: Partial<QA>) => setQa(qa.map((x, j) => j === i ? { ...x, ...patch } : x))
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => setMaterials(m => [...m, { name: f.name, url: r.result as string }]); r.readAsDataURL(f)
  }
  const addLink = () => { if (!link.trim()) return; setMaterials(m => [...m, { name: link.trim(), url: link.trim() }]); setLink('') }

  const save = () => {
    setErr('')
    if (!title.trim()) { setErr('Give the lesson a title.'); return }
    const cleanQa = qa.filter(x => x.q.trim() && x.a.trim())
    if (cleanQa.length === 0 && materials.length === 0) { setErr('Add at least one solved Q&A or a material.'); return }
    onSave({ id: `custom-${Date.now()}`, title: title.trim(), summary: summary.trim(), qa: cleanQa, furtherStudy: [], pages: [], materials, source: 'custom' })
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 85, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto', background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>Add a {subjectName} lesson</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 16, lineHeight: 1.5 }}>Add solved Q&A and upload worksheets/notes. Build the full repository here over time — no code needed.</p>

        <Field label="Lesson title"><input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Fractions — Halves and Quarters" style={input} /></Field>
        <Field label="Short summary (optional)"><input value={summary} onChange={e => setSummary(e.target.value)} placeholder="One line about this lesson" style={input} /></Field>

        <div style={{ marginBottom: 12 }}>
          <label style={fieldLabel}>Solved Questions & Answers</label>
          {qa.map((x, i) => (
            <div key={i} style={{ border: '1px solid #EEF0F5', borderRadius: 10, padding: 10, marginBottom: 8, position: 'relative' }}>
              <input value={x.q} onChange={e => setQA(i, { q: e.target.value })} placeholder={`Question ${i + 1}`} style={{ ...input, marginBottom: 6, fontWeight: 700 }} />
              <textarea value={x.a} onChange={e => setQA(i, { a: e.target.value })} placeholder="Answer" rows={2} style={{ ...input, resize: 'vertical' }} />
              {qa.length > 1 && <button onClick={() => setQa(qa.filter((_, j) => j !== i))} style={{ position: 'absolute', top: 8, right: 8, background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}><X size={14} /></button>}
            </div>
          ))}
          <button onClick={() => setQa([...qa, { q: '', a: '' }])} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1.5px dashed #CBD5E1', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#64748B', fontFamily: FONT }}><Plus size={13} /> Add another Q&A</button>
        </div>

        <div style={{ marginBottom: 14 }}>
          <label style={fieldLabel}>Materials — worksheets, notes, scans, links</label>
          {materials.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#F8FAFC', marginBottom: 6 }}>
              <Paperclip size={13} color={P} /><span style={{ flex: 1, fontSize: 12.5, color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <button onClick={() => setMaterials(materials.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}><X size={13} /></button>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => fileRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '8px 12px', borderRadius: 8, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#475569', fontFamily: FONT }}><FileUp size={13} /> Upload file</button>
            <input value={link} onChange={e => setLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && addLink()} placeholder="…or paste a link" style={{ ...input, flex: 1 }} />
            <button onClick={addLink} style={{ padding: '8px 12px', borderRadius: 8, border: 'none', background: P, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: FONT }}>Add</button>
          </div>
          <input ref={fileRef} type="file" onChange={onFile} style={{ display: 'none' }} />
        </div>

        {err && <div style={{ fontSize: 12, color: '#DC2626', fontWeight: 700, marginBottom: 10 }}>{err}</div>}
        <button onClick={save} style={{ width: '100%', padding: '12px 0', borderRadius: 11, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 14, fontWeight: 800, fontFamily: FONT }}>Save lesson</button>
      </motion.div>
    </motion.div>
  )
}

// ── small shared bits ───────────────────────────────────────────────────────────
const wrap: React.CSSProperties = { padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 1000, margin: '0 auto' }
const input: React.CSSProperties = { width: '100%', padding: '9px 11px', borderRadius: 9, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: FONT, color: '#0F172A', outline: 'none', boxSizing: 'border-box' }
const fieldLabel: React.CSSProperties = { fontSize: 11, fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: 6 }

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div style={{ marginBottom: 12 }}><label style={fieldLabel}>{label}</label>{children}</div>
}

function Back({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 14, fontSize: 13, fontWeight: 700, fontFamily: FONT }}>
      <ChevronLeft size={15} /> {label}
    </button>
  )
}

function Tag({ icon, text }: { icon: React.ReactNode; text: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#64748B', fontWeight: 700 }}>{icon}{text}</span>
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>{icon}<h2 style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>{title}</h2></div>
      {children}
    </div>
  )
}

function Empty({ icon, title, sub, onAdd, onAddLabel = 'Add subject' }: { icon: string; title: string; sub: string; onAdd?: () => void; onAddLabel?: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '52px 20px', borderRadius: 18, background: '#FAFAFF', border: '1.5px dashed #DDD6FE', marginTop: 18 }}>
      <div style={{ fontSize: 42, marginBottom: 10 }}>{icon}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>{title}</div>
      <div style={{ fontSize: 13, color: '#64748B', maxWidth: 380, margin: '0 auto 16px', lineHeight: 1.6 }}>{sub}</div>
      {onAdd && <button onClick={onAdd} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg,${P},#9B59FF)`, color: '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }}><Plus size={14} style={{ display: 'inline', marginRight: 6, verticalAlign: 'middle' }} /> {onAddLabel}</button>}
    </div>
  )
}

function NavBtn({ disabled, onClick, children }: { disabled: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width: 42, height: 42, borderRadius: 12, border: 'none', cursor: disabled ? 'not-allowed' : 'pointer', background: disabled ? 'rgba(255,255,255,0.12)' : '#fff', color: disabled ? 'rgba(255,255,255,0.4)' : '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {children}
    </button>
  )
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 440, background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
