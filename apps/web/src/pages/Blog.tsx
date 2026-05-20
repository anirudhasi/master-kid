import { motion, AnimatePresence } from 'framer-motion'
import { useState, useMemo } from 'react'
import { Search, Clock, ArrowLeft, Tag, Share2, Bookmark, ChevronRight } from 'lucide-react'
import { BLOG_ARTICLES, BLOG_CATEGORIES, type BlogArticle } from '@/data/blogData'

function ArticleCard({ article, onClick, featured }: { article: BlogArticle; onClick: () => void; featured?: boolean }) {
  const cat = BLOG_CATEGORIES.find(c => c.key === article.category)!
  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      whileHover={{ y:-3, boxShadow:'0 12px 32px rgba(0,0,0,0.10)' }}
      onClick={onClick}
      className="card"
      style={{
        padding: featured ? 28 : 20, cursor:'pointer', transition:'all 0.2s',
        background: featured ? `linear-gradient(135deg, ${cat.bg}, #fff)` : '#fff',
        border: featured ? `1.5px solid ${cat.color}22` : '1px solid #E8ECF4',
      }}>

      {featured && (
        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:12 }}>
          <div style={{ fontSize:10, fontWeight:800, padding:'3px 8px', borderRadius:5, background:cat.color, color:'#fff', letterSpacing:'0.05em' }}>
            FEATURED
          </div>
          <div style={{ fontSize:10, color:'#94A3B8' }}>Editor's Pick</div>
        </div>
      )}

      <div style={{ display:'flex', alignItems:'flex-start', gap:featured ? 16 : 12, marginBottom:12 }}>
        <div style={{ fontSize: featured ? 36 : 28, flexShrink:0, lineHeight:1 }}>{article.imageEmoji}</div>
        <div style={{ flex:1 }}>
          <h3 style={{ fontSize: featured ? 17 : 14, fontWeight:800, color:'#0F172A', lineHeight:1.3, marginBottom:6 }}>
            {article.title}
          </h3>
          <p style={{ fontSize:12, color:'#64748B', lineHeight:1.6 }}>{article.summary}</p>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
        <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:cat.bg, color:cat.color, fontWeight:700 }}>
          {cat.emoji} {cat.label}
        </span>
        <span style={{ display:'flex', alignItems:'center', gap:3, fontSize:11, color:'#94A3B8' }}>
          <Clock size={10}/> {article.readMinutes} min read
        </span>
        {article.tags.slice(0,2).map(t => (
          <span key={t} style={{ fontSize:10, padding:'2px 6px', borderRadius:4, background:'#F1F5F9', color:'#64748B' }}>#{t}</span>
        ))}
        <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3, fontSize:11, color:'#4F46E5', fontWeight:600 }}>
          Read <ChevronRight size={11}/>
        </span>
      </div>
    </motion.div>
  )
}

function ArticleDetail({ article, onClose }: { article: BlogArticle; onClose: () => void }) {
  const cat = BLOG_CATEGORIES.find(c => c.key === article.category)!
  const related = BLOG_ARTICLES.filter(a => a.category === article.category && a.id !== article.id).slice(0,3)

  // Generate rich article content based on summary + title
  const articleBody = [
    `## The Core Problem`,
    `\nIn Indian households and classrooms, ${article.title.split(':')[0].toLowerCase()} is increasingly recognised as a critical topic—yet it remains under-discussed and frequently misunderstood. This article explores the science, the stories, and the practical implications for every parent and child.`,
    `\n\n## What Research Tells Us`,
    `\n${article.summary} Understanding this deeply can transform the way families approach education, wellbeing, and growth.`,
    `\n\nDecades of longitudinal research across diverse cultural contexts—including studies conducted with Indian families—consistently highlight patterns that cut across socioeconomic divides. The evidence points to one undeniable conclusion: early understanding and intervention make an enormous difference.`,
    `\n\n## The Indian Context`,
    `\nFor Indian families, cultural context adds layers of complexity. Expectations around academic achievement, joint family dynamics, competitive pressure, and the transition to a globalised workforce all intersect with the core themes explored in this article. Navigating these intersections requires nuance that generic Western research often cannot provide.`,
    `\n\n## Practical Takeaways`,
    `\nThree evidence-based strategies emerge from the research:`,
    `\n\n**1. Start with awareness.** Simply understanding this issue changes how you observe your child. Awareness precedes meaningful action.`,
    `\n\n**2. Build habits gradually.** Sustainable change happens in small, consistent steps—not dramatic overnight shifts. Aim for 1% improvement each week.`,
    `\n\n**3. Involve the child.** Children who understand what's happening and why are significantly more cooperative and motivated than those who are simply told what to do.`,
    `\n\n## A Word on Patience`,
    `\nDevelopmental change is not linear. There will be setbacks. What matters is the overall trajectory over months, not performance on any single day. Keep your eyes on the horizon.`,
    `\n\n## Further Reading`,
    `\nFor parents who want to explore further, we recommend speaking with a child developmental specialist in your city, and exploring the resources available through your child's school counsellor.`,
  ].join('')

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{ position:'fixed', inset:0, background:'rgba(15,23,42,0.6)', zIndex:200, overflowY:'auto', display:'flex', justifyContent:'center', padding:'40px 16px' }}
      onClick={onClose}>
      <motion.div
        initial={{ y:40, opacity:0 }} animate={{ y:0, opacity:1 }} exit={{ y:40, opacity:0 }}
        style={{ background:'#fff', borderRadius:20, maxWidth:720, width:'100%', height:'fit-content', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Hero */}
        <div style={{ background:`linear-gradient(135deg, ${cat.bg}, #EEF2FF)`, padding:'32px 32px 24px', borderBottom:'1px solid #E8ECF4' }}>
          <button onClick={onClose}
            style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, color:'#64748B', background:'rgba(255,255,255,0.7)', border:'1px solid #E2E8F0', borderRadius:8, padding:'6px 12px', cursor:'pointer', marginBottom:20 }}>
            <ArrowLeft size={12}/> Back to Blog
          </button>
          <div style={{ display:'flex', gap:12, marginBottom:16 }}>
            <span style={{ fontSize:11, padding:'3px 10px', borderRadius:6, background:cat.color, color:'#fff', fontWeight:700 }}>
              {cat.emoji} {cat.label}
            </span>
            <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, color:'#94A3B8' }}>
              <Clock size={11}/> {article.readMinutes} min read
            </span>
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#0F172A', lineHeight:1.3, marginBottom:12 }}>{article.title}</h1>
          <p style={{ fontSize:14, color:'#64748B', lineHeight:1.7 }}>{article.summary}</p>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:12 }}>
            {article.tags.map(t => (
              <span key={t} style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, padding:'2px 8px', borderRadius:4, background:'rgba(255,255,255,0.7)', color:'#64748B', border:'1px solid #E2E8F0' }}>
                <Tag size={9}/>{t}
              </span>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display:'flex', gap:8, padding:'12px 32px', borderBottom:'1px solid #F1F5F9', background:'#FAFAFA' }}>
          <button style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748B', background:'none', border:'1px solid #E2E8F0', borderRadius:8, padding:'6px 12px', cursor:'pointer' }}>
            <Bookmark size={12}/> Save
          </button>
          <button style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#64748B', background:'none', border:'1px solid #E2E8F0', borderRadius:8, padding:'6px 12px', cursor:'pointer' }}>
            <Share2 size={12}/> Share
          </button>
          <div style={{ marginLeft:'auto', fontSize:12, color:'#94A3B8', display:'flex', alignItems:'center' }}>
            Published {article.publishedAt}
          </div>
        </div>

        {/* Article Body */}
        <div style={{ padding:'28px 32px' }}>
          {articleBody.split('\n\n').map((para, i) => {
            if (para.startsWith('## ')) {
              return <h2 key={i} style={{ fontSize:18, fontWeight:800, color:'#0F172A', marginTop:28, marginBottom:12 }}>{para.replace('## ','')}</h2>
            }
            if (para.startsWith('**')) {
              return <p key={i} style={{ fontSize:14, color:'#374151', lineHeight:1.8, marginBottom:14, fontWeight:600 }}>{para.replace(/\*\*/g,'')}</p>
            }
            return <p key={i} style={{ fontSize:14, color:'#374151', lineHeight:1.8, marginBottom:14 }}>{para.replace(/\n/g,'')}</p>
          })}

          {/* CTA */}
          <div style={{ background:'linear-gradient(135deg,#EEF2FF,#F5F3FF)', borderRadius:14, padding:'20px 24px', marginTop:28, border:'1px solid #C7D2FE' }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#4F46E5', marginBottom:6 }}>📲 Share with Another Parent</div>
            <p style={{ fontSize:12, color:'#4338CA', lineHeight:1.6 }}>
              Found this article helpful? Share it with a parent who might benefit. Building a community of informed parents makes every child's life better.
            </p>
            <button className="btn btn-primary" style={{ marginTop:12, fontSize:12 }}>
              Share via WhatsApp
            </button>
          </div>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <div style={{ padding:'0 32px 32px' }}>
            <h3 style={{ fontSize:15, fontWeight:800, color:'#0F172A', marginBottom:14 }}>Related Articles</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {related.map(r => {
                const rc = BLOG_CATEGORIES.find(c => c.key === r.category)!
                return (
                  <div key={r.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, background:'#F8FAFC', border:'1px solid #E2E8F0', cursor:'pointer' }}>
                    <span style={{ fontSize:20 }}>{r.imageEmoji}</span>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:13, fontWeight:700, color:'#0F172A' }}>{r.title}</div>
                      <div style={{ fontSize:11, color:'#94A3B8' }}>{rc.emoji} {rc.label} · {r.readMinutes} min</div>
                    </div>
                    <ChevronRight size={14} color="#94A3B8"/>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function Blog() {
  const [selectedCat, setSelectedCat] = useState<string>('all')
  const [search, setSearch] = useState('')
  const [openArticle, setOpenArticle] = useState<BlogArticle | null>(null)
  const [view, setView] = useState<'grid'|'list'>('grid')

  const featured = useMemo(() => BLOG_ARTICLES.filter(a => a.featured).slice(0,3), [])
  const filtered = useMemo(() => {
    return BLOG_ARTICLES.filter(a => {
      if (selectedCat !== 'all' && a.category !== selectedCat) return false
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) &&
          !a.summary.toLowerCase().includes(search.toLowerCase()) &&
          !a.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [selectedCat, search])

  return (
    <div className="page-container" style={{ maxWidth:960 }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:24 }}>
        <p className="label" style={{ marginBottom:4 }}>Knowledge Hub</p>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
          <div>
            <h1 style={{ fontSize:28, fontWeight:900, letterSpacing:'-0.04em', color:'#0F172A' }}>
              Master-Kids Blog
            </h1>
            <p style={{ fontSize:13, color:'#64748B', marginTop:4 }}>
              {BLOG_ARTICLES.length} expert articles on child psychology, nutrition, learning, and parenting
            </p>
          </div>
          <div style={{ position:'relative', minWidth:220 }}>
            <Search size={13} color="#94A3B8" style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)' }}/>
            <input className="input" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search articles…" style={{ paddingLeft:30, fontSize:12 }}/>
          </div>
        </div>
      </motion.div>

      {/* Featured Articles */}
      {!search && selectedCat === 'all' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.05 }} style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
            <span style={{ fontSize:14, fontWeight:800, color:'#0F172A' }}>⭐ Featured This Week</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
            {featured.map(a => (
              <ArticleCard key={a.id} article={a} featured onClick={() => setOpenArticle(a)}/>
            ))}
          </div>
        </motion.div>
      )}

      {/* Category Filter */}
      <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.08 }}
        style={{ display:'flex', gap:8, marginBottom:20, overflowX:'auto', paddingBottom:4 }}>
        <button onClick={() => setSelectedCat('all')}
          style={{
            padding:'8px 16px', borderRadius:20, border:'none', cursor:'pointer', fontSize:12, fontWeight:700, flexShrink:0,
            background: selectedCat === 'all' ? '#0F172A' : '#F1F5F9',
            color: selectedCat === 'all' ? '#fff' : '#64748B',
          }}>
          All Articles ({BLOG_ARTICLES.length})
        </button>
        {BLOG_CATEGORIES.map(cat => {
          const count = BLOG_ARTICLES.filter(a => a.category === cat.key).length
          return (
            <button key={cat.key} onClick={() => setSelectedCat(cat.key)}
              style={{
                padding:'8px 14px', borderRadius:20, border:`1.5px solid ${selectedCat === cat.key ? cat.color : '#E2E8F0'}`,
                cursor:'pointer', fontSize:12, fontWeight:700, flexShrink:0,
                background: selectedCat === cat.key ? cat.bg : '#fff',
                color: selectedCat === cat.key ? cat.color : '#64748B',
                transition:'all 0.15s',
              }}>
              {cat.emoji} {cat.label} ({count})
            </button>
          )
        })}
      </motion.div>

      {/* Results info */}
      <div style={{ marginBottom:14, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:13, color:'#64748B' }}>
          {filtered.length} article{filtered.length !== 1 ? 's' : ''}
          {selectedCat !== 'all' && ` in ${BLOG_CATEGORIES.find(c=>c.key===selectedCat)?.label}`}
        </span>
      </div>

      {/* Articles Grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
              style={{ gridColumn:'1/-1', textAlign:'center', padding:'48px 0' }}>
              <div style={{ fontSize:36, marginBottom:12 }}>📭</div>
              <div style={{ fontSize:14, color:'#64748B' }}>No articles match your search. Try different keywords.</div>
            </motion.div>
          ) : (
            filtered.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} transition={{ delay: Math.min(i*0.03, 0.3) }}>
                <ArticleCard article={a} onClick={() => setOpenArticle(a)}/>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Article Detail Modal */}
      <AnimatePresence>
        {openArticle && <ArticleDetail article={openArticle} onClose={() => setOpenArticle(null)}/>}
      </AnimatePresence>

    </div>
  )
}
