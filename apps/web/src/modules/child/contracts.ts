// modules/child/contracts.ts — M3 Child (spec §4)

export interface ChildRef { id: string; name: string }

export interface FeedItem {
  id: string
  kind: 'lesson' | 'knowledge' | 'quote' | 'olympiad' | 'activity'
  title: string
  refId: string                // catalog item id (M8)
  completed: boolean
}

export interface EngagementDelta {
  streakDays: number
  streakChanged: boolean
}

export interface ProgressSummary {
  childId: string
  streakDays: number
  lastActivityAt: string | null
  completedToday: number
  nextMilestone?: { title: string; courseName: string }   // composed from M4 data via events
  subscriptionBadge: 'trialing' | 'active' | 'past_due' | 'expired' | 'none' // via M9 contract
}

export interface StoryboardEntry {
  id: string
  kind: string
  title: string
  body?: string
  mediaUrl?: string
  occurredAt: string
}

export interface MilestoneProgressInput {
  childId: string
  enrollmentId: string
  milestoneId: string
  status: 'not_started' | 'in_progress' | 'completed'
  note?: string
  recordedByCoachId: string
}

export interface ChildContract {
  getSelectedChild(): ChildRef | null
  selectChild(childId: string): Promise<void>              // emits child.selected
  getDailyFeed(childId: string): Promise<FeedItem[]>
  completeFeedItem(childId: string, itemId: string): Promise<EngagementDelta>
  getProgressSummary(childId: string): Promise<ProgressSummary>   // M2 dashboard composes on this
  /** Shared-write seam: M4 coach records progress THROUGH M3 (seam rule 1). */
  recordMilestoneProgress(input: MilestoneProgressInput): Promise<void>
  getStoryboard(childId: string): Promise<StoryboardEntry[]>
  addStoryboardEntry(input: Omit<StoryboardEntry, 'id'> & { childId: string }): Promise<void>
}
