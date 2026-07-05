# M3 — Child (Module Spec)

**Status:** Draft for sign-off · **Stage:** 2 (launch-critical)

## 1. Responsibility
Everything the child sees and everything the child *does*. Owns the child-mode shell
(selection, PIN exit — auth mechanics in M1), the daily experience, and — per the Stage-2
ownership refinement — **all per-child progress/engagement records**. Rationale: these
rows share the child's lifecycle (created with the child, deleted with the child,
exported in a DPDP request as one bundle), regardless of which feature page writes them.

> This refines `00-FOUNDATION-ARCHITECTURE.md`, which loosely grouped storyboard under
> M8. Ownership by lifecycle, not by feature page. Foundation doc annotated.

## 2. Owned data
- `daily_feed`, `knowledge_progress` (008) · `olympiad_progress`, `user_resources` (005)
- `storyboard_entries` (003) — the child's journey record
- `activity_events` (010) — raw engagement stream (feeds streaks, S1 signals later)
- `milestone_progress` (007) — shared-write exception: M4 coach marks progress, M3 owns
  the record. Handled via an M3 contract function `recordMilestoneProgress()` that M4
  calls — preserving seam rule 1 (single writer) at the code level.

## 3. Key flows
1. **Child shell** — child selector → `child.selected` event → whole app re-scopes.
   Child-safe chrome: no billing, no settings, no community posting (reading per consent).
2. **Daily loop** (exists: Daily/digest) — feed assembled from M8 catalogs + M3 progress;
   completing items writes progress + `activity_events`, updates streak.
3. **Streaks & engagement** — computed from `activity_events`; keep rules in one
   `engagement.ts` policy file (they WILL change; don't scatter).
4. **Storyboard** — timeline of milestones, badges, uploads. Emits
   `storyboard.entry_added` (M7 sharing hook, consent-gated).
5. **Planner** (exists: MyPlanner) — child-visible plan; parent edits via M2 view.

## 4. Contract
```ts
export interface ChildContract {
  getSelectedChild(): ChildRef | null
  selectChild(childId: string): Promise<void>
  getDailyFeed(childId: string): Promise<FeedItem[]>
  completeFeedItem(childId: string, itemId: string): Promise<EngagementDelta>
  getProgressSummary(childId: string): Promise<ProgressSummary>   // M2 dashboard uses this
  recordMilestoneProgress(input: MilestoneProgressInput): Promise<void>  // M4 calls this
  getStoryboard(childId: string): Promise<StoryboardEntry[]>
  addStoryboardEntry(input: NewEntry): Promise<void>
}
```

## 5. Events
Emits: `child.selected` · `feed.item_completed` · `streak.changed` ·
`storyboard.entry_added`
Consumes: `content.updated` (feed refresh) · `subscription.*` (feature gating)

## 6. DoD
- [ ] Child shell + PIN-exit integrated with M1
- [ ] Daily feed loop migrated + streak policy file with unit tests
- [ ] `recordMilestoneProgress` used by M4 (proves shared-write pattern)
- [ ] ProgressSummary consumed by M2 dashboard
