import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { Users, Plus, Send, Search } from 'lucide-react'
import { useAppStore, type SocialPost } from '@/store/appStore'
import { useAuthStore } from '@/store/authStore'

const POST_TYPE_COLORS = {
  achievement:  { bg:'#ECFDF5', border:'#A7F3D0', badge:'badge-emerald', label:'Achievement 🏆' },
  question:     { bg:'#EEF2FF', border:'#C7D2FE', badge:'badge-brand',   label:'Question ❓'   },
  update:       { bg:'#F5F9FE', border:'#DCE8F5', badge:'badge-slate',   label:'Update 📝'     },
  announcement: { bg:'#FFFBEB', border:'#FDE68A', badge:'badge-amber',   label:'Announcement 📢'},
}

const ROLE_COLORS = {
  student: { label:'Student', color:'#4F46E5', bg:'#EEF2FF' },
  parent:  { label:'Parent',  color:'#059669', bg:'#ECFDF5' },
  tutor:   { label:'Tutor',   color:'#D97706', bg:'#FFFBEB' },
}

const CATEGORY_COLORS = {
  parents: '#059669', students: '#4F46E5',
  tutors:  '#D97706', subject:  '#7C3AED', hobby: '#0891B2',
}

const REACTIONS = ['🔥','❤️','⭐','👏','💡','🎉']

function PostCard({ post }: { post: SocialPost }) {
  const { reactToPost } = useAppStore()
  const [expanded, setExpanded] = useState(false)
  const tc = POST_TYPE_COLORS[post.postType]
  const rc = ROLE_COLORS[post.authorRole]

  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}}
      className="card" style={{padding:20,marginBottom:12,border:`1px solid ${tc.border}`,background:tc.bg}}>
      {/* Author */}
      <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
        <div style={{width:40,height:40,borderRadius:12,background:rc.bg,display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>
          {post.authorAvatar}
        </div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
            <span style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{post.authorName}</span>
            <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:6,background:rc.bg,color:rc.color}}>{rc.label}</span>
            {post.school && <span style={{fontSize:10,color:'#94A3B8'}}>· {post.school}</span>}
          </div>
          <div style={{fontSize:11,color:'#94A3B8'}}>{post.timeAgo}</div>
        </div>
        <span className={`badge ${tc.badge}`} style={{fontSize:10,flexShrink:0}}>{tc.label}</span>
      </div>

      {/* Badge pill */}
      {post.badge && (
        <div style={{marginBottom:10}}>
          <span className="badge badge-amber" style={{fontSize:11}}>🏆 Earned: {post.badge}</span>
        </div>
      )}

      {/* Content */}
      <p style={{fontSize:13,color:'#1E293B',lineHeight:1.7,marginBottom:14}}>{post.content}</p>

      {/* Reactions */}
      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap'}}>
        {post.reactions.map(r => (
          <button key={r.emoji} onClick={() => reactToPost(post.id, r.emoji)}
            style={{
              display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,cursor:'pointer',
              background: r.reacted ? '#EEF2FF' : '#F8FAFC',
              border: `1px solid ${r.reacted?'#C7D2FE':'#DCE8F5'}`,
              transition:'all 0.15s',fontSize:12,color:r.reacted?'#4F46E5':'#64748B',
            }}>
            <span style={{fontSize:14}}>{r.emoji}</span>
            {r.count > 0 && <span style={{fontWeight:600}}>{r.count}</span>}
          </button>
        ))}

        {/* Add reaction */}
        <div style={{position:'relative'}}>
          <button onClick={()=>setExpanded(!expanded)}
            style={{display:'flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:20,cursor:'pointer',background:'#F8FAFC',border:'1px solid #DCE8F5',fontSize:12,color:'#94A3B8'}}>
            + React
          </button>
          {expanded && (
            <div style={{position:'absolute',bottom:'100%',left:0,background:'#fff',border:'1px solid #DCE8F5',borderRadius:12,padding:'8px 10px',display:'flex',gap:6,boxShadow:'0 4px 16px rgba(0,0,0,0.1)',zIndex:10,marginBottom:4}}>
              {REACTIONS.map(e=>(
                <button key={e} onClick={()=>{reactToPost(post.id,e);setExpanded(false)}}
                  style={{fontSize:20,background:'none',border:'none',cursor:'pointer',padding:'2px 4px',borderRadius:6,transition:'transform 0.1s'}}
                  onMouseEnter={ev=>(ev.currentTarget.style.transform='scale(1.3)')}
                  onMouseLeave={ev=>(ev.currentTarget.style.transform='scale(1)')}>
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        <span style={{fontSize:12,color:'#94A3B8',marginLeft:'auto'}}>💬 {post.commentCount} comments</span>
      </div>
    </motion.div>
  )
}

export default function SocialFeed() {
  const { socialPosts, socialGroups, addPost, toggleGroup } = useAppStore()
  const { activeKidId, kids } = useAuthStore()
  const activeKid = kids.find(k => k.id === activeKidId)
  const childName = activeKid?.name ?? 'Student'
  const [postContent, setPostContent]   = useState('')
  const [postType, setPostType]         = useState<SocialPost['postType']>('update')
  const [filter, setFilter]             = useState<'all'|'achievement'|'question'|'announcement'>('all')
  const [groupTab, setGroupTab]         = useState<'all'|'joined'>('all')
  const [showCompose, setShowCompose]   = useState(false)
  const [search, setSearch]             = useState('')

  const filtered = socialPosts.filter(p => {
    if (filter !== 'all' && p.postType !== filter) return false
    if (search && !p.content.toLowerCase().includes(search.toLowerCase()) && !p.authorName.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const groups = groupTab==='joined' ? socialGroups.filter(g=>g.joined) : socialGroups

  const handlePost = () => {
    if (!postContent.trim()) return
    addPost(postContent.trim(), postType)
    setPostContent('')
    setShowCompose(false)
  }

  return (
    <div className="page-container">

      {/* Header */}
      <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} style={{marginBottom:24}}>
        <p className="label" style={{marginBottom:4}}>Community</p>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',flexWrap:'wrap',gap:12}}>
          <h1 style={{fontSize:28,fontWeight:900,letterSpacing:'-0.04em',color:'#0F172A'}}>Social Feed</h1>
          <button onClick={()=>setShowCompose(!showCompose)} className="btn btn-primary" style={{fontSize:12,gap:6}}>
            <Plus size={13}/> New Post
          </button>
        </div>
      </motion.div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20,alignItems:'start'}}>

        {/* ── Left: Feed ───────────────────────────────────────────────────── */}
        <div>

          {/* Compose */}
          <AnimatePresence>
          {showCompose && (
            <motion.div initial={{opacity:0,height:0}} animate={{opacity:1,height:'auto'}} exit={{opacity:0,height:0}}
              className="card" style={{padding:20,marginBottom:16,overflow:'hidden'}}>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:14}}>
                <div style={{fontSize:28}}>{activeKid?.avatar ?? '👤'}</div>
                <div>
                  <div style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{childName}</div>
                  <div style={{fontSize:11,color:'#64748B'}}>{activeKid?.school ?? ''}</div>
                </div>
              </div>
              <div style={{display:'flex',gap:6,marginBottom:12,flexWrap:'wrap'}}>
                {(Object.keys(POST_TYPE_COLORS) as SocialPost['postType'][]).map(t=>(
                  <button key={t} onClick={()=>setPostType(t)}
                    className={`btn ${postType===t?'btn-primary':'btn-ghost'}`} style={{fontSize:11,padding:'5px 12px'}}>
                    {POST_TYPE_COLORS[t].label}
                  </button>
                ))}
              </div>
              <textarea className="input" rows={3} value={postContent} onChange={e=>setPostContent(e.target.value)}
                placeholder="Share an achievement, ask a question, or post an update…"
                style={{resize:'none',lineHeight:1.7,marginBottom:10}}/>
              <div style={{display:'flex',gap:8,justifyContent:'flex-end'}}>
                <button onClick={()=>setShowCompose(false)} className="btn btn-ghost" style={{fontSize:12}}>Cancel</button>
                <button onClick={handlePost} disabled={!postContent.trim()} className="btn btn-primary"
                  style={{fontSize:12,gap:6}}><Send size={12}/> Post</button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Search + filter */}
          <div style={{display:'flex',gap:8,marginBottom:16,flexWrap:'wrap'}}>
            <div style={{flex:1,position:'relative',minWidth:180}}>
              <Search size={13} color="#94A3B8" style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)'}}/>
              <input className="input" value={search} onChange={e=>setSearch(e.target.value)}
                placeholder="Search posts…" style={{paddingLeft:30,fontSize:12}}/>
            </div>
            {(['all','achievement','question','announcement'] as const).map(f=>(
              <button key={f} onClick={()=>setFilter(f)} className={`btn ${filter===f?'btn-primary':'btn-ghost'}`}
                style={{fontSize:11,padding:'7px 12px'}}>
                {f==='all'?'All':f==='achievement'?'🏆 Wins':f==='question'?'❓ Q&A':'📢 Notices'}
              </button>
            ))}
          </div>

          {/* Posts */}
          {filtered.length===0 ? (
            <div className="card" style={{padding:40,textAlign:'center'}}>
              <div style={{fontSize:36,marginBottom:12}}>💬</div>
              <div style={{fontSize:13,color:'#64748B'}}>No posts matching this filter. Be the first to post!</div>
            </div>
          ) : (
            filtered.map(p => <PostCard key={p.id} post={p}/>)
          )}
        </div>

        {/* ── Right: Groups ─────────────────────────────────────────────────── */}
        <div style={{display:'flex',flexDirection:'column',gap:12}}>

          {/* Stats */}
          <div className="card" style={{padding:18}}>
            <p style={{fontSize:12,fontWeight:700,color:'#0F172A',marginBottom:12}}>Community Stats</p>
            {[
              {label:'Total Posts',  value:socialPosts.length, emoji:'📝'},
              {label:'Groups Joined',value:socialGroups.filter(g=>g.joined).length, emoji:'👥'},
              {label:'Active Users', value:2847, emoji:'🌍'},
            ].map(s=>(
              <div key={s.label} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 0',borderBottom:'1px solid #F1F5F9'}}>
                <span style={{fontSize:12,color:'#64748B'}}>{s.emoji} {s.label}</span>
                <span style={{fontSize:13,fontWeight:700,color:'#0F172A'}}>{s.value}</span>
              </div>
            ))}
          </div>

          {/* Groups */}
          <div className="card" style={{padding:18}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <p style={{fontSize:12,fontWeight:700,color:'#0F172A'}}>Groups</p>
              <div style={{display:'flex',gap:4}}>
                {(['all','joined'] as const).map(t=>(
                  <button key={t} onClick={()=>setGroupTab(t)}
                    className={`btn ${groupTab===t?'btn-primary':'btn-ghost'}`} style={{fontSize:10,padding:'4px 8px'}}>
                    {t==='all'?'All':'Joined'}
                  </button>
                ))}
              </div>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {groups.map(g=>(
                <div key={g.id} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 12px',borderRadius:10,background:'#F8FAFC',border:'1px solid #E2E8F0'}}>
                  <div style={{width:36,height:36,borderRadius:10,background:CATEGORY_COLORS[g.category]+'18',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>
                    {g.emoji}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:700,color:'#0F172A',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{g.name}</div>
                    <div style={{fontSize:10,color:'#94A3B8'}}>{g.memberCount.toLocaleString()} members</div>
                  </div>
                  <button onClick={()=>toggleGroup(g.id)}
                    style={{
                      padding:'5px 10px',borderRadius:7,border:'none',cursor:'pointer',fontSize:10,fontWeight:700,
                      background:g.joined?'#EEF2FF':'#4F46E5',color:g.joined?'#4F46E5':'#fff',transition:'all 0.15s',flexShrink:0,
                    }}>
                    {g.joined?'Joined':'+ Join'}
                  </button>
                </div>
              ))}
            </div>

            <button style={{width:'100%',marginTop:12,padding:'9px 0',borderRadius:9,border:'1.5px dashed #DCE8F5',background:'none',cursor:'pointer',fontSize:12,color:'#64748B',display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <Users size={13}/> Create a Group
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
