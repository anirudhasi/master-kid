import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Community social feed (parents + students). Reactive cache / mock source of
// truth; socialService writes through it. Posts are shared community-wide.

export interface Comment {
  id: string
  authorName: string
  authorAvatar: string
  body: string
  createdAt: number
}

export interface Post {
  id: string
  authorId: string            // account id (activePhone in mock)
  authorName: string
  authorAvatar: string
  authorRole: string          // 'Parent' | 'Student' | 'Teacher' | 'Coach'
  childName?: string
  sourceKind: 'achievement' | 'resource' | 'freeform'
  body: string
  mediaUrl?: string
  createdAt: number
  reactions: Record<string, string[]>  // emoji → reactor ids
  comments: Comment[]
}

export const REACTIONS = ['👏', '❤️', '🔥', '⭐'] as const

const seed: Post[] = [
  {
    id: 'seed-1', authorId: 'system', authorName: 'Master-Kids', authorAvatar: '🎓', authorRole: 'Team',
    sourceKind: 'freeform', createdAt: Date.now() - 3600_000 * 5,
    body: 'Welcome to the community! 🎉 Share your child’s achievements, ask questions, and swap resources with other parents.',
    reactions: { '👏': ['a', 'b', 'c'], '❤️': ['d'] }, comments: [],
  },
  {
    id: 'seed-2', authorId: 'system', authorName: 'NPS Parent Group', authorAvatar: '🏫', authorRole: 'Parent',
    sourceKind: 'freeform', createdAt: Date.now() - 3600_000 * 26,
    body: '📢 Olympiad registrations (IMO/NSO/IEO) close end of the month. Don’t miss the early-bird slots!',
    reactions: { '🔥': ['x', 'y'] }, comments: [],
  },
]

interface SocialState {
  posts: Record<string, Post>
  _set: (post: Post) => void
  _remove: (id: string) => void
}

export const useSocialStore = create<SocialState>()(
  persist(
    (set) => ({
      posts: Object.fromEntries(seed.map((p) => [p.id, p])),
      _set: (post) => set((s) => ({ posts: { ...s.posts, [post.id]: post } })),
      _remove: (id) => set((s) => { const n = { ...s.posts }; delete n[id]; return { posts: n } }),
    }),
    { name: 'mk-social-v1' },
  ),
)

export function feed(posts: Record<string, Post>): Post[] {
  return Object.values(posts).sort((a, b) => b.createdAt - a.createdAt)
}

export function reactionCount(p: Post): number {
  return Object.values(p.reactions).reduce((a, ids) => a + ids.length, 0)
}
