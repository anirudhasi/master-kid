import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Daily engagement: per-child completed tasks for the day + a streak that grows
// when the day's checklist is finished on consecutive days.

interface ChildEng {
  date: string            // current day's key
  done: string[]          // task ids done today
  streak: number
  lastComplete: string    // day key when checklist was last fully completed
}

interface EngState {
  byChild: Record<string, ChildEng>
  markTask: (childId: string, dateKey: string, taskId: string, totalTasks: number) => void
}

const yesterday = (key: string) => {
  const d = new Date(key); d.setDate(d.getDate() - 1); return d.toISOString().slice(0, 10)
}

export const useEngagementStore = create<EngState>()(
  persist(
    (set) => ({
      byChild: {},
      markTask: (childId, dateKey, taskId, totalTasks) =>
        set((s) => {
          const cur = s.byChild[childId]
          const fresh = !cur || cur.date !== dateKey
          const done = fresh ? [taskId] : (cur.done.includes(taskId) ? cur.done : [...cur.done, taskId])
          let streak = cur?.streak ?? 0
          let lastComplete = cur?.lastComplete ?? ''
          if (done.length >= totalTasks && lastComplete !== dateKey) {
            streak = lastComplete === yesterday(dateKey) ? streak + 1 : 1
            lastComplete = dateKey
          }
          return { byChild: { ...s.byChild, [childId]: { date: dateKey, done, streak, lastComplete } } }
        }),
    }),
    { name: 'mk-engagement-v1' },
  ),
)

export function todayState(byChild: Record<string, ChildEng>, childId: string, dateKey: string) {
  const c = byChild[childId]
  return { done: c && c.date === dateKey ? c.done : [], streak: c?.streak ?? 0 }
}
