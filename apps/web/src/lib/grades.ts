// Class ladder Nursery → Class 12, shared by Storyboard, Academic, etc.

export const GRADE_LADDER = [
  'Nursery', 'LKG', 'UKG',
  'Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6',
  'Class 7', 'Class 8', 'Class 9', 'Class 10', 'Class 11', 'Class 12',
] as const

export type GradeTile = (typeof GRADE_LADDER)[number]

/** Map a child's stored grade ('Grade 4', 'Class 4', 'Nursery', …) to a ladder index. */
export function currentGradeIndex(kidGrade?: string): number {
  if (!kidGrade) return GRADE_LADDER.indexOf('Class 1')
  const num = kidGrade.match(/(\d+)/)
  if (num) {
    const idx = GRADE_LADDER.indexOf(`Class ${parseInt(num[1])}` as GradeTile)
    if (idx >= 0) return idx
  }
  const norm = kidGrade.trim().toLowerCase()
  const direct = GRADE_LADDER.findIndex((g) => g.toLowerCase() === norm)
  return direct >= 0 ? direct : GRADE_LADDER.indexOf('Class 1')
}

export type TileState = 'unlocked' | 'next' | 'locked'

/** Tiles up to the current grade are unlocked; the immediate next unlocks on promotion (April). */
export function tileState(index: number, currentIndex: number): TileState {
  if (index <= currentIndex) return 'unlocked'
  if (index === currentIndex + 1) return 'next'
  return 'locked'
}

/** The April in which the next tile becomes available (start of the next academic year). */
export function nextUnlockLabel(): string {
  const now = new Date()
  const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear()
  return `Unlocks April ${year}`
}
