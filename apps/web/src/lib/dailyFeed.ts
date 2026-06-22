// Deterministic per-child, per-day feed generator. Same child + same day → same
// feed (so "today's tasks" are stable), built from the class-leveled knowledge
// catalog + the child's subjects. Mirrors the daily_feed table shape (008).

import { itemsForGrade, type KItem } from '@/data/knowledgeCatalog'
import { PARENT_QUOTES, type Quote } from '@/data/engagementCatalog'

export interface DailyFeed {
  dateKey: string
  focus: string
  riddle?: KItem
  words: KItem[]
  proverb?: KItem
  game?: KItem
  quote: Quote
}

export const dayKey = (d = new Date()) => d.toISOString().slice(0, 10)

// tiny deterministic hash → number
function seed(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return Math.abs(h)
}
const pick = <T,>(arr: T[], s: number): T | undefined => arr.length ? arr[s % arr.length] : undefined
function pickN<T>(arr: T[], n: number, s: number): T[] {
  if (arr.length <= n) return arr
  return Array.from({ length: n }, (_, k) => arr[(s + k) % arr.length])
}

export function buildDailyFeed(childId: string, grade: string, subjects: string[] = [], dateKey = dayKey()): DailyFeed {
  const s = seed(`${childId}:${dateKey}`)
  const subj = subjects.length ? subjects[s % subjects.length] : 'your favourite subject'
  const games = [...itemsForGrade(grade, 'sudoku'), ...itemsForGrade(grade, 'quiz')]
  return {
    dateKey,
    focus: `Spend 20 focused minutes on ${subj} today — then check it off below.`,
    riddle: pick(itemsForGrade(grade, 'riddle'), s),
    words: pickN(itemsForGrade(grade, 'word_power'), 5, s + 3),
    proverb: pick(itemsForGrade(grade, 'proverb'), s + 7),
    game: pick(games, s + 11),
    quote: PARENT_QUOTES[s % PARENT_QUOTES.length],
  }
}
