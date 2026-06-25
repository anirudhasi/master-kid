// Default olympiad / competitive-exam catalog for the exams TRACKER (Olympiads.tsx).
// Per feedback ("This can be pre-filled"), a new child's tracker is seeded with the
// common national olympiads so the parent only has to confirm/register rather than
// enter everything from scratch. Dates are for the 2026–27 cycle.

import type { OlympiadExam } from '@/store/appStore'

// Common SOF + national olympiads suitable across primary/middle school.
const COMMON_EXAMS: Omit<OlympiadExam, 'isRegistered' | 'isAttending' | 'prepProgress'>[] = [
  {
    id: 'imo', name: 'International Mathematics Olympiad', shortName: 'IMO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'Mathematics', subjectIcon: '📐',
    examDate: '2026-10-21', registrationDeadline: '2026-08-31',
    difficultyNote: 'Covers some content beyond the school syllabus. Focus on logical reasoning and speed.',
    prepTopics: ['Number patterns', 'Fractions — beyond textbook', 'Geometry basics', 'Logical reasoning', 'Data interpretation'],
  },
  {
    id: 'nso', name: 'National Science Olympiad', shortName: 'NSO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'Science', subjectIcon: '🔬',
    examDate: '2026-11-11', registrationDeadline: '2026-09-15',
    difficultyNote: 'Focus on living/non-living things, environment, and basic physics concepts.',
    prepTopics: ['Plants and their types', 'Animals — habitats', 'Water cycle', 'Simple machines', 'Human body basics'],
  },
  {
    id: 'ieo', name: 'International English Olympiad', shortName: 'IEO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'English', subjectIcon: '📖',
    examDate: '2026-12-09', registrationDeadline: '2026-10-15',
    difficultyNote: 'Tests grammar, reading comprehension, vocabulary, and creative expression.',
    prepTopics: ['Grammar — all parts of speech', 'Reading comprehension', 'Vocabulary building', 'Sentence transformation'],
  },
  {
    id: 'igko', name: 'International General Knowledge Olympiad', shortName: 'IGKO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'General Knowledge', subjectIcon: '🌟',
    examDate: '2026-09-16', registrationDeadline: '2026-08-15',
    difficultyNote: 'Current affairs, life skills, and general awareness across topics.',
    prepTopics: ['Current affairs', 'India & the world', 'Science around us', 'Sports & culture', 'Life skills'],
  },
  {
    id: 'nco', name: 'National Cyber Olympiad', shortName: 'NCO',
    organizer: 'Science Olympiad Foundation (SOF)', subject: 'Computers', subjectIcon: '💻',
    examDate: '2026-10-07', registrationDeadline: '2026-08-31',
    difficultyNote: 'Computer fundamentals, logical reasoning, and basic IT awareness.',
    prepTopics: ['Parts of a computer', 'MS Office basics', 'Internet & safety', 'Logical reasoning'],
  },
  {
    id: 'asset', name: 'ASSET Talent & Olympiad Exam', shortName: 'ASSET',
    organizer: 'Educational Initiatives', subject: 'Math + Science + English', subjectIcon: '🏆',
    examDate: '2026-11-25', registrationDeadline: '2026-09-30',
    difficultyNote: 'Application-based questions. Tests understanding and application, not just recall.',
    prepTopics: ['Conceptual Math', 'Real-world Science problems', 'English usage in context'],
  },
]

/** Pre-filled exams for a child's tracker. `grade` reserved for future tuning. */
export function defaultOlympiadExams(_grade?: string): OlympiadExam[] {
  return COMMON_EXAMS.map(e => ({ ...e, isRegistered: false, isAttending: false, prepProgress: 0 }))
}
