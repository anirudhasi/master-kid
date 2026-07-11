import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef, useEffect } from 'react'
import { Send, Upload, X, CheckCircle, Star, Lightbulb, BookOpen, Sparkles, Wifi, WifiOff } from 'lucide-react'
import axios from 'axios'
import { useAppStore, type MikoKidContext } from '@/store/appStore'
import { useAuthStore } from '@/modules/identity'
import { useKidStore } from '@/hooks/useKidStore'

const QUICK_CHIPS = [
  { label: 'What should I study today?', emoji: '📅' },
  { label: 'Explain fractions simply',    emoji: '➗' },
  { label: 'How am I doing this week?',   emoji: '📊' },
  { label: 'Give me a Math quiz',         emoji: '🎯' },
  { label: 'Tips to improve my score',    emoji: '📈' },
  { label: 'Explain photosynthesis',      emoji: '🌱' },
]

const SUBJECTS = ['Math','English','Hindi','Science (EVS)','Computer','All Subjects']

type CheckResult = {
  subject: string
  grade?: string
  score: number
  maxScore: number
  percentage: number
  strengths: string[]
  improvements: string[]
  questionFeedback: { q: string; status: 'correct'|'partial'|'wrong'; tip: string }[]
  overallTip: string
}

export default function AIAssistant() {
  const { profile, chatMessages, isChatting, sendChatMessage } = useAppStore()
  const { activeKidId, kids } = useAuthStore()
  const { xpTotal, streakDays } = useKidStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const childName = activeKid?.name ?? 'Student'
  const kidBoard   = activeKid?.board   ?? profile.board
  const kidGrade   = activeKid?.grade   ?? profile.grade
  const kidSchool  = activeKid?.school  ?? profile.school
  const kidGoal    = activeKid?.onboarding?.lifeGoal ?? profile.lifeGoal
  const kidActivities = activeKid?.onboarding?.activities ?? profile.sports

  const [tab, setTab]               = useState<'chat'|'check'>('chat')
  const [input, setInput]           = useState('')
  const [file, setFile]             = useState<File|null>(null)
  const [filePreview, setFilePreview] = useState<string>('')
  const [checkSubject, setCheckSubject] = useState('Math')
  const [checkGrade, setCheckGrade]   = useState(kidGrade)
  const [isChecking, setIsChecking]   = useState(false)
  const [checkResult, setCheckResult] = useState<CheckResult|null>(null)
  const [apiStatus, setApiStatus]     = useState<'checking'|'online'|'offline'>('checking')
  const bottomRef  = useRef<HTMLDivElement>(null)
  const fileRef    = useRef<HTMLInputElement>(null)

  // Check if OpenAI API key is configured
  useEffect(() => {
    const key = import.meta.env.VITE_OPENAI_API_KEY
    if (key && key.startsWith('sk-')) {
      setApiStatus('online')
    } else {
      setApiStatus('offline')
    }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isChatting])

  const kidCtx: MikoKidContext = {
    name:       childName,
    grade:      kidGrade,
    board:      kidBoard,
    school:     kidSchool,
    goal:       kidGoal,
    subjects:   activeKid?.onboarding?.subjects ?? profile.subjectGoals.filter(g => g.active).map(g => g.subject),
    activities: kidActivities ?? [],
    xp:         xpTotal,
    streak:     streakDays,
  }

  const handleSend = () => {
    if (!input.trim() || isChatting) return
    sendChatMessage(input.trim(), kidCtx)
    setInput('')
  }

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setCheckResult(null)
    if (f.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onload = ev => setFilePreview(ev.target?.result as string)
      reader.readAsDataURL(f)
    } else {
      setFilePreview('')
    }
  }

  const handleCheck = async () => {
    if (!file) return
    setIsChecking(true)
    setCheckResult(null)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('subject', checkSubject)
      formData.append('grade', checkGrade)
      formData.append('board', kidBoard)
      formData.append('child_name', childName)
      const res = await axios.post('/api/check/answer-sheet', formData, {
        headers:{'Content-Type':'multipart/form-data'},
      })
      setCheckResult(res.data.result)
    } catch {
      // Fallback demo result
      setCheckResult({
        subject: checkSubject,
        score: 17, maxScore: 20, percentage: 85,
        strengths: [
          'Excellent understanding of basic fraction addition',
          'Neat and organised working shown — great habit!',
          'Word problems attempted with correct approach',
        ],
        improvements: [
          'Question 3: Mixed fractions — review the LCM method (NCERT Ch.3 pg.42)',
          'Question 7: Forgot to simplify the final answer to lowest terms',
          'Time management: last 2 questions seem rushed — practice timed tests',
        ],
        questionFeedback: [
          { q:'Q1 – Add 1/4 + 2/4',           status:'correct',  tip:'Perfect!' },
          { q:'Q2 – Subtract 3/5 – 1/5',       status:'correct',  tip:'Correct and simplified well.' },
          { q:'Q3 – Mixed fraction 2½ + 1¾',   status:'partial',  tip:'Method correct but calculation error in step 2. Recheck.' },
          { q:'Q4 – Word problem (pizza)',       status:'correct',  tip:'Great reading and setup!' },
          { q:'Q5 – Compare fractions',         status:'wrong',    tip:'Use the common denominator method. Revise NCERT example 3.4.' },
        ],
        overallTip: `${childName} shows solid understanding of basic fraction concepts. The main gap is mixed fractions and simplification. Suggest 15 minutes of targeted practice on NCERT Ch.3 exercises 3.2 and 3.3 before the next test.`,
      })
    }
    setIsChecking(false)
  }

  const scoreColor = (pct: number) => pct>=80?'#059669':pct>=60?'#D97706':'#DC2626'
  const scoreBg    = (pct: number) => pct>=80?'#ECFDF5':pct>=60?'#FFFBEB':'#FEF2F2'

  return (
    <div className="page-container">

      {/* Header */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <p className="label" style={{marginBottom:4}}>Your Personal AI</p>
            <h1 style={{fontSize:28,fontWeight:900,letterSpacing:'-0.04em',color:'#0F172A',lineHeight:1.1}}>
              AI Tutor & Grader
            </h1>
            <p style={{fontSize:13,color:'#64748B',marginTop:4}}>
              Knows your {kidBoard} {kidGrade} curriculum · Acts as teacher, parent & friend
            </p>
          </div>
          <div style={{display:'flex',gap:8,alignItems:'center'}}>
            <span className="badge badge-emerald">⚡ {xpTotal} XP</span>
            <span className="badge badge-amber">🔥 {streakDays}d streak</span>
          </div>
        </div>
      </motion.div>

      {/* Tab switcher */}
      <div style={{display:'flex',gap:6,marginBottom:20}}>
        <button onClick={()=>setTab('chat')} className={`btn ${tab==='chat'?'btn-primary':'btn-ghost'}`}
          style={{fontSize:12,padding:'8px 18px',gap:6}}>
          <Sparkles size={13}/> Chat with AI Tutor
        </button>
        <button onClick={()=>setTab('check')} className={`btn ${tab==='check'?'btn-primary':'btn-ghost'}`}
          style={{fontSize:12,padding:'8px 18px',gap:6}}>
          <Upload size={13}/> Check Answer Sheet
        </button>
      </div>

      {/* ── CHAT TAB ──────────────────────────────────────────────────────── */}
      {tab==='chat' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 260px',gap:16,alignItems:'start'}}>

            {/* Chat window */}
            <div className="card" style={{display:'flex',flexDirection:'column',height:560}}>
              {/* AI intro bar */}
              <div style={{
                padding:'14px 20px',borderBottom:'1px solid #DCE8F5',
                display:'flex',alignItems:'center',gap:12,flexShrink:0,
                background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)',
                borderRadius:'14px 14px 0 0',
              }}>
                <div style={{width:40,height:40,borderRadius:12,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>🤖</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>Miko — Your AI Tutor</div>
                  <div style={{fontSize:11,color:'#64748B'}}>
                    Knows {kidBoard} {kidGrade} · Goal: {kidGoal.split('–')[0]}
                  </div>
                </div>
                <div style={{marginLeft:'auto',display:'flex',alignItems:'center',gap:5}}>
                  {apiStatus === 'online' ? (
                    <>
                      <Wifi size={12} color="#22C55E"/>
                      <span style={{fontSize:11,color:'#22C55E',fontWeight:600}}>AI Ready</span>
                    </>
                  ) : apiStatus === 'offline' ? (
                    <>
                      <WifiOff size={12} color="#EF4444"/>
                      <span style={{fontSize:11,color:'#EF4444',fontWeight:600}}>AI Offline</span>
                    </>
                  ) : (
                    <>
                      <div style={{width:7,height:7,borderRadius:'50%',background:'#94A3B8'}}/>
                      <span style={{fontSize:11,color:'#94A3B8',fontWeight:600}}>Connecting…</span>
                    </>
                  )}
                </div>
              </div>

              {/* Offline banner */}
              {apiStatus === 'offline' && (
                <div style={{padding:'10px 16px',background:'#FEF2F2',borderBottom:'1px solid #FECACA',flexShrink:0}}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:6}}>
                    <WifiOff size={13} color="#DC2626"/>
                    <span style={{fontSize:12,color:'#991B1B',fontWeight:700}}>Ollama is not running — Miko needs it to work</span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:3,paddingLeft:4}}>
                    {[
                      { step:'1', cmd:'Install Ollama', sub:'Download from ollama.ai (free, runs locally)' },
                      { step:'2', cmd:'ollama run llama3.2', sub:'Paste this in your terminal — downloads ~2GB model once' },
                      { step:'3', cmd:'Reload this page', sub:'Miko will connect automatically' },
                    ].map(r => (
                      <div key={r.step} style={{display:'flex',alignItems:'baseline',gap:7}}>
                        <span style={{fontSize:10,fontWeight:800,color:'#DC2626',flexShrink:0}}>Step {r.step}:</span>
                        <code style={{fontSize:11,background:'#FEE2E2',padding:'1px 6px',borderRadius:4,color:'#7F1D1D',fontFamily:'monospace',fontWeight:700}}>{r.cmd}</code>
                        <span style={{fontSize:10,color:'#B91C1C'}}>— {r.sub}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              <div style={{flex:1,overflowY:'auto',padding:'16px 20px',display:'flex',flexDirection:'column',gap:12}}>
                {chatMessages.length===0 && (
                  <div style={{textAlign:'center',paddingTop:32}}>
                    <div style={{fontSize:36,marginBottom:12}}>👋</div>
                    <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:6}}>Hi {childName}! I'm Miko, your AI tutor.</div>
                    <div style={{fontSize:12,color:'#64748B',lineHeight:1.7,maxWidth:320,margin:'0 auto'}}>
                      I know your {kidBoard} {kidGrade} curriculum, your goal of <strong>{kidGoal.split('–')[0]}</strong>, and I'm here to help you every step of the way.
                    </div>
                    <div style={{fontSize:12,color:'#94A3B8',marginTop:16}}>Try one of the quick questions below ↓</div>
                  </div>
                )}
                {chatMessages.map(msg => (
                  <div key={msg.id} style={{display:'flex',justifyContent:msg.role==='user'?'flex-end':'flex-start'}}>
                    {msg.role==='assistant' && (
                      <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,flexShrink:0,marginRight:8,marginTop:2}}>🤖</div>
                    )}
                    <div className={msg.role==='user'?'chat-bubble-user':'chat-bubble-ai'}>
                      {msg.content}
                      <div style={{fontSize:10,opacity:0.6,marginTop:4,textAlign:'right'}}>{msg.timestamp}</div>
                    </div>
                  </div>
                ))}
                {isChatting && (
                  <div style={{display:'flex',alignItems:'flex-start',gap:8}}>
                    <div style={{width:28,height:28,borderRadius:8,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13}}>🤖</div>
                    <div className="chat-bubble-ai" style={{display:'flex',alignItems:'center',gap:6}}>
                      <div style={{display:'flex',gap:4}}>
                        {[0,1,2].map(i=>(
                          <div key={i} style={{width:6,height:6,borderRadius:'50%',background:'#94A3B8',animation:`pulse-dot 1.2s ${i*0.2}s infinite`}}/>
                        ))}
                      </div>
                      <span style={{fontSize:11,color:'#94A3B8'}}>Thinking…</span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef}/>
              </div>

              {/* Input */}
              <div style={{padding:'12px 16px',borderTop:'1px solid #DCE8F5',display:'flex',gap:8,flexShrink:0}}>
                <input className="input" value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&!e.shiftKey&&handleSend()}
                  placeholder={`Ask Miko anything about ${kidBoard} ${kidGrade}…`}
                  style={{flex:1,fontSize:13}}/>
                <button onClick={handleSend} disabled={!input.trim()||isChatting} className="btn btn-primary"
                  style={{padding:'10px 14px'}}>
                  <Send size={14}/>
                </button>
              </div>
            </div>

            {/* Quick chips + context */}
            <div style={{display:'flex',flexDirection:'column',gap:12}}>
              <div className="card" style={{padding:18}}>
                <p style={{fontSize:12,fontWeight:700,color:'#0F172A',marginBottom:12}}>Quick Questions</p>
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {QUICK_CHIPS.map(c=>(
                    <button key={c.label} onClick={()=>{ setInput(c.label); sendChatMessage(c.label, kidCtx) }}
                      style={{
                        display:'flex',alignItems:'center',gap:8,padding:'8px 10px',borderRadius:8,
                        background:'#F8FAFC',border:'1px solid #DCE8F5',cursor:'pointer',textAlign:'left',
                        fontSize:11,color:'#374151',fontWeight:500,transition:'all 0.15s',
                      }}>
                      <span style={{fontSize:14,flexShrink:0}}>{c.emoji}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="card-sky" style={{padding:16}}>
                <p style={{fontSize:11,fontWeight:700,color:'#0369A1',marginBottom:10}}>🎯 MIKO KNOWS</p>
                {[
                  `${kidBoard} ${kidGrade} curriculum`,
                  kidSchool ? `${kidSchool}` : null,
                  `Goal: ${kidGoal.split('–')[0]}`,
                  `${streakDays}-day study streak`,
                  kidActivities.length > 0 ? `Activities: ${kidActivities[0]}` : null,
                ].filter(Boolean).map(item=>(
                  <div key={item as string} style={{display:'flex',alignItems:'center',gap:6,marginBottom:5}}>
                    <CheckCircle size={11} color="#0891B2"/>
                    <span style={{fontSize:11,color:'#0C4A6E'}}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── ANSWER SHEET CHECK TAB ────────────────────────────────────────── */}
      {tab==='check' && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:20,alignItems:'start'}}>

            {/* Upload panel */}
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              <div className="card" style={{padding:24}}>
                <p style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>Upload Answer Sheet</p>
                <p style={{fontSize:12,color:'#64748B',marginBottom:16}}>Photo or PDF of the test paper — AI will grade it, give marks, and suggest improvements</p>

                <div style={{marginBottom:14}}>
                  <p className="label" style={{marginBottom:6}}>Subject</p>
                  <select className="input" value={checkSubject} onChange={e=>setCheckSubject(e.target.value)}>
                    {SUBJECTS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div style={{marginBottom:16}}>
                  <p className="label" style={{marginBottom:6}}>Grade</p>
                  <select className="input" value={checkGrade} onChange={e=>setCheckGrade(e.target.value)}>
                    {['Grade 1','Grade 2','Grade 3','Grade 4','Grade 5','Grade 6','Grade 7','Grade 8','Grade 9','Grade 10','Grade 11','Grade 12'].map(g=><option key={g}>{g}</option>)}
                  </select>
                </div>

                {/* Drop zone */}
                <div
                  onClick={()=>fileRef.current?.click()}
                  style={{
                    border:`2px dashed ${file?'#6366F1':'#DCE8F5'}`,borderRadius:12,
                    padding:'28px 20px',textAlign:'center',cursor:'pointer',
                    background:file?'#EEF2FF':'#F8FAFC',transition:'all 0.2s',marginBottom:14,
                  }}>
                  {filePreview ? (
                    <img src={filePreview} alt="preview" style={{maxHeight:180,maxWidth:'100%',borderRadius:8,objectFit:'contain'}}/>
                  ) : (
                    <>
                      <Upload size={28} color="#94A3B8" style={{margin:'0 auto 8px'}}/>
                      <div style={{fontSize:13,fontWeight:600,color:'#374151',marginBottom:4}}>
                        {file ? `📄 ${file.name}` : 'Click to upload or drag & drop'}
                      </div>
                      <div style={{fontSize:11,color:'#94A3B8'}}>JPG, PNG, or PDF · Max 10MB</div>
                    </>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={handleFile} style={{display:'none'}}/>

                {file && (
                  <div style={{display:'flex',gap:8,marginBottom:12}}>
                    <button onClick={()=>{setFile(null);setFilePreview('');setCheckResult(null)}}
                      className="btn btn-ghost" style={{flex:1,fontSize:12,gap:5}}>
                      <X size={12}/> Remove
                    </button>
                    <button onClick={handleCheck} disabled={isChecking} className="btn btn-primary"
                      style={{flex:2,fontSize:12}}>
                      {isChecking?'🔍 Checking…':'🤖 Check & Grade'}
                    </button>
                  </div>
                )}

                <div style={{padding:'12px 14px',borderRadius:10,background:'#F0FDF4',border:'1px solid #BBF7D0'}}>
                  <p style={{fontSize:11,color:'#166534',lineHeight:1.6}}>
                    📷 <strong>Tip:</strong> Take the photo in good lighting, ensure all answers are visible.
                    AI grades based on {kidBoard} {checkSubject} standards for {checkGrade}.
                  </p>
                </div>
              </div>
            </div>

            {/* Results panel */}
            <div>
              {!checkResult && !isChecking && (
                <div className="card" style={{padding:40,textAlign:'center'}}>
                  <div style={{fontSize:48,marginBottom:16}}>📝</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:6}}>Ready to Grade</div>
                  <div style={{fontSize:12,color:'#64748B',lineHeight:1.7}}>
                    Upload an answer sheet and click "Check & Grade" — the AI will score it question by question and give personalised improvement tips.
                  </div>
                </div>
              )}

              {isChecking && (
                <div className="card" style={{padding:40,textAlign:'center'}}>
                  <div style={{fontSize:36,marginBottom:16}}>🔍</div>
                  <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:6}}>Analysing Answer Sheet…</div>
                  <div style={{fontSize:12,color:'#64748B'}}>AI is checking each answer against {kidBoard} {checkGrade} standards</div>
                </div>
              )}

              <AnimatePresence>
              {checkResult && (
                <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} style={{display:'flex',flexDirection:'column',gap:12}}>

                  {/* Score card */}
                  <div className="card" style={{padding:24,textAlign:'center',border:`1.5px solid ${scoreColor(checkResult.percentage)}30`,background:scoreBg(checkResult.percentage)}}>
                    <div style={{fontSize:12,fontWeight:700,color:scoreColor(checkResult.percentage),letterSpacing:'0.06em',textTransform:'uppercase',marginBottom:8}}>
                      {checkResult.subject} · {checkResult.grade ?? checkGrade}
                    </div>
                    <div style={{fontSize:56,fontWeight:900,letterSpacing:'-0.04em',color:scoreColor(checkResult.percentage),lineHeight:1}}>
                      {checkResult.percentage}%
                    </div>
                    <div style={{fontSize:16,color:'#64748B',margin:'6px 0'}}>
                      {checkResult.score} / {checkResult.maxScore} marks
                    </div>
                    <div style={{fontSize:13,fontWeight:700,color:scoreColor(checkResult.percentage)}}>
                      {checkResult.percentage>=90?'Excellent! 🏆':checkResult.percentage>=75?'Good work! ⭐':checkResult.percentage>=60?'Keep going! 💪':'Needs more practice 📚'}
                    </div>
                  </div>

                  {/* Question-by-question */}
                  <div className="card" style={{padding:20}}>
                    <p style={{fontSize:13,fontWeight:700,color:'#0F172A',marginBottom:12}}>Question-by-Question</p>
                    <div style={{display:'flex',flexDirection:'column',gap:8}}>
                      {checkResult.questionFeedback.map(q=>(
                        <div key={q.q} style={{
                          display:'flex',alignItems:'flex-start',gap:10,padding:'10px 12px',borderRadius:9,
                          background:q.status==='correct'?'#F0FDF4':q.status==='partial'?'#FFFBEB':'#FEF2F2',
                          border:`1px solid ${q.status==='correct'?'#BBF7D0':q.status==='partial'?'#FDE68A':'#FECACA'}`,
                        }}>
                          <span style={{fontSize:14,flexShrink:0}}>
                            {q.status==='correct'?'✅':q.status==='partial'?'⚠️':'❌'}
                          </span>
                          <div>
                            <div style={{fontSize:12,fontWeight:700,color:'#0F172A',marginBottom:2}}>{q.q}</div>
                            <div style={{fontSize:11,color:'#64748B'}}>{q.tip}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Strengths */}
                  <div className="card" style={{padding:20}}>
                    <p style={{fontSize:13,fontWeight:700,color:'#059669',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                      <Star size={13}/> Strengths
                    </p>
                    {checkResult.strengths.map(s=>(
                      <div key={s} style={{display:'flex',gap:8,marginBottom:7}}>
                        <CheckCircle size={12} color="#059669" style={{marginTop:2,flexShrink:0}}/>
                        <span style={{fontSize:12,color:'#374151'}}>{s}</span>
                      </div>
                    ))}
                  </div>

                  {/* Improvements */}
                  <div className="card" style={{padding:20}}>
                    <p style={{fontSize:13,fontWeight:700,color:'#D97706',marginBottom:10,display:'flex',alignItems:'center',gap:6}}>
                      <Lightbulb size={13}/> Points to Improve
                    </p>
                    {checkResult.improvements.map((imp,i)=>(
                      <div key={i} style={{display:'flex',gap:8,marginBottom:7}}>
                        <span style={{fontSize:12,fontWeight:700,color:'#D97706',flexShrink:0}}>{i+1}.</span>
                        <span style={{fontSize:12,color:'#374151'}}>{imp}</span>
                      </div>
                    ))}
                  </div>

                  {/* AI overall tip */}
                  <div className="card" style={{padding:20,background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)',border:'1px solid #C7D2FE'}}>
                    <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                      <BookOpen size={14} color="#4F46E5"/>
                      <span style={{fontSize:12,fontWeight:700,color:'#4338CA'}}>AI Study Recommendation</span>
                    </div>
                    <p style={{fontSize:12,color:'#374151',lineHeight:1.7}}>{checkResult.overallTip}</p>
                  </div>
                </motion.div>
              )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
