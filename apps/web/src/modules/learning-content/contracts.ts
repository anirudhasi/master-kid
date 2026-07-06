// modules/learning-content/contracts.ts — M8 Learning Content (spec §4)
// ⚠️ This contract becomes FROZEN at Stage-3 PR-18 merge: it is the S1 agent boundary.
// After freeze, changes require a superseding ADR.

export type Board = 'CBSE' | 'ICSE' | 'STATE' | (string & {})
export type Grade = 'NUR' | 'LKG' | 'UKG' | '1' | '2' | '3' | '4' | '5' | '6'
  | '7' | '8' | '9' | '10' | '11' | '12'

export type ContentKind = 'lesson' | 'qa' | 'knowledge' | 'quote' | 'olympiad_set' | 'help'
export type ContentStatus = 'draft' | 'review' | 'published' | 'deprecated'
export type ContentSource = 'manual' | 'agent' | 'import'

export interface SubjectTree {
  board: Board
  grade: Grade
  subjects: { subjectKey: string; label: string;
    lessons: { id: string; ordinal: number; title: string }[] }[]
}

export interface Lesson {
  id: string
  subjectKey: string
  grade: Grade
  title: string
  summary?: string
  qa: { question: string; answer: string }[]
  furtherStudy: { title: string; url: string }[]
}

export interface ContentQuery {
  kind?: ContentKind
  grade?: Grade            // items at/below this grade
  type?: string            // knowledge sub-type: quiz | riddle | ...
  subject?: string
  limit?: number
  cursor?: string
}

export interface ContentItem {
  id: string
  legacyId?: string        // continuity with pre-import progress rows (M8-A1)
  kind: ContentKind
  title?: string
  payload: Record<string, unknown>
  status: ContentStatus
}

export interface ContentDraft {
  kind: ContentKind
  title?: string
  payload: Record<string, unknown>
  grade?: Grade
  subject?: string
}

export interface ContentContract {
  // ── read side (app) ──
  getSyllabus(board: Board, grade: Grade): Promise<SubjectTree>
  getLesson(lessonId: string): Promise<Lesson>
  queryItems(q: ContentQuery): Promise<{ items: ContentItem[]; cursor?: string }>

  // ── write side (S1 agents + M10 admin ONLY; enforced server-side) ──
  upsertDraft(item: ContentDraft, source: Exclude<ContentSource, 'import'>): Promise<{ id: string }>
  submitForReview(id: string): Promise<void>
  publish(id: string, reviewerId: string): Promise<void>      // emits content.updated
  deprecate(id: string, reason: string): Promise<void>
}
