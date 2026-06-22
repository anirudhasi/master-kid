// Knowledge & fun catalog. Items are tagged with a class level (grade tile) and a
// difficulty (beginner→advanced). The app shows items at/below the child's class
// (never beyond), across all difficulties. Content is data — grow it freely.

import { GRADE_LADDER } from '@/lib/grades'

export type KType =
  | 'quiz' | 'riddle' | 'word_power' | 'idiom' | 'proverb'
  | 'capital' | 'tongue_twister' | 'sudoku' | 'puzzle'
export type KLevel = 'beginner' | 'intermediate' | 'advanced'

export interface QItem { q: string; options: string[]; answerIndex: number }
export interface KItem {
  id: string
  type: KType
  level: KLevel
  grade: string            // class tile this item suits (shown if child >= this)
  prompt?: string          // riddle / idiom / proverb / puzzle / capital question
  answer?: string          // the reveal
  word?: string; meaning?: string; example?: string  // word_power
  text?: string            // tongue twister
  questions?: QItem[]      // quiz
  sudoku?: { puzzle: number[][]; solution: number[][] }  // 4×4 (0 = blank)
  title?: string
}

export const CATEGORIES: { type: KType; label: string; icon: string; color: string; colorLight: string }[] = [
  { type: 'quiz',          label: 'Quizzes',         icon: '❓', color: '#4F46E5', colorLight: '#EEF2FF' },
  { type: 'riddle',        label: 'Riddles',         icon: '🧩', color: '#7C3AED', colorLight: '#F5F3FF' },
  { type: 'word_power',    label: 'Word Power',      icon: '📚', color: '#059669', colorLight: '#ECFDF5' },
  { type: 'idiom',         label: 'Idioms',          icon: '💬', color: '#0891B2', colorLight: '#ECFEFF' },
  { type: 'proverb',       label: 'Proverbs',        icon: '🦉', color: '#D97706', colorLight: '#FFFBEB' },
  { type: 'capital',       label: 'Capitals',        icon: '🌍', color: '#DB2777', colorLight: '#FCE7F3' },
  { type: 'tongue_twister',label: 'Tongue Twisters', icon: '👅', color: '#DC2626', colorLight: '#FEF2F2' },
  { type: 'sudoku',        label: 'Sudoku',          icon: '🔢', color: '#0EA5E9', colorLight: '#F0F9FF' },
  { type: 'puzzle',        label: 'Brain Puzzles',   icon: '🧠', color: '#16A34A', colorLight: '#F0FDF4' },
]

export const CATEGORY_META = Object.fromEntries(CATEGORIES.map(c => [c.type, c]))

let n = 0
const id = (t: string) => `k-${t}-${++n}`

const ITEMS: KItem[] = [
  // ── Quizzes ──
  { id: id('quiz'), type: 'quiz', level: 'beginner', grade: 'Class 2', title: 'Animals & Nature', questions: [
    { q: 'Which animal is the tallest?', options: ['Elephant', 'Giraffe', 'Horse', 'Camel'], answerIndex: 1 },
    { q: 'What do bees make?', options: ['Milk', 'Honey', 'Silk', 'Wax only'], answerIndex: 1 },
    { q: 'Which is a reptile?', options: ['Frog', 'Crocodile', 'Dolphin', 'Sparrow'], answerIndex: 1 },
  ] },
  { id: id('quiz'), type: 'quiz', level: 'intermediate', grade: 'Class 4', title: 'General Science', questions: [
    { q: 'The gas we breathe in to live is…', options: ['Carbon dioxide', 'Oxygen', 'Nitrogen', 'Helium'], answerIndex: 1 },
    { q: 'How many planets are in our solar system?', options: ['7', '8', '9', '10'], answerIndex: 1 },
    { q: 'Water boils at…', options: ['50°C', '100°C', '0°C', '200°C'], answerIndex: 1 },
  ] },
  { id: id('quiz'), type: 'quiz', level: 'advanced', grade: 'Class 5', title: 'India GK', questions: [
    { q: 'National animal of India?', options: ['Lion', 'Tiger', 'Elephant', 'Peacock'], answerIndex: 1 },
    { q: 'Who wrote the national anthem?', options: ['Tagore', 'Gandhi', 'Nehru', 'Bose'], answerIndex: 0 },
  ] },

  // ── Riddles ──
  { id: id('rd'), type: 'riddle', level: 'beginner', grade: 'Class 1', prompt: 'I have hands but cannot clap. What am I?', answer: 'A clock' },
  { id: id('rd'), type: 'riddle', level: 'beginner', grade: 'Class 2', prompt: 'What has a face and two hands but no arms or legs?', answer: 'A clock' },
  { id: id('rd'), type: 'riddle', level: 'intermediate', grade: 'Class 3', prompt: 'The more you take, the more you leave behind. What are they?', answer: 'Footsteps' },
  { id: id('rd'), type: 'riddle', level: 'intermediate', grade: 'Class 4', prompt: 'I’m tall when young and short when old. What am I?', answer: 'A candle' },
  { id: id('rd'), type: 'riddle', level: 'advanced', grade: 'Class 5', prompt: 'What has keys but opens no locks?', answer: 'A piano (or keyboard)' },

  // ── Word power ──
  { id: id('wp'), type: 'word_power', level: 'beginner', grade: 'Class 2', word: 'Brave', meaning: 'Showing courage', example: 'The brave girl saved the kitten.' },
  { id: id('wp'), type: 'word_power', level: 'beginner', grade: 'Class 2', word: 'Curious', meaning: 'Eager to learn or know', example: 'She was curious about the stars.' },
  { id: id('wp'), type: 'word_power', level: 'intermediate', grade: 'Class 4', word: 'Generous', meaning: 'Willing to give and share', example: 'He was generous with his toys.' },
  { id: id('wp'), type: 'word_power', level: 'intermediate', grade: 'Class 4', word: 'Diligent', meaning: 'Hard-working and careful', example: 'A diligent student finishes homework on time.' },
  { id: id('wp'), type: 'word_power', level: 'intermediate', grade: 'Class 4', word: 'Honest', meaning: 'Telling the truth', example: 'An honest child returned the lost wallet.' },
  { id: id('wp'), type: 'word_power', level: 'advanced', grade: 'Class 5', word: 'Perseverance', meaning: 'Not giving up despite difficulty', example: 'Her perseverance won the race.' },
  { id: id('wp'), type: 'word_power', level: 'advanced', grade: 'Class 5', word: 'Gratitude', meaning: 'Being thankful', example: 'He expressed gratitude to his teacher.' },

  // ── Idioms ──
  { id: id('id'), type: 'idiom', level: 'beginner', grade: 'Class 3', prompt: 'Piece of cake', answer: 'Something very easy to do.' },
  { id: id('id'), type: 'idiom', level: 'intermediate', grade: 'Class 4', prompt: 'Break the ice', answer: 'To start a conversation in a friendly way.' },
  { id: id('id'), type: 'idiom', level: 'intermediate', grade: 'Class 4', prompt: 'Hit the books', answer: 'To study hard.' },
  { id: id('id'), type: 'idiom', level: 'advanced', grade: 'Class 6', prompt: 'Once in a blue moon', answer: 'Something that happens very rarely.' },

  // ── Proverbs ──
  { id: id('pv'), type: 'proverb', level: 'beginner', grade: 'Class 3', prompt: 'A stitch in time saves nine.', answer: 'Fixing a small problem early prevents bigger trouble later.' },
  { id: id('pv'), type: 'proverb', level: 'intermediate', grade: 'Class 4', prompt: 'Practice makes perfect.', answer: 'Doing something repeatedly makes you better at it.' },
  { id: id('pv'), type: 'proverb', level: 'intermediate', grade: 'Class 5', prompt: 'Honesty is the best policy.', answer: 'Telling the truth is always the wisest choice.' },

  // ── Capitals (flashcards) ──
  { id: id('cap'), type: 'capital', level: 'beginner', grade: 'Class 3', prompt: 'India', answer: 'New Delhi' },
  { id: id('cap'), type: 'capital', level: 'beginner', grade: 'Class 3', prompt: 'Japan', answer: 'Tokyo' },
  { id: id('cap'), type: 'capital', level: 'intermediate', grade: 'Class 4', prompt: 'France', answer: 'Paris' },
  { id: id('cap'), type: 'capital', level: 'intermediate', grade: 'Class 4', prompt: 'Australia', answer: 'Canberra' },
  { id: id('cap'), type: 'capital', level: 'advanced', grade: 'Class 5', prompt: 'Canada', answer: 'Ottawa' },
  { id: id('cap'), type: 'capital', level: 'advanced', grade: 'Class 6', prompt: 'Brazil', answer: 'Brasília' },

  // ── Tongue twisters ──
  { id: id('tt'), type: 'tongue_twister', level: 'beginner', grade: 'Class 1', text: 'She sells sea-shells by the sea-shore.' },
  { id: id('tt'), type: 'tongue_twister', level: 'beginner', grade: 'Class 2', text: 'Red lorry, yellow lorry.' },
  { id: id('tt'), type: 'tongue_twister', level: 'intermediate', grade: 'Class 4', text: 'Peter Piper picked a peck of pickled peppers.' },
  { id: id('tt'), type: 'tongue_twister', level: 'advanced', grade: 'Class 5', text: 'How much wood would a woodchuck chuck if a woodchuck could chuck wood?' },

  // ── Sudoku (4×4) ──
  { id: id('su'), type: 'sudoku', level: 'beginner', grade: 'Class 3', title: 'Mini Sudoku — Easy',
    sudoku: { puzzle: [[1, 0, 0, 4], [0, 4, 1, 0], [0, 1, 4, 0], [4, 0, 0, 1]], solution: [[1, 2, 3, 4], [3, 4, 1, 2], [2, 1, 4, 3], [4, 3, 2, 1]] } },
  { id: id('su'), type: 'sudoku', level: 'intermediate', grade: 'Class 4', title: 'Mini Sudoku — Medium',
    sudoku: { puzzle: [[0, 0, 2, 0], [2, 0, 0, 3], [3, 0, 0, 2], [0, 2, 0, 0]], solution: [[1, 3, 2, 4], [2, 4, 1, 3], [3, 1, 4, 2], [4, 2, 3, 1]] } },

  // ── Brain puzzles ──
  { id: id('pz'), type: 'puzzle', level: 'beginner', grade: 'Class 3', prompt: 'I am an odd number. Take away one letter and I become even. What number am I?', answer: 'Seven (remove "s" → "even").' },
  { id: id('pz'), type: 'puzzle', level: 'intermediate', grade: 'Class 4', prompt: 'If 2 + 3 = 10, 7 + 2 = 63, 6 + 5 = 66, then 8 + 4 = ?', answer: '96  (a+b)×a: (8+4)×8 = 96).' },
  { id: id('pz'), type: 'puzzle', level: 'advanced', grade: 'Class 6', prompt: 'A farmer has 17 sheep, all but 9 run away. How many are left?', answer: '9 sheep.' },
]

const gIdx = (g: string) => GRADE_LADDER.indexOf(g as typeof GRADE_LADDER[number])

/** Items at/below the child's class (never beyond), optionally of one type. */
export function itemsForGrade(childGrade: string, type?: KType): KItem[] {
  const ci = gIdx(childGrade)
  return ITEMS.filter(i => gIdx(i.grade) <= ci && (type ? i.type === type : true))
}

export function countForGrade(childGrade: string, type: KType): number {
  return itemsForGrade(childGrade, type).length
}
