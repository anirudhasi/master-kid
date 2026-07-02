import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, ChevronLeft, Check } from 'lucide-react'
import { useAuthStore, type KidOnboardingData, type KidProfile } from '@/store/authStore'
import { useKidsDataStore } from '@/store/kidsDataStore'

// ── Helpers ────────────────────────────────────────────────────────────────────
const slide = (dir: 1 | -1 = 1) => ({
  initial:    { opacity: 0, x: 32 * dir },
  animate:    { opacity: 1, x: 0 },
  exit:       { opacity: 0, x: -32 * dir },
  transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
})

// Comprehensive subject list by board + grade
function getSubjectsByBoardAndGrade(board: string, grade: string): string[] {
  const g = parseInt(grade.replace(/\D/g, '')) || 4
  const b = board.toUpperCase()

  // ── ICSE / ISC ──────────────────────────────────────────────────────────
  if (b.includes('ICSE') || b.includes('ISC')) {
    if (g <= 2)  return ['English Language', 'Mathematics', 'Environmental Studies (EVS)', 'Hindi', 'General Knowledge (GK)', 'Drawing & Art', 'Physical Education']
    if (g <= 5)  return ['English Language', 'English Literature', 'Mathematics', 'Environmental Studies (EVS)', 'History & Civics', 'Geography', 'Hindi', 'Computer', 'Drawing & Art', 'General Knowledge (GK)', 'Physical Education', 'Moral Science']
    if (g <= 8)  return ['English Language', 'English Literature', 'Mathematics', 'Science', 'History & Civics', 'Geography', 'Hindi', 'Computer', 'Drawing & Art', 'Physical Education', 'Moral Science']
    if (g <= 10) return ['English Language', 'English Literature', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Applications', 'History & Civics', 'Geography', 'Hindi', 'Physical Education']
    // Grade 11–12 ISC — list all electives; student picks their stream
    return ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Accountancy', 'Economics', 'History', 'Political Science', 'Sociology', 'Psychology', 'Physical Education', 'Fine Arts', 'Home Science']
  }

  // ── IB / IGCSE / Cambridge ────────────────────────────────────────────────
  if (b.includes('IB') || b.includes('IGCSE') || b.includes('CAMBRIDGE')) {
    if (g <= 5)  return ['English', 'Mathematics', 'Science', 'Social Studies', 'Hindi', 'French', 'Physical Education', 'Drawing & Art', 'Music', 'General Knowledge (GK)']
    if (g <= 10) return ['English', 'Mathematics', 'Sciences', 'Individuals & Societies', 'Language Acquisition (Hindi)', 'Language Acquisition (French)', 'Physical Education', 'Design', 'Arts', 'Computer Science', 'Drama']
    return ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'History', 'Geography', 'Psychology', 'Computer Science', 'French', 'Hindi', 'Physical Education', 'Fine Arts']
  }

  // ── State Board — schools commonly split Science/SST and add the mother
  // tongue (e.g. Kannada) plus Abacus from early classes ────────────────────
  if (b.includes('STATE')) {
    if (g <= 5)  return ['English', 'Mathematics', 'Science', 'Social Studies (SST)', 'Hindi', 'Kannada', 'General Knowledge (GK)', 'Moral Science', 'Computer', 'Abacus', 'Physical Education']
    if (g <= 10) return ['English', 'Mathematics', 'Science', 'Social Science', 'Hindi', 'Kannada', 'Computer', 'Physical Education']
    return ['English', 'Physics', 'Chemistry', 'Mathematics', 'Biology', 'Computer Science', 'Accountancy', 'Business Studies', 'Economics', 'History', 'Political Science']
  }

  // ── CBSE (default) ───────────────────────────────────────────────────────
  if (g <= 2)  return ['Mathematics', 'English', 'Hindi', 'Environmental Studies (EVS)', 'Drawing & Art', 'Physical Education', 'General Knowledge (GK)']
  if (g <= 5)  return ['Mathematics', 'English', 'Hindi', 'Environmental Studies (EVS)', 'Computer', 'Drawing & Art', 'General Knowledge (GK)', 'Physical Education', 'Moral Science', 'Sanskrit']
  if (g <= 8)  return ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Sanskrit', 'Computer', 'Drawing & Art', 'Physical Education', 'General Knowledge (GK)']
  if (g <= 10) return ['Mathematics', 'English', 'Hindi', 'Science', 'Social Science', 'Computer Applications', 'Sanskrit', 'Physical Education', 'Drawing & Art']
  // Grade 11–12 — show all electives grouped by stream; student deselects irrelevant ones
  return [
    // Core
    'English', 'Hindi',
    // Science stream
    'Physics', 'Chemistry', 'Mathematics', 'Biology',
    'Computer Science', 'Informatics Practices',
    // Commerce stream
    'Accountancy', 'Business Studies', 'Economics',
    // Humanities stream
    'History', 'Geography', 'Political Science', 'Psychology', 'Sociology',
    // Common electives
    'Physical Education', 'Fine Arts', 'Home Science', 'Music',
  ]
}

const ACTIVITIES_LIST = [
  { group: 'Sports',       items: ['Swimming', 'Cricket', 'Football', 'Badminton', 'Tennis', 'Basketball', 'Athletics', 'Gymnastics', 'Skating', 'Chess'] },
  { group: 'Dance',        items: ['Bharatanatyam', 'Kathak', 'Kuchipudi', 'Western Dance', 'Hip-Hop', 'Salsa', 'Folk Dance'] },
  { group: 'Music',        items: ['Western Vocal', 'Carnatic Vocal', 'Hindustani Vocal', 'Guitar', 'Piano', 'Tabla', 'Drums', 'Flute', 'Violin'] },
  { group: 'Visual Arts',  items: ['Drawing & Painting', 'Craft', 'Pottery', 'Photography', 'Calligraphy'] },
  { group: 'Other',        items: ['Coding / Programming', 'Robotics', 'Debate', 'Theatre', 'Reading Club', 'Cooking'] },
]

const LIFE_GOALS = [
  'Doctor / Surgeon', 'Engineer / Scientist', 'Software Developer', 'Artist / Animator',
  'Sportsperson / Olympian', 'Musician / Performer', 'Entrepreneur', 'Teacher / Professor',
  'Pilot / Astronaut', 'Architect / Designer', 'Marine Biologist', 'Lawyer / Judge',
  'Chef / Restaurateur', 'Writer / Journalist', 'Dancer / Choreographer',
]

const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

// ── Step components ────────────────────────────────────────────────────────────
interface StepProps {
  kid: KidProfile
  draft: Partial<KidOnboardingData>
  setDraft: React.Dispatch<React.SetStateAction<Partial<KidOnboardingData>>>
  onNext: () => void
  onBack?: () => void
  isLast?: boolean
}

function StepWelcome({ kid, onNext }: StepProps) {
  return (
    <motion.div {...slide(1)} style={{ textAlign: 'center' }}>
      <motion.div
        animate={{ scale: [1, 1.08, 1] }}
        transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
        style={{
          width: 100, height: 100, borderRadius: 28, margin: '0 auto 24px',
          background: `linear-gradient(135deg, ${kid.colorLight}, ${kid.color}22)`,
          border: `3px solid ${kid.color}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52,
        }}>
        {kid.avatar}
      </motion.div>

      <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 8 }}>
        Hi {kid.name}! 👋
      </h2>
      <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, maxWidth: 380, margin: '0 auto 32px' }}>
        Welcome to <strong style={{ color: '#4F46E5' }}>Master-Kids</strong>! Let's set up your
        personal learning profile in just a few steps so your AI tutor Miko knows exactly how to help you.
      </p>

      {/* Profile preview pill */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 10, padding: '10px 18px',
        borderRadius: 40, background: kid.colorLight, border: `1.5px solid ${kid.color}30`,
        marginBottom: 32,
      }}>
        <span style={{ fontSize: 22 }}>{kid.avatar}</span>
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: kid.color }}>{kid.name}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>{kid.grade} · {kid.board} · {kid.school}</div>
        </div>
      </div>

      {/* Steps preview */}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
        {['School', 'Subjects', 'Activities', 'Dream'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ padding: '4px 10px', borderRadius: 20, background: '#EEF2FF', border: '1px solid #C7D2FE', fontSize: 11, fontWeight: 600, color: '#4F46E5' }}>
              {i + 1}. {s}
            </div>
            {i < 3 && <ChevronRight size={10} color="#CBD5E1" />}
          </div>
        ))}
      </div>

      <button onClick={onNext} style={{
        padding: '14px 40px', borderRadius: 12, border: 'none',
        background: `linear-gradient(135deg, ${kid.color}, #7C3AED)`,
        color: '#fff', fontSize: 15, fontWeight: 800, cursor: 'pointer',
        boxShadow: `0 4px 20px ${kid.color}45`, letterSpacing: '-0.01em',
      }}>
        Let's Get Started! 🚀
      </button>
    </motion.div>
  )
}

function StepSchool({ kid, draft, setDraft, onNext, onBack }: StepProps) {
  const updateKid    = useAuthStore(s => s.updateKid)
  const section      = draft.section ?? ''
  const classTeacher = draft.classTeacher ?? ''
  const school       = kid.school
  const [editingSchool, setEditingSchool] = useState(false)
  const [schoolDraft, setSchoolDraft]     = useState(school)

  const saveSchool = () => {
    updateKid(kid.id, { school: schoolDraft.trim() })
    setEditingSchool(false)
  }

  return (
    <motion.div {...slide(1)}>
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🏫</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>Your School Details</h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>Tell us a bit about your class so we can tailor everything</p>
      </div>

      {/* School name — editable inline (parents asked: "school is not editable??") */}
      <div style={{ padding: '12px 14px', borderRadius: 10, background: '#F0F9FF', border: '1px solid #BAE6FD', marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#0369A1', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>School</div>
        {editingSchool ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
            <input
              autoFocus value={schoolDraft}
              onChange={e => setSchoolDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveSchool(); if (e.key === 'Escape') setEditingSchool(false) }}
              placeholder="School name"
              style={{ flex: 1, padding: '7px 10px', borderRadius: 8, border: '1.5px solid #7DD3FC', fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0C4A6E', background: '#fff' }}
            />
            <button onClick={saveSchool}
              style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: '#0284C7', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Save
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: '#0C4A6E', flex: 1 }}>🏫 {school || 'Add your school'}</div>
            <button onClick={() => { setSchoolDraft(school); setEditingSchool(true) }}
              style={{ padding: '4px 12px', borderRadius: 8, border: '1px solid #7DD3FC', background: '#fff', color: '#0284C7', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              ✏️ Edit
            </button>
          </div>
        )}
        <div style={{ fontSize: 11, color: '#0369A1', marginTop: 4 }}>{kid.board} · {kid.grade}</div>
      </div>

      {/* Section */}
      <div style={{ marginBottom: 16 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Class Section
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {SECTIONS.map(s => (
            <button key={s} onClick={() => setDraft(d => ({ ...d, section: s }))}
              style={{
                width: 48, height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 15, fontWeight: 800,
                background: section === s ? kid.color : '#F1F5F9',
                color: section === s ? '#fff' : '#374151',
                boxShadow: section === s ? `0 2px 10px ${kid.color}40` : 'none',
                transition: 'all 0.15s',
              }}>{s}</button>
          ))}
          <button onClick={() => setDraft(d => ({ ...d, section: 'Other' }))}
            style={{
              padding: '0 14px', height: 48, borderRadius: 12, border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 700,
              background: section === 'Other' ? kid.color : '#F1F5F9',
              color: section === 'Other' ? '#fff' : '#374151',
              transition: 'all 0.15s',
            }}>Other</button>
        </div>
      </div>

      {/* Class teacher */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Class Teacher Name
        </label>
        <input
          value={classTeacher}
          onChange={e => setDraft(d => ({ ...d, classTeacher: e.target.value }))}
          placeholder="e.g. Mrs. Kavitha R."
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10,
            border: `1.5px solid ${classTeacher ? kid.color + '60' : '#E2E8F0'}`,
            fontSize: 14, fontFamily: 'inherit', outline: 'none',
            color: '#0F172A', background: '#fff', transition: 'border-color 0.2s',
          }}
        />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack}
          style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ChevronLeft size={14} /> Back
        </button>
        <button onClick={onNext}
          style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: kid.color, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          Continue <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}

function StepSubjects({ kid, draft, setDraft, onNext, onBack }: StepProps) {
  const presetSubjects = getSubjectsByBoardAndGrade(kid.board ?? 'CBSE', kid.grade)

  // Custom subjects: any in draft that aren't in the preset list
  const [customSubjects, setCustomSubjects] = useState<string[]>(() =>
    (draft.subjects ?? presetSubjects).filter(s => !presetSubjects.includes(s))
  )
  const [newSubject, setNewSubject] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const allSubjects = [...presetSubjects, ...customSubjects]
  const selected    = draft.subjects ?? presetSubjects
  const goals       = draft.subjectGoalMins ?? {}

  const toggle = (sub: string) => {
    setDraft(d => {
      const cur = d.subjects ?? allSubjects
      return { ...d, subjects: cur.includes(sub) ? cur.filter(s => s !== sub) : [...cur, sub] }
    })
  }

  const setGoal = (sub: string, mins: number) => {
    setDraft(d => ({ ...d, subjectGoalMins: { ...(d.subjectGoalMins ?? {}), [sub]: mins } }))
  }

  const addCustom = () => {
    const trimmed = newSubject.trim()
    if (!trimmed || allSubjects.map(s => s.toLowerCase()).includes(trimmed.toLowerCase())) return
    setCustomSubjects(cs => [...cs, trimmed])
    // auto-select and set default goal
    setDraft(d => ({
      ...d,
      subjects: [...(d.subjects ?? presetSubjects), trimmed],
      subjectGoalMins: { ...(d.subjectGoalMins ?? {}), [trimmed]: 90 },
    }))
    setNewSubject('')
    inputRef.current?.focus()
  }

  const removeCustom = (sub: string) => {
    setCustomSubjects(cs => cs.filter(s => s !== sub))
    setDraft(d => {
      const goals = { ...(d.subjectGoalMins ?? {}) }
      delete goals[sub]
      return { ...d, subjects: (d.subjects ?? []).filter(s => s !== sub), subjectGoalMins: goals }
    })
  }

  const isDuplicate = newSubject.trim() !== '' &&
    allSubjects.map(s => s.toLowerCase()).includes(newSubject.trim().toLowerCase())

  return (
    <motion.div {...slide(1)}>
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 36, marginBottom: 8 }}>📚</div>
        <h2 style={{ fontSize: 21, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 4 }}>Choose Subjects</h2>
        <p style={{ fontSize: 12.5, color: '#64748B' }}>
          Tap to select · deselect what {kid.name} doesn't study · add missing ones below
        </p>
      </div>

      {/* ── Section 1: Subject chip grid ───────────────────────────────── */}
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          {selected.length} of {allSubjects.length} selected
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {allSubjects.map(sub => {
            const isOn     = selected.includes(sub)
            const isCustom = !presetSubjects.includes(sub)
            return (
              <div key={sub} style={{ position: 'relative' }}>
                <button
                  onClick={() => toggle(sub)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                    padding: '9px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: isOn ? kid.colorLight : '#F1F5F9',
                    outline: `2px solid ${isOn ? kid.color : 'transparent'}`,
                    outlineOffset: 0,
                    transition: 'all 0.15s', textAlign: 'left',
                  }}>
                  {/* Checkbox dot */}
                  <div style={{
                    width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                    background: isOn ? kid.color : '#CBD5E1',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}>
                    {isOn && <Check size={11} color="#fff" strokeWidth={3} />}
                  </div>
                  <span style={{
                    fontSize: 12, fontWeight: isOn ? 700 : 500, lineHeight: 1.3,
                    color: isOn ? kid.color : '#374151', flex: 1,
                  }}>
                    {sub}
                  </span>
                  {isCustom && (
                    <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: '#FEF3C7', color: '#D97706', fontWeight: 700, flexShrink: 0 }}>
                      ✏
                    </span>
                  )}
                </button>
                {/* Remove button for custom subjects */}
                {isCustom && (
                  <button
                    onClick={() => removeCustom(sub)}
                    title="Remove"
                    style={{
                      position: 'absolute', top: -6, right: -6,
                      width: 18, height: 18, borderRadius: '50%',
                      background: '#DC2626', border: '2px solid #fff',
                      color: '#fff', fontSize: 11, lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', zIndex: 1,
                    }}>
                    ×
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Section 2: Weekly goal sliders (only selected subjects) ─────── */}
      {selected.length > 0 && (
        <div style={{
          padding: '14px 14px 10px', borderRadius: 12, marginBottom: 14,
          background: '#F8FAFC', border: '1px solid #E2E8F0',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
            ⏱ Weekly Study Goals
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {selected.map(sub => {
              const goal = goals[sub] ?? 90
              const hrs  = goal >= 60 ? `${Math.floor(goal / 60)}h${goal % 60 > 0 ? ` ${goal % 60}m` : ''}` : `${goal}m`
              return (
                <div key={sub}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{sub}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: kid.color }}>{hrs}/wk</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 10, color: '#CBD5E1', flexShrink: 0 }}>30m</span>
                    <input
                      type="range" min={30} max={300} step={15} value={goal}
                      onChange={e => setGoal(sub, Number(e.target.value))}
                      style={{ flex: 1, accentColor: kid.color, cursor: 'pointer', height: 4 }}
                    />
                    <span style={{ fontSize: 10, color: '#CBD5E1', flexShrink: 0 }}>5h</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Section 3: Add custom subject ───────────────────────────────── */}
      <div style={{
        padding: '12px 14px', borderRadius: 12, marginBottom: 18,
        background: '#F8FAFF', border: '1.5px dashed #C7D2FE',
      }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#6366F1', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          + Can't find your subject? Add it
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            ref={inputRef}
            value={newSubject}
            onChange={e => setNewSubject(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addCustom()}
            placeholder="e.g. Abacus, French, Vedic Maths…"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 9,
              border: `1.5px solid ${isDuplicate ? '#FCA5A5' : newSubject.trim() ? kid.color + '70' : '#E2E8F0'}`,
              fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0F172A',
              background: '#fff', transition: 'border-color 0.2s',
            }}
          />
          <button
            onClick={addCustom}
            disabled={!newSubject.trim() || isDuplicate}
            style={{
              padding: '9px 16px', borderRadius: 9, border: 'none', flexShrink: 0, fontFamily: 'inherit',
              background: newSubject.trim() && !isDuplicate ? kid.color : '#E2E8F0',
              color: newSubject.trim() && !isDuplicate ? '#fff' : '#94A3B8',
              fontSize: 13, fontWeight: 700,
              cursor: newSubject.trim() && !isDuplicate ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
            }}>
            + Add
          </button>
        </div>
        {isDuplicate && (
          <p style={{ fontSize: 11, color: '#DC2626', marginTop: 5, fontWeight: 500 }}>
            "{newSubject.trim()}" is already in the list
          </p>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack}
          style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ChevronLeft size={14} /> Back
        </button>
        <button onClick={onNext} disabled={selected.length === 0}
          style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: selected.length > 0 ? 'pointer' : 'not-allowed', background: selected.length > 0 ? kid.color : '#E2E8F0', color: selected.length > 0 ? '#fff' : '#94A3B8' }}>
          Continue ({selected.length}) <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}

function StepActivities({ kid, draft, setDraft, onNext, onBack }: StepProps) {
  const selected = draft.activities ?? []
  const [newActivity, setNewActivity] = useState('')

  const toggle = (act: string) => {
    setDraft(d => {
      const cur = d.activities ?? []
      return { ...d, activities: cur.includes(act) ? cur.filter(a => a !== act) : [...cur, act] }
    })
  }

  // "Can't find your hobby? Add it" — custom activities beyond the preset list.
  const presetItems = ACTIVITIES_LIST.flatMap(g => g.items)
  const customActivities = selected.filter(a => !presetItems.includes(a))
  const isDuplicateActivity = [...presetItems, ...selected]
    .some(a => a.toLowerCase() === newActivity.trim().toLowerCase())

  const addCustomActivity = () => {
    const trimmed = newActivity.trim()
    if (!trimmed || isDuplicateActivity) return
    setDraft(d => ({ ...d, activities: [...(d.activities ?? []), trimmed] }))
    setNewActivity('')
  }

  return (
    <motion.div {...slide(1)}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🎨</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>Extra-Curricular Activities</h2>
        <p style={{ fontSize: 13, color: '#64748B' }}>What does {kid.name} do outside of school? Select all that apply.</p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24, maxHeight: 380, overflowY: 'auto', paddingRight: 4 }}>
        {ACTIVITIES_LIST.map(group => (
          <div key={group.group}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>{group.group}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {group.items.map(act => {
                const on = selected.includes(act)
                return (
                  <button key={act} onClick={() => toggle(act)}
                    style={{
                      padding: '7px 12px', borderRadius: 20, border: `1.5px solid ${on ? kid.color : '#E2E8F0'}`,
                      background: on ? kid.color : '#fff', color: on ? '#fff' : '#374151',
                      fontSize: 12, fontWeight: on ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
                      boxShadow: on ? `0 2px 8px ${kid.color}30` : 'none',
                    }}>
                    {on && '✓ '}{act}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Custom hobby add — "can't find your hobby? add it" */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
          Can't find your hobby?
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={newActivity}
            onChange={e => setNewActivity(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') addCustomActivity() }}
            placeholder="e.g. Karate, Gardening, Origami…"
            style={{
              flex: 1, padding: '9px 12px', borderRadius: 9,
              border: `1.5px solid ${isDuplicateActivity && newActivity.trim() ? '#FCA5A5' : newActivity.trim() ? kid.color + '70' : '#E2E8F0'}`,
              fontSize: 13, fontFamily: 'inherit', outline: 'none', color: '#0F172A', background: '#fff',
            }}
          />
          <button
            onClick={addCustomActivity}
            disabled={!newActivity.trim() || isDuplicateActivity}
            style={{
              padding: '9px 16px', borderRadius: 9, border: 'none', flexShrink: 0, fontFamily: 'inherit',
              background: newActivity.trim() && !isDuplicateActivity ? kid.color : '#E2E8F0',
              color: newActivity.trim() && !isDuplicateActivity ? '#fff' : '#94A3B8',
              fontSize: 13, fontWeight: 700,
              cursor: newActivity.trim() && !isDuplicateActivity ? 'pointer' : 'not-allowed',
            }}>
            + Add
          </button>
        </div>
        {customActivities.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 8 }}>
            {customActivities.map(act => (
              <button key={act} onClick={() => toggle(act)}
                style={{
                  padding: '7px 12px', borderRadius: 20, border: 'none',
                  background: kid.color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                }}>
                ✓ {act} ✕
              </button>
            ))}
          </div>
        )}
      </div>

      {selected.length > 0 && (
        <div style={{ padding: '10px 14px', borderRadius: 10, background: kid.colorLight, border: `1px solid ${kid.color}30`, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: kid.color, marginBottom: 4 }}>Selected ({selected.length})</div>
          <div style={{ fontSize: 12, color: '#374151' }}>{selected.join(' · ')}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack}
          style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ChevronLeft size={14} /> Back
        </button>
        <button onClick={onNext}
          style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: kid.color, color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {selected.length === 0 ? 'Skip for now' : 'Continue'} <ChevronRight size={14} />
        </button>
      </div>
    </motion.div>
  )
}

function StepDream({ kid, draft, setDraft, onNext, onBack }: StepProps) {
  const lifeGoal  = draft.lifeGoal ?? ''
  const targetYear = draft.targetYear ?? (new Date().getFullYear() + (18 - (kid.age ?? 10)))
  const [custom, setCustom] = useState(!LIFE_GOALS.includes(lifeGoal) && lifeGoal !== '')

  return (
    <motion.div {...slide(1)}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>🌟</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 6 }}>
          {kid.name}'s Big Dream
        </h2>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
          What do you want to be when you grow up?<br />Your AI tutor will keep this in mind while helping you study!
        </p>
      </div>

      {/* Goal grid */}
      {!custom && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginBottom: 14 }}>
          {LIFE_GOALS.map(g => (
            <button key={g} onClick={() => setDraft(d => ({ ...d, lifeGoal: g }))}
              style={{
                padding: '7px 12px', borderRadius: 20,
                border: `1.5px solid ${lifeGoal === g ? kid.color : '#E2E8F0'}`,
                background: lifeGoal === g ? kid.color : '#fff',
                color: lifeGoal === g ? '#fff' : '#374151',
                fontSize: 12, fontWeight: lifeGoal === g ? 700 : 500, cursor: 'pointer', transition: 'all 0.15s',
              }}>
              {lifeGoal === g && '✓ '}{g}
            </button>
          ))}
          <button onClick={() => setCustom(true)}
            style={{ padding: '7px 12px', borderRadius: 20, border: '1.5px dashed #C7D2FE', background: '#F8FAFF', color: '#6366F1', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            + Something else…
          </button>
        </div>
      )}

      {/* Custom goal input */}
      {custom && (
        <div style={{ marginBottom: 14 }}>
          <input
            autoFocus
            value={lifeGoal}
            onChange={e => setDraft(d => ({ ...d, lifeGoal: e.target.value }))}
            placeholder={`${kid.name}'s dream career or life goal…`}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10,
              border: `1.5px solid ${lifeGoal ? kid.color + '60' : '#E2E8F0'}`,
              fontSize: 14, fontFamily: 'inherit', outline: 'none', color: '#0F172A', marginBottom: 8,
            }}
          />
          <button onClick={() => { setCustom(false); setDraft(d => ({ ...d, lifeGoal: '' })) }}
            style={{ fontSize: 11, color: '#94A3B8', background: 'none', border: 'none', cursor: 'pointer' }}>
            ← Choose from list
          </button>
        </div>
      )}

      {/* Target year */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ fontSize: 11, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Target Year (when I'll achieve my dream)
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={new Date().getFullYear() + 4}
            max={new Date().getFullYear() + 20}
            value={targetYear}
            onChange={e => setDraft(d => ({ ...d, targetYear: Number(e.target.value) }))}
            style={{ flex: 1, accentColor: kid.color, cursor: 'pointer' }}
          />
          <div style={{
            padding: '6px 14px', borderRadius: 10, background: kid.colorLight,
            border: `1.5px solid ${kid.color}30`, fontSize: 16, fontWeight: 900, color: kid.color,
            flexShrink: 0,
          }}>{targetYear}</div>
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 4, textAlign: 'center' }}>
          That's {targetYear - new Date().getFullYear()} years from now — plenty of time with consistent daily effort! 💪
        </div>
      </div>

      {/* Dream card preview */}
      {lifeGoal && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '14px 16px', borderRadius: 12, marginBottom: 24,
            background: `linear-gradient(135deg, ${kid.colorLight}, ${kid.color}12)`,
            border: `1.5px solid ${kid.color}30`,
          }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: kid.color, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
            {kid.name}'s Goal
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 2 }}>🎯 {lifeGoal}</div>
          <div style={{ fontSize: 11, color: '#64748B' }}>Target: {targetYear} · {targetYear - new Date().getFullYear()} years of focused learning</div>
        </motion.div>
      )}

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onBack}
          style={{ flex: 1, padding: '12px 0', borderRadius: 10, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          <ChevronLeft size={14} /> Back
        </button>
        <button onClick={onNext}
          style={{ flex: 2, padding: '12px 0', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${kid.color}, #7C3AED)`, color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: `0 4px 20px ${kid.color}40` }}>
          {lifeGoal ? `Let's Go, ${kid.name}! 🚀` : 'Start Learning →'}
        </button>
      </div>
    </motion.div>
  )
}

function StepDone({ kid }: { kid: KidProfile }) {
  return (
    <motion.div {...slide(1)} style={{ textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 12 }}
        style={{
          width: 100, height: 100, borderRadius: '50%', margin: '0 auto 24px',
          background: `linear-gradient(135deg, ${kid.color}, #7C3AED)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48,
          boxShadow: `0 8px 32px ${kid.color}45`,
        }}>🎉</motion.div>

      <h2 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em', marginBottom: 8 }}>
        You're all set, {kid.name}!
      </h2>
      <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.7, marginBottom: 24 }}>
        Your AI tutor Miko is ready. Your personalized syllabus,<br />
        schedule, and study plan are being prepared just for you!
      </p>

      {/* Confetti items */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        {['📚 Syllabus Ready', '🤖 Miko Online', '⚡ 0 XP', '🔥 Day 1'].map(item => (
          <div key={item} style={{ padding: '6px 12px', borderRadius: 20, background: kid.colorLight, border: `1px solid ${kid.color}30`, fontSize: 11, fontWeight: 700, color: kid.color }}>
            {item}
          </div>
        ))}
      </div>

      <div style={{ padding: '14px', borderRadius: 12, background: '#F0FDF4', border: '1px solid #BBF7D0', marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#166534', lineHeight: 1.6 }}>
          🌟 <strong>Tip:</strong> Log your first study session today to start your streak and earn your first 10 XP!
        </p>
      </div>
    </motion.div>
  )
}

// ── Progress bar ───────────────────────────────────────────────────────────────
function ProgressBar({ step, total, color }: { step: number; total: number; color: string }) {
  const labels = ['Welcome', 'School', 'Subjects', 'Activities', 'Dream']
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 4, borderRadius: 4,
            background: i < step ? color : '#E2E8F0',
            transition: 'background 0.4s',
          }} />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>
          Step {Math.min(step, total)} of {total}
        </span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>
          {step <= total ? labels[step - 1] : 'Done!'}
        </span>
      </div>
    </div>
  )
}

// ── Root KidOnboarding ─────────────────────────────────────────────────────────
export default function KidOnboarding() {
  const navigate = useNavigate()
  const { activeKidId, kids, markOnboarded } = useAuthStore()
  const { initKidData } = useKidsDataStore()
  const kid = kids.find(k => k.id === activeKidId)

  const [step,  setStep]  = useState(1)
  const [draft, setDraft] = useState<Partial<KidOnboardingData>>({
    section: '',
    classTeacher: '',
    subjects: getSubjectsByBoardAndGrade(kid?.board ?? 'CBSE', kid?.grade ?? 'Grade 4'),
    subjectGoalMins: {},
    activities: [],
    lifeGoal: '',
    targetYear: new Date().getFullYear() + (18 - (kid?.age ?? 10)),
  })
  const [done, setDone] = useState(false)

  if (!kid) return null

  const TOTAL = 5

  const next = () => {
    if (step < TOTAL) {
      setStep(s => s + 1)
    } else {
      // complete
      const finalData: KidOnboardingData = {
        section:         draft.section      ?? '',
        classTeacher:    draft.classTeacher ?? '',
        subjects:        draft.subjects     ?? getSubjectsByBoardAndGrade(kid.board ?? 'CBSE', kid.grade),
        subjectGoalMins: draft.subjectGoalMins ?? {},
        activities:      draft.activities   ?? [],
        lifeGoal:        draft.lifeGoal     ?? '',
        targetYear:      draft.targetYear   ?? new Date().getFullYear() + 8,
      }
      markOnboarded(kid.id, finalData)
      initKidData(kid.id, finalData, kid.grade)
      setDone(true)
      setTimeout(() => navigate('/child'), 2200)
    }
  }

  const back = () => setStep(s => Math.max(1, s - 1))

  const stepProps: StepProps = {
    kid, draft, setDraft,
    onNext: next,
    onBack: back,
    isLast: step === TOTAL,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: `linear-gradient(160deg, ${kid.colorLight} 0%, #fff 40%, ${kid.colorLight} 100%)`,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: '24px 16px 48px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>M</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Master-Kids</div>
            <div style={{ fontSize: 9, color: '#94A3B8', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Profile Setup</div>
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: '#fff', borderRadius: 20, padding: '32px 32px 28px',
          boxShadow: '0 8px 40px rgba(15,23,42,0.10)',
          border: `1px solid ${kid.color}20`,
        }}>
          {!done && <ProgressBar step={step} total={TOTAL} color={kid.color} />}

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" {...slide(1)}>
                <StepDone kid={kid} />
              </motion.div>
            ) : (
              <motion.div key={step} {...slide(1)}>
                {step === 1 && <StepWelcome    {...stepProps} />}
                {step === 2 && <StepSchool     {...stepProps} />}
                {step === 3 && <StepSubjects   {...stepProps} />}
                {step === 4 && <StepActivities {...stepProps} />}
                {step === 5 && <StepDream      {...stepProps} />}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
