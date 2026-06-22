// Extra-curricular activity catalog + age-aware default curricula.
// Parents pick activities, then customise the syllabus and set a target date.

export interface ActivityType {
  key: string
  name: string
  icon: string
  color: string
  category: 'dance' | 'music' | 'arts' | 'sports' | 'mind' | 'language' | 'tech'
}

export const ACTIVITY_TYPES: ActivityType[] = [
  { key: 'bharatanatyam', name: 'Bharatanatyam', icon: '💃', color: '#EC4899', category: 'dance' },
  { key: 'western_dance', name: 'Western Dance',  icon: '🕺', color: '#DB2777', category: 'dance' },
  { key: 'vocal',         name: 'Vocal Music',    icon: '🎤', color: '#8B5CF6', category: 'music' },
  { key: 'piano',         name: 'Piano / Keyboard', icon: '🎹', color: '#7C3AED', category: 'music' },
  { key: 'guitar',        name: 'Guitar',         icon: '🎸', color: '#6D28D9', category: 'music' },
  { key: 'drawing',       name: 'Drawing & Art',  icon: '🎨', color: '#F59E0B', category: 'arts' },
  { key: 'swimming',      name: 'Swimming',       icon: '🏊', color: '#0EA5E9', category: 'sports' },
  { key: 'cricket',       name: 'Cricket',        icon: '🏏', color: '#16A34A', category: 'sports' },
  { key: 'football',      name: 'Football',       icon: '⚽', color: '#059669', category: 'sports' },
  { key: 'badminton',     name: 'Badminton',      icon: '🏸', color: '#10B981', category: 'sports' },
  { key: 'chess',         name: 'Chess',          icon: '♟️', color: '#475569', category: 'mind' },
  { key: 'abacus',        name: 'Abacus / Mental Maths', icon: '🧮', color: '#D97706', category: 'mind' },
  { key: 'coding',        name: 'Coding',         icon: '💻', color: '#2563EB', category: 'tech' },
  { key: 'robotics',      name: 'Robotics',       icon: '🤖', color: '#4F46E5', category: 'tech' },
  { key: 'french',        name: 'French',         icon: '🇫🇷', color: '#1D4ED8', category: 'language' },
  { key: 'hindi_lang',    name: 'Hindi',          icon: '🔤', color: '#DC2626', category: 'language' },
  { key: 'kannada',       name: 'Kannada',        icon: '🔤', color: '#B45309', category: 'language' },
]

export const ACTIVITY_META = Object.fromEntries(ACTIVITY_TYPES.map(a => [a.key, a]))

const TEMPLATES: Record<string, string> = {
  bharatanatyam: `Year 1 Foundation (Bharatanatyam)
1. Posture & basic stance (Araimandi, Muzhumandi)
2. Adavus — Tatta, Natta, Visharu (groups 1–3)
3. Hand gestures — Asamyukta & Samyukta Hastas
4. Eye & neck movements (Drishti bhedas, Greeva)
5. First Alarippu — practice & rhythm
6. Theory: history, instruments, costume basics
Target: appear for the Year-1 grade exam.`,
  swimming: `Beginner Swimming
1. Water comfort & breathing (bubbles, floating)
2. Kicking drills with board
3. Freestyle arm action + coordination
4. Backstroke basics
5. Endurance: 1 lap → 4 laps
6. Water safety & diving intro
Target: swim 50m freestyle unassisted.`,
  chess: `Chess — Beginner
1. Board, pieces & how each moves
2. Check, checkmate, stalemate
3. Opening principles (control centre, develop pieces)
4. Basic tactics: forks, pins, skewers
5. Simple endgames (K+Q vs K)
6. Play & review 10 practice games
Target: win a school-level friendly tournament.`,
  drawing: `Drawing — Junior Grade
1. Lines, shapes & shading basics
2. Object drawing (still life)
3. Colour theory & wash techniques
4. Landscape & perspective intro
5. Figure & cartoon drawing
6. Portfolio of 8 finished works
Target: clear the Junior Grade drawing exam.`,
  coding: `Coding for Kids — Level 1
1. What is a program? Sequencing (Scratch)
2. Loops & repetition
3. Events & interactivity
4. Variables & simple logic
5. Build a small game
6. Showcase project
Target: build and present one original game.`,
}

/** Suggest a starter syllabus for an activity, lightly tuned by age. */
export function defaultCurriculum(key: string, age?: number): string {
  const base = TEMPLATES[key]
  const meta = ACTIVITY_META[key]
  const name = meta?.name ?? 'Activity'
  if (base) return age && age <= 7 ? base.replace('Year 1 Foundation', 'Foundation (early years)') : base
  return `${name} — Starter Plan
1. Fundamentals & warm-up
2. Core technique practice
3. Build consistency (weekly goals)
4. Intermediate skills
5. Mock assessment / friendly
6. Review & next-level prep
Target: set a clear goal with your coach.`
}
