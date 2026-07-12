import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, ChevronDown, ChevronRight, BookOpen, Edit3, Check, School, Pencil, Trash2, Plus, FileText } from 'lucide-react'
import { type SyllabusChapter } from '@/store/appStore'
import { chapterPct, subjectPct } from '@/store/kidsDataStore'
import { useKidStore } from '@/hooks/useKidStore'
import { useAuthStore } from '@/modules/identity'
import Academic from '@/pages/Academic'

const FONT = "'Nunito', 'Inter', sans-serif"

const STATUS_CONFIG = {
  'not-started': { label: 'Not Started', cls: 'status-not-started', dot: '#94A3B8' },
  'in-progress':  { label: 'In Progress', cls: 'status-in-progress',  dot: '#3B82F6' },
  'completed':    { label: 'Completed',   cls: 'status-completed',    dot: '#22C55E' },
  'revised':      { label: 'Revised',     cls: 'status-revised',      dot: '#F59E0B' },
}

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function ChapterCard({ chapter, subjectId, subjectColor }: {
  chapter: SyllabusChapter; subjectId: string; subjectColor: string
}) {
  const { toggleTopicComplete, updateChapterStatus, toggleChapterInSchool, removeChapter } = useKidStore()
  const [open, setOpen] = useState(false)
  const [editNote, setEditNote] = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const pct   = chapterPct(chapter)
  const sc    = STATUS_CONFIG[chapter.status]
  const days  = chapter.testScheduled ? daysUntil(chapter.testScheduled) : null

  return (
    <div style={{
      border: '1px solid #E2E8F0', borderRadius: 10, marginBottom: 8,
      background: '#fff', overflow: 'hidden',
    }}>
      {/* Chapter header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer' }}
        onClick={() => setOpen(!open)}>
        <div style={{
          width: 36, height: 36, borderRadius: 8, flexShrink: 0,
          background: chapter.status === 'completed' ? '#DCFCE7'
            : chapter.status === 'in-progress' ? '#DBEAFE' : '#F1F5F9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700,
          color: chapter.status === 'completed' ? '#166534'
            : chapter.status === 'in-progress' ? '#1D4ED8' : '#64748B',
        }}>
          {pct}%
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{chapter.name}</span>
            <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, fontWeight: 600 }} className={sc.cls}>{sc.label}</span>
            {days !== null && days >= 0 && days <= 14 && (
              <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: days <= 3 ? '#FFF5F5' : '#FFFBEB', color: days <= 3 ? '#DC2626' : '#B45309', fontWeight: 600 }}>
                ⚡ Test in {days}d
              </span>
            )}
            <button
              onClick={e => { e.stopPropagation(); toggleChapterInSchool(subjectId, chapter.id) }}
              title="Mark chapters currently being done in school"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10, fontWeight: 700,
                padding: '2px 8px', borderRadius: 10, cursor: 'pointer',
                border: chapter.inSchool ? 'none' : '1px dashed #CBD5E1',
                background: chapter.inSchool ? '#DCFCE7' : 'transparent',
                color: chapter.inSchool ? '#15803D' : '#94A3B8',
              }}>
              <School size={10} /> {chapter.inSchool ? 'In school' : 'In school?'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: '#64748B' }}>
              {new Date(chapter.targetStartDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
              {' → '}
              {new Date(chapter.targetEndDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
            </span>
            <span style={{ fontSize: 11, color: '#64748B' }}>
              {chapter.topics.filter(t => t.isCompleted).length}/{chapter.topics.length} topics
            </span>
          </div>
        </div>

        {/* Progress bar mini */}
        <div style={{ width: 80, flexShrink: 0 }}>
          <div style={{ height: 5, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: `${pct}%`, height: '100%', background: subjectColor, borderRadius: 3, transition: 'width 0.5s' }} />
          </div>
        </div>

        {/* Status dropdown */}
        <select
          value={chapter.status}
          onChange={e => { e.stopPropagation(); updateChapterStatus(subjectId, chapter.id, e.target.value as SyllabusChapter['status']) }}
          onClick={e => e.stopPropagation()}
          style={{ fontSize: 11, padding: '3px 6px', borderRadius: 6, border: '1px solid #DCE8F5', background: '#F8FAFC', color: '#334155', cursor: 'pointer', outline: 'none' }}>
          <option value="not-started">Not Started</option>
          <option value="in-progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="revised">Revised</option>
        </select>

        {/* Delete chapter (edit option from the change request) */}
        {confirmDel ? (
          <span style={{ display: 'inline-flex', gap: 4 }} onClick={e => e.stopPropagation()}>
            <button onClick={() => removeChapter(subjectId, chapter.id)}
              style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', cursor: 'pointer', fontWeight: 700 }}>
              Delete
            </button>
            <button onClick={() => setConfirmDel(false)}
              style={{ fontSize: 10.5, padding: '3px 8px', borderRadius: 6, border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer' }}>
              Cancel
            </button>
          </span>
        ) : (
          <button onClick={e => { e.stopPropagation(); setConfirmDel(true) }} title="Delete chapter"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1', display: 'flex', padding: 2 }}>
            <Trash2 size={13} />
          </button>
        )}

        {open ? <ChevronDown size={14} color="#94A3B8" /> : <ChevronRight size={14} color="#94A3B8" />}
      </div>

      {/* Topics expanded */}
      {open && (
        <div style={{ borderTop: '1px solid #F1F5F9', padding: '10px 14px 12px', background: '#FAFBFF' }}>
          {chapter.topics.length === 0 && (
            <div style={{ fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
              No sub-topics for this chapter — use the status dropdown (Not Started → In Progress → Completed) to track it.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }} className="resp-2col">
            {chapter.topics.map(topic => (
              <button key={topic.id}
                onClick={() => toggleTopicComplete(subjectId, chapter.id, topic.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
                  borderRadius: 8, border: '1px solid',
                  borderColor: topic.isCompleted ? '#BBF7D0' : '#E2E8F0',
                  background: topic.isCompleted ? '#F0FDF4' : '#fff',
                  cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}>
                {topic.isCompleted
                  ? <CheckCircle2 size={14} color="#22C55E" />
                  : <Circle size={14} color="#CBD5E1" />}
                <span style={{ fontSize: 12, color: topic.isCompleted ? '#166534' : '#374151', fontWeight: topic.isCompleted ? 600 : 400, flex: 1 }}>{topic.name}</span>
                {topic.completedDate && (
                  <span style={{ fontSize: 9.5, color: '#86EFAC' }}>{topic.completedDate}</span>
                )}
              </button>
            ))}
          </div>

          {/* Notes */}
          {(chapter.notes || editNote) && (
            <div style={{ marginTop: 6, padding: '8px 10px', borderRadius: 8, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
              {editNote ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input defaultValue={chapter.notes} placeholder="Add chapter notes..."
                    style={{ flex: 1, fontSize: 11.5, padding: '4px 8px', borderRadius: 6, border: '1px solid #FCD34D', outline: 'none', background: '#fff' }} />
                  <button onClick={() => setEditNote(false)} style={{ fontSize: 11, padding: '4px 8px', borderRadius: 6, background: '#4F46E5', color: '#fff', border: 'none', cursor: 'pointer' }}>
                    <Check size={12} />
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 12, color: '#92400E', flex: 1 }}>📝 {chapter.notes}</span>
                  <button onClick={() => setEditNote(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#D97706' }}><Edit3 size={12} /></button>
                </div>
              )}
            </div>
          )}
          {!chapter.notes && !editNote && (
            <button onClick={() => setEditNote(true)} style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              + Add note
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Editable textbook / book name per subject (feedback: add the book being followed).
function EditableBook({ subjectId, textbook, teacher, color }: {
  subjectId: string; textbook: string; teacher: string; color: string
}) {
  const { updateSubjectTextbook } = useKidStore()
  const [editing, setEditing] = useState(false)
  const [val, setVal] = useState(textbook)

  const save = () => { updateSubjectTextbook(subjectId, val.trim() || 'Textbook'); setEditing(false) }

  if (editing) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
        <BookOpen size={12} color={color} />
        <input autoFocus value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') { setVal(textbook); setEditing(false) } }}
          placeholder="Book / textbook name"
          style={{ fontSize: 12, padding: '3px 8px', borderRadius: 6, border: `1px solid ${color}55`, outline: 'none', background: '#fff', minWidth: 180 }} />
        <button onClick={save} style={{ display: 'flex', padding: 4, borderRadius: 6, background: color, color: '#fff', border: 'none', cursor: 'pointer' }}><Check size={12} /></button>
      </div>
    )
  }

  return (
    <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <BookOpen size={12} color={color} /> {textbook}
        <button onClick={() => { setVal(textbook); setEditing(true) }} title="Edit book name"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', padding: 0 }}>
          <Pencil size={11} />
        </button>
      </span>
      · <span style={{ fontWeight: 600 }}>Teacher: {teacher}</span>
    </div>
  )
}

// One "Academics" home: chapter/syllabus progress + lessons & digital books
// were two separate pages doing overlapping jobs — merged per user feedback.
export default function Syllabus() {
  const [tab, setTab] = useState<'progress' | 'lessons'>('progress')
  return (
    <div className="page-container" style={{ paddingBottom: 0 }}>
      <div style={{ display: 'inline-flex', background: '#F1F5F9', borderRadius: 11, padding: 3, margin: '0 0 4px' }}>
        {([['progress', '📊 Syllabus & Progress'], ['lessons', '📚 Lessons & Books']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ padding: '7px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 800,
              background: tab === k ? '#fff' : 'transparent', color: tab === k ? '#4F46E5' : '#64748B',
              boxShadow: tab === k ? '0 1px 4px rgba(15,23,42,0.1)' : 'none' }}>
            {label}
          </button>
        ))}
      </div>
      {tab === 'progress' ? <ChapterProgress /> : <Academic />}
    </div>
  )
}

function ChapterProgress() {
  const { subjects, ensureChapters, addChapter } = useKidStore()
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const [activeSubject, setActiveSubject] = useState(subjects[0]?.id ?? '')
  const [filterStatus, setFilterStatus] = useState<'all' | SyllabusChapter['status']>('all')
  const [newChapter, setNewChapter] = useState('')

  // Preload "most probable" chapters for this class into any subject without them.
  useEffect(() => {
    if (activeKid && subjects.some(s => s.chapters.length === 0)) {
      ensureChapters(activeKid.grade)
    }
  }, [activeKid?.id, subjects.length])

  const subject = subjects.find(s => s.id === activeSubject) ?? subjects[0]

  const handleAddChapter = () => {
    const name = newChapter.trim()
    if (!name || !subject) return
    addChapter(subject.id, name)
    setNewChapter('')
  }

  if (subjects.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="label" style={{ marginBottom: 4 }}>{activeKid?.grade} · {activeKid?.board}</div>
            <h1 className="page-title">Syllabus & Chapter Progress</h1>
          </div>
        </div>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <BookOpen size={40} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No syllabus data yet</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            Syllabus content for {activeKid?.grade} {activeKid?.board} will be added here.
          </div>
        </div>
      </div>
    )
  }

  if (!subject) return null

  const filtered = subject.chapters.filter(c => filterStatus === 'all' || c.status === filterStatus)
  const pct = subjectPct(subject)
  const completedCh = subject.chapters.filter(c => c.status === 'completed').length

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>
            Academic Year 2026–27 · {activeKid?.board ?? 'CBSE'} · {activeKid?.school?.split(',')[0] ?? 'School'}
          </div>
          <h1 className="page-title">Syllabus & Chapter Progress</h1>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 16, alignItems: 'start' }} className="syllabus-grid">

        {/* ── Subject list ─────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, position: 'sticky', top: 20 }} className="syllabus-subjects">
          {subjects.map(sub => {
            const p = subjectPct(sub)
            const active = sub.id === activeSubject
            return (
              <button key={sub.id}
                onClick={() => setActiveSubject(sub.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 10, border: active ? `2px solid ${sub.color}` : '1px solid #DCE8F5',
                  background: active ? sub.colorLight : '#fff', cursor: 'pointer',
                  transition: 'all 0.15s', textAlign: 'left',
                }}>
                <span style={{ fontSize: 20 }}>{sub.icon}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? sub.color : '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub.name}</div>
                  <div style={{ marginTop: 4, height: 3, background: '#F1F5F9', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${p}%`, height: '100%', background: sub.color, borderRadius: 2 }} />
                  </div>
                  <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>{p}% done</div>
                </div>
              </button>
            )
          })}
        </div>

        {/* ── Chapter detail ───────────────────────────── */}
        <div>
          {/* Subject header */}
          <motion.div key={subject.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}}
            style={{
              padding: '16px 20px', borderRadius: 12, marginBottom: 14,
              background: subject.colorLight, border: `1.5px solid ${subject.color}30`,
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 32 }}>{subject.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: subject.color }}>{subject.name}</div>
                <EditableBook subjectId={subject.id} textbook={subject.textbook} teacher={subject.teacher} color={subject.color} />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: subject.color, lineHeight: 1 }}>{pct}%</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{completedCh}/{subject.chapters.length} chapters done</div>
                <Link to="/worksheets" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
                  fontSize: 11, fontWeight: 700, color: subject.color, textDecoration: 'none',
                  padding: '3px 10px', borderRadius: 8, background: '#fff', border: `1px solid ${subject.color}40`,
                }}>
                  <FileText size={11} /> Worksheets
                </Link>
              </div>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.6)', borderRadius: 6, overflow: 'hidden' }}>
              <div style={{ width: `${pct}%`, height: '100%', background: subject.color, borderRadius: 6, transition: 'width 0.8s' }} />
            </div>
          </motion.div>

          {/* Filter */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {(['all','not-started','in-progress','completed','revised'] as const).map(f => (
              <button key={f} onClick={() => setFilterStatus(f)}
                style={{
                  fontSize: 11, padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                  fontWeight: filterStatus === f ? 700 : 500, border: 'none',
                  background: filterStatus === f ? subject.color : '#F1F5F9',
                  color: filterStatus === f ? '#fff' : '#64748B',
                }}>
                {f === 'all' ? `All (${subject.chapters.length})` :
                  f === 'not-started' ? `Not Started (${subject.chapters.filter(c=>c.status===f).length})` :
                  f === 'in-progress' ? `In Progress (${subject.chapters.filter(c=>c.status===f).length})` :
                  f === 'completed'   ? `Done (${subject.chapters.filter(c=>c.status===f).length})` :
                  `Revised (${subject.chapters.filter(c=>c.status===f).length})`}
              </button>
            ))}
          </div>

          {/* Chapter cards */}
          {filtered.map(ch => (
            <ChapterCard key={ch.id} chapter={ch} subjectId={subject.id} subjectColor={subject.color} />
          ))}

          {/* Add chapter (edit option from the change request) */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <input
              value={newChapter}
              onChange={e => setNewChapter(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddChapter() }}
              placeholder={`Add a chapter to ${subject.name}…`}
              style={{
                flex: 1, padding: '9px 12px', borderRadius: 9, fontSize: 13, fontFamily: 'inherit',
                border: `1.5px solid ${newChapter.trim() ? subject.color + '70' : '#E2E8F0'}`,
                outline: 'none', background: '#fff', color: '#0F172A',
              }}
            />
            <button onClick={handleAddChapter} disabled={!newChapter.trim()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 16px',
                borderRadius: 9, border: 'none', fontSize: 13, fontWeight: 700, fontFamily: 'inherit',
                background: newChapter.trim() ? subject.color : '#E2E8F0',
                color: newChapter.trim() ? '#fff' : '#94A3B8',
                cursor: newChapter.trim() ? 'pointer' : 'not-allowed', flexShrink: 0,
              }}>
              <Plus size={14} /> Add chapter
            </button>
          </div>

          {filtered.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center' }}>
              <BookOpen size={32} color="#CBD5E1" style={{ margin: '0 auto 12px' }} />
              <div style={{ fontSize: 13, color: '#64748B' }}>No chapters with this filter.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
