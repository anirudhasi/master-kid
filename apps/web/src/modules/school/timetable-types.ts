// modules/school/timetable-types.ts — extracted from store/timetableStore (PR-26).
// Shape adopted verbatim as the class `timetable` jsonb schema (dev-spec grounding).
export interface Period {
  id: string
  label: string        // e.g. "Period 1", "Lunch"
  start: string        // HH:mm
  end: string          // HH:mm
  kind: 'class' | 'break'
}
export interface Timetable {
  periods: Period[]
  days: number[]                                 // 1=Mon..6=Sat
  grid: Record<string, Record<number, string>>   // grid[periodId][day] = subject ('' = free)
}
