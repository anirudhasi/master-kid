import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Per-child chosen subjects (keys into the academic catalog), scoped by grade.
// Reactive cache + mock-mode source of truth; academicService writes through it.
// Map key = `${childId}::${grade}` → ordered list of subject keys.

interface AcademicState {
  selected: Record<string, string[]>
  _setList: (key: string, keys: string[]) => void
}

export const useAcademicStore = create<AcademicState>()(
  persist(
    (set) => ({
      selected: {},
      _setList: (key, keys) => set((s) => ({ selected: { ...s.selected, [key]: keys } })),
    }),
    { name: 'mk-academic-v1' },
  ),
)

export const childGradeKey = (childId: string, grade: string) => `${childId}::${grade}`
