import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, ChevronDown, ChevronRight, Calendar, Star } from 'lucide-react'
import { useKidStore } from '@/hooks/useKidStore'
import { useAuthStore } from '@/modules/identity'
import { defaultOlympiadExams } from '@/data/olympiadExamsCatalog'

function daysUntil(dateStr: string) {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function Countdown({ date }: { date: string }) {
  const days = daysUntil(date)
  const color = days <= 30 ? '#DC2626' : days <= 60 ? '#D97706' : '#059669'
  const bg    = days <= 30 ? '#FFF5F5' : days <= 60 ? '#FFFBEB' : '#ECFDF5'
  return (
    <div style={{ textAlign: 'center', padding: '10px 14px', borderRadius: 10, background: bg, border: `1.5px solid ${color}30` }}>
      <div style={{ fontSize: 28, fontWeight: 900, color, lineHeight: 1 }}>{days}</div>
      <div style={{ fontSize: 10, color, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>days left</div>
      <div style={{ fontSize: 10, color: '#94A3B8', marginTop: 2 }}>
        {new Date(date).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'})}
      </div>
    </div>
  )
}

export default function Olympiads() {
  const { olympiads, toggleOlympiadRegistration, ensureOlympiads, hasData } = useKidStore()
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const [activeId, setActiveId] = useState<string | null>(olympiads[0]?.id ?? null)
  const [prepExpanded, setPrepExpanded] = useState(true)

  // Pre-fill the tracker with common olympiads on first visit (feedback).
  useEffect(() => {
    if (activeKidId && hasData && olympiads.length === 0) {
      ensureOlympiads(defaultOlympiadExams(activeKid?.grade))
    }
  }, [activeKidId, hasData, olympiads.length])

  const registered = olympiads.filter(o => o.isRegistered)
  const attending  = olympiads.filter(o => o.isAttending)

  if (olympiads.length === 0) {
    return (
      <div className="page-container">
        <div className="page-header">
          <div>
            <div className="label" style={{ marginBottom: 4 }}>Academic Year 2026–27</div>
            <h1 className="page-title">Olympiads & Competitive Exams</h1>
          </div>
        </div>
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <Trophy size={40} color="#CBD5E1" style={{ margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>No olympiad exams yet</div>
          <div style={{ fontSize: 13, color: '#64748B' }}>
            Olympiad registrations for {activeKid?.name} will appear here once added.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div>
          <div className="label" style={{ marginBottom: 4 }}>Academic Year 2026–27</div>
          <h1 className="page-title">Olympiads & Competitive Exams</h1>
          <p className="page-subtitle">Track registrations, prep progress, and results for all olympiad exams</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, background: '#ECFDF5', border: '1px solid #BBF7D0' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#059669' }}>{registered.length}</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>Registered</div>
          </div>
          <div style={{ textAlign: 'center', padding: '8px 16px', borderRadius: 10, background: '#EEF2FF', border: '1px solid #C7D2FE' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#4F46E5' }}>{attending.length}</div>
            <div style={{ fontSize: 10, color: '#64748B' }}>Attending</div>
          </div>
        </div>
      </div>

      {/* Exam cards list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {olympiads.map(o => {
          const isActive = activeId === o.id
          const days = daysUntil(o.examDate)
          const urgency = days <= 30 ? '#DC2626' : days <= 60 ? '#D97706' : '#4F46E5'

          return (
            <motion.div key={o.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}}
              style={{ border: `1.5px solid ${isActive ? urgency : '#E2E8F0'}`, borderRadius: 12, background: '#fff', overflow: 'hidden', transition: 'border-color 0.2s' }}>

              {/* Card header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => setActiveId(isActive ? null : o.id)}>

                <div style={{
                  width: 44, height: 44, borderRadius: 12, background: isActive ? urgency+'15' : '#F8FAFC',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, flexShrink: 0,
                }}>{o.subjectIcon}</div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{o.shortName}</span>
                    <span style={{ fontSize: 10, color: '#64748B' }}>{o.name}</span>
                    {o.isRegistered && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#DCFCE7', color: '#166534', fontWeight: 600 }}>✓ Registered</span>
                    )}
                    {!o.isRegistered && o.isAttending && (
                      <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 10, background: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>⏳ Planning to Register</span>
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                    {o.organizer} · {o.subject}
                  </div>
                  {/* Prep progress bar */}
                  <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 4, background: '#F1F5F9', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${o.prepProgress}%`, height: '100%', background: urgency, borderRadius: 3, transition: 'width 0.5s' }} />
                    </div>
                    <span style={{ fontSize: 10, color: urgency, fontWeight: 700, minWidth: 30 }}>{o.prepProgress}%</span>
                  </div>
                </div>

                <Countdown date={o.examDate} />

                {isActive ? <ChevronDown size={16} color="#94A3B8" /> : <ChevronRight size={16} color="#94A3B8" />}
              </div>

              {/* Expanded detail */}
              {isActive && (
                <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}}
                  style={{ borderTop: '1px solid #F1F5F9', padding: '16px', background: '#FAFBFF' }}>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fff', border: '1px solid #DCE8F5' }}>
                      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>EXAM DATE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Calendar size={13} color="#4F46E5" />
                        {new Date(o.examDate).toLocaleDateString('en-IN',{weekday:'short',day:'numeric',month:'long'})}
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px', borderRadius: 10, background: '#fff', border: '1px solid #DCE8F5' }}>
                      <div style={{ fontSize: 10, color: '#64748B', marginBottom: 4, fontWeight: 600 }}>REG DEADLINE</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: daysUntil(o.registrationDeadline) <= 14 ? '#DC2626' : '#0F172A' }}>
                        {new Date(o.registrationDeadline).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}
                        {daysUntil(o.registrationDeadline) <= 14 && <span style={{ fontSize: 10, color: '#DC2626', marginLeft: 4 }}>⚠️ Soon!</span>}
                      </div>
                    </div>
                    {o.pastResult && (
                      <div style={{ padding: '10px 12px', borderRadius: 10, background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                        <div style={{ fontSize: 10, color: '#92400E', marginBottom: 4, fontWeight: 600 }}>LAST YEAR ({o.pastResult.year})</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{o.pastResult.rank}</div>
                        <div style={{ fontSize: 11, color: '#B45309' }}>Score: {o.pastResult.score}</div>
                      </div>
                    )}
                  </div>

                  {/* Difficulty note */}
                  <div style={{ padding: '10px 12px', borderRadius: 9, background: '#F0F9FF', border: '1px solid #BAE6FD', marginBottom: 14 }}>
                    <div style={{ fontSize: 11, color: '#0369A1', fontWeight: 600, marginBottom: 3 }}>📌 What to expect</div>
                    <div style={{ fontSize: 12, color: '#0C4A6E' }}>{o.difficultyNote}</div>
                  </div>

                  {/* Prep topics */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#0F172A' }}>Preparation Topics</div>
                      <button onClick={() => setPrepExpanded(!prepExpanded)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                        {prepExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      </button>
                    </div>
                    {prepExpanded && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                        {o.prepTopics.map((topic, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, background: '#fff', border: '1px solid #E2E8F0' }}>
                            <Star size={12} color={urgency} fill={urgency} />
                            <span style={{ fontSize: 12, color: '#374151' }}>{topic}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Registration toggle */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button
                      onClick={() => toggleOlympiadRegistration(o.id)}
                      style={{
                        padding: '8px 18px', borderRadius: 9, border: 'none', cursor: 'pointer',
                        fontWeight: 700, fontSize: 12,
                        background: o.isRegistered ? '#FFF5F5' : '#4F46E5',
                        color: o.isRegistered ? '#DC2626' : '#fff',
                      }}>
                      {o.isRegistered ? '✕ Cancel Registration' : '✓ Mark as Registered'}
                    </button>
                    <button style={{ padding: '8px 18px', borderRadius: 9, border: '1px solid #DCE8F5', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12, color: '#4F46E5' }}>
                      📄 Past Papers
                    </button>
                    <button style={{ padding: '8px 18px', borderRadius: 9, border: '1px solid #DCE8F5', background: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 12, color: '#059669' }}>
                      📚 Study Guide
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Olympiad calendar strip */}
      <div style={{ padding: '16px 18px', borderRadius: 12, background: '#1E293B', color: '#F1F5F9' }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: '#E2E8F0' }}>📅 2026–27 Olympiad Calendar</div>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto' }}>
          {olympiads.map(o => (
            <div key={o.id} style={{
              minWidth: 140, padding: '10px 12px', borderRadius: 9,
              background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 20, marginBottom: 4 }}>{o.subjectIcon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#E2E8F0' }}>{o.shortName}</div>
              <div style={{ fontSize: 10, color: '#64748B', marginBottom: 6 }}>
                {new Date(o.examDate).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}
              </div>
              <div style={{
                fontSize: 10, padding: '2px 7px', borderRadius: 10, display: 'inline-block', fontWeight: 600,
                background: o.isRegistered ? 'rgba(34,197,94,0.2)' : 'rgba(148,163,184,0.2)',
                color: o.isRegistered ? '#4ADE80' : '#94A3B8',
              }}>
                {o.isRegistered ? '✓ Registered' : 'Not registered'}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
