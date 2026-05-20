import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { ChevronRight, ChevronDown, Shuffle } from 'lucide-react'
import {
  STORY_BOOKS, SPORT_ACTIVITIES, YOUTUBE_CHANNELS, VOCABULARY_WORDS,
  RIDDLES, TONGUE_TWISTERS, POEMS_AND_PHRASES, FUN_FACTS, MIND_GAMES,
} from '@/data/funContentData'
import { useAuthStore } from '@/store/authStore'

const TABS = [
  { key:'riddles',   label:'Riddles',       emoji:'🤔' },
  { key:'funfacts',  label:'Fun Facts',     emoji:'🌟' },
  { key:'books',     label:'Story Books',   emoji:'📚' },
  { key:'sports',    label:'Sports',        emoji:'⚽' },
  { key:'youtube',   label:'YouTube',       emoji:'▶️' },
  { key:'vocab',     label:'Vocabulary',    emoji:'📖' },
  { key:'twisters',  label:'Tongue Twisters', emoji:'👅' },
  { key:'poems',     label:'Poems',         emoji:'🎭' },
  { key:'mindgames', label:'Mind Games',    emoji:'🧩' },
]

function RiddleSection({ kidAge }: { kidAge: number }) {
  const [revealed, setRevealed] = useState<Record<number,boolean>>({})
  const [shuffle, setShuffle] = useState(0)
  const filtered = useMemo(() => {
    const group = kidAge <= 7 ? '5-7' : kidAge <= 10 ? '8-10' : '11-14'
    const relevant = RIDDLES.filter(r => r.ageGroup === group)
    return [...relevant].sort(() => Math.random() - 0.5).slice(0, 12)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidAge, shuffle])

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A' }}>🤔 Brain-Teasing Riddles</h2>
          <p style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Tap the answer box to reveal. Can you solve them first?</p>
        </div>
        <button onClick={() => { setShuffle(s=>s+1); setRevealed({}) }}
          className="btn btn-secondary" style={{ fontSize:12, gap:5 }}>
          <Shuffle size={12}/> New Set
        </button>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map((r, i) => (
          <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
            className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', gap:8, marginBottom:12 }}>
              <div style={{ width:24, height:24, borderRadius:6, background:'#EEF2FF', color:'#4F46E5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:800, flexShrink:0 }}>
                {i+1}
              </div>
              <p style={{ fontSize:14, color:'#1E293B', lineHeight:1.6, fontWeight:600 }}>{r.riddle}</p>
            </div>
            <div>
              <button onClick={() => setRevealed(rv => ({ ...rv, [i]: !rv[i] }))}
                style={{
                  width:'100%', padding:'10px 14px', borderRadius:10, border:'1.5px dashed #CBD5E1',
                  background: revealed[i] ? '#ECFDF5' : '#F8FAFC', cursor:'pointer',
                  display:'flex', alignItems:'center', justifyContent:'space-between',
                  fontSize:13, color: revealed[i] ? '#059669' : '#94A3B8', fontWeight:600,
                }}>
                {revealed[i] ? `✅ ${r.answer}` : '👆 Tap to reveal answer'}
                <ChevronDown size={14} style={{ transform: revealed[i] ? 'rotate(180deg)' : 'none', transition:'transform 0.2s' }}/>
              </button>
            </div>
            <div style={{ marginTop:8 }}>
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#F1F5F9', color:'#64748B' }}>{r.category}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function FunFactsSection({ kidAge }: { kidAge: number }) {
  const [shuffle, setShuffle] = useState(0)
  const facts = useMemo(() => {
    const group = kidAge <= 9 ? '6-9' : '10-14'
    return [...FUN_FACTS.filter(f => f.ageGroup === group)].sort(() => Math.random() - 0.5).slice(0, 10)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kidAge, shuffle])

  const catColors: Record<string, { bg:string; color:string; emoji:string }> = {
    science:      { bg:'#EEF2FF', color:'#4F46E5', emoji:'🔬' },
    nature:       { bg:'#ECFDF5', color:'#059669', emoji:'🌿' },
    history:      { bg:'#FFFBEB', color:'#D97706', emoji:'📜' },
    invention:    { bg:'#F5F3FF', color:'#7C3AED', emoji:'💡' },
    'world-record':{ bg:'#FEF2F2', color:'#DC2626', emoji:'🏆' },
    India:        { bg:'#FFF7ED', color:'#EA580C', emoji:'🇮🇳' },
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div>
          <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A' }}>🌟 Did You Know?</h2>
          <p style={{ fontSize:12, color:'#64748B', marginTop:2 }}>Mind-blowing facts to share with everyone!</p>
        </div>
        <button onClick={() => setShuffle(s=>s+1)} className="btn btn-secondary" style={{ fontSize:12, gap:5 }}>
          <Shuffle size={12}/> New Facts
        </button>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {facts.map((f, i) => {
          const cc = catColors[f.category] ?? { bg:'#F1F5F9', color:'#64748B', emoji:'✨' }
          return (
            <motion.div key={i} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.05 }}
              className="card" style={{ padding:20, display:'flex', gap:16, borderLeft:`3px solid ${cc.color}` }}>
              <div style={{ fontSize:32, flexShrink:0 }}>{cc.emoji}</div>
              <div>
                <p style={{ fontSize:14, color:'#1E293B', lineHeight:1.7 }}>{f.fact}</p>
                <span style={{ fontSize:10, marginTop:8, display:'inline-block', padding:'2px 8px', borderRadius:4, background:cc.bg, color:cc.color, fontWeight:700 }}>
                  {f.category.charAt(0).toUpperCase() + f.category.slice(1).replace('-',' ')}
                </span>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function BooksSection({ kidAge }: { kidAge: number }) {
  const groups = [
    { label:'Ages 3–5', min:3, max:5 },
    { label:'Ages 6–8', min:6, max:8 },
    { label:'Ages 9–11', min:9, max:11 },
    { label:'Ages 12–14', min:12, max:14 },
  ]
  const activeGroup = groups.find(g => kidAge >= g.min && kidAge <= g.max) ?? groups[1]
  const [selected, setSelected] = useState(activeGroup.label)

  const books = STORY_BOOKS.filter(b => {
    const g = groups.find(g => g.label === selected)!
    return b.ageMin <= g.max && b.ageMax >= g.min
  })

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:6 }}>📚 Recommended Story Books</h2>
      <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Curated reading lists to build vocabulary, empathy, and a love of reading.</p>

      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {groups.map(g => (
          <button key={g.label} onClick={() => setSelected(g.label)}
            style={{
              padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: selected === g.label ? '#4F46E5' : '#F1F5F9',
              color: selected === g.label ? '#fff' : '#64748B',
            }}>
            {g.label}
            {g.label === activeGroup.label && ' ⭐'}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {books.map((b, i) => (
          <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
            className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', gap:12, marginBottom:12 }}>
              <div style={{ width:48, height:64, borderRadius:8, background:'linear-gradient(135deg,#667eea,#764ba2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:24, flexShrink:0 }}>📖</div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:800, color:'#0F172A', marginBottom:2, lineHeight:1.3 }}>{b.title}</div>
                <div style={{ fontSize:11, color:'#64748B' }}>by {b.author}</div>
                <div style={{ fontSize:10, marginTop:4, padding:'2px 7px', borderRadius:4, background:'#EEF2FF', color:'#4F46E5', display:'inline-block', fontWeight:600 }}>{b.genre}</div>
              </div>
            </div>
            <p style={{ fontSize:12, color:'#374151', lineHeight:1.6, marginBottom:10 }}>{b.whyRead}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:11, padding:'3px 8px', borderRadius:5, background:'#FFFBEB', color:'#D97706', fontWeight:600 }}>
                🎯 {b.theme}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function SportsSection({ kidAge }: { kidAge: number }) {
  const [filter, setFilter] = useState<'all'|'indoor'|'outdoor'|'both'>('all')
  const sports = SPORT_ACTIVITIES.filter(s => {
    if (kidAge < s.ageMin || kidAge > s.ageMax) return false
    if (filter !== 'all' && s.indoorOutdoor !== filter) return false
    return true
  })

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:6 }}>⚽ Sports & Activities</h2>
      <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Physical activity builds both body and brain. Explore what's right for your child's age.</p>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {(['all','indoor','outdoor','both'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: filter === f ? '#4F46E5' : '#F1F5F9',
              color: filter === f ? '#fff' : '#64748B',
            }}>
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:14 }}>
        {sports.map((s, i) => (
          <motion.div key={s.name} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
            className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ fontSize:32 }}>{s.emoji}</div>
              <div>
                <div style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>{s.name}</div>
                <div style={{ fontSize:10, color:'#94A3B8' }}>Ages {s.ageMin}–{s.ageMax} · {s.indoorOutdoor}</div>
              </div>
            </div>
            <p style={{ fontSize:12, color:'#374151', lineHeight:1.5, marginBottom:10 }}>{s.benefit}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#ECFDF5', color:'#059669', fontWeight:600 }}>
                🧠 {s.skillBuilt.split(',')[0]}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function YouTubeSection() {
  const [langFilter, setLangFilter] = useState<'English'|'Hindi'|'Both'|'all'>('all')
  const channels = langFilter === 'all' ? YOUTUBE_CHANNELS : YOUTUBE_CHANNELS.filter(c => c.language === langFilter)

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:6 }}>▶️ Educational YouTube Channels</h2>
      <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Curated channels for learning—no ads, no junk, just knowledge.</p>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {(['all','English','Hindi','Both'] as const).map(l => (
          <button key={l} onClick={() => setLangFilter(l)}
            style={{
              padding:'7px 16px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: langFilter === l ? '#4F46E5' : '#F1F5F9',
              color: langFilter === l ? '#fff' : '#64748B',
            }}>
            {l === 'all' ? 'All Languages' : l}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:14 }}>
        {channels.map((c, i) => (
          <motion.div key={c.name} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.03 }}
            className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:48, height:36, borderRadius:8, background:'linear-gradient(135deg,#FF0000,#CC0000)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>
                {c.emoji}
              </div>
              <div>
                <div style={{ fontSize:13, fontWeight:800, color:'#0F172A' }}>{c.name}</div>
                <div style={{ display:'flex', gap:4, marginTop:2, flexWrap:'wrap' }}>
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:3, background:'#EEF2FF', color:'#4F46E5', fontWeight:600 }}>{c.subject}</span>
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:3, background:'#F1F5F9', color:'#64748B' }}>Ages {c.ageRange}</span>
                  <span style={{ fontSize:10, padding:'1px 6px', borderRadius:3, background: c.language === 'Hindi' ? '#FFFBEB' : '#ECFDF5', color: c.language === 'Hindi' ? '#D97706' : '#059669' }}>{c.language}</span>
                </div>
              </div>
            </div>
            <p style={{ fontSize:12, color:'#374151', lineHeight:1.5, marginBottom:12 }}>{c.description}</p>
            <a
              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(c.searchQuery)}`}
              target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#DC2626', fontWeight:700, textDecoration:'none' }}
              onClick={e => e.stopPropagation()}>
              ▶ Search on YouTube <ChevronRight size={11}/>
            </a>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function VocabSection({ grade }: { grade: number }) {
  const [selectedGrade, setSelectedGrade] = useState(grade)
  const [flipped, setFlipped] = useState<Record<number,boolean>>({})
  const words = useMemo(() => VOCABULARY_WORDS.filter(w => w.grade === selectedGrade), [selectedGrade])

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:6 }}>📖 Vocabulary Builder</h2>
      <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Build a powerful vocabulary word by word. Flip each card to see the meaning.</p>

      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {[1,2,3,4,5,6,7,8].map(g => (
          <button key={g} onClick={() => { setSelectedGrade(g); setFlipped({}) }}
            style={{
              padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700,
              background: selectedGrade === g ? '#4F46E5' : '#F1F5F9',
              color: selectedGrade === g ? '#fff' : '#64748B',
            }}>
            Grade {g}
            {g === grade && ' ⭐'}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:14 }}>
        {words.map((w, i) => (
          <motion.div key={w.word} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.05 }}
            onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))}
            style={{ cursor:'pointer', perspective:600 }}>
            <motion.div
              animate={{ rotateY: flipped[i] ? 180 : 0 }}
              transition={{ duration:0.4 }}
              style={{ transformStyle:'preserve-3d', position:'relative', minHeight:120 }}>
              {/* Front */}
              <div className="card" style={{ padding:20, backfaceVisibility:'hidden', position:'absolute', width:'100%', boxSizing:'border-box', background:'linear-gradient(135deg,#EEF2FF,#fff)', borderColor:'#C7D2FE' }}>
                <div style={{ fontSize:18, fontWeight:900, color:'#4F46E5', marginBottom:6 }}>{w.word}</div>
                <div style={{ fontSize:10, color:'#94A3B8', marginBottom:8 }}>Grade {w.grade} · {w.difficulty}</div>
                <div style={{ fontSize:11, color:'#64748B' }}>👆 Tap to see meaning</div>
              </div>
              {/* Back */}
              <div className="card" style={{ padding:20, backfaceVisibility:'hidden', position:'absolute', width:'100%', boxSizing:'border-box', transform:'rotateY(180deg)', background:'#ECFDF5', borderColor:'#A7F3D0' }}>
                <div style={{ fontSize:13, fontWeight:800, color:'#059669', marginBottom:6 }}>{w.meaning}</div>
                <div style={{ fontSize:12, color:'#065F46', lineHeight:1.5, fontStyle:'italic' }}>"{w.example}"</div>
              </div>
            </motion.div>
            {!flipped[i] && <div style={{ height:120 }}/>}
            {flipped[i] && <div style={{ height:120 }}/>}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function TwistersSection() {
  const [langFilter, setLangFilter] = useState<'all'|'English'|'Hindi'>('all')
  const [difficulty, setDifficulty] = useState<'all'|'easy'|'medium'|'hard'>('all')
  const [practicing, setPracticing] = useState<number|null>(null)
  const [count, setCount] = useState<Record<number,number>>({})

  const filtered = TONGUE_TWISTERS.filter(t => {
    if (langFilter !== 'all' && t.language !== langFilter) return false
    if (difficulty !== 'all' && t.difficulty !== difficulty) return false
    return true
  })

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:6 }}>👅 Tongue Twisters</h2>
      <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Practice saying these faster and faster to improve pronunciation and brain speed!</p>

      <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
        {(['all','English','Hindi'] as const).map(l => (
          <button key={l} onClick={() => setLangFilter(l)}
            style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background: langFilter === l ? '#4F46E5' : '#F1F5F9', color: langFilter === l ? '#fff' : '#64748B' }}>
            {l === 'all' ? 'All' : l}
          </button>
        ))}
        <div style={{ width:1, background:'#E2E8F0' }}/>
        {(['all','easy','medium','hard'] as const).map(d => (
          <button key={d} onClick={() => setDifficulty(d)}
            style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background: difficulty === d ? '#0F172A' : '#F1F5F9', color: difficulty === d ? '#fff' : '#64748B' }}>
            {d.charAt(0).toUpperCase()+d.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map((t, i) => {
          const diffColors: Record<string,{bg:string;color:string}> = {
            easy: {bg:'#ECFDF5',color:'#059669'}, medium: {bg:'#FFFBEB',color:'#D97706'}, hard: {bg:'#FEF2F2',color:'#DC2626'}
          }
          const dc = diffColors[t.difficulty]
          return (
            <motion.div key={i} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
              className="card" style={{ padding:20 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                <span style={{ fontSize:10, padding:'3px 8px', borderRadius:5, background:dc.bg, color:dc.color, fontWeight:700 }}>{t.difficulty.charAt(0).toUpperCase()+t.difficulty.slice(1)}</span>
                <span style={{ fontSize:10, padding:'3px 8px', borderRadius:5, background: t.language === 'Hindi' ? '#FFFBEB' : '#EEF2FF', color: t.language === 'Hindi' ? '#D97706' : '#4F46E5', fontWeight:600 }}>{t.language}</span>
              </div>
              <p style={{ fontSize:14, fontWeight:700, color:'#0F172A', lineHeight:1.6, marginBottom:14, fontStyle:'italic' }}>"{t.text}"</p>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <button
                  onClick={() => { setPracticing(practicing === i ? null : i); setCount(c => ({ ...c, [i]: (c[i]||0) })) }}
                  className={`btn ${practicing === i ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize:11, padding:'6px 12px', flex:1 }}>
                  {practicing === i ? '⏹ Stop' : '🎙 Practice'}
                </button>
                {(count[i] || 0) > 0 && (
                  <button onClick={() => setCount(c => ({ ...c, [i]: (c[i]||0)+1 }))}
                    style={{ fontSize:11, padding:'6px 10px', borderRadius:8, border:'1px solid #E2E8F0', background:'#F1F5F9', cursor:'pointer' }}>
                    ×{count[i]}
                  </button>
                )}
                {practicing === i && (
                  <button onClick={() => setCount(c => ({ ...c, [i]: (c[i]||0)+1 }))}
                    style={{ fontSize:11, padding:'6px 12px', borderRadius:8, border:'none', background:'#4F46E5', color:'#fff', cursor:'pointer' }}>
                    Count +1
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

function PoemsSection() {
  const [typeFilter, setTypeFilter] = useState<'all'|'poem'|'quote'|'phrase'>('all')
  const filtered = POEMS_AND_PHRASES.filter(p => typeFilter === 'all' || p.type === typeFilter)

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:6 }}>🎭 Poems & Inspiring Quotes</h2>
      <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Words that stay with you for a lifetime. Memorise one each week!</p>

      <div style={{ display:'flex', gap:8, marginBottom:20 }}>
        {(['all','poem','quote','phrase'] as const).map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background: typeFilter === t ? '#4F46E5' : '#F1F5F9', color: typeFilter === t ? '#fff' : '#64748B' }}>
            {t === 'all' ? 'All' : t.charAt(0).toUpperCase()+t.slice(1)}s
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map((p, i) => (
          <motion.div key={p.title} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
            className="card" style={{ padding:20, background: p.type === 'quote' ? '#FFFBEB' : p.type === 'phrase' ? '#ECFDF5' : '#FAFAFA', borderColor: p.type === 'quote' ? '#FDE68A' : p.type === 'phrase' ? '#A7F3D0' : '#E2E8F0' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <div style={{ fontSize:13, fontWeight:800, color:'#0F172A' }}>{p.title}</div>
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#F1F5F9', color:'#64748B' }}>
                {p.type === 'poem' ? '📜 Poem' : p.type === 'quote' ? '💬 Quote' : '✨ Phrase'}
              </span>
            </div>
            <pre style={{ fontSize:13, color:'#374151', lineHeight:1.8, whiteSpace:'pre-wrap', margin:0, fontFamily:'inherit', fontStyle:'italic' }}>{p.lines}</pre>
            <div style={{ marginTop:12, display:'flex', gap:6 }}>
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#EEF2FF', color:'#4F46E5' }}>🎯 {p.theme}</span>
              <span style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#F1F5F9', color:'#64748B' }}>Ages {p.ageGroup}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

function MindGamesSection() {
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const types = ['all','sudoku','logic','memory','spatial','word','puzzle']
  const filtered = MIND_GAMES.filter(g => typeFilter === 'all' || g.type === typeFilter)

  return (
    <div>
      <h2 style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginBottom:6 }}>🧩 Mind Games & Brain Workouts</h2>
      <p style={{ fontSize:12, color:'#64748B', marginBottom:16 }}>Play these regularly to build focus, memory, and problem-solving power.</p>

      <div style={{ display:'flex', gap:8, marginBottom:20, flexWrap:'wrap' }}>
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)}
            style={{ padding:'6px 14px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, background: typeFilter === t ? '#4F46E5' : '#F1F5F9', color: typeFilter === t ? '#fff' : '#64748B' }}>
            {t === 'all' ? 'All Games' : t.charAt(0).toUpperCase()+t.slice(1)}
          </button>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        {filtered.map((g, i) => (
          <motion.div key={g.name} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay:i*0.04 }}
            className="card" style={{ padding:20 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
              <div style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>{g.name}</div>
              <span style={{ fontSize:10, padding:'3px 8px', borderRadius:5, background:'#EEF2FF', color:'#4F46E5', fontWeight:700 }}>{g.type}</span>
            </div>
            <p style={{ fontSize:12, color:'#374151', lineHeight:1.5, marginBottom:10 }}>{g.description}</p>
            <div style={{ background:'#F8FAFC', borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
              <p style={{ fontSize:11, fontWeight:700, color:'#374151', marginBottom:4 }}>How to Play:</p>
              <p style={{ fontSize:12, color:'#64748B', lineHeight:1.5 }}>{g.howToPlay}</p>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {g.benefits.map(b => (
                <span key={b} style={{ fontSize:10, padding:'2px 7px', borderRadius:4, background:'#ECFDF5', color:'#059669' }}>✓ {b}</span>
              ))}
            </div>
            <div style={{ marginTop:10, fontSize:11, color:'#94A3B8' }}>Age {g.ageMin}+</div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function FunHub() {
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const kidAge = activeKid?.age ?? 10
  const kidGrade = activeKid?.grade ? parseInt(activeKid.grade.replace(/\D/g,'')) || 4 : 4
  const [activeTab, setActiveTab] = useState('funfacts')

  return (
    <div className="page-container" style={{ maxWidth:960 }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:24 }}>
        <p className="label" style={{ marginBottom:4 }}>Fun & Play</p>
        <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', color:'#0F172A' }}>
          Fun Learning Hub
        </h1>
        <p style={{ fontSize:13, color:'#64748B', marginTop:4 }}>
          Because learning should be joyful — riddles, books, sports, YouTube picks, poems, and mind games
          {activeKid && ` curated for ${activeKid.name}`}
        </p>
      </motion.div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:24, overflowX:'auto', paddingBottom:4 }}>
        {TABS.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            style={{
              display:'flex', alignItems:'center', gap:6,
              padding:'8px 14px', borderRadius:10, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, flexShrink:0,
              background: activeTab === tab.key ? '#0F172A' : '#F1F5F9',
              color: activeTab === tab.key ? '#fff' : '#64748B',
              boxShadow: activeTab === tab.key ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
              transition:'all 0.15s',
            }}>
            <span style={{ fontSize:16 }}>{tab.emoji}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div key={activeTab} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-10 }} transition={{ duration:0.2 }}>
          {activeTab === 'riddles'   && <RiddleSection kidAge={kidAge}/>}
          {activeTab === 'funfacts'  && <FunFactsSection kidAge={kidAge}/>}
          {activeTab === 'books'     && <BooksSection kidAge={kidAge}/>}
          {activeTab === 'sports'    && <SportsSection kidAge={kidAge}/>}
          {activeTab === 'youtube'   && <YouTubeSection/>}
          {activeTab === 'vocab'     && <VocabSection grade={kidGrade}/>}
          {activeTab === 'twisters'  && <TwistersSection/>}
          {activeTab === 'poems'     && <PoemsSection/>}
          {activeTab === 'mindgames' && <MindGamesSection/>}
        </motion.div>
      </AnimatePresence>

    </div>
  )
}
