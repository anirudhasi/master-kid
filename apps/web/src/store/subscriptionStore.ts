import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Per-child subscription. This store is the reactive cache + the mock-mode
// source of truth; the subscriptionService writes through it so the UI updates
// regardless of backend (mock or Supabase). See services/subscriptionService.ts.

export type SubPlan = 'free_trial' | 'monthly' | 'yearly'
export type SubStatus = 'trialing' | 'active' | 'expired' | 'skipped_test'

export interface Subscription {
  childId: string
  plan: SubPlan
  status: SubStatus
  startedAt: number          // epoch ms
  currentPeriodEnd: number   // epoch ms — when access lapses (ignored for skipped_test)
}

interface SubState {
  subs: Record<string, Subscription>
  /** internal write-through used by the service layer */
  _set: (sub: Subscription) => void
  _remove: (childId: string) => void
}

export const useSubscriptionStore = create<SubState>()(
  persist(
    (set) => ({
      subs: {},
      _set: (sub) => set((s) => ({ subs: { ...s.subs, [sub.childId]: sub } })),
      _remove: (childId) =>
        set((s) => {
          const next = { ...s.subs }
          delete next[childId]
          return { subs: next }
        }),
    }),
    { name: 'mk-subscriptions-v1' },
  ),
)

/** True when the child currently has access (active/trial not lapsed, or test-skipped). */
export function isSubscriptionActive(sub?: Subscription | null): boolean {
  if (!sub) return false
  if (sub.status === 'skipped_test') return true
  if (sub.status === 'expired') return false
  return sub.currentPeriodEnd > Date.now()
}

/** Whole days remaining in the current period (0 if lapsed). */
export function daysRemaining(sub?: Subscription | null): number {
  if (!sub || sub.status === 'skipped_test') return 0
  return Math.max(0, Math.ceil((sub.currentPeriodEnd - Date.now()) / 86_400_000))
}
