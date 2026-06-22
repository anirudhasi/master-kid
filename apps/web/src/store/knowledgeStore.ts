import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Per-child knowledge progress: items learned/solved + quiz scores.
// Reactive cache / mock source of truth; knowledgeService writes through it.

interface KnowledgeState {
  solved: Record<string, string[]>                 // childId → item ids
  scores: Record<string, Record<string, number>>   // childId → itemId → %
  _markSolved: (childId: string, itemId: string) => void
  _setScore: (childId: string, itemId: string, score: number) => void
}

export const useKnowledgeStore = create<KnowledgeState>()(
  persist(
    (set) => ({
      solved: {}, scores: {},
      _markSolved: (childId, itemId) =>
        set((s) => {
          const cur = s.solved[childId] ?? []
          if (cur.includes(itemId)) return s
          return { solved: { ...s.solved, [childId]: [...cur, itemId] } }
        }),
      _setScore: (childId, itemId, score) =>
        set((s) => ({ scores: { ...s.scores, [childId]: { ...(s.scores[childId] ?? {}), [itemId]: score } } })),
    }),
    { name: 'mk-knowledge-v1' },
  ),
)

export const solvedSet = (all: Record<string, string[]>, childId: string) => new Set(all[childId] ?? [])
