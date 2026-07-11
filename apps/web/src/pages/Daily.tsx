import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Flame, Target, Eye, Check, Gamepad2, BookOpen, Sparkles, ChevronRight,
  Trophy, Film, MapPin, CalendarDays,
} from 'lucide-react'
import { useAuthStore } from '@/modules/identity'
import { useEngagementStore, todayState } from '@/store/engagementStore'
import { buildDailyFeed, dayKey } from '@/lib/dailyFeed'
import { GRADE_LADDER, currentGradeIndex } from '@/lib/grades'
import QuoteOfDay from '@/components/QuoteOfDay'
import { COMPETITIONS, MOVIES, TRIPS, tierFor } from '@/data/engagementCatalog'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"
const TASKS = ['riddle', 'words', 'proverb', 'game'] as const

export default function Daily() {
  const navigate = useNavigate()
  const { activeKidId, kids } = useAuthStore()
  const kid = kids.find(k => k.id === activeKidId)
  const byChild = useEngagementStore(s => s.byChild)
  const markTask = useEngagementStore(s => s.markTask)
  const [reveal, setReveal] = useState<Record<string, boolean>>({})

  if (!kid) return null
  const grade = GRADE_LADDER[currentGradeIndex(kid.grade)]
  const subjects = kid.onboarding?.subjects ?? []
  const dk = dayKey()
  const feed = buildDailyFeed(kid.id, grade, subjects, dk)
  const { done, streak } = todayState(byChild, kid.id, dk)
  const total = TASKS.length
  const completed = TASKS.filter(t => done.includes(t)).length
  const pct = Math.round((completed / total) * 100)

  const mark = (task: string) => markTask(kid.id, dk, task, total)
  const open = (task: string) => { setReveal(r => ({ ...r, [task]: true })); mark(task) }
  const isWeekend = [0, 6].includes(new Date().getDay())

  return (
    <div style={{ padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 820, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Hi {kid.name}! 👋</h1>
          <p style={{ fontSize: 13.5, color: '#64748B', marginTop: 2 }}>Here's your plan for {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ProgressRing pct={pct} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 14, background: '#FFF7ED', border: '1px solid #FED7AA' }}>
            <Flame size={18} color="#EA580C" /><div><div style={{ fontSize: 18, fontWeight: 900, color: '#C2410C', lineHeight: 1 }}>{streak}</div><div style={{ fontSize: 10, color: '#9A3412', fontWeight: 700 }}>day streak</div></div>
          </div>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}><QuoteOfDay /></div>

      {/* Today's focus */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '16px 18px', borderRadius: 16, background: 'linear-gradient(135deg,#EEF2FF,#F5F3FF)', border: '1px solid #DDD6FE', marginBottom: 20 }}>
        <Target size={22} color={P} style={{ flexShrink: 0 }} />
        <div><div style={{ fontSize: 11, fontWeight: 800, color: P, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today's focus</div><div style={{ fontSize: 14.5, fontWeight: 700, color: '#0F172A', marginTop: 2 }}>{feed.focus}</div></div>
      </div>

      <h2 style={sectionH}>Your daily challenge <span style={{ fontWeight: 700, color: '#94A3B8' }}>· {completed}/{total} done</span></h2>
      <div style={{ display: 'grid', gap: 12, marginBottom: 28 }}>
        {/* Riddle */}
        <TaskCard icon={<Sparkles size={16} />} color="#7C3AED" title="Riddle of the day" done={done.includes('riddle')}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', lineHeight: 1.5 }}>{feed.riddle?.prompt ?? 'No riddle today.'}</div>
          {feed.riddle && (reveal.riddle
            ? <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 9, background: '#F5F3FF', fontSize: 13.5, color: '#1F2937' }}><strong style={{ color: '#7C3AED' }}>Answer: </strong>{feed.riddle.answer}</div>
            : <button onClick={() => open('riddle')} style={{ ...taskBtn, color: '#7C3AED', borderColor: '#DDD6FE' }}><Eye size={14} /> Reveal</button>)}
        </TaskCard>

        {/* 5 words */}
        <TaskCard icon={<BookOpen size={16} />} color="#059669" title="5 new words" done={done.includes('words')}>
          {!reveal.words
            ? <button onClick={() => open('words')} style={{ ...taskBtn, color: '#059669', borderColor: '#A7F3D0' }}><Eye size={14} /> Show today's words</button>
            : <div style={{ display: 'grid', gap: 6, marginTop: 4 }}>
                {feed.words.map(w => <div key={w.id} style={{ fontSize: 13 }}><strong style={{ color: '#065F46' }}>{w.word}</strong> <span style={{ color: '#64748B' }}>— {w.meaning}</span></div>)}
              </div>}
        </TaskCard>

        {/* Proverb */}
        <TaskCard icon={<span style={{ fontSize: 16 }}>🦉</span>} color="#D97706" title="Proverb of the day" done={done.includes('proverb')}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{feed.proverb?.prompt ?? 'No proverb today.'}</div>
          {feed.proverb && (reveal.proverb
            ? <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 9, background: '#FFFBEB', fontSize: 13.5, color: '#1F2937' }}><strong style={{ color: '#D97706' }}>Means: </strong>{feed.proverb.answer}</div>
            : <button onClick={() => open('proverb')} style={{ ...taskBtn, color: '#D97706', borderColor: '#FDE68A' }}><Eye size={14} /> What does it mean?</button>)}
        </TaskCard>

        {/* Game */}
        <TaskCard icon={<Gamepad2 size={16} />} color="#0EA5E9" title="Today's game" done={done.includes('game')}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{feed.game?.title ?? feed.game?.type === 'sudoku' ? 'Mini Sudoku' : 'A quick brain game'}</div>
          <button onClick={() => { mark('game'); navigate('/fun') }} style={{ ...taskBtn, color: '#0EA5E9', borderColor: '#BAE6FD' }}><Gamepad2 size={14} /> Play in Fun & Knowledge <ChevronRight size={13} /></button>
        </TaskCard>
      </div>

      {/* Weekend Bonanza */}
      <h2 style={sectionH}>🎉 Weekend Bonanza {isWeekend && <span style={{ fontSize: 11, fontWeight: 800, padding: '3px 9px', borderRadius: 8, background: '#FEF3C7', color: '#92400E', marginLeft: 6 }}>LIVE NOW</span>}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 12 }}>
        <BonanzaCard icon={<Trophy size={18} color="#D97706" />} title="Weekly quiz" tint="#FFFBEB">
          <div style={{ fontSize: 12.5, color: '#475569', marginBottom: 10 }}>Test the week's learning and earn XP.</div>
          <button onClick={() => navigate('/fun')} style={{ ...taskBtn, color: '#D97706', borderColor: '#FDE68A' }}>Take the quiz <ChevronRight size={13} /></button>
        </BonanzaCard>
        <BonanzaCard icon={<CalendarDays size={18} color="#4F46E5" />} title="Local competitions" tint="#EEF2FF">
          {COMPETITIONS.slice(0, 3).map(c => <Line key={c.title} emoji={c.emoji} title={c.title} note={c.note} />)}
        </BonanzaCard>
        <BonanzaCard icon={<Film size={18} color="#DB2777" />} title="Movie pick" tint="#FCE7F3">
          {tierFor(MOVIES, kid.age || 9).slice(0, 2).map(m => <Line key={m.title} emoji={m.emoji} title={m.title} note={m.note} />)}
        </BonanzaCard>
        <BonanzaCard icon={<MapPin size={18} color="#16A34A" />} title="Weekend outing" tint="#F0FDF4">
          {tierFor(TRIPS, kid.age || 9).slice(0, 2).map(t => <Line key={t.title} emoji={t.emoji} title={t.title} note={t.note} />)}
        </BonanzaCard>
      </div>
    </div>
  )
}

// ── bits ─────────────────────────────────────────────────────────────────────
const sectionH: React.CSSProperties = { fontSize: 17, fontWeight: 900, color: '#0F172A', margin: '6px 0 12px' }
const taskBtn: React.CSSProperties = { alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 13px', borderRadius: 9, border: '1.5px solid', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 800, fontFamily: FONT, marginTop: 10 }

function ProgressRing({ pct }: { pct: number }) {
  const r = 22, c = 2 * Math.PI * r
  return (
    <div style={{ position: 'relative', width: 56, height: 56 }}>
      <svg width={56} height={56} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="#EEF0F5" strokeWidth={6} />
        <circle cx={28} cy={28} r={r} fill="none" stroke={P} strokeWidth={6} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} style={{ transition: 'stroke-dashoffset 0.5s' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: P }}>{pct}%</div>
    </div>
  )
}

function TaskCard({ icon, color, title, done, children }: { icon: React.ReactNode; color: string; title: string; done: boolean; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: `1px solid ${done ? '#BBF7D0' : '#EEF0F5'}`, padding: 16, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: color + '18', color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 13.5, fontWeight: 900, color: '#0F172A', flex: 1 }}>{title}</span>
        {done && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 800, color: '#16A34A' }}><Check size={14} /> Done</span>}
      </div>
      {children}
    </div>
  )
}

function BonanzaCard({ icon, title, tint, children }: { icon: React.ReactNode; title: string; tint: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #EEF0F5', padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: tint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <span style={{ fontSize: 14, fontWeight: 900, color: '#0F172A' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Line({ emoji, title, note }: { emoji: string; title: string; note: string }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
      <span style={{ fontSize: 16 }}>{emoji}</span>
      <div><div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{title}</div><div style={{ fontSize: 11.5, color: '#64748B' }}>{note}</div></div>
    </div>
  )
}
