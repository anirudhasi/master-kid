// Olympiad practice catalog — 6 subjects × 4 categories.
// Per the brief: Basic / Intermediate / Pro = 20 worksheets each (60), plus 40
// sample papers from previous years = 100 sets per subject. We ship a small
// SAMPLE here; the rest is filled via the in-app upload provision over time.

export type OlySubject = 'maths' | 'science' | 'english' | 'gk' | 'cs' | 'sst'
export type OlyCategory = 'basic' | 'intermediate' | 'pro' | 'sample'

export interface OlyQuestion {
  q: string
  options: string[]
  answerIndex: number
}

export interface OlySet {
  id: string
  subject: OlySubject
  category: OlyCategory
  grade: string
  title: string
  kind: 'worksheet' | 'sample_paper'
  questions?: OlyQuestion[]  // interactive worksheet
  materialUrl?: string       // sample paper / uploaded file or link
  source?: 'sample' | 'custom'
  shared?: boolean           // shared to community
  uploadedBy?: string
}

export const OLY_SUBJECTS: { key: OlySubject; name: string; icon: string; color: string; colorLight: string }[] = [
  { key: 'maths',   name: 'Mathematics',      icon: '📐', color: '#4F46E5', colorLight: '#EEF2FF' },
  { key: 'science', name: 'Science',          icon: '🔬', color: '#0369A1', colorLight: '#F0F9FF' },
  { key: 'english', name: 'English',          icon: '📖', color: '#059669', colorLight: '#ECFDF5' },
  { key: 'gk',      name: 'GK',               icon: '🌟', color: '#CA8A04', colorLight: '#FEFCE8' },
  { key: 'cs',      name: 'Computer Science', icon: '💻', color: '#7C3AED', colorLight: '#F5F3FF' },
  { key: 'sst',     name: 'Social Studies',   icon: '🗺️', color: '#D97706', colorLight: '#FFFBEB' },
]

export const OLY_CATEGORIES: { key: OlyCategory; label: string; blurb: string; target: number }[] = [
  { key: 'basic',        label: 'Basic',         blurb: 'Build the fundamentals', target: 20 },
  { key: 'intermediate', label: 'Intermediate',  blurb: 'Step up the challenge',  target: 20 },
  { key: 'pro',          label: 'Pro',           blurb: 'Competition-level',      target: 20 },
  { key: 'sample',       label: 'Sample Papers', blurb: 'From previous years',    target: 40 },
]

export const SUBJECT_META = Object.fromEntries(OLY_SUBJECTS.map(s => [s.key, s]))

// ── Seeded sample sets (Class 4 Maths + Science) ──────────────────────────────
const SETS: OlySet[] = [
  {
    id: 'oly-m-b1', subject: 'maths', category: 'basic', grade: 'Class 4', kind: 'worksheet', source: 'sample',
    title: 'Number Sense — Worksheet 1',
    questions: [
      { q: 'Which number is the largest?', options: ['4,099', '4,199', '4,091', '4,190'], answerIndex: 1 },
      { q: '3,000 + 400 + 50 + 6 = ?', options: ['3,456', '3,654', '3,546', '3,465'], answerIndex: 0 },
      { q: 'Round 6,847 to the nearest thousand.', options: ['6,000', '7,000', '6,800', '6,900'], answerIndex: 1 },
    ],
  },
  {
    id: 'oly-m-b2', subject: 'maths', category: 'basic', grade: 'Class 4', kind: 'worksheet', source: 'sample',
    title: 'Patterns & Logic — Worksheet 2',
    questions: [
      { q: 'Find the next number: 2, 4, 8, 16, ?', options: ['20', '24', '32', '30'], answerIndex: 2 },
      { q: 'Which is an even number?', options: ['17', '23', '38', '41'], answerIndex: 2 },
    ],
  },
  {
    id: 'oly-m-i1', subject: 'maths', category: 'intermediate', grade: 'Class 4', kind: 'worksheet', source: 'sample',
    title: 'Fractions & Reasoning — Worksheet 1',
    questions: [
      { q: 'Which fraction is the largest?', options: ['1/2', '1/4', '3/4', '1/3'], answerIndex: 2 },
      { q: 'Half of 48 is…', options: ['12', '24', '16', '36'], answerIndex: 1 },
    ],
  },
  {
    id: 'oly-s-b1', subject: 'science', category: 'basic', grade: 'Class 4', kind: 'worksheet', source: 'sample',
    title: 'Living World — Worksheet 1',
    questions: [
      { q: 'Which part of the plant makes food?', options: ['Root', 'Leaf', 'Stem', 'Flower'], answerIndex: 1 },
      { q: 'Honey is made by…', options: ['Ants', 'Worker bees', 'Spiders', 'Butterflies'], answerIndex: 1 },
    ],
  },
]

// ── Class 4 Maths worksheet PDFs (served from /public) ────────────────────────
// Real worksheet bank from master-kids_Worksheets/Class 4/Maths, mapped into the
// Olympiad practice levels by lesson band: L1 → Basic, L2 → Intermediate,
// L3 → Pro, and the MOCK/SAMPLE papers → Sample Papers.
const C4_MATH_DIR = '/worksheets/class4/maths'
const pad = (n: number) => String(n).padStart(2, '0')

function c4MathWorksheetSets(): OlySet[] {
  const mk = (n: number, lesson: number, category: OlyCategory): OlySet => ({
    id: `oly-m-c4-w${pad(n)}`,
    subject: 'maths', category, grade: 'Class 4', kind: 'sample_paper', source: 'sample',
    title: `Maths Practice — Worksheet ${n}`,
    materialUrl: `${C4_MATH_DIR}/MK-MATH-C4-L${lesson}-W${pad(n)}.pdf`,
  })
  const sets: OlySet[] = []
  for (let n = 1; n <= 20; n++) sets.push(mk(n, 1, 'basic'))
  for (let n = 21; n <= 40; n++) sets.push(mk(n, 2, 'intermediate'))
  for (let n = 41; n <= 46; n++) sets.push(mk(n, 3, 'pro'))
  sets.push({
    id: 'oly-m-c4-sp-mock', subject: 'maths', category: 'sample', grade: 'Class 4',
    kind: 'sample_paper', source: 'sample', title: 'Maths Mock Paper (Sample)',
    materialUrl: `${C4_MATH_DIR}/MK-MATH-C4-MOCK-W81_SAMPLE.pdf`,
  })
  sets.push({
    id: 'oly-m-c4-sp-w27', subject: 'maths', category: 'sample', grade: 'Class 4',
    kind: 'sample_paper', source: 'sample', title: 'Maths Sample Paper — Set 27',
    materialUrl: `${C4_MATH_DIR}/MK-MATH-C4-L2-W27_SAMPLE.pdf`,
  })
  return sets
}

const ALL_SETS: OlySet[] = [...SETS, ...c4MathWorksheetSets()]

export function setsFor(grade: string, subject: OlySubject, category: OlyCategory): OlySet[] {
  return ALL_SETS.filter(s => s.grade === grade && s.subject === subject && s.category === category)
}

export function seededCount(grade: string, subject: OlySubject, category: OlyCategory): number {
  return setsFor(grade, subject, category).length
}
