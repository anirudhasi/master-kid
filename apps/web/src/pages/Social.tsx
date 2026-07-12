import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Image as ImageIcon, Send, Award, Share2, MessageCircle, X, Trash2,
  Copy, Check, Globe,
} from 'lucide-react'
import { useAuthStore } from '@/modules/identity'
import { useSocialStore, feed, reactionCount, REACTIONS, type Post } from '@/store/socialStore'
import { socialService } from '@/services/socialService'
import { useStoryboardStore, entriesFor, type StoryEntry } from '@/store/storyboardStore'

const P = '#6C63FF'
const FONT = "'Nunito', 'Inter', sans-serif"

const roleLabel = (r: string) => r === 'TEACHER' ? 'Teacher' : r === 'COACH' ? 'Coach' : r === 'STUDENT' ? 'Student' : 'Parent'
const timeAgo = (t: number) => {
  const s = (Date.now() - t) / 1000
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}
const isImg = (v?: string) => !!v && (v.startsWith('data:') || v.startsWith('http'))

export default function Social() {
  const { activePhone, adminName, adminAvatar, adminPhotoUrl, role, activeKidId, kids } = useAuthStore()
  const posts = useSocialStore(s => s.posts)
  const allStory = useStoryboardStore(s => s.entries)

  const userId = activePhone || 'guest'
  const kid = kids.find(k => k.id === activeKidId)
  const author = {
    authorId: userId,
    authorName: adminName || 'You',
    authorAvatar: adminPhotoUrl || adminAvatar || '👤',
    authorRole: roleLabel(role),
  }

  const [body, setBody] = useState('')
  const [media, setMedia] = useState<string | undefined>()
  const [picking, setPicking] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader(); r.onload = () => setMedia(r.result as string); r.readAsDataURL(f)
  }

  const post = () => {
    if (!body.trim() && !media) return
    void socialService.addPost({ ...author, sourceKind: 'freeform', body: body.trim(), mediaUrl: media, childName: undefined })
    setBody(''); setMedia(undefined)
  }

  const shareAchievement = (e: StoryEntry) => {
    void socialService.addPost({
      ...author, sourceKind: 'achievement', childName: kid?.name,
      body: `${kid?.name ?? 'My child'} — ${e.title || 'New achievement'}${e.body ? `: ${e.body}` : ''} 🎉`,
      mediaUrl: e.mediaUrl,
    })
    setPicking(false)
  }

  const list = feed(posts)
  const shareable = kid ? entriesFor(allStory, kid.id).filter(e => ['achievement', 'result', 'certificate', 'photo'].includes(e.kind)) : []

  return (
    <div style={{ padding: '24px clamp(16px,4vw,40px) 64px', fontFamily: FONT, maxWidth: 680, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>Community</h1>
      <p style={{ fontSize: 13.5, color: '#64748B', margin: '4px 0 18px' }}>Share wins, ask questions, and cheer each other on.</p>

      {/* Composer */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F5', padding: 16, marginBottom: 22, boxShadow: '0 1px 8px rgba(15,23,42,0.04)' }}>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Share something with the community…" rows={2}
          style={{ width: '100%', border: 'none', outline: 'none', resize: 'vertical', fontFamily: FONT, fontSize: 14, color: '#0F172A', boxSizing: 'border-box' }} />
        {media && (
          <div style={{ position: 'relative', display: 'inline-block', marginTop: 8 }}>
            <img src={media} alt="attachment" style={{ maxHeight: 140, borderRadius: 10 }} />
            <button onClick={() => setMedia(undefined)} style={{ position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: 7, border: 'none', cursor: 'pointer', background: 'rgba(0,0,0,0.6)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={13} /></button>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <IconChip onClick={() => fileRef.current?.click()} icon={<ImageIcon size={15} />} label="Photo" />
          {kid && <IconChip onClick={() => setPicking(true)} icon={<Award size={15} />} label="Share achievement" />}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} style={{ display: 'none' }} />
          <button onClick={post} disabled={!body.trim() && !media}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 10, border: 'none', cursor: (!body.trim() && !media) ? 'not-allowed' : 'pointer', background: (!body.trim() && !media) ? '#E2E8F0' : `linear-gradient(135deg,${P},#9B59FF)`, color: (!body.trim() && !media) ? '#94A3B8' : '#fff', fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
            <Send size={14} /> Post
          </button>
        </div>
      </div>

      {/* Feed */}
      <div style={{ display: 'grid', gap: 14 }}>
        {list.map(p => <PostCard key={p.id} post={p} userId={userId} canDelete={p.authorId === userId} />)}
      </div>

      {/* Achievement picker */}
      <AnimatePresence>
        {picking && (
          <Modal title={`Share ${kid?.name ?? ''}'s achievement`} onClose={() => setPicking(false)}>
            {shareable.length === 0 ? (
              <div style={{ fontSize: 13, color: '#64748B', textAlign: 'center', padding: 16 }}>No storyboard memories yet. Add some in <strong>Storyboard</strong> first.</div>
            ) : (
              <div style={{ display: 'grid', gap: 8, maxHeight: '60vh', overflowY: 'auto' }}>
                {shareable.map(e => (
                  <button key={e.id} onClick={() => shareAchievement(e)}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 11, cursor: 'pointer', border: '1px solid #EEF0F5', background: '#fff', textAlign: 'left', fontFamily: FONT }}>
                    {isImg(e.mediaUrl) ? <img src={e.mediaUrl} alt="" style={{ width: 40, height: 40, borderRadius: 9, objectFit: 'cover' }} /> : <div style={{ width: 40, height: 40, borderRadius: 9, background: '#EEECFF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏆</div>}
                    <span style={{ flex: 1 }}>
                      <span style={{ display: 'block', fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{e.title || e.kind}</span>
                      <span style={{ fontSize: 11.5, color: '#64748B' }}>{e.grade} · {e.kind}</span>
                    </span>
                    <Share2 size={15} color={P} />
                  </button>
                ))}
              </div>
            )}
          </Modal>
        )}
      </AnimatePresence>
    </div>
  )
}

function PostCard({ post, userId, canDelete }: { post: Post; userId: string; canDelete: boolean }) {
  const [showComments, setShowComments] = useState(false)
  const [comment, setComment] = useState('')
  const [shareOpen, setShareOpen] = useState(false)
  const { adminName, adminAvatar } = useAuthStore()

  const total = reactionCount(post)
  const addComment = () => {
    if (!comment.trim()) return
    void socialService.addComment(post.id, { authorName: adminName || 'You', authorAvatar: adminAvatar || '👤', body: comment.trim() })
    setComment('')
  }

  return (
    <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #EEF0F5', padding: 16, boxShadow: '0 1px 8px rgba(15,23,42,0.04)', position: 'relative' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Avatar v={post.authorAvatar} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13.5, fontWeight: 800, color: '#0F172A' }}>{post.authorName}</span>
            <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: '#EEF2FF', color: '#4338CA' }}>{post.authorRole}</span>
            {post.sourceKind === 'achievement' && <span style={{ fontSize: 9.5, fontWeight: 800, padding: '1px 7px', borderRadius: 7, background: '#FEF3C7', color: '#92400E' }}>🏆 Achievement</span>}
          </div>
          <div style={{ fontSize: 11, color: '#94A3B8' }}>{timeAgo(post.createdAt)}</div>
        </div>
        {canDelete && <button onClick={() => socialService.removePost(post.id)} title="Delete" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#CBD5E1' }}><Trash2 size={14} /></button>}
      </div>

      {/* Body */}
      {post.body && <div style={{ fontSize: 14, color: '#1F2937', lineHeight: 1.6, marginBottom: post.mediaUrl ? 10 : 12 }}>{post.body}</div>}
      {isImg(post.mediaUrl) && <img src={post.mediaUrl} alt="" style={{ width: '100%', borderRadius: 12, marginBottom: 12, maxHeight: 360, objectFit: 'cover' }} />}

      {/* Reactions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', borderTop: '1px solid #F1F5F9', paddingTop: 12 }}>
        {REACTIONS.map(emoji => {
          const ids = post.reactions[emoji] ?? []
          const mine = ids.includes(userId)
          return (
            <button key={emoji} onClick={() => socialService.react(post.id, emoji, userId)}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 700, border: `1.5px solid ${mine ? P : '#E2E8F0'}`, background: mine ? '#EEECFF' : '#fff', color: mine ? P : '#64748B' }}>
              {emoji} {ids.length > 0 && ids.length}
            </button>
          )
        })}
        <button onClick={() => setShowComments(v => !v)} style={chip}><MessageCircle size={14} /> {post.comments.length || ''}</button>
        <div style={{ position: 'relative', marginLeft: 'auto' }}>
          <button onClick={() => doNativeOrMenu(post, () => setShareOpen(v => !v))} style={chip}><Share2 size={14} /> Share</button>
          <AnimatePresence>{shareOpen && <SharePopover post={post} onClose={() => setShareOpen(false)} />}</AnimatePresence>
        </div>
      </div>
      {total > 0 && <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>{total} reaction{total > 1 ? 's' : ''}</div>}

      {/* Comments */}
      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              {post.comments.map(c => (
                <div key={c.id} style={{ display: 'flex', gap: 8 }}>
                  <Avatar v={c.authorAvatar} sm />
                  <div style={{ background: '#F8FAFC', borderRadius: 10, padding: '7px 11px', flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#0F172A' }}>{c.authorName}</span>
                    <span style={{ fontSize: 10.5, color: '#94A3B8', marginLeft: 6 }}>{timeAgo(c.createdAt)}</span>
                    <div style={{ fontSize: 12.5, color: '#374151', marginTop: 2 }}>{c.body}</div>
                  </div>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, marginTop: 2 }}>
                <input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment()} placeholder="Write a comment…"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 13, fontFamily: FONT, outline: 'none' }} />
                <button onClick={addComment} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer', background: P, color: '#fff', fontSize: 12.5, fontWeight: 800, fontFamily: FONT }}>Send</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Use the native share sheet (covers Instagram/Facebook/WhatsApp on mobile),
// otherwise fall back to an explicit menu.
function doNativeOrMenu(post: Post, openMenu: () => void) {
  const text = `${post.body}${post.childName ? ` — ${post.childName}` : ''} (via Master-Kids)`
  const nav = navigator as Navigator & { share?: (d: ShareData) => Promise<void> }
  if (nav.share) { nav.share({ title: 'Master-Kids', text }).catch(() => {}) } else { openMenu() }
}

function SharePopover({ post, onClose }: { post: Post; onClose: () => void }) {
  const [copied, setCopied] = useState(false)
  const text = `${post.body}${post.childName ? ` — ${post.childName}` : ''} (via Master-Kids)`
  const url = typeof window !== 'undefined' ? window.location.origin : ''
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`
  const wa = `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`
  const copy = () => { navigator.clipboard?.writeText(text).then(() => { setCopied(true); setTimeout(onClose, 900) }) }
  return (
    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
      style={{ position: 'absolute', right: 0, top: 36, zIndex: 30, background: '#fff', borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 8px 28px rgba(15,23,42,0.18)', padding: 6, width: 200, fontFamily: FONT }}>
      <a href={fb} target="_blank" rel="noreferrer" style={shareItem}><Globe size={14} color="#1877F2" /> Facebook</a>
      <a href={wa} target="_blank" rel="noreferrer" style={shareItem}><MessageCircle size={14} color="#25D366" /> WhatsApp</a>
      <button onClick={copy} style={{ ...shareItem, width: '100%', border: 'none', background: 'none', cursor: 'pointer' }}>
        {copied ? <Check size={14} color="#16A34A" /> : <Copy size={14} color="#64748B" />} {copied ? 'Copied for Instagram' : 'Copy caption (Instagram)'}
      </button>
    </motion.div>
  )
}

function Avatar({ v, sm }: { v: string; sm?: boolean }) {
  const size = sm ? 28 : 40
  return (
    <div style={{ width: size, height: size, borderRadius: sm ? 9 : 12, overflow: 'hidden', flexShrink: 0, background: '#EEECFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: sm ? 14 : 20 }}>
      {isImg(v) ? <img src={v} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : v}
    </div>
  )
}

function IconChip({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 9, border: '1.5px solid #E2E8F0', background: '#fff', cursor: 'pointer', fontSize: 12.5, fontWeight: 700, color: '#475569', fontFamily: FONT }}>{icon} {label}</button>
}

const chip: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 20, cursor: 'pointer', fontFamily: FONT, fontSize: 13, fontWeight: 700, border: '1.5px solid #E2E8F0', background: '#fff', color: '#64748B' }
const shareItem: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', borderRadius: 8, textDecoration: 'none', color: '#0F172A', fontSize: 13, fontWeight: 700, fontFamily: FONT }

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 80, background: 'rgba(15,23,42,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <motion.div initial={{ scale: 0.96, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.96, opacity: 0 }} onClick={e => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 460, background: '#fff', borderRadius: 18, padding: 22, fontFamily: FONT }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, fontWeight: 900, color: '#0F172A' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={18} /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  )
}
