// modules/events/contracts.ts — M13 Event Bus contracts (spec §2)
// The event catalog IS the integration map. Add events via PR to this file only.
// Payloads must be plain JSON-serializable data (broker-swap safety, spec §5).

interface Base<T extends string, P> {
  type: T
  version: 1
  occurredAt: string        // ISO
  actorId: string | null    // account causing it; null = system/agent
  payload: P
}

// ── M1 identity ──────────────────────────────────────────────────────────────
export type AccountCreated     = Base<'account.created',      { accountId: string; role: string }>
export type AccountRoleChanged = Base<'account.role_changed', { accountId: string; roles: string[] }>
export type HandshakeGranted   = Base<'handshake.granted',    { childId: string; granteeRole: 'coach' | 'school' }>
export type HandshakeRedeemed  = Base<'handshake.redeemed',   { childId: string; granteeAccountId: string }>
export type AccessRevoked      = Base<'access.revoked',       { childId: string; granteeAccountId: string }>

// ── M2 parent ────────────────────────────────────────────────────────────────
export type ChildCreated  = Base<'child.created',  { childId: string; accountId: string; isFirstChild: boolean }>
export type ChildUpdated  = Base<'child.updated',  { childId: string }>
export type ChildArchived = Base<'child.archived', { childId: string }>
export type ConsentChanged = Base<'consent.changed', { childId: string; kind: string; granted: boolean }>

// ── M3 child ─────────────────────────────────────────────────────────────────
export type ChildSelected     = Base<'child.selected',        { childId: string }>
export type FeedItemCompleted = Base<'feed.item_completed',   { childId: string; itemId: string }>
export type StreakChanged     = Base<'streak.changed',        { childId: string; days: number }>
export type StoryboardAdded   = Base<'storyboard.entry_added',{ childId: string; entryId: string }>

// ── M4 coach ─────────────────────────────────────────────────────────────────
export type EnrollmentCompleted = Base<'enrollment.handshake_completed', { childId: string; coachId: string; enrollmentId: string }>
export type EnrollmentEnded     = Base<'enrollment.ended',               { enrollmentId: string }>
export type MilestoneUpdated    = Base<'milestone.progress_updated',     { childId: string; milestoneId: string; status: string }>

// ── M8 content / S1 ──────────────────────────────────────────────────────────
export type ContentUpdated        = Base<'content.updated',         { itemId: string; kind: string }>
export type ContentDraftSubmitted = Base<'content.draft_submitted', { itemId: string; source: 'agent' | 'manual' }>

// ── M9 commerce ──────────────────────────────────────────────────────────────
export type SubscriptionActivated = Base<'subscription.activated',      { accountId: string; planId: string }>
export type SubscriptionExpired   = Base<'subscription.expired',        { accountId: string }>
export type PaymentFailed         = Base<'subscription.payment_failed', { accountId: string }>

// ── M10 admin ────────────────────────────────────────────────────────────────
export type AdminAction = Base<'admin.action_performed', { action: string; targetId?: string }>

export type AnyDomainEvent =
  | AccountCreated | AccountRoleChanged | HandshakeGranted | HandshakeRedeemed | AccessRevoked
  | ChildCreated | ChildUpdated | ChildArchived | ConsentChanged
  | ChildSelected | FeedItemCompleted | StreakChanged | StoryboardAdded
  | EnrollmentCompleted | EnrollmentEnded | MilestoneUpdated
  | ContentUpdated | ContentDraftSubmitted
  | SubscriptionActivated | SubscriptionExpired | PaymentFailed
  | AdminAction

export type EventType = AnyDomainEvent['type']
export type EventOf<T extends EventType> = Extract<AnyDomainEvent, { type: T }>

export interface EventBus {
  emit<E extends AnyDomainEvent>(event: E): void
  on<T extends EventType>(type: T, handler: (e: EventOf<T>) => void | Promise<void>): () => void
}

/** Helper to construct a well-formed event. */
export function makeEvent<T extends EventType>(
  type: T, payload: EventOf<T>['payload'], actorId: string | null = null,
): EventOf<T> {
  return { type, version: 1, occurredAt: new Date().toISOString(), actorId, payload } as EventOf<T>
}
