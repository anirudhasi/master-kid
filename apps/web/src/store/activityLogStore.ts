import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { supabase } from '@/lib/supabase'

// ── Platform activity log ─────────────────────────────────────────────────────
// Records every meaningful user action for the Admin Console's activity
// monitor. Kept locally (capped) and mirrored best-effort to Supabase
// `activity_events` when a backend session exists.

export type ActivityEvent =
  | 'login' | 'logout' | 'signup'
  | 'kid_added' | 'kid_updated' | 'kid_removed' | 'kid_onboarded'
  | 'worksheet_submitted' | 'chapter_added' | 'chapter_removed'
  | 'log_added' | 'subscription_started'
  | 'admin_action'

export interface ActivityEntry {
  id: string
  event: ActivityEvent
  actor: string        // account identifier (email/phone) — masked in the UI
  detail: string
  at: number
}

interface ActivityLogState {
  entries: ActivityEntry[]
  logActivity: (event: ActivityEvent, actor: string, detail: string, childId?: string) => void
  clear: () => void
}

const MAX_ENTRIES = 500

export const useActivityLogStore = create<ActivityLogState>()(
  persist(
    (set) => ({
      entries: [],

      logActivity(event, actor, detail, childId) {
        const entry: ActivityEntry = {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          event, actor, detail, at: Date.now(),
        }
        set(s => ({ entries: [entry, ...s.entries].slice(0, MAX_ENTRIES) }))

        // Mirror to the backend when signed in (fire-and-forget).
        if (supabase) {
          supabase.auth.getUser().then(({ data }) => {
            const uid = data.user?.id
            if (!uid) return
            supabase!.from('activity_events')
              .insert({ account_id: uid, child_id: childId ?? null, event, detail })
              .then(({ error }) => { if (error) console.warn('[activity] mirror failed:', error.message) })
          })
        }
      },

      clear: () => set({ entries: [] }),
    }),
    { name: 'mk-activity-v1' },
  ),
)

/** Convenience for non-React callers (stores, services). */
export const logActivity = (event: ActivityEvent, actor: string, detail: string, childId?: string) =>
  useActivityLogStore.getState().logActivity(event, actor, detail, childId)
