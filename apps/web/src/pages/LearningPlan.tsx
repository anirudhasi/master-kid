import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { RefreshCw, ChevronUp, ChevronDown, CheckCircle, Clock, Zap, Target, BookOpen, FlaskConical, Dumbbell, Music2, AlertCircle, Trophy, Calendar, ChevronRight } from 'lucide-react'
import { useAppStore, type LearningSlot, type SlotType } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'

const SLOT_COLORS: Record<SlotType, { bg: string; border: string; color: string; label: string }> = {
  study:    { bg:'#EEF2FF', border:'#A5B4FC', color:'#4338CA', label:'Study'     },
  revision: { bg:'#FFFBEB', border:'#FCD34D', color:'#B45309', label:'Revision'  },
  practice: { bg:'#ECFDF5', border:'#6EE7B7', color:'#065F46', label:'Practice'  },
  test:     { bg:'#FEF2F2', border:'#FCA5A5', color:'#B91C1C', label:'Test ⚡'   },
  sports:   { bg:'#ECFEFF', border:'#67E8F9', color:'#0E7490', label:'Sports'    },
  activity: { bg:'#F5F3FF', border:'#C4B5FD', color:'#5B21B6', label:'Activity'  },
}

const SLOT_ICONS: Record<SlotType, React.ElementType> = {
  study: BookOpen, revision: RefreshCw, practice: FlaskConical,
  test: AlertCircle, sports: Dumbbell, activity: Music2,
}

const TIME_COLORS = {
  morning:   { label:'🌅 Morning',   color:'#D97706' },
  afternoon: { label:'☀️ Afternoon', color:'#0891B2' },
  evening:   { label:'🌙 Evening',   color:'#7C3AED' },
}

const fade = (d = 0) => ({
  initial:{opacity:0,y:12}, animate:{opacity:1,y:0},
  transition:{duration:0.4,delay:d,ease:[0.16,1,0.3,1]},
})

function SlotCard({ slot, dayLabel, index, total }: { slot: LearningSlot; dayLabel: string; index: number; total: number }) {
  const { toggleSlotComplete, moveSlot } = useAppStore()
  const sc   = SLOT_COLORS[slot.type]
  const Icon = SLOT_ICONS[slot.type]
  return (
    <div style={{
      display:'flex', alignItems:'flex-start', gap:10,
      padding:'12px 14px', borderRadius:10,
      background: slot.completed ? '#F8FAFC' : sc.bg,
      border:`1px solid ${slot.completed ? '#E2E8F0' : sc.border}`,
      opacity: slot.completed ? 0.65 : 1,
      transition:'all 0.2s',
    }}>
      {/* Complete toggle */}
      <button onClick={() => toggleSlotComplete(dayLabel, slot.id)}
        style={{
          width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:1, cursor:'pointer',
          border:`2px solid ${slot.completed ? '#059669' : sc.border}`,
          background: slot.completed ? '#059669' : 'transparent',
          display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s',
        }}>
        {slot.completed && <span style={{fontSize:10,color:'#fff',fontWeight:900}}>✓</span>}
      </button>

      {/* Content */}
      <div style={{flex:1, minWidth:0}}>
        <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:2}}>
          <span style={{fontSize:11,fontWeight:700,padding:'2px 7px',borderRadius:6,background:sc.bg,color:sc.color,border:`1px solid ${sc.border}`}}>
            {sc.label}
          </span>
          <span style={{fontSize:11,color:'#94A3B8'}}>{slot.durationMinutes} min</span>
        </div>
        <div style={{fontSize:13,fontWeight:700,color:slot.completed?'#94A3B8':'#0F172A',textDecoration:slot.completed?'line-through':'none',marginBottom:2}}>
          {slot.topic}
        </div>
        <div style={{fontSize:12,color:'#64748B',fontWeight:600}}>{slot.subject}</div>
        {slot.materials.length > 0 && !slot.completed && (
          <div style={{display:'flex',flexWrap:'wrap',gap:4,marginTop:6}}>
            {slot.materials.map(m => (
              <span key={m.title} style={{fontSize:10,padding:'2px 7px',borderRadius:5,background:'#F1F5F9',color:'#475569',border:'1px solid #E2E8F0'}}>
                📖 {m.platform || m.type}
              </span>
            ))}
          </div>
        )}
        {slot.notes && <div style={{fontSize:11,color:'#94A3B8',marginTop:4,fontStyle:'italic'}}>{slot.notes}</div>}
      </div>

      {/* Reorder */}
      <div style={{display:'flex',flexDirection:'column',gap:2,flexShrink:0}}>
        <button onClick={() => moveSlot(dayLabel,slot.id,'up')} disabled={index===0}
          style={{padding:'2px 4px',background:'none',border:'none',cursor:index===0?'default':'pointer',opacity:index===0?0.2:0.5,transition:'opacity 0.15s'}}>
          <ChevronUp size={13}/>
        </button>
        <button onClick={() => moveSlot(dayLabel,slot.id,'down')} disabled={index===total-1}
          style={{padding:'2px 4px',background:'none',border:'none',cursor:index===total-1?'default':'pointer',opacity:index===total-1?0.2:0.5,transition:'opacity 0.15s'}}>
          <ChevronDown size={13}/>
        </button>
      </div>
    </div>
  )
}

export default function LearningPlan() {
  const { profile, weeklyPlan, isGeneratingPlan, generatePlan } = useAppStore()
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const childName = activeKid?.name ?? 'Student'
  const [activeDay, setActiveDay] = useState(0)
  const [view, setView] = useState<'week'|'journey'|'tests'>('week')

  if (!weeklyPlan) return (
    <div className="page-container" style={{textAlign:'center',paddingTop:80}}>
      <p style={{fontSize:14,color:'#64748B',marginBottom:20}}>No learning plan yet. Generate one!</p>
      <button onClick={generatePlan} className="btn btn-primary">Generate My Plan</button>
    </div>
  )

  const currentDay = weeklyPlan.days[activeDay]
  const completed  = currentDay.slots.filter(s=>s.completed).length
  const totalSlots = currentDay.slots.length
  const pct        = totalSlots > 0 ? (completed/totalSlots)*100 : 0

  const timeGroups = ['morning','afternoon','evening'] as const
  const groupedSlots = timeGroups.map(t => ({
    time: t,
    slots: currentDay.slots.map((s,i)=>({...s,_idx:i})).filter(s=>s.timeOfDay===t),
  })).filter(g=>g.slots.length>0)

  return (
    <div className="page-container">

      {/* Header */}
      <motion.div {...fade(0)} style={{marginBottom:24}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <div>
            <p className="label" style={{marginBottom:4}}>AI-Powered · {activeKid?.board ?? weeklyPlan.board} · {activeKid?.grade ?? weeklyPlan.grade}</p>
            <h1 style={{fontSize:28,fontWeight:900,letterSpacing:'-0.04em',color:'#0F172A',lineHeight:1.1}}>
              {childName}'s Learning Plan
            </h1>
            <p style={{fontSize:13,color:'#64748B',marginTop:4}}>
              Personalised for {activeKid?.board ?? weeklyPlan.board} {activeKid?.grade ?? weeklyPlan.grade} · {activeKid?.school ?? ''}
            </p>
          </div>
          <button onClick={generatePlan} disabled={isGeneratingPlan} className="btn btn-secondary"
            style={{fontSize:12,padding:'8px 16px',display:'flex',alignItems:'center',gap:6}}>
            <RefreshCw size={13} className={isGeneratingPlan?'animate-spin':''} />
            {isGeneratingPlan ? 'Generating…' : 'Regenerate Plan'}
          </button>
        </div>
      </motion.div>

      {/* View switcher */}
      <motion.div {...fade(0.05)} style={{display:'flex',gap:6,marginBottom:20}}>
        {(['week','journey','tests'] as const).map(v => (
          <button key={v} onClick={()=>setView(v)} className={`btn ${view===v?'btn-primary':'btn-ghost'}`}
            style={{fontSize:12,padding:'7px 16px'}}>
            {v==='week'?'📅 This Week':v==='journey'?'🚀 My Journey':'📝 Upcoming Tests'}
          </button>
        ))}
      </motion.div>

      {/* ── WEEK VIEW ──────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
      {view==='week' && (
        <motion.div key="week" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>

          {/* Day tabs */}
          <div style={{display:'flex',gap:6,marginBottom:20,overflowX:'auto',paddingBottom:4}}>
            {weeklyPlan.days.map((d,i) => {
              const done = d.slots.filter(s=>s.completed).length
              const active = i===activeDay
              return (
                <button key={d.day} onClick={()=>setActiveDay(i)}
                  style={{
                    flexShrink:0, padding:'8px 14px', borderRadius:10, cursor:'pointer',
                    border:`1.5px solid ${active?'#6366F1':'#DCE8F5'}`,
                    background:active?'#4F46E5':d.isHoliday?'#FEF9C3':'#fff',
                    transition:'all 0.15s',
                  }}>
                  <div style={{fontSize:11,fontWeight:700,color:active?'#fff':d.isHoliday?'#B45309':'#64748B',marginBottom:2}}>
                    {d.day.slice(0,3).toUpperCase()}
                  </div>
                  <div style={{fontSize:10,color:active?'rgba(255,255,255,0.7)':d.isHoliday?'#D97706':'#94A3B8'}}>
                    {d.isHoliday?'🏖️':`${done}/${d.slots.length}`}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Day header */}
          <div className="card" style={{padding:20,marginBottom:16}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#0F172A'}}>{currentDay.day}</div>
                <div style={{fontSize:12,color:'#94A3B8'}}>{currentDay.date}</div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:22,fontWeight:900,color:pct===100?'#059669':'#4F46E5'}}>{Math.round(pct)}%</div>
                <div style={{fontSize:11,color:'#94A3B8'}}>{completed}/{totalSlots} done</div>
              </div>
            </div>
            <div className="progress-track">
              <motion.div className="progress-fill" initial={{width:0}} animate={{width:`${pct}%`}}
                style={{background:pct===100?'#059669':'linear-gradient(90deg,#4F46E5,#7C3AED)'}}
                transition={{duration:0.8,ease:[0.16,1,0.3,1]}} />
            </div>
            {pct===100 && (
              <p style={{fontSize:12,color:'#059669',fontWeight:700,marginTop:8}}>
                🎉 Perfect day! All tasks completed. You earned bonus XP!
              </p>
            )}
          </div>

          {currentDay.isHoliday ? (
            <div className="card" style={{padding:32,textAlign:'center'}}>
              <div style={{fontSize:48,marginBottom:12}}>🏖️</div>
              <div style={{fontSize:16,fontWeight:700,color:'#0F172A',marginBottom:6}}>{currentDay.holidayName || 'Holiday!'}</div>
              <div style={{fontSize:13,color:'#64748B'}}>Enjoy your day off — rest is part of the plan too. See you tomorrow!</div>
            </div>
          ) : groupedSlots.length === 0 ? (
            <div className="card" style={{padding:32,textAlign:'center'}}>
              <div style={{fontSize:13,color:'#94A3B8'}}>Light day — no scheduled slots. Perfect time for free reading or rest.</div>
            </div>
          ) : (
            <div style={{display:'flex',flexDirection:'column',gap:14}}>
              {groupedSlots.map(group => (
                <div key={group.time}>
                  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:TIME_COLORS[group.time].color}}>
                      {TIME_COLORS[group.time].label}
                    </span>
                    <div style={{flex:1,height:1,background:'#DCE8F5'}}/>
                    <span style={{fontSize:11,color:'#94A3B8'}}>
                      {group.slots.reduce((a,s)=>a+s.durationMinutes,0)} min
                    </span>
                  </div>
                  <div style={{display:'flex',flexDirection:'column',gap:8}}>
                    {group.slots.map((slot,idx) => (
                      <SlotCard key={slot.id} slot={slot} dayLabel={currentDay.day}
                        index={currentDay.slots.findIndex(s=>s.id===slot.id)}
                        total={currentDay.slots.length} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* ── JOURNEY VIEW ──────────────────────────────────────────────────── */}
      {view==='journey' && (
        <motion.div key="journey" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <div className="card" style={{padding:28,marginBottom:20}}>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:20}}>
              <div style={{width:48,height:48,borderRadius:14,background:'linear-gradient(135deg,#4F46E5,#7C3AED)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>🚀</div>
              <div>
                <div style={{fontSize:16,fontWeight:800,color:'#0F172A'}}>Your Journey to Success</div>
                <div style={{fontSize:13,color:'#64748B'}}>Goal: <strong style={{color:'#4F46E5'}}>{activeKid?.onboarding?.lifeGoal ?? profile.lifeGoal}</strong></div>
              </div>
            </div>
            {(() => {
              const targetYear = activeKid?.onboarding?.targetYear ?? profile.targetYear
              return (
                <div style={{display:'flex',alignItems:'center',gap:8,padding:'10px 14px',borderRadius:10,background:'#ECFDF5',border:'1px solid #A7F3D0',marginBottom:20}}>
                  <Trophy size={14} color="#059669"/>
                  <span style={{fontSize:12,color:'#065F46',fontWeight:600}}>Target Year: {targetYear} · You have {targetYear - new Date().getFullYear()} years to get there</span>
                </div>
              )
            })()}

            {/* Milestones */}
            <div style={{position:'relative'}}>
              <div style={{position:'absolute',left:20,top:0,bottom:0,width:2,background:'#E2E8F0',zIndex:0}}/>
              <div style={{display:'flex',flexDirection:'column',gap:0}}>
                {weeklyPlan.journeyMilestones.map((m,i) => {
                  const isNow = i===0
                  return (
                    <div key={m.grade} style={{display:'flex',alignItems:'flex-start',gap:16,padding:'16px 0',position:'relative',zIndex:1}}>
                      <div style={{
                        width:40,height:40,borderRadius:'50%',flexShrink:0,
                        background:isNow?'#4F46E5':'#fff',
                        border:`2px solid ${isNow?'#4F46E5':'#DCE8F5'}`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        fontSize:18,boxShadow:isNow?'0 0 0 4px rgba(99,102,241,0.15)':'none',
                      }}>{m.emoji}</div>
                      <div style={{flex:1,paddingTop:6}}>
                        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
                          <span style={{fontSize:13,fontWeight:800,color:isNow?'#4F46E5':'#0F172A'}}>{m.grade}</span>
                          <span style={{fontSize:11,color:'#94A3B8'}}>{m.year}</span>
                          {isNow && <span className="badge badge-brand" style={{fontSize:10}}>You are here</span>}
                        </div>
                        <div style={{fontSize:12,color:'#64748B',marginBottom:4}}>{m.focus}</div>
                        <div style={{display:'flex',alignItems:'center',gap:6}}>
                          <Target size={11} color="#4F46E5"/>
                          <span style={{fontSize:11,fontWeight:600,color:'#4F46E5'}}>{m.keyGoal}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Subject progress toward goal */}
          <div className="card" style={{padding:24}}>
            <p style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:4}}>Foundation Subjects for {(activeKid?.onboarding?.lifeGoal ?? profile.lifeGoal).split('–')[0].trim()}</p>
            <p style={{fontSize:12,color:'#94A3B8',marginBottom:16}}>Build these strong now — they're the pillars of your goal</p>
            {Object.entries(activeKid?.onboarding?.subjectGoalMins ?? {}).map(([subject, weeklyMinutes]) => (
              <div key={subject} style={{display:'flex',alignItems:'center',gap:12,marginBottom:10}}>
                <span style={{fontSize:12,fontWeight:700,color:'#374151',width:72,flexShrink:0}}>{subject}</span>
                <div style={{flex:1}}>
                  <div className="progress-track">
                    <div style={{height:'100%',borderRadius:4,background:'linear-gradient(90deg,#4F46E5,#7C3AED)',width:'45%',transition:'width 0.8s'}}/>
                  </div>
                </div>
                <span style={{fontSize:11,color:'#64748B',flexShrink:0,width:60,textAlign:'right'}}>{weeklyMinutes} min/wk</span>
              </div>
            ))}
            <div style={{marginTop:14,padding:'12px 14px',borderRadius:10,background:'#EEF2FF',border:'1px solid #C7D2FE'}}>
              <p style={{fontSize:12,color:'#4338CA',fontWeight:600,lineHeight:1.6}}>
                💡 AI Insight: At your current pace, you'll complete the Grade 5 foundation by end of term.
                Prioritise Math and Science — they're critical for your JEE goal.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── TESTS VIEW ────────────────────────────────────────────────────── */}
      {view==='tests' && (
        <motion.div key="tests" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div className="card" style={{padding:20}}>
              <p style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:16}}>Upcoming Tests & Assessments</p>
              {weeklyPlan.upcomingTests.map(test => {
                const daysLeft = Math.round((new Date(test.date).getTime()-Date.now())/(1000*60*60*24))
                const urgent   = daysLeft <= 3
                return (
                  <div key={test.id} style={{
                    display:'flex',alignItems:'center',gap:14,padding:'14px 16px',borderRadius:10,marginBottom:10,
                    background:urgent?'#FEF2F2':'#F5F9FE',
                    border:`1px solid ${urgent?'#FCA5A5':'#DCE8F5'}`,
                  }}>
                    <div style={{
                      width:44,height:44,borderRadius:12,flexShrink:0,
                      background:urgent?'#DC2626':'#4F46E5',
                      display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    }}>
                      <span style={{fontSize:11,fontWeight:800,color:'#fff'}}>{daysLeft <= 0 ? 'NOW' : `${daysLeft}d`}</span>
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:700,color:'#0F172A',marginBottom:2}}>{test.subject}</div>
                      <div style={{fontSize:11,color:'#64748B'}}>{test.topics.join(' · ')}</div>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}>
                      <span className={`badge ${test.type==='surprise'?'badge-rose':test.type==='mock'?'badge-amber':'badge-brand'}`} style={{fontSize:10}}>
                        {test.type==='surprise'?'⚡ Surprise':test.type==='mock'?'📝 Mock':'📅 Scheduled'}
                      </span>
                      <div style={{fontSize:11,color:'#94A3B8',marginTop:4}}>{test.date}</div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Upload answer sheet CTA */}
            <Link to="/assistant" style={{textDecoration:'none'}}>
              <div className="card" style={{
                padding:20, cursor:'pointer',
                background:'linear-gradient(135deg,#EEF2FF 0%,#F5F3FF 100%)',
                border:'1px solid #C7D2FE',
              }}>
                <div style={{display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:44,height:44,borderRadius:12,background:'#4F46E5',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20}}>📷</div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:14,fontWeight:700,color:'#0F172A',marginBottom:2}}>Upload & Check Answer Sheet</div>
                    <div style={{fontSize:12,color:'#64748B'}}>Take a photo of the test paper → AI grades it, gives marks & improvement tips</div>
                  </div>
                  <ChevronRight size={18} color="#6366F1"/>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  )
}
