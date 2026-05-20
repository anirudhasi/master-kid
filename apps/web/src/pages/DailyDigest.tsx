import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Send, Clock, BookOpen, Zap, Bell, CheckCircle, ChevronRight, Shuffle, MessageCircle } from 'lucide-react'
import { WORKSHEETS, SUBJECT_ICONS, COMPLEXITY_COLORS } from '@/data/worksheetsData'
import { FUN_FACTS, RIDDLES, VOCABULARY_WORDS, POEMS_AND_PHRASES } from '@/data/funContentData'
import { useAuthStore } from '@/store/authStore'

const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function todayLabel() {
  const d = new Date()
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function seededRandom(seed: number) {
  // Deterministic random based on date so same digest shows all day
  let s = seed
  return () => { s = (s * 16807 + 0) % 2147483647; return (s - 1) / 2147483646 }
}

function useTodayDigest(grade: number, kidAge: number) {
  const seed = useMemo(() => {
    const d = new Date()
    return d.getFullYear() * 10000 + (d.getMonth()+1) * 100 + d.getDate()
  }, [])

  return useMemo(() => {
    const rand = seededRandom(seed)
    const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]

    const gradeWs = WORKSHEETS.filter(w => w.grade === grade)
    const worksheet = pick(gradeWs)
    const bonusWs   = pick(gradeWs.filter(w => w.id !== worksheet?.id))

    const ageGroup = kidAge <= 9 ? '6-9' : '10-14'
    const funFact  = pick(FUN_FACTS.filter(f => f.ageGroup === ageGroup))

    const riddleGroup = kidAge <= 7 ? '5-7' : kidAge <= 10 ? '8-10' : '11-14'
    const riddle   = pick(RIDDLES.filter(r => r.ageGroup === riddleGroup))

    const vocab    = pick(VOCABULARY_WORDS.filter(v => v.grade === grade))

    const poem     = pick(POEMS_AND_PHRASES.filter(p => p.type === 'quote' || p.type === 'poem'))

    return { worksheet, bonusWs, funFact, riddle, vocab, poem }
  }, [seed, grade, kidAge])
}

function WhatsAppPreview({ kidName, grade, digest }: {
  kidName: string, grade: number, digest: ReturnType<typeof useTodayDigest>
}) {
  const { worksheet, funFact, riddle, vocab } = digest
  if (!worksheet) return null
  const cc = COMPLEXITY_COLORS[worksheet.complexity]

  const message = `🌟 *Good Morning!* Here's ${kidName}'s Daily Learning Digest 📚

📅 *${todayLabel()}* | Grade ${grade}

━━━━━━━━━━━━━━━━━━━━━
📝 *TODAY'S WORKSHEET*
━━━━━━━━━━━━━━━━━━━━━
${SUBJECT_ICONS[worksheet.subject]} *${worksheet.title}*
Topic: ${worksheet.topic}
Difficulty: ${cc.label} | ⏱ ${worksheet.estimatedMinutes} mins
📎 Open worksheet: masterkids.app/ws/${worksheet.id}

━━━━━━━━━━━━━━━━━━━━━
🌟 *DID YOU KNOW?*
━━━━━━━━━━━━━━━━━━━━━
${funFact?.fact ?? ''}

━━━━━━━━━━━━━━━━━━━━━
🤔 *TODAY'S RIDDLE*
━━━━━━━━━━━━━━━━━━━━━
${riddle?.riddle ?? ''}
_(Reply with your answer!)_

━━━━━━━━━━━━━━━━━━━━━
📖 *WORD OF THE DAY*
━━━━━━━━━━━━━━━━━━━━━
*${vocab?.word ?? ''}* — ${vocab?.meaning ?? ''}
_"${vocab?.example ?? ''}"_

Happy learning! 🚀
_Powered by Master-Kids_`

  return (
    <div style={{ background:'#ECE5DD', borderRadius:14, padding:20, fontFamily:'system-ui', position:'relative', overflow:'hidden' }}>
      {/* WhatsApp header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16, paddingBottom:12, borderBottom:'1px solid rgba(0,0,0,0.1)' }}>
        <div style={{ width:36, height:36, borderRadius:'50%', background:'#25D366', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>👨‍👩‍👧</div>
        <div>
          <div style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>Master-Kids</div>
          <div style={{ fontSize:11, color:'#666' }}>Daily Learning Digest · 6:00 AM</div>
        </div>
        <div style={{ marginLeft:'auto', fontSize:11, color:'#666' }}>6:00 AM</div>
      </div>

      {/* Message bubble */}
      <div style={{ background:'#fff', borderRadius:'0 12px 12px 12px', padding:'14px 16px', boxShadow:'0 1px 2px rgba(0,0,0,0.1)', maxWidth:'90%', position:'relative' }}>
        <div style={{ position:'absolute', left:-8, top:0, width:0, height:0, borderTop:'8px solid #fff', borderLeft:'8px solid transparent' }}/>
        <pre style={{ fontSize:12, lineHeight:1.7, whiteSpace:'pre-wrap', color:'#1a1a1a', margin:0, fontFamily:'inherit' }}>
          {message}
        </pre>
        <div style={{ fontSize:10, color:'#999', textAlign:'right', marginTop:6 }}>6:00 AM ✓✓</div>
      </div>

      {/* Watermark */}
      <div style={{ position:'absolute', bottom:12, right:16, fontSize:11, color:'rgba(0,0,0,0.25)', fontWeight:700 }}>
        WhatsApp Preview
      </div>
    </div>
  )
}

function DigestCard({
  icon, color, bg, title, subtitle, children,
}: { icon: string; color: string; bg: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="card" style={{ padding:24, borderLeft:`3px solid ${color}` }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
        <div style={{ width:38, height:38, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>{icon}</div>
        <div>
          <div style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>{title}</div>
          <div style={{ fontSize:11, color:'#94A3B8' }}>{subtitle}</div>
        </div>
      </div>
      {children}
    </div>
  )
}

export default function DailyDigest() {
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const kidName   = activeKid?.name ?? 'Your Child'
  const kidAge    = activeKid?.age ?? 10
  const gradeNum  = activeKid?.grade ? parseInt(activeKid.grade.replace(/\D/g,'')) || 4 : 4

  const digest = useTodayDigest(gradeNum, kidAge)
  const [sent, setSent] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)
  const [riddleRevealed, setRiddleRevealed] = useState(false)
  const [cardFlipped, setCardFlipped] = useState(false)
  const [refreshSeed, setRefreshSeed] = useState(0)

  const { worksheet, bonusWs, funFact, riddle, vocab, poem } = digest

  if (!worksheet) return (
    <div className="page-container" style={{ textAlign:'center', paddingTop:80 }}>
      <p style={{ color:'#94A3B8' }}>No worksheets available for this grade yet.</p>
    </div>
  )

  const cc = COMPLEXITY_COLORS[worksheet.complexity]

  return (
    <div className="page-container" style={{ maxWidth:820 }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:28 }}>
        <p className="label" style={{ marginBottom:4 }}>Daily Digest</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', color:'#0F172A' }}>
              Good Morning{activeKid ? `, ${kidName}!` : '!'} 🌅
            </h1>
            <p style={{ fontSize:13, color:'#64748B', marginTop:4 }}>{todayLabel()} · Grade {gradeNum} Daily Pack</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => setRefreshSeed(s=>s+1)} className="btn btn-secondary" style={{ fontSize:12, gap:5 }}>
              <Shuffle size={13}/> Refresh
            </button>
            <button onClick={() => setShowWhatsApp(!showWhatsApp)} className="btn btn-primary" style={{ fontSize:12, gap:5 }}>
              <MessageCircle size={13}/> WhatsApp Preview
            </button>
          </div>
        </div>
      </motion.div>

      {/* Send notification banner */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.05 }}
        style={{ background:'linear-gradient(135deg,#25D366,#128C7E)', borderRadius:14, padding:'16px 20px', marginBottom:24, display:'flex', alignItems:'center', gap:16 }}>
        <div style={{ fontSize:28 }}>📲</div>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:14, fontWeight:800, color:'#fff', marginBottom:2 }}>Send Today's Digest to Parent</div>
          <div style={{ fontSize:12, color:'rgba(255,255,255,0.8)' }}>Worksheet + Fun Fact + Riddle + Word of the Day — delivered to WhatsApp at 6 AM daily</div>
        </div>
        <button
          onClick={() => setSent(true)}
          disabled={sent}
          style={{
            padding:'10px 18px', borderRadius:10, border:'none', cursor: sent ? 'default' : 'pointer',
            background: sent ? 'rgba(255,255,255,0.2)' : '#fff',
            color: sent ? 'rgba(255,255,255,0.7)' : '#128C7E',
            fontWeight:800, fontSize:13, display:'flex', alignItems:'center', gap:6, flexShrink:0,
          }}>
          {sent ? <><CheckCircle size={13}/> Sent!</> : <><Send size={13}/> Send Now</>}
        </button>
      </motion.div>

      {/* WhatsApp preview */}
      {showWhatsApp && (
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:24 }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#374151', marginBottom:10 }}>📱 WhatsApp Message Preview</div>
          <WhatsAppPreview kidName={kidName} grade={gradeNum} digest={digest}/>
        </motion.div>
      )}

      {/* Main grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Primary Worksheet */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.08 }}
          style={{ gridColumn:'1/-1' }}>
          <DigestCard icon={SUBJECT_ICONS[worksheet.subject]} color={cc.color} bg={cc.bg}
            title="Today's Worksheet" subtitle={`${worksheet.estimatedMinutes} min · ${worksheet.questionCount} questions`}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#0F172A', marginBottom:4 }}>{worksheet.title}</div>
                <div style={{ fontSize:13, color:'#64748B', marginBottom:12 }}>{worksheet.description}</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  <span style={{ fontSize:11, padding:'3px 9px', borderRadius:6, background:cc.bg, color:cc.color, fontWeight:700 }}>{cc.label}</span>
                  <span style={{ fontSize:11, padding:'3px 9px', borderRadius:6, background:'#EEF2FF', color:'#4F46E5', fontWeight:600 }}>{worksheet.subject}</span>
                  <span style={{ fontSize:11, padding:'3px 9px', borderRadius:6, background:'#F1F5F9', color:'#64748B' }}>📌 {worksheet.topic}</span>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8, flexShrink:0 }}>
                <button className="btn btn-primary" style={{ fontSize:13, gap:6, padding:'10px 20px' }}>
                  <BookOpen size={14}/> Open Worksheet
                </button>
                <button className="btn btn-secondary" style={{ fontSize:12, gap:5 }}>
                  <Send size={12}/> Send to WhatsApp
                </button>
              </div>
            </div>
          </DigestCard>
        </motion.div>

        {/* Fun Fact */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
          <DigestCard icon="🌟" color="#D97706" bg="#FFFBEB" title="Did You Know?" subtitle="Today's fun fact">
            <p style={{ fontSize:14, color:'#1E293B', lineHeight:1.7, marginBottom:10 }}>
              {funFact?.fact}
            </p>
            <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#FEF9C3', color:'#854D0E', fontWeight:600 }}>
              {funFact?.category.charAt(0).toUpperCase()}{funFact?.category.slice(1)}
            </span>
          </DigestCard>
        </motion.div>

        {/* Riddle */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.12 }}>
          <DigestCard icon="🤔" color="#7C3AED" bg="#F5F3FF" title="Brain Teaser" subtitle="Can you solve it?">
            <p style={{ fontSize:14, color:'#1E293B', lineHeight:1.7, marginBottom:14, fontWeight:600 }}>
              {riddle?.riddle}
            </p>
            <button onClick={() => setRiddleRevealed(r => !r)}
              style={{
                width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px dashed #C4B5FD',
                background: riddleRevealed ? '#EDE9FE' : '#F8FAFC', cursor:'pointer',
                fontSize:13, color: riddleRevealed ? '#7C3AED' : '#94A3B8', fontWeight:700,
                transition:'all 0.2s',
              }}>
              {riddleRevealed ? `✅ ${riddle?.answer}` : '👆 Reveal Answer'}
            </button>
          </DigestCard>
        </motion.div>
      </div>

      {/* Bottom row: vocab + poem + bonus worksheet */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>

        {/* Word of the Day */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.14 }}>
          <DigestCard icon="📖" color="#0891B2" bg="#ECFEFF" title="Word of the Day" subtitle={`Grade ${gradeNum} · ${vocab?.difficulty}`}>
            <motion.div
              onClick={() => setCardFlipped(f => !f)}
              animate={{ rotateY: cardFlipped ? 180 : 0 }}
              transition={{ duration:0.4 }}
              style={{ cursor:'pointer', minHeight:80 }}>
              {!cardFlipped ? (
                <div>
                  <div style={{ fontSize:22, fontWeight:900, color:'#0891B2', marginBottom:6 }}>{vocab?.word}</div>
                  <div style={{ fontSize:11, color:'#94A3B8' }}>👆 Tap to reveal meaning</div>
                </div>
              ) : (
                <div>
                  <div style={{ fontSize:13, fontWeight:700, color:'#0C4A6E', marginBottom:6 }}>{vocab?.meaning}</div>
                  <div style={{ fontSize:12, color:'#64748B', fontStyle:'italic', lineHeight:1.5 }}>"{vocab?.example}"</div>
                </div>
              )}
            </motion.div>
          </DigestCard>
        </motion.div>

        {/* Quote / Poem */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.16 }}>
          <DigestCard icon="✨" color="#DB2777" bg="#FDF2F8" title="Inspiring Words" subtitle="Memorise one line today">
            <p style={{ fontSize:13, color:'#1E293B', lineHeight:1.7, fontStyle:'italic', marginBottom:8 }}>
              "{poem?.lines?.split('\n')[0]}"
            </p>
            <div style={{ fontSize:11, color:'#94A3B8' }}>— {poem?.title}</div>
          </DigestCard>
        </motion.div>

        {/* Bonus Worksheet */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.18 }}>
          {bonusWs && (
            <DigestCard icon="⚡" color="#059669" bg="#ECFDF5" title="Bonus Challenge" subtitle="Extra credit · Optional">
              <div style={{ fontSize:14, fontWeight:800, color:'#0F172A', marginBottom:4 }}>{bonusWs.title}</div>
              <div style={{ fontSize:12, color:'#64748B', marginBottom:12 }}>{bonusWs.subject} · {bonusWs.topic}</div>
              <button className="btn btn-secondary" style={{ fontSize:12, gap:5, width:'100%' }}>
                <ChevronRight size={12}/> Open Bonus Sheet
              </button>
            </DigestCard>
          )}
        </motion.div>
      </div>

      {/* Schedule settings */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }}
        className="card" style={{ padding:24 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12, marginBottom:16 }}>
          <div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0F172A', marginBottom:4 }}>⚙️ Digest Schedule Settings</div>
            <div style={{ fontSize:12, color:'#64748B' }}>Customise when and how parents receive the daily digest</div>
          </div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
          {[
            { label:'Delivery Time', value:'6:00 AM', icon:'⏰', desc:'Every school day' },
            { label:'Channel', value:'WhatsApp', icon:'📲', desc:'+91 98765 43210' },
            { label:'Language', value:'English', icon:'🌐', desc:'Hindi available' },
            { label:'Worksheets/Day', value:'2 (1 Main + 1 Bonus)', icon:'📋', desc:'Adjustable' },
          ].map(s => (
            <div key={s.label} style={{ background:'#F8FAFC', borderRadius:10, padding:'14px 16px', border:'1px solid #E2E8F0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
                <span style={{ fontSize:16 }}>{s.icon}</span>
                <span style={{ fontSize:11, color:'#94A3B8' }}>{s.label}</span>
              </div>
              <div style={{ fontSize:13, fontWeight:700, color:'#0F172A', marginBottom:2 }}>{s.value}</div>
              <div style={{ fontSize:11, color:'#94A3B8' }}>{s.desc}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop:16, padding:'12px 16px', borderRadius:10, background:'#EEF2FF', border:'1px solid #C7D2FE' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <Bell size={14} color="#4F46E5"/>
            <span style={{ fontSize:13, color:'#4338CA', fontWeight:700 }}>Smart Scheduling Active</span>
          </div>
          <p style={{ fontSize:12, color:'#4338CA', marginTop:4, lineHeight:1.5 }}>
            The digest automatically skips holidays, adjusts difficulty based on upcoming exams,
            and rotates subjects to ensure balanced weekly coverage. Subjects not yet studied this week get priority.
          </p>
        </div>
      </motion.div>

      {/* Weekly overview */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.22 }}
        className="card" style={{ padding:24, marginTop:16 }}>
        <div style={{ fontSize:15, fontWeight:800, color:'#0F172A', marginBottom:16 }}>📅 This Week's Coverage</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
          {['Mon','Tue','Wed','Thu','Fri'].map((day, i) => {
            const rand2 = seededRandom(new Date().getFullYear() * 1000 + i * 7)
            const ws = WORKSHEETS.filter(w => w.grade === gradeNum)[Math.floor(rand2() * WORKSHEETS.filter(w=>w.grade===gradeNum).length)]
            const isToday = new Date().getDay() === i + 1
            if (!ws) return null
            return (
              <div key={day} style={{
                borderRadius:10, padding:12, textAlign:'center',
                background: isToday ? '#EEF2FF' : '#F8FAFC',
                border: isToday ? '2px solid #4F46E5' : '1px solid #E2E8F0',
              }}>
                <div style={{ fontSize:11, fontWeight:700, color: isToday ? '#4F46E5' : '#94A3B8', marginBottom:6 }}>{day}</div>
                <div style={{ fontSize:18, marginBottom:4 }}>{SUBJECT_ICONS[ws.subject]}</div>
                <div style={{ fontSize:10, fontWeight:700, color:'#374151', lineHeight:1.3 }}>{ws.subject}</div>
                {isToday && <div className="badge badge-brand" style={{ marginTop:6, fontSize:9, padding:'1px 5px' }}>TODAY</div>}
              </div>
            )
          })}
        </div>
        <div style={{ display:'flex', gap:6, marginTop:14, flexWrap:'wrap' }}>
          <div style={{ fontSize:12, color:'#64748B' }}>
            <span style={{ fontWeight:700, color:'#4F46E5' }}>3</span> worksheets completed this week ·&nbsp;
            <span style={{ fontWeight:700, color:'#059669' }}>+30 XP</span> earned
          </div>
        </div>
      </motion.div>

    </div>
  )
}
