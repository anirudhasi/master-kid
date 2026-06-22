// Academic content catalog — lessons, solved Q&A, digital-book pages, and
// "further studies" per subject/grade. This is read-mostly content (data, not
// code): new subjects/lessons are added here (MVP) or in catalog_* tables later,
// never via a deploy of new components.

export interface QA {
  q: string
  a: string
}

export interface FurtherStudy {
  title: string
  url?: string
}

export interface BookPage {
  heading: string
  body: string
}

export interface Material {
  name: string
  url: string // dataURL (mock upload) or external link
}

export interface Lesson {
  id: string
  title: string
  summary: string
  qa: QA[]
  furtherStudy: FurtherStudy[]
  pages: BookPage[]        // the flip-book — optional; populated later by upload
  materials?: Material[]   // parent-uploaded worksheets / scans / links
  source?: 'sample' | 'custom'
}

export interface CatalogSubject {
  key: string
  name: string
  icon: string
  color: string
  colorLight: string
  grade: string // GRADE_LADDER tile, e.g. 'Class 4'
  lessons: Lesson[]
}

// Subjects a parent can add for any class (icons/colors). Lessons may or may
// not be seeded yet — the page handles "lessons coming soon" gracefully.
export const ADDABLE_SUBJECTS: Omit<CatalogSubject, 'grade' | 'lessons'>[] = [
  { key: 'maths',    name: 'Mathematics',    icon: '📐', color: '#4F46E5', colorLight: '#EEF2FF' },
  { key: 'english',  name: 'English',        icon: '📖', color: '#059669', colorLight: '#ECFDF5' },
  { key: 'science',  name: 'Science',        icon: '🔬', color: '#0369A1', colorLight: '#F0F9FF' },
  { key: 'evs',      name: 'EVS',            icon: '🌍', color: '#0891B2', colorLight: '#ECFEFF' },
  { key: 'hindi',    name: 'Hindi',          icon: '🔤', color: '#DC2626', colorLight: '#FFF5F5' },
  { key: 'sst',      name: 'Social Studies', icon: '🗺️', color: '#D97706', colorLight: '#FFFBEB' },
  { key: 'computer', name: 'Computer Science', icon: '💻', color: '#7C3AED', colorLight: '#F5F3FF' },
]

export const SUBJECT_META = Object.fromEntries(ADDABLE_SUBJECTS.map(s => [s.key, s]))

// ── Seeded lesson content (Class 4 Mathematics + English) ─────────────────────
const CATALOG: CatalogSubject[] = [
  {
    key: 'maths', name: 'Mathematics', icon: '📐', color: '#4F46E5', colorLight: '#EEF2FF', grade: 'Class 4',
    lessons: [
      {
        id: 'm-long-short',
        title: 'Long and Short',
        summary: 'Measuring length with standard units — centimetres and metres — and comparing, adding and subtracting lengths.',
        qa: [
          { q: 'How many centimetres make one metre?', a: '100 centimetres make 1 metre (1 m = 100 cm).' },
          { q: 'A pencil is 15 cm and a pen is 12 cm. How much longer is the pencil?', a: '15 − 12 = 3 cm. The pencil is 3 cm longer.' },
          { q: 'Which is longer: 1 metre or 90 centimetres?', a: '1 metre, because 1 m = 100 cm, and 100 cm > 90 cm.' },
          { q: 'Convert 250 cm into metres and centimetres.', a: '250 cm = 2 m 50 cm (since 200 cm = 2 m, leaving 50 cm).' },
        ],
        furtherStudy: [
          { title: 'NCERT Math-Magic — Chapter 2 (Long and Short)' },
          { title: 'Khan Academy: Measuring length', url: 'https://www.khanacademy.org' },
          { title: 'Hands-on: measure 5 objects at home with a ruler' },
        ],
        pages: [
          { heading: 'Units of Length', body: 'We measure short lengths in centimetres (cm) and longer lengths in metres (m). A ruler is marked in centimetres. Your finger is about 1 cm wide; a door is about 2 m tall.' },
          { heading: 'Comparing Lengths', body: 'To compare, use the same unit. 1 m = 100 cm. So 1 m is longer than 90 cm. Always convert to the same unit before comparing or adding.' },
          { heading: 'Adding & Subtracting', body: 'Add or subtract only like units. 1 m 20 cm + 30 cm = 1 m 50 cm. To find a difference, subtract: 15 cm − 12 cm = 3 cm.' },
          { heading: 'Try It Yourself', body: 'Measure your textbook, pencil and the table. Write each length in cm, then order them from shortest to longest.' },
        ],
      },
      {
        id: 'm-tables-shares',
        title: 'Tables and Shares',
        summary: 'Multiplication tables up to 10 and division as equal sharing, with simple word problems.',
        qa: [
          { q: 'What is 7 × 8?', a: '56.' },
          { q: 'Share 24 chocolates equally among 4 children. How many each?', a: '24 ÷ 4 = 6 chocolates each.' },
          { q: 'How are multiplication and division related?', a: 'They are opposites: if 6 × 4 = 24, then 24 ÷ 4 = 6 and 24 ÷ 6 = 4.' },
        ],
        furtherStudy: [
          { title: 'NCERT Math-Magic — Tables and Shares' },
          { title: 'Practice: recite the 6, 7 and 8 times tables daily' },
        ],
        pages: [
          { heading: 'Multiplication is Repeated Addition', body: '4 × 3 means 4 added 3 times: 4 + 4 + 4 = 12. Learning tables makes this fast.' },
          { heading: 'Division is Equal Sharing', body: 'Dividing 12 by 3 means making 3 equal groups: each group has 4. So 12 ÷ 3 = 4.' },
          { heading: 'Word Problems', body: 'Read carefully: "shared equally" means divide; "in all / altogether" usually means multiply or add.' },
        ],
      },
    ],
  },
  {
    key: 'english', name: 'English', icon: '📖', color: '#059669', colorLight: '#ECFDF5', grade: 'Class 4',
    lessons: [
      {
        id: 'e-nouns',
        title: 'Nouns — Common and Proper',
        summary: 'Naming words: common nouns name any person/place/thing; proper nouns name a particular one and begin with a capital letter.',
        qa: [
          { q: 'What is a proper noun? Give an example.', a: 'A proper noun names a particular person, place or thing and starts with a capital letter, e.g. Bangalore, Priya.' },
          { q: 'Underline the common nouns: "The girl put her book on the table."', a: 'girl, book, table.' },
          { q: 'Is "Monday" a common or proper noun?', a: 'Proper noun — it names a particular day, so it takes a capital letter.' },
        ],
        furtherStudy: [
          { title: 'NCERT Marigold — Grammar: Nouns' },
          { title: 'Game: spot 10 proper nouns in a newspaper headline' },
        ],
        pages: [
          { heading: 'What is a Noun?', body: 'A noun is a naming word — for a person, place, animal or thing: teacher, city, dog, pencil.' },
          { heading: 'Common vs Proper', body: 'Common nouns name any one of a kind (boy, river). Proper nouns name a particular one and always begin with a capital letter (Arjun, Ganga).' },
          { heading: 'Capital Letters', body: 'Names of people, places, days, months and festivals are proper nouns: Diwali, April, Chennai. Give them a capital letter.' },
        ],
      },
    ],
  },
]

/** All seeded subjects for a class tile (e.g. 'Class 4'). */
export function catalogForGrade(grade: string): CatalogSubject[] {
  return CATALOG.filter(s => s.grade === grade)
}

/** Look up one subject's seeded content for a grade (or undefined if not seeded). */
export function subjectContent(grade: string, key: string): CatalogSubject | undefined {
  return CATALOG.find(s => s.grade === grade && s.key === key)
}
