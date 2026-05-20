import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Search, Filter, Download, BookOpen, Clock, ChevronRight, X, CheckCircle, ArrowLeft, Send, Printer } from 'lucide-react'
import {
  WORKSHEETS, SUBJECTS_BY_GRADE, SUBJECT_ICONS, COMPLEXITY_COLORS,
  type Worksheet, type WorksheetSubject, type WorksheetComplexity,
} from '@/data/worksheetsData'
import { useAuthStore } from '@/store/authStore'

const GRADES = [1,2,3,4,5,6,7,8]

function WorksheetCard({ ws, onClick }: { ws: Worksheet; onClick: () => void }) {
  const cc = COMPLEXITY_COLORS[ws.complexity]
  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-2 }}
      onClick={onClick}
      className="card"
      style={{ padding:20, cursor:'pointer', borderLeft:`3px solid ${cc.color}`, transition:'box-shadow 0.2s' }}
    >
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:20 }}>{SUBJECT_ICONS[ws.subject]}</span>
          <div>
            <div style={{ fontSize:13, fontWeight:800, color:'#0F172A', lineHeight:1.3 }}>{ws.title}</div>
            <div style={{ fontSize:11, color:'#64748B', marginTop:2 }}>{ws.topic}</div>
          </div>
        </div>
        <span style={{ fontSize:10, padding:'3px 8px', borderRadius:6, background:cc.bg, color:cc.color, fontWeight:700, flexShrink:0, marginLeft:8 }}>
          {cc.label}
        </span>
      </div>
      <p style={{ fontSize:12, color:'#64748B', lineHeight:1.5, marginBottom:12 }}>{ws.description}</p>
      <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94A3B8' }}>
          <Clock size={11}/> {ws.estimatedMinutes} min
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94A3B8' }}>
          <BookOpen size={11}/> {ws.questionCount} questions
        </span>
        <span style={{ fontSize:11, padding:'2px 7px', borderRadius:5, background:'#EEF2FF', color:'#4F46E5', fontWeight:600 }}>
          Grade {ws.grade}
        </span>
        {ws.tags.slice(0,2).map(t => (
          <span key={t} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#F1F5F9', color:'#64748B' }}>{t}</span>
        ))}
      </div>
      <div style={{ display:'flex', justifyContent:'flex-end', marginTop:12 }}>
        <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:12, color:'#4F46E5', fontWeight:600 }}>
          Open Worksheet <ChevronRight size={13}/>
        </span>
      </div>
    </motion.div>
  )
}

function WorksheetDetail({ ws, onClose }: { ws: Worksheet; onClose: () => void }) {
  const cc = COMPLEXITY_COLORS[ws.complexity]
  const [submitted, setSubmitted] = useState(false)
  const [answers, setAnswers] = useState<string[]>(Array(ws.questionCount).fill(''))

  // Generate sample questions based on topic
  const sampleQuestions = useMemo(() => {
    const templates = [
      `Solve the following ${ws.topic} problem and show your working clearly.`,
      `Explain in your own words what you understand about ${ws.topic}.`,
      `Give 3 examples of ${ws.topic} from your daily life.`,
      `Fill in the blanks based on what you know about ${ws.topic}.`,
      `True or False? Write T or F and give a reason for each answer.`,
      `Match the following items related to ${ws.topic}.`,
      `Draw a diagram to illustrate the concept of ${ws.topic}.`,
      `Write a short paragraph explaining ${ws.topic} as if teaching a younger student.`,
      `Calculate and show your steps: a ${ws.topic} problem with two parts.`,
      `Colour or shade the correct answers in the ${ws.topic} grid below.`,
    ]
    return templates.slice(0, Math.min(ws.questionCount, 10))
  }, [ws])

  return (
    <motion.div initial={{ opacity:0, x:30 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:30 }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.5)', zIndex:200, display:'flex', justifyContent:'flex-end' }}
      onClick={onClose}>
      <motion.div
        initial={{ x:420 }} animate={{ x:0 }} exit={{ x:420 }}
        style={{ width:'min(560px,100vw)', background:'#fff', height:'100%', overflowY:'auto', padding:0, display:'flex', flexDirection:'column' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ background:'linear-gradient(135deg,#4F46E5,#7C3AED)', padding:'24px 24px 20px', flexShrink:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:6, fontSize:12 }}>
              <ArrowLeft size={13}/> Back
            </button>
            <div style={{ display:'flex', gap:6 }}>
              <button style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                <Printer size={12}/> Print
              </button>
              <button style={{ background:'rgba(255,255,255,0.2)', border:'none', borderRadius:8, padding:'6px 10px', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', gap:5, fontSize:12 }}>
                <Send size={12}/> Send via WhatsApp
              </button>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:'rgba(255,255,255,0.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24 }}>
              {SUBJECT_ICONS[ws.subject]}
            </div>
            <div>
              <h2 style={{ fontSize:20, fontWeight:900, color:'#fff', marginBottom:4 }}>{ws.title}</h2>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, background:'rgba(255,255,255,0.2)', color:'#fff' }}>Grade {ws.grade}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, background:cc.bg, color:cc.color, fontWeight:700 }}>{cc.label}</span>
                <span style={{ fontSize:11, padding:'2px 8px', borderRadius:5, background:'rgba(255,255,255,0.2)', color:'#fff' }}>{ws.estimatedMinutes} min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:24, flex:1 }}>
          <div style={{ background:'#F8FAFC', borderRadius:12, padding:'14px 16px', marginBottom:20, border:'1px solid #E2E8F0' }}>
            <p style={{ fontSize:13, color:'#374151', lineHeight:1.6 }}>{ws.description}</p>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginTop:10 }}>
              {ws.tags.map(t => (
                <span key={t} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#EEF2FF', color:'#4F46E5' }}>{t}</span>
              ))}
            </div>
          </div>

          {submitted ? (
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
              style={{ textAlign:'center', padding:'32px 16px' }}>
              <div style={{ fontSize:48, marginBottom:12 }}>🎉</div>
              <div style={{ fontSize:18, fontWeight:800, color:'#059669', marginBottom:8 }}>Worksheet Submitted!</div>
              <div style={{ fontSize:13, color:'#64748B', marginBottom:20 }}>Great work! +10 XP has been added to your streak.</div>
              <div style={{ background:'#ECFDF5', border:'1px solid #A7F3D0', borderRadius:12, padding:'14px 16px', marginBottom:16 }}>
                <p style={{ fontSize:12, color:'#065F46', fontWeight:600 }}>AI Review in Progress</p>
                <p style={{ fontSize:11, color:'#064E3B', marginTop:4 }}>Your answers have been sent for AI grading. Results will appear in the Parent Dashboard.</p>
              </div>
              <button onClick={() => { setSubmitted(false); setAnswers(Array(ws.questionCount).fill('')) }}
                className="btn btn-secondary" style={{ fontSize:13 }}>
                Try Another Worksheet
              </button>
            </motion.div>
          ) : (
            <>
              <div style={{ marginBottom:16, display:'flex', alignItems:'center', gap:8 }}>
                <BookOpen size={16} color="#4F46E5"/>
                <span style={{ fontSize:14, fontWeight:700, color:'#0F172A' }}>Practice Questions</span>
                <span style={{ fontSize:11, color:'#94A3B8' }}>({ws.questionCount} questions · {ws.estimatedMinutes} minutes)</span>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:16, marginBottom:24 }}>
                {sampleQuestions.map((q, i) => (
                  <div key={i} style={{ background:'#FAFAFA', border:'1px solid #E2E8F0', borderRadius:10, padding:16 }}>
                    <div style={{ display:'flex', gap:10, marginBottom:10 }}>
                      <div style={{ width:24, height:24, borderRadius:6, background:'#4F46E5', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>
                        {i+1}
                      </div>
                      <p style={{ fontSize:13, color:'#374151', lineHeight:1.6, flex:1 }}>{q}</p>
                    </div>
                    {/* Whiteboard answer area */}
                    <div style={{ background:'#fff', border:'1.5px solid #CBD5E1', borderRadius:8, padding:12, minHeight:80, position:'relative' }}>
                      <textarea
                        value={answers[i]}
                        onChange={e => { const a = [...answers]; a[i] = e.target.value; setAnswers(a) }}
                        placeholder="Write your answer here…"
                        style={{ width:'100%', border:'none', outline:'none', resize:'none', fontSize:13, color:'#374151', background:'transparent', minHeight:64, fontFamily:'inherit', lineHeight:1.6 }}
                        rows={3}
                      />
                      {answers[i] && (
                        <CheckCircle size={14} color="#059669" style={{ position:'absolute', top:8, right:8 }}/>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Whiteboard drawing area */}
              <div style={{ background:'#FAFAFA', border:'2px dashed #CBD5E1', borderRadius:12, padding:20, marginBottom:20, textAlign:'center' }}>
                <div style={{ fontSize:24, marginBottom:8 }}>✏️</div>
                <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:4 }}>Diagram / Working Space</div>
                <div style={{ fontSize:11, color:'#94A3B8' }}>Use the app's whiteboard tool or print and solve on paper.</div>
                <button className="btn btn-secondary" style={{ marginTop:12, fontSize:12, padding:'8px 16px' }}>
                  Open Whiteboard
                </button>
              </div>

              <button
                onClick={() => setSubmitted(true)}
                className="btn btn-success"
                style={{ width:'100%', padding:'14px 0', fontSize:14 }}>
                ✅ Submit Worksheet · +10 XP
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function Resources() {
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const defaultGrade = activeKid?.grade ? parseInt(activeKid.grade.replace(/\D/g,'')) || 4 : 4

  const [selectedGrade, setSelectedGrade] = useState(defaultGrade)
  const [selectedSubject, setSelectedSubject] = useState<WorksheetSubject | null>(null)
  const [selectedComplexity, setSelectedComplexity] = useState<WorksheetComplexity | null>(null)
  const [search, setSearch] = useState('')
  const [openWs, setOpenWs] = useState<Worksheet | null>(null)
  const [showFilter, setShowFilter] = useState(false)

  const availableSubjects = SUBJECTS_BY_GRADE[selectedGrade] ?? []

  const filtered = useMemo(() => {
    return WORKSHEETS.filter(w => {
      if (w.grade !== selectedGrade) return false
      if (selectedSubject && w.subject !== selectedSubject) return false
      if (selectedComplexity && w.complexity !== selectedComplexity) return false
      if (search && !w.title.toLowerCase().includes(search.toLowerCase()) &&
          !w.topic.toLowerCase().includes(search.toLowerCase()) &&
          !w.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [selectedGrade, selectedSubject, selectedComplexity, search])

  const stats = useMemo(() => ({
    total: WORKSHEETS.filter(w => w.grade === selectedGrade).length,
    easy: WORKSHEETS.filter(w => w.grade === selectedGrade && w.complexity === 'easy').length,
    medium: WORKSHEETS.filter(w => w.grade === selectedGrade && w.complexity === 'medium').length,
    hard: WORKSHEETS.filter(w => w.grade === selectedGrade && w.complexity === 'hard').length,
  }), [selectedGrade])

  return (
    <div className="page-container" style={{ maxWidth:960 }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:24 }}>
        <p className="label" style={{ marginBottom:4 }}>Learning Resources</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', color:'#0F172A' }}>
              Worksheets & Practice
            </h1>
            <p style={{ fontSize:13, color:'#64748B', marginTop:4 }}>
              {activeKid ? `Showing Grade ${selectedGrade} worksheets • Personalised for ${activeKid.name}` : 'Select a grade to browse worksheets'}
            </p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setShowFilter(!showFilter)} className={`btn ${showFilter ? 'btn-primary' : 'btn-secondary'}`} style={{ fontSize:12, gap:5 }}>
              <Filter size={13}/> Filter
            </button>
          </div>
        </div>
      </motion.div>

      {/* Grade Selector */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1, transition:{ delay:0.05 } }}
        style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4, flexWrap:'wrap' }}>
        {GRADES.map(g => (
          <button key={g} onClick={() => { setSelectedGrade(g); setSelectedSubject(null) }}
            style={{
              padding:'8px 16px', borderRadius:10, border:'none', cursor:'pointer', fontWeight:700, fontSize:13, flexShrink:0,
              background: selectedGrade === g ? '#4F46E5' : '#F1F5F9',
              color: selectedGrade === g ? '#fff' : '#64748B',
              boxShadow: selectedGrade === g ? '0 2px 8px rgba(79,70,229,0.25)' : 'none',
              transition: 'all 0.15s',
            }}>
            Grade {g}
            {g === defaultGrade && activeKid && <span style={{ marginLeft:4, fontSize:10 }}>⭐</span>}
          </button>
        ))}
      </motion.div>

      {/* Stats row */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.08 }}
        style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Total', value:stats.total, color:'#4F46E5', bg:'#EEF2FF' },
          { label:'Easy', value:stats.easy, color:'#059669', bg:'#ECFDF5' },
          { label:'Medium', value:stats.medium, color:'#D97706', bg:'#FFFBEB' },
          { label:'Hard', value:stats.hard, color:'#DC2626', bg:'#FEF2F2' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'14px 16px', textAlign:'center' }}>
            <div style={{ fontSize:22, fontWeight:900, color:s.color }}>{s.value}</div>
            <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{s.label} worksheets</div>
          </div>
        ))}
      </motion.div>

      {/* Subject Tiles */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.1 }} style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:13, fontWeight:700, color:'#374151' }}>Filter by Subject</span>
          {selectedSubject && (
            <button onClick={() => setSelectedSubject(null)}
              style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color:'#64748B', background:'#F1F5F9', border:'none', borderRadius:5, padding:'3px 8px', cursor:'pointer' }}>
              <X size={10}/> Clear
            </button>
          )}
        </div>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          {availableSubjects.map(subj => {
            const active = selectedSubject === subj
            const count = WORKSHEETS.filter(w => w.grade === selectedGrade && w.subject === subj).length
            return (
              <motion.button key={subj} whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }}
                onClick={() => setSelectedSubject(active ? null : subj)}
                style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:6,
                  padding:'14px 20px', borderRadius:14, border:`2px solid ${active ? '#4F46E5' : '#E2E8F0'}`,
                  background: active ? '#EEF2FF' : '#FAFAFA', cursor:'pointer',
                  boxShadow: active ? '0 0 0 3px rgba(79,70,229,0.15)' : 'none', transition:'all 0.15s',
                  minWidth:90,
                }}>
                <span style={{ fontSize:28 }}>{SUBJECT_ICONS[subj]}</span>
                <span style={{ fontSize:12, fontWeight:700, color: active ? '#4F46E5' : '#374151' }}>{subj}</span>
                <span style={{ fontSize:10, color:'#94A3B8' }}>{count} sheets</span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Filter Panel */}
      <AnimatePresence>
        {showFilter && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden', marginBottom:16 }}>
            <div className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', gap:20, flexWrap:'wrap', alignItems:'flex-start' }}>
                <div>
                  <p style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Complexity</p>
                  <div style={{ display:'flex', gap:6 }}>
                    {(['easy','medium','hard'] as WorksheetComplexity[]).map(c => {
                      const cc = COMPLEXITY_COLORS[c]
                      return (
                        <button key={c} onClick={() => setSelectedComplexity(selectedComplexity === c ? null : c)}
                          style={{
                            padding:'6px 14px', borderRadius:8, border:`1.5px solid ${selectedComplexity === c ? cc.color : '#E2E8F0'}`,
                            background: selectedComplexity === c ? cc.bg : '#fff', color: selectedComplexity === c ? cc.color : '#64748B',
                            fontWeight:700, fontSize:12, cursor:'pointer',
                          }}>
                          {cc.label}
                        </button>
                      )
                    })}
                  </div>
                </div>
                <div style={{ flex:1, minWidth:200 }}>
                  <p style={{ fontSize:12, fontWeight:700, color:'#374151', marginBottom:8 }}>Search</p>
                  <div style={{ position:'relative' }}>
                    <Search size={13} color="#94A3B8" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}/>
                    <input className="input" value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search by topic or keyword…" style={{ paddingLeft:30, fontSize:12 }}/>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div style={{ marginBottom:12, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:13, color:'#64748B', fontWeight:600 }}>
          {filtered.length} worksheet{filtered.length !== 1 ? 's' : ''} found
        </span>
        {(selectedSubject || selectedComplexity || search) && (
          <button onClick={() => { setSelectedSubject(null); setSelectedComplexity(null); setSearch('') }}
            style={{ fontSize:12, color:'#4F46E5', background:'none', border:'none', cursor:'pointer', fontWeight:600 }}>
            Clear all filters
          </button>
        )}
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
              className="card" style={{ padding:40, textAlign:'center' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:14, color:'#64748B' }}>No worksheets match your filters. Try adjusting the grade or subject.</div>
            </motion.div>
          ) : (
            filtered.map(ws => (
              <WorksheetCard key={ws.id} ws={ws} onClick={() => setOpenWs(ws)}/>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Worksheet Detail Panel */}
      <AnimatePresence>
        {openWs && <WorksheetDetail ws={openWs} onClose={() => setOpenWs(null)}/>}
      </AnimatePresence>

    </div>
  )
}
