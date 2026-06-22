import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Per-child extra-curricular activities, each with a custom curriculum, a
// flexible target, and an optional coach link (handshake token). Reactive cache
// / mock source of truth; activityService writes through it.

export type CoachStatus = 'none' | 'pending' | 'linked'

export interface Activity {
  id: string
  childId: string
  key: string          // activity type key
  name: string
  icon: string
  color: string
  level: string        // 'Beginner' | 'Intermediate' | 'Advanced'
  curriculum: string   // syllabus (write / paste)
  targetName: string
  targetDate: string   // yyyy-mm-dd
  coachToken?: string  // handshake token
  coachStatus: CoachStatus
  coachName?: string
  createdAt: number
}

interface ActivityState {
  activities: Record<string, Activity>
  _set: (a: Activity) => void
  _remove: (id: string) => void
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      activities: {},
      _set: (a) => set((s) => ({ activities: { ...s.activities, [a.id]: a } })),
      _remove: (id) => set((s) => { const n = { ...s.activities }; delete n[id]; return { activities: n } }),
    }),
    { name: 'mk-activities-v1' },
  ),
)

export function activitiesFor(all: Record<string, Activity>, childId: string): Activity[] {
  return Object.values(all).filter((a) => a.childId === childId).sort((a, b) => a.createdAt - b.createdAt)
}

export function makeToken(): string {
  const part = () => Math.random().toString(36).slice(2, 6).toUpperCase()
  return `MK-${part()}-${part()}`
}
