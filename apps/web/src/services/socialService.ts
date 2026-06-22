// ── Social service boundary ──────────────────────────────────────────────────
// UI talks only to this. Mock (write-through to socialStore) + supabase impls.
// Maps to posts / post_reactions / post_comments. The store stays the reactive
// cache; supabase mode also best-effort writes to Postgres for durability.

import { supabase } from '@/lib/supabase'
import { AUTH_PROVIDER } from '@/lib/env'
import { useSocialStore, type Post, type Comment } from '@/store/socialStore'

export type NewPost = Omit<Post, 'id' | 'createdAt' | 'reactions' | 'comments'>

export interface SocialService {
  addPost(post: NewPost): Promise<void>
  react(postId: string, emoji: string, userId: string): Promise<void>
  addComment(postId: string, comment: Omit<Comment, 'id' | 'createdAt'>): Promise<void>
  removePost(postId: string): Promise<void>
}

const store = () => useSocialStore.getState()

const base: SocialService = {
  async addPost(post) {
    store()._set({ ...post, id: `post-${Date.now()}`, createdAt: Date.now(), reactions: {}, comments: [] })
  },
  async react(postId, emoji, userId) {
    const p = store().posts[postId]; if (!p) return
    const ids = p.reactions[emoji] ?? []
    const next = ids.includes(userId) ? ids.filter((i) => i !== userId) : [...ids, userId]
    store()._set({ ...p, reactions: { ...p.reactions, [emoji]: next } })
  },
  async addComment(postId, comment) {
    const p = store().posts[postId]; if (!p) return
    store()._set({ ...p, comments: [...p.comments, { ...comment, id: `c-${Date.now()}`, createdAt: Date.now() }] })
  },
  async removePost(postId) {
    store()._remove(postId)
  },
}

// Supabase mirrors writes to Postgres (community-readable). Cache stays source
// of truth for the UI; a full server-backed feed sync is a later step.
const supabaseSocialService: SocialService = {
  ...base,
  async addPost(post) {
    await base.addPost(post)
    if (!supabase) return
    const { data: u } = await supabase.auth.getUser()
    await supabase.from('posts').insert({
      account_id: u.user?.id, child_id: null, source_kind: post.sourceKind,
      body: post.body, media_url: post.mediaUrl, visibility: 'community',
    })
  },
}

export const socialService: SocialService =
  AUTH_PROVIDER === 'supabase' ? supabaseSocialService : base
