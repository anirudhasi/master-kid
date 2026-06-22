import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Per-child, per-class storyboard entries. Reactive cache + mock-mode source of
// truth; storyboardService writes through it (same pattern as subscriptionStore).

export type StoryKind = 'achievement' | 'result' | 'certificate' | 'photo' | 'note'

export interface StoryEntry {
  id: string
  childId: string
  grade: string          // class tile key, e.g. 'Class 4'
  kind: StoryKind
  title: string
  body: string           // description / scribble note text
  postcardNote: string   // flip-side note for a photo
  mediaUrl?: string      // dataURL (mock) or storage URL
  occurredOn: string     // yyyy-mm-dd — timeline ordering
  createdAt: number
}

export const PHOTO_CAP = 10

interface StoryState {
  entries: Record<string, StoryEntry>
  _set: (entry: StoryEntry) => void
  _remove: (id: string) => void
}

export const useStoryboardStore = create<StoryState>()(
  persist(
    (set) => ({
      entries: {},
      _set: (entry) => set((s) => ({ entries: { ...s.entries, [entry.id]: entry } })),
      _remove: (id) =>
        set((s) => {
          const next = { ...s.entries }
          delete next[id]
          return { entries: next }
        }),
    }),
    { name: 'mk-storyboard-v1' },
  ),
)

// ── Selectors (pure helpers) ──────────────────────────────────────────────────
export function entriesFor(all: Record<string, StoryEntry>, childId: string, grade?: string): StoryEntry[] {
  return Object.values(all)
    .filter((e) => e.childId === childId && (grade ? e.grade === grade : true))
    .sort((a, b) => (a.occurredOn < b.occurredOn ? 1 : a.occurredOn > b.occurredOn ? -1 : b.createdAt - a.createdAt))
}

export function photoCountFor(all: Record<string, StoryEntry>, childId: string, grade: string): number {
  return Object.values(all).filter((e) => e.childId === childId && e.grade === grade && e.kind === 'photo').length
}
