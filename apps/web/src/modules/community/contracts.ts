// modules/community/contracts.ts — M7 Community (spec §4)
// Safety invariants live in the DB (018) and /api/moderate; this contract is the
// app-side surface. No DM primitives by design (spec §3.4).

export type ModerationStatus = 'visible' | 'flagged' | 'hidden' | 'removed'
export type ReactionKind = 'like' | 'clap' | 'star'
export type LfKind = 'seeking_tutor' | 'seeking_students'

export interface Post {
  id: string
  accountId: string
  childId?: string
  sourceKind: 'achievement' | 'resource' | 'freeform'
  body?: string
  mediaUrl?: string
  status: ModerationStatus     // authors see own flagged items with an "under review" chip
  createdAt: string
  reactions: Partial<Record<ReactionKind, number>>
  commentCount: number
}

export interface Comment {
  id: string
  accountId: string
  body: string
  status: ModerationStatus
  createdAt: string
}

export interface PostInput {
  sourceKind: Post['sourceKind']
  body?: string
  mediaUrl?: string
  childId?: string             // requires community_visibility consent (DB-enforced, 018)
}

export interface LookingForListing {
  id: string
  kind: LfKind
  subjects: string[]
  grade?: string
  city?: string
  mode?: 'online' | 'offline' | 'hybrid'
  body?: string
  status: 'open' | 'closed'
  createdAt: string
  myInterestStatus?: 'pending' | 'accepted' | 'declined'
}

export interface CommunityContract {
  getFeed(cursor?: string): Promise<{ posts: Post[]; cursor?: string }>
  /** Runs the /api/moderate screen before insert; consent gate enforced in DB. */
  createPost(input: PostInput): Promise<{ post: Post; moderation: 'visible' | 'flagged' }>
  react(postId: string, kind: ReactionKind): Promise<void>
  comment(postId: string, body: string): Promise<Comment>
  report(target: { kind: 'post' | 'comment' | 'listing'; id: string }, reason: string): Promise<void>

  listLookingFor(filters: { kind?: LfKind; subject?: string; city?: string }): Promise<LookingForListing[]>
  createLookingFor(input: Omit<LookingForListing, 'id' | 'status' | 'createdAt' | 'myInterestStatus'>): Promise<LookingForListing>
  closeLookingFor(id: string): Promise<void>
  /** Notifies owner via M12; reveals NOTHING about the interested party pre-accept. */
  expressInterest(listingId: string): Promise<void>
  resolveInterest(listingId: string, interestedAccountId: string,
    decision: 'accepted' | 'declined'): Promise<void>
}
