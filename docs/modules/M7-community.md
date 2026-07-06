# M7 — Community (Module Spec)

**Status:** Draft for sign-off · **Stage:** 4 (growth)
**Governing constraint: this is a children's platform. Safety > engagement, always.**

## 1. Responsibility
Social layer: feed, posts, reactions, comments, and "looking-for" listings (parent seeks
tutor / tutor seeks students). Adults are the actors; children are subjects only under
explicit consent.

## 2. Owned data
`posts`, `post_reactions`, `post_comments` (006) · `018_community_v2.sql`:
`looking_for_listings` (kind seeking_tutor|seeking_students, subjects, grade, city, mode,
status open|closed) · `reports` (reporter, target, reason, status) ·
moderation columns on posts/comments: `status visible|flagged|hidden|removed`.

## 3. Safety architecture (the heart of this spec)
1. **Actors are adults.** Only parent/coach/school roles can post/comment/react.
   Child mode is read-only at most, and only curated categories.
2. **Child PII discipline:** posting about a child requires `community_visibility`
   consent (M2); default post form nudges away from full names/photos; no child is
   *taggable* as an entity.
3. **Moderation pipeline:** every post/comment → synchronous cheap screen (blocklist +
   `/api/moderate` classifier) → publish or flag → user `reports` → M10 review queue →
   audited hide/remove. Repeat-offender throttling.
4. **No DMs between arbitrary users at launch.** Coach↔parent messaging exists only
   inside an enrollment (M4). Community contact happens via "express interest" on a
   listing, which reveals nothing until the parent accepts → then a handshake (M1)
   proceeds. Prevents strangers cold-contacting families — non-negotiable.
5. **No engagement-bait mechanics** (no streaks-for-posting, no follower counts at
   launch). Community serves discovery + belonging, not addiction.

## 4. Contract
```ts
export interface CommunityContract {
  getFeed(cursor?: string): Promise<FeedPage>
  createPost(input: PostInput): Promise<Post>            // consent-checked if child-related
  react(postId: string, kind: ReactionKind): Promise<void>
  comment(postId: string, body: string): Promise<Comment>
  report(target: ReportTarget, reason: string): Promise<void>
  listLookingFor(filters: LfFilters): Promise<LookingForListing[]>
  createLookingFor(input: LfInput): Promise<LookingForListing>
  expressInterest(listingId: string): Promise<void>      // notifies owner via M12; no PII revealed
}
```

## 5. Events
Emits: `post.created` · `report.filed` (→ M10 queue) · `lf.interest_expressed` (→ M12)
Consumes: `storyboard.entry_added` (share prompt, consent-gated) · `consent.changed`

## 6. DoD
- [ ] Migration 018; Social page migrated with moderation states
- [ ] Report → M10 queue → hide/remove loop working, audited
- [ ] Looking-for + express-interest → handshake flow demonstrated
- [ ] Consent gate verified: no child-related post without `community_visibility`
