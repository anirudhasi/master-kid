import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OlySet } from '@/data/olympiadCatalog'

// Olympiad state: per-child per-set progress + parent-uploaded custom sets.
// Reactive cache / mock source of truth; olympiadService writes through it.

export interface SetProgress {
  status: 'not_started' | 'in_progress' | 'done'
  score?: number      // % for worksheets
  updatedAt: number
}

interface OlyState {
  // progress[childId][setId]
  progress: Record<string, Record<string, SetProgress>>
  // custom[`${grade}::${subject}`] = OlySet[]
  custom: Record<string, OlySet[]>
  _setProgress: (childId: string, setId: string, p: SetProgress) => void
  _setCustom: (key: string, sets: OlySet[]) => void
}

export const useOlympiadStore = create<OlyState>()(
  persist(
    (set) => ({
      progress: {},
      custom: {},
      _setProgress: (childId, setId, p) =>
        set((s) => ({ progress: { ...s.progress, [childId]: { ...(s.progress[childId] ?? {}), [setId]: p } } })),
      _setCustom: (key, sets) => set((s) => ({ custom: { ...s.custom, [key]: sets } })),
    }),
    { name: 'mk-olympiad-v1' },
  ),
)

export const olyKey = (grade: string, subject: string) => `${grade}::${subject}`

export function allSharedSets(custom: Record<string, OlySet[]>): OlySet[] {
  return Object.values(custom).flat().filter((s) => s.shared)
}
