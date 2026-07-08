// modules/admin/contracts.ts — M10 Admin & Flow Control (spec §4)
// ALL mutations route through /api/admin/* (server-side role check + audit).

export type ToggleScope = 'global' | 'plan' | 'account'
export type ReviewKind =
  | 'content_draft' | 'coach_verification' | 'community_report'
  | 'school_verification' | 'data_request'

export interface Toggle {
  key: string                  // 'module.community', 'feature.olympiad_pro'
  scope: ToggleScope
  scopeRef: string             // '*' | planId | accountId
  value: boolean
  updatedAt: string
}

export interface JourneyStep {
  id: string
  type: string                 // step TYPES are code; arrangement is data (spec §2.2)
  enabled: boolean
  params?: Record<string, unknown>
}

export interface JourneyDefinition {
  key: 'onboarding_steps' | 'child_daily_feed_composition' | 'parent_nav_order' | (string & {})
  version: number
  steps: JourneyStep[]
  published: boolean
}

export interface ReviewItem {
  id: string
  kind: ReviewKind
  refId: string
  summary?: string
  status: 'pending' | 'approved' | 'rejected'
  notes?: string
  createdAt: string
}

export interface OpsSnapshot {
  reviewCounts: Record<ReviewKind, number>
  ticketCounts: Record<string, number>
  notificationFailures24h: number
  topSearchTerms: { term: string; count: number }[]
  agentSpendInr?: { day: number; week: number }   // populated once S1 lands
}

export interface AdminContract {
  getToggles(): Promise<Toggle[]>
  setToggle(key: string, scope: ToggleScope, scopeRef: string, value: boolean): Promise<void>

  getJourney(key: string): Promise<JourneyDefinition>       // published (fallback if absent)
  getJourneyDrafts(key: string): Promise<JourneyDefinition[]>
  saveJourneyDraft(def: Omit<JourneyDefinition, 'published'>): Promise<void>
  publishJourney(key: string, version: number): Promise<void>  // rollback = publish older version

  getReviewQueue(kind?: ReviewKind): Promise<ReviewItem[]>
  resolveReview(id: string, decision: 'approved' | 'rejected', notes?: string): Promise<void>

  searchAccounts(q: string): Promise<{ id: string; name?: string; phone?: string;
    role: string; status: string }[]>
  setAccountStatus(accountId: string, status: 'active' | 'disabled'): Promise<void>

  getOpsSnapshot(): Promise<OpsSnapshot>
}

/** Runtime module gate used across the app (kill-switch semantics, PR-30). */
export interface TogglesRuntime {
  isEnabled(key: string): boolean          // cached snapshot; refreshes on toggle.changed
}

export class ModuleDisabledError extends Error {
  constructor(public readonly moduleKey: string) {
    super(`module '${moduleKey}' is disabled`)
    this.name = 'ModuleDisabledError'
  }
}
