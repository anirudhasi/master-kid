import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Lesson } from '@/data/academicCatalog'

// Parent/admin-uploaded lessons (Q&A + materials) layered on top of the seeded
// sample catalog. Keyed by `${grade}::${subjectKey}`. This is the "upload the
// rest over time" store — the seeded catalog stays read-only sample content.

interface ContentState {
  custom: Record<string, Lesson[]>
  _setList: (key: string, lessons: Lesson[]) => void
}

export const useAcademicContentStore = create<ContentState>()(
  persist(
    (set) => ({
      custom: {},
      _setList: (key, lessons) => set((s) => ({ custom: { ...s.custom, [key]: lessons } })),
    }),
    { name: 'mk-academic-content-v1' },
  ),
)

export const contentKey = (grade: string, subjectKey: string) => `${grade}::${subjectKey}`
