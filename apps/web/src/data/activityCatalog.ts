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

/** Suggest a starter syllabus for an activity, lightly tuned by age.
 *  `displayName` lets custom (non-catalog) activities name their own plan. */
export function defaultCurriculum(key: string, age?: number, displayName?: string): string {
  const base = TEMPLATES[key]
  const meta = ACTIVITY_META[key]
  const name = displayName ?? meta?.name ?? 'Activity'
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

// ── Standard courses ("targets") ──────────────────────────────────────────────
// A picker of recognised graded programs per activity. Selecting one auto-fills
// the syllabus (per the feedback). Activities without a curated list fall back to
// a generic Beginner/Intermediate/Advanced program via standardCoursesFor().
export interface StandardCourse { name: string; syllabus: string }

const syl = (title: string, ...steps: string[]) =>
  [title, ...steps.map((s, i) => `${i + 1}. ${s}`)].join('\n')

export const STANDARD_COURSES: Record<string, StandardCourse[]> = {
  piano: [
    { name: 'Trinity — Initial Grade (Piano)', syllabus: syl('Trinity Initial Grade — Piano', 'Sitting posture & hand position', 'Two simple set pieces', 'Scales: C & G major (one octave)', 'Clapping rhythms & basic aural', 'Mock exam & performance') },
    { name: 'Trinity Grade 1 (Piano)', syllabus: syl('Trinity Grade 1 — Piano', 'Three set pieces', 'Scales & arpeggios (C, G, F major)', 'Sight-reading 4 bars', 'Aural tests & musical knowledge', 'Mock exam & recital') },
    { name: 'ABRSM Grade 1 (Piano)', syllabus: syl('ABRSM Grade 1 — Piano', 'Three pieces from the syllabus list', 'Scales & broken chords (C, G, D, F)', 'Sight-reading', 'Aural tests', 'Mock exam') },
  ],
  guitar: [
    { name: 'Trinity Rock & Pop — Grade 1 (Guitar)', syllabus: syl('Trinity Rock & Pop Grade 1 — Guitar', 'Open chords (E, A, D, G, C)', 'Two performance songs', 'Strumming & timing', 'Technical focus: changing chords cleanly', 'Mock performance') },
    { name: 'RSL Grade 1 (Guitar)', syllabus: syl('RSL Grade 1 — Guitar', 'Power chords & riffs', 'Three set songs', 'Scales: minor pentatonic', 'Ear & timing tests', 'Mock exam') },
  ],
  vocal: [
    { name: 'Trinity Rockschool — Grade 1 (Vocals)', syllabus: syl('Trinity Rockschool Grade 1 — Vocals', 'Breathing & posture', 'Two performance songs', 'Pitching & warm-ups', 'Rhythm & timing', 'Mock performance') },
    { name: 'ABRSM Singing — Grade 1', syllabus: syl('ABRSM Singing Grade 1', 'Three songs (incl. unaccompanied)', 'Breathing & tone', 'Sight-singing', 'Aural tests', 'Mock exam') },
  ],
  bharatanatyam: [
    { name: 'Bharatanatyam — Year 1 (Foundation)', syllabus: TEMPLATES.bharatanatyam },
    { name: 'Bharatanatyam — Year 2 (Junior)', syllabus: syl('Bharatanatyam Year 2 — Junior', 'Adavus groups 4–9', 'Jatiswaram introduction', 'Hand & eye coordination', 'Theory: ragas & talas', 'Stage practice') },
    { name: 'Karnataka Govt. — Junior Grade (Dance)', syllabus: syl('Karnataka Govt. Junior Grade — Dance', 'Prescribed adavus', 'Theory paper prep', 'Practical items', 'Mock practical & viva', 'Final exam prep') },
  ],
  western_dance: [
    { name: 'ISTD — Grade 1 (Modern/Jazz)', syllabus: syl('ISTD Grade 1 — Modern/Jazz', 'Warm-up & isolations', 'Set exercises', 'Travelling steps', 'A taught routine', 'Mock assessment') },
    { name: 'Hip-Hop — Beginner Program', syllabus: syl('Hip-Hop Beginner', 'Groove & bounce basics', 'Foundational steps', 'Short choreography', 'Freestyle confidence', 'Showcase piece') },
  ],
  drawing: [
    { name: 'Karnataka Govt. — Junior Grade (Drawing)', syllabus: TEMPLATES.drawing },
    { name: 'Karnataka Govt. — Senior Grade (Drawing)', syllabus: syl('Karnataka Govt. Senior Grade — Drawing', 'Object & memory drawing', 'Still life with shading', 'Design & lettering', 'Perspective & composition', 'Exam portfolio') },
  ],
  chess: [
    { name: 'Chess — Beginner (FIDE basics)', syllabus: TEMPLATES.chess },
    { name: 'Chess — Rating Improvement (U1000)', syllabus: syl('Chess Rating Improvement (U1000)', 'Tactics: forks, pins, skewers', 'Opening repertoire basics', 'Endgame technique', 'Tournament play & analysis', 'Target a rating gain') },
  ],
  abacus: [
    { name: 'Abacus — Level 1', syllabus: syl('Abacus Level 1', 'Bead values & finger technique', 'Simple addition', 'Simple subtraction', 'Speed drills', 'Level 1 assessment') },
    { name: 'Abacus — Level 2', syllabus: syl('Abacus Level 2', 'Two-digit add/subtract', 'Mixed operations', 'Mental visualisation', 'Speed & accuracy drills', 'Level 2 assessment') },
  ],
  coding: [
    { name: 'Coding — Scratch Level 1', syllabus: TEMPLATES.coding },
    { name: 'Coding — Python for Kids (Level 1)', syllabus: syl('Python for Kids — Level 1', 'Print, variables & input', 'Loops & conditions', 'Functions', 'A small text game', 'Showcase project') },
  ],
  swimming: [
    { name: 'Swimming — Beginner (Learn to Swim)', syllabus: TEMPLATES.swimming },
    { name: 'Swimming — Stroke Development', syllabus: syl('Swimming Stroke Development', 'Freestyle refinement', 'Backstroke technique', 'Breaststroke basics', 'Endurance sets', 'Time-trial target') },
  ],
}

/** Standard graded courses for an activity (curated, else a generic 3-level set). */
export function standardCoursesFor(key: string, displayName?: string): StandardCourse[] {
  if (STANDARD_COURSES[key]) return STANDARD_COURSES[key]
  const name = displayName ?? ACTIVITY_META[key]?.name ?? 'Activity'
  return ['Beginner', 'Intermediate', 'Advanced'].map(lvl => ({
    name: `${name} — ${lvl} Program`,
    syllabus: syl(`${name} — ${lvl} Program`, 'Fundamentals & warm-up', 'Core technique practice', 'Build consistency (weekly goals)', `${lvl} skills & assessment`, 'Review & next-level prep'),
  }))
}

/** Special non-course target choices offered alongside standard courses. */
export const TARGET_NO_TARGET = 'No target — just learning'
export const TARGET_UNDECIDED = 'Not sure, decide later'
